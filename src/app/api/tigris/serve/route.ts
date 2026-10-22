import { NextRequest, NextResponse } from "next/server";
import { getTigrisClient } from "@/lib/tigris";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return new Response(null, { status: 400 });
  }

  const key = rawKey.replace(/^\/+/, "");
  const tigris = getTigrisClient();
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

  if (!rawKey) {
    return new Response("Missing 'key' parameter", { status: 400 });
  }

  const key = rawKey.replace(/^\/+/, "");
  const tigris = getTigrisClient();
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
      const command = new GetObjectCommand({
        Bucket: tigris.bucket,
        Key: tryKey,
        Range: rangeHeader || undefined,
      });

      const response = await tigris.client.send(command);

      if (response.Body) {
        const ext = tryKey.slice(tryKey.lastIndexOf(".")).toLowerCase();
        const contentType = response.ContentType || MIME_BY_EXT[ext] || "video/mp4";

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
          status: rangeHeader ? 206 : 200,
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
