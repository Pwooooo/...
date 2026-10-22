import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { VideoItem } from "@/types";

export interface TigrisConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  publicUrl: string;
}

export function getTigrisConfig(): TigrisConfig | null {
  // Only accept genuine Tigris or AWS environment variables (do NOT use MinIO S3_ACCESS_KEY)
  const accessKeyId =
    process.env.TIGRIS_ACCESS_KEY_ID ||
    process.env.TIGRIS_STORAGE_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.TIGRIS_SECRET_ACCESS_KEY ||
    process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const endpoint =
    process.env.TIGRIS_ENDPOINT ||
    process.env.TIGRIS_STORAGE_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    "https://fly.storage.tigris.dev";

  const bucket =
    process.env.TIGRIS_BUCKET ||
    process.env.TIGRIS_BUCKET_NAME ||
    process.env.TIGRIS_STORAGE_BUCKET ||
    process.env.BUCKET_NAME ||
    "entropy-videos";

  const region =
    process.env.TIGRIS_REGION ||
    process.env.AWS_REGION ||
    "auto";

  const publicUrl = (
    process.env.TIGRIS_PUBLIC_URL ||
    process.env.PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  return { endpoint, accessKeyId, secretAccessKey, bucket, region, publicUrl };
}

export function isTigrisConfigured(): boolean {
  return Boolean(getTigrisConfig());
}

let verifiedClientCache: {
  client: S3Client;
  bucket: string;
  publicUrl: string;
  endpoint: string;
} | null = null;

let isVerifyingPromise: Promise<{
  client: S3Client;
  bucket: string;
  publicUrl: string;
  endpoint: string;
} | null> | null = null;

export async function getVerifiedTigrisClient(): Promise<{
  client: S3Client;
  bucket: string;
  publicUrl: string;
  endpoint: string;
} | null> {
  const config = getTigrisConfig();
  if (!config) return null;

  if (verifiedClientCache && verifiedClientCache.endpoint === config.endpoint) {
    return verifiedClientCache;
  }

  if (isVerifyingPromise) {
    return isVerifyingPromise;
  }

  isVerifyingPromise = (async () => {
    try {
      const rawClient = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: false,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });

      let activeBucket = config.bucket;
      let bucketVerified = false;

      // 1. Check if the candidate bucket exists and is accessible
      if (activeBucket) {
        try {
          await rawClient.send(new HeadBucketCommand({ Bucket: activeBucket }));
          bucketVerified = true;
        } catch (headErr: any) {
          console.warn(`Tigris HeadBucket on "${activeBucket}" failed:`, headErr?.name || headErr?.message);
        }
      }

      // 2. If specified bucket not found, query user's actual buckets in their Tigris account
      if (!bucketVerified) {
        try {
          const listRes = await rawClient.send(new ListBucketsCommand({}));
          if (listRes.Buckets && listRes.Buckets.length > 0) {
            const match = listRes.Buckets.find(
              (b) => b.Name && activeBucket && b.Name.toLowerCase() === activeBucket.toLowerCase()
            );
            if (match?.Name) {
              activeBucket = match.Name;
              bucketVerified = true;
            } else if (listRes.Buckets[0].Name) {
              activeBucket = listRes.Buckets[0].Name;
              bucketVerified = true;
            }
            console.log(`Auto-discovered verified Tigris bucket: "${activeBucket}"`);
          }
        } catch (listErr: any) {
          console.warn("Could not list Tigris buckets:", listErr?.name || listErr?.message);
        }
      }

      // 3. If no bucket exists in account, try to create one
      if (!bucketVerified) {
        const targetToCreate = activeBucket || "entropy-videos";
        try {
          await rawClient.send(new CreateBucketCommand({ Bucket: targetToCreate }));
          activeBucket = targetToCreate;
          bucketVerified = true;
          console.log(`Created new Tigris bucket: "${activeBucket}"`);
        } catch (createErr: any) {
          console.warn(`Could not create Tigris bucket "${targetToCreate}":`, createErr?.name || createErr?.message);
          activeBucket = targetToCreate;
        }
      }

      // 4. Ensure CORS on the verified bucket
      try {
        await rawClient.send(
          new PutBucketCorsCommand({
            Bucket: activeBucket,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedOrigins: ["*"],
                  AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                  AllowedHeaders: ["*"],
                  ExposeHeaders: ["ETag", "Content-Length", "Accept-Ranges", "Content-Range"],
                  MaxAgeSeconds: 3600,
                },
              ],
            },
          })
        );
      } catch (corsErr: any) {
        console.warn("Tigris CORS setup note:", corsErr?.message || corsErr);
      }

      verifiedClientCache = {
        client: rawClient,
        bucket: activeBucket,
        publicUrl: config.publicUrl,
        endpoint: config.endpoint,
      };

      return verifiedClientCache;
    } catch (err) {
      console.warn("Could not initialize verified Tigris client:", err);
      return null;
    } finally {
      isVerifyingPromise = null;
    }
  })();

  return isVerifyingPromise;
}

