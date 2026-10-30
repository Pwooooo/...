import { NextRequest, NextResponse } from "next/server";
import { getVerifiedTigrisClient } from "@/lib/tigris";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 3 MB max chunk when proxying through Vercel Serverless Functions (safely under Vercel's 4.5 MB limit)
const MAX_PROXY_CHUNK_BYTES = 3 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".m4v": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
};

function clampRangeHeader(rangeHeader: string | null, totalSize: number): string | undefined {
  if (!totalSize || totalSize <= 0) return rangeHeader || undefined;
  if (!rangeHeader) {
    if (totalSize > MAX_PROXY_CHUNK_BYTES) {
      return `bytes=0-${MAX_PROXY_CHUNK_BYTES - 1}`;
    }
    return undefined;
  }

  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return rangeHeader;

  const start = parseInt(match[1], 10);
  if (isNaN(start) || start >= totalSize) return rangeHeader;

  const requestedEnd = match[2] ? parseInt(match[2], 10) : totalSize - 1;
  const maxAllowedEnd = Math.min(start + MAX_PROXY_CHUNK_BYTES - 1, totalSize - 1);
  const clampedEnd = isNaN(requestedEnd) ? maxAllowedEnd : Math.min(requestedEnd, maxAllowedEnd);

  return `bytes=${start}-${clampedEnd}`;
}

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return new Response(null, { status: 400 });
  }

  const key = rawKey.replace(/^\/+/, "");
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) {
    return new Response(null, { status: 503 });
  }

  const keysToTry = [key];
  if (!key.includes(".")) {
    keysToTry.push(`${key}.mp4`, `${key}.webm`);
  }

  for (const tryKey of keysToTry) {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: tigris.bucket,
        Key: tryKey,
      });
      const headRes = await tigris.client.send(headCommand);
      const ext = tryKey.slice(tryKey.lastIndexOf(".")).toLowerCase();

      return new Response(null, {
        status: 200,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": headRes.ContentLength?.toString() || "0",
          "Content-Type": headRes.ContentType || MIME_BY_EXT[ext] || "video/mp4",
          "ETag": headRes.ETag || "",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {}
  }

  return new Response(null, { status: 404 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key");
  const forceProxy = searchParams.get("proxy") === "1";

  if (!rawKey) {
    return new Response("Missing 'key' parameter", { status: 400 });
  }

  const key = rawKey.replace(/^\/+/, "");
  const tigris = await getVerifiedTigrisClient();
  if (!tigris) {
    return new Response("Tigris storage is not configured", { status: 503 });
  }

  const keysToTry = [key];
  if (!key.includes(".")) {
    keysToTry.push(`${key}.mp4`, `${key}.webm`, `${key}.mov`);
  }

  const rangeHeader = req.headers.get("range");

  for (const tryKey of keysToTry) {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: tigris.bucket,
        Key: tryKey,
      });
      const headRes = await tigris.client.send(headCommand);
      const totalSize = headRes.ContentLength || 0;
      const ext = tryKey.slice(tryKey.lastIndexOf(".")).toLowerCase();
      const contentType = headRes.ContentType || MIME_BY_EXT[ext] || "video/mp4";
      const isVideo = contentType.startsWith("video/") || tryKey.startsWith("videos/");

      // Redirect large videos directly to presigned Tigris S3 URL to bypass Vercel's 4.5MB response limit & timeouts
      if (!forceProxy && (isVideo || totalSize > MAX_PROXY_CHUNK_BYTES)) {
        try {
          const getCmd = new GetObjectCommand({
            Bucket: tigris.bucket,
            Key: tryKey,
            ResponseContentType: contentType,
          });
          const signedUrl = await getSignedUrl(tigris.client, getCmd, { expiresIn: 14400 });
          return NextResponse.redirect(signedUrl, 307);
        } catch {}
      }

      const effectiveRange = clampRangeHeader(rangeHeader, totalSize);
      const command = new GetObjectCommand({
        Bucket: tigris.bucket,
        Key: tryKey,
        Range: effectiveRange,
      });

      const response = await tigris.client.send(command);

      if (response.Body) {
        const headers: Record<string, string> = {
          "Accept-Ranges": "bytes",
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        };

        if (response.ContentLength) {
          headers["Content-Length"] = response.ContentLength.toString();
        }
        if (response.ContentRange) {
          headers["Content-Range"] = response.ContentRange;
        }
        if (response.ETag) {
          headers["ETag"] = response.ETag;
        }

        const webStream = response.Body.transformToWebStream();
        return new Response(webStream as unknown as BodyInit, {
          status: effectiveRange ? 206 : 200,
          headers,
        });
      }
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode !== 404) {
        // Continue to try other keys
      }
    }
  }

  return new Response("Object not found in Tigris storage", { status: 404 });
}
