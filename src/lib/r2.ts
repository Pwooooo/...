import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl: string;
}

export function getR2Config(): R2Config | null {
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID;

  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const bucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    "entropy-videos";

  const endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  const publicUrl = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint, publicUrl };
}

export function isR2Configured(): boolean {
  return Boolean(getR2Config());
}

let cachedClient: { client: S3Client; bucket: string; publicUrl: string; endpoint: string } | null = null;

export function getR2Client() {
  const config = getR2Config();
  if (!config) return null;

  if (!cachedClient || cachedClient.bucket !== config.bucket) {
    try {
      const client = new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
      cachedClient = { client, bucket: config.bucket, publicUrl: config.publicUrl, endpoint: config.endpoint };
    } catch (err) {
      console.warn("Could not create Cloudflare R2 client:", err);
      return null;
    }
  }

  return cachedClient;
}

export async function createR2PresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; fileUrl: string; key: string } | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2.client, command, {
      expiresIn: expiresInSeconds,
    });

    const fileUrl = r2.publicUrl
      ? `${r2.publicUrl}/${key}`
      : `/api/r2/serve?key=${encodeURIComponent(key)}`;

    return { uploadUrl, fileUrl, key };
  } catch (err) {
    console.error("Failed to generate presigned R2 upload URL:", err);
    return null;
  }
}