export function getTigrisClient() {
  if (verifiedClientCache) return verifiedClientCache;
  const config = getTigrisConfig();
  if (!config) return null;

  try {
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    return {
      client,
      bucket: config.bucket,
      publicUrl: config.publicUrl,
      endpoint: config.endpoint,
    };
  } catch {
    return null;
  }
}

export async function ensureTigrisCors(): Promise<boolean> {
  const verified = await getVerifiedTigrisClient();
  return Boolean(verified);
}

export async function createTigrisPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; fileUrl: string; key: string; bucket: string } | null> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(tigris.client, command, {
      expiresIn: expiresInSeconds,
    });

    const fileUrl = `/api/tigris/serve?key=${encodeURIComponent(key)}`;

    return { uploadUrl, fileUrl, key, bucket: tigris.bucket };
  } catch (err) {
    console.error("Failed to generate presigned Tigris upload URL:", err);
    return null;
  }
}

export async function uploadBufferToTigris(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await tigris.client.send(command);

    return `/api/tigris/serve?key=${encodeURIComponent(key)}`;
  } catch (err) {
    console.error(`Failed to upload ${key} to Tigris:`, err);
    return null;
  }
}

export async function deleteObjectFromTigris(keyOrUrl: string): Promise<boolean> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris || !keyOrUrl) return false;

  try {
    let key = keyOrUrl;
    if (key.startsWith("http://") || key.startsWith("https://")) {
      try {
        const u = new URL(key);
        key = u.pathname.replace(/^\//, "");
        if (key.startsWith(`${tigris.bucket}/`)) {
          key = key.replace(`${tigris.bucket}/`, "");
        }
      } catch {}
    } else if (key.startsWith("/api/tigris/serve?key=") || key.startsWith("/api/r2/serve?key=")) {
      try {
        const u = new URL(key, "http://localhost");
        const k = u.searchParams.get("key");
        if (k) key = k;
      } catch {}
    }

    const command = new DeleteObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
    });
    await tigris.client.send(command);
    return true;
  } catch (err) {
    console.warn(`Could not delete object ${keyOrUrl} from Tigris:`, err);
    return false;
  }
}

export async function fetchTigrisDeletedVideos(): Promise<Set<string>> {
  const tigris = await getVerifiedTigrisClient();
  const set = new Set<string>();
  if (!tigris) return set;

  try {
    const command = new GetObjectCommand({
      Bucket: tigris.bucket,
      Key: "metadata/deleted_videos.json",
    });
    const response = await tigris.client.send(command);
    const bodyStr = await response.Body?.transformToString();
    if (bodyStr) {
      const parsed = JSON.parse(bodyStr);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (typeof id === "string") set.add(id);
        });
      }
    }
  } catch {}
  return set;
}

export async function saveTigrisDeletedVideos(deletedIds: string[]): Promise<boolean> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) return false;

  try {
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: "metadata/deleted_videos.json",
      Body: Buffer.from(JSON.stringify(Array.from(new Set(deletedIds)), null, 2)),
      ContentType: "application/json",
    });
    await tigris.client.send(command);
    return true;
  } catch (err) {
    console.warn("Could not save Tigris deleted videos list:", err);
    return false;
  }
}

