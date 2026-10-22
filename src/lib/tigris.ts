import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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
  const accessKeyId =
    process.env.TIGRIS_ACCESS_KEY_ID ||
    process.env.TIGRIS_STORAGE_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY;

  const secretAccessKey =
    process.env.TIGRIS_SECRET_ACCESS_KEY ||
    process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const endpoint =
    process.env.TIGRIS_ENDPOINT ||
    process.env.TIGRIS_STORAGE_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    (process.env.CLOUDFLARE_R2_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "https://fly.storage.tigris.dev");

  const bucket =
    process.env.TIGRIS_BUCKET ||
    process.env.TIGRIS_BUCKET_NAME ||
    process.env.TIGRIS_STORAGE_BUCKET ||
    process.env.BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.S3_BUCKET_NAME ||
    "entropy-videos";

  const region =
    process.env.TIGRIS_REGION ||
    process.env.AWS_REGION ||
    "auto";

  const publicUrl = (
    process.env.TIGRIS_PUBLIC_URL ||
    process.env.PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.S3_PUBLIC_DOMAIN ||
    ""
  ).replace(/\/$/, "");

  return { endpoint, accessKeyId, secretAccessKey, bucket, region, publicUrl };
}

export function isTigrisConfigured(): boolean {
  return Boolean(getTigrisConfig());
}

let cachedTigrisClient: {
  client: S3Client;
  bucket: string;
  publicUrl: string;
  endpoint: string;
} | null = null;

export function getTigrisClient() {
  const config = getTigrisConfig();
  if (!config) return null;

  if (!cachedTigrisClient || cachedTigrisClient.bucket !== config.bucket || cachedTigrisClient.endpoint !== config.endpoint) {
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
      cachedTigrisClient = {
        client,
        bucket: config.bucket,
        publicUrl: config.publicUrl,
        endpoint: config.endpoint,
      };
    } catch (err) {
      console.warn("Could not create Tigris storage client:", err);
      return null;
    }
  }

  return cachedTigrisClient;
}

export async function createTigrisPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; fileUrl: string; key: string } | null> {
  const tigris = getTigrisClient();
  if (!tigris) return null;

  try {
    // We omit ContentType from the signing command so browsers can PUT with any charset/header without 403 SignatureDoesNotMatch
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
    });

    const uploadUrl = await getSignedUrl(tigris.client, command, {
      expiresIn: expiresInSeconds,
    });

    const fileUrl = `/api/tigris/serve?key=${encodeURIComponent(key)}`;

    return { uploadUrl, fileUrl, key };
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
  const tigris = getTigrisClient();
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
  const tigris = getTigrisClient();
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

export async function fetchTigrisVideosIndex(): Promise<VideoItem[]> {
  const tigris = getTigrisClient();
  if (!tigris) return [];

  const map = new Map<string, VideoItem>();

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
          if (v && v.id) map.set(v.id, v);
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
            if (parsed && parsed.id && !map.has(parsed.id)) {
              map.set(parsed.id, parsed);
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 3. Fallback discovery: Look for raw uploaded video files in videos/
  try {
    const listVidCmd = new ListObjectsV2Command({
      Bucket: tigris.bucket,
      Prefix: "videos/",
      MaxKeys: 500,
    });
    const listVidRes = await tigris.client.send(listVidCmd);
    if (listVidRes.Contents && listVidRes.Contents.length > 0) {
      for (const obj of listVidRes.Contents) {
        if (!obj.Key || obj.Key.endsWith("/")) continue;
        const filename = obj.Key.replace(/^videos\//, "");
        const idMatch = filename.replace(/\.[^/.]+$/, "");
        if (!idMatch || map.has(idMatch)) continue;

        const cleanTitle = idMatch.replace(/^v-(user|srv)-/, "").replace(/[-_]/g, " ");
        const inferredVideo: VideoItem = {
          id: idMatch,
          title: cleanTitle ? `Video ${cleanTitle}` : "Uploaded Video",
          description: "Stored securely on Tigris Object Storage",
          thumbnailUrl: `/api/tigris/serve?key=${encodeURIComponent(`thumbnails/${idMatch}.jpg`)}`,
          masterPlaylistUrl: null,
          rawVideoUrl: `/api/tigris/serve?key=${encodeURIComponent(obj.Key)}`,
          durationSeconds: 0,
          viewCount: 0,
          publishedAt: new Date(obj.LastModified || Date.now()).toISOString(),
          category: "Technology",
          tags: ["video"],
          channel: {
            id: "creator",
            handle: "creator",
            displayName: "Creator",
            avatarUrl: "/default-avatar.png",
            subscribersCount: 0,
          },
          isShort: false,
        };
        map.set(idMatch, inferredVideo);
      }
    }
  } catch {}

  return Array.from(map.values());
}

export async function saveTigrisVideosIndex(videos: VideoItem[], newVideo?: VideoItem): Promise<void> {
  const tigris = getTigrisClient();
  if (!tigris) return;

  try {
    // 1. Immediately save the new video metadata individually
    if (newVideo && newVideo.id) {
      const indCmd = new PutObjectCommand({
        Bucket: tigris.bucket,
        Key: `metadata/videos/${newVideo.id}.json`,
        Body: Buffer.from(JSON.stringify(newVideo, null, 2)),
        ContentType: "application/json",
      });
      await tigris.client.send(indCmd).catch(() => {});
    }

    // 2. Save consolidated index
    const command = new PutObjectCommand({
      Bucket: tigris.bucket,
      Key: "metadata/videos.json",
      Body: Buffer.from(JSON.stringify(videos, null, 2)),
      ContentType: "application/json",
    });
    await tigris.client.send(command);
  } catch (err) {
    console.warn("Could not save Tigris videos index:", err);
  }
}