export async function deleteVideoFromTigris(id: string): Promise<boolean> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris || !id) return false;

  try {
    // 1. Delete individual metadata file
    await deleteObjectFromTigris(`metadata/videos/${id}.json`);

    // 2. Scan and delete all matching files in videos/, thumbnails/, and metadata/videos/
    const prefixes = ["videos/", "thumbnails/", "metadata/videos/"];
    const idClean = id.trim().toLowerCase();
    let idDecoded = idClean;
    try {
      idDecoded = decodeURIComponent(id).trim().toLowerCase();
    } catch {}

    for (const prefix of prefixes) {
      try {
        const listCmd = new ListObjectsV2Command({
          Bucket: tigris.bucket,
          Prefix: prefix,
          MaxKeys: 1000,
        });
        const res = await tigris.client.send(listCmd);
        if (res.Contents) {
          for (const item of res.Contents) {
            if (!item.Key) continue;
            const keyLower = item.Key.toLowerCase();
            let keyDecoded = keyLower;
            try {
              keyDecoded = decodeURIComponent(item.Key).toLowerCase();
            } catch {}

            if (
              keyLower.includes(idClean) ||
              keyDecoded.includes(idClean) ||
              keyLower.includes(idDecoded) ||
              keyDecoded.includes(idDecoded)
            ) {
              await tigris.client.send(
                new DeleteObjectCommand({
                  Bucket: tigris.bucket,
                  Key: item.Key,
                })
              ).catch(() => {});
            }
          }
        }
      } catch {}
    }

    // 3. Update deleted videos list in Tigris
    const currentDeleted = await fetchTigrisDeletedVideos();
    currentDeleted.add(id);
    currentDeleted.add(idClean);
    currentDeleted.add(idDecoded);
    await saveTigrisDeletedVideos(Array.from(currentDeleted));

    return true;
  } catch (err) {
    console.warn(`Error deleting video ${id} from Tigris:`, err);
    return false;
  }
}

export async function fetchTigrisVideosIndex(): Promise<VideoItem[]> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) return [];

  const map = new Map<string, VideoItem>();
  const deletedSet = await fetchTigrisDeletedVideos();

  // 1. Consolidated metadata/videos.json
  try {
    const command = new GetObjectCommand({
      Bucket: tigris.bucket,
      Key: "metadata/videos.json",
    });
    const response = await tigris.client.send(command);
    const bodyStr = await response.Body?.transformToString();
    if (bodyStr) {
      const parsed = JSON.parse(bodyStr);
      if (Array.isArray(parsed)) {
        parsed.forEach((v: VideoItem) => {
          if (v && v.id && !deletedSet.has(v.id) && !deletedSet.has(v.id.toLowerCase())) {
            map.set(v.id, v);
          }
        });
      }
    }
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name !== "NoSuchKey" && name !== "NotFound") {
      console.warn("Could not fetch Tigris videos index:", err);
    }
  }

  // 2. Discover individual metadata files in metadata/videos/*.json
  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: tigris.bucket,
      Prefix: "metadata/videos/",
      MaxKeys: 500,
    });
    const listRes = await tigris.client.send(listCmd);
    if (listRes.Contents && listRes.Contents.length > 0) {
      for (const obj of listRes.Contents) {
        if (!obj.Key || !obj.Key.endsWith(".json")) continue;
        try {
          const getCmd = new GetObjectCommand({
            Bucket: tigris.bucket,
            Key: obj.Key,
          });
          const res = await tigris.client.send(getCmd);
          const str = await res.Body?.transformToString();
          if (str) {
            const parsed = JSON.parse(str);
            if (
              parsed &&
              parsed.id &&
              !deletedSet.has(parsed.id) &&
              !deletedSet.has(parsed.id.toLowerCase()) &&
              !map.has(parsed.id)
            ) {
              map.set(parsed.id, parsed);
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Could not list metadata/videos/ in Tigris:", err);
  }

  return Array.from(map.values()).filter(
    (v) => !deletedSet.has(v.id) && !deletedSet.has(v.id.toLowerCase())
  );
}

export async function saveTigrisVideosIndex(videos: VideoItem[], newVideo?: VideoItem): Promise<boolean> {
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) return false;

  try {
    // 1. Immediately save the new video metadata individually
    if (newVideo && newVideo.id) {
      const indCmd = new PutObjectCommand({
        Bucket: tigris.bucket,
        Key: `metadata/videos/${newVideo.id}.json`,
        Body: Buffer.from(JSON.stringify(newVideo, null, 2)),
        ContentType: "application/json",
      });
      await tigris.client.send(indCmd);
    }

    // 2. Save consolidated index
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: "metadata/videos.json",
      Body: Buffer.from(JSON.stringify(videos, null, 2)),
      ContentType: "application/json",
    });
    await tigris.client.send(command);
    return true;
  } catch (err) {
    console.error("Could not save Tigris videos index:", err);
    throw err;
  }
}
