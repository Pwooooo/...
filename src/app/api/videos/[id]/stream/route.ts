import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getTigrisClient } from "@/lib/tigris";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "videos");
const PUBLIC_VIDEOS_DIR = path.join(process.cwd(), "public", "videos");

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".m4v": "video/mp4",
};

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "entropy-videos";
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
  const publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

  try {
    const client = new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    return { client, bucket, endpoint, publicUrl };
  } catch {
    return null;
  }
}

function findLocalVideoFile(id: string): string | null {
  const dirs = [PUBLIC_VIDEOS_DIR, UPLOADS_DIR];
  const extensions = [".mp4", ".webm", ".mov", ".mkv", ".m4v"];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    for (const ext of extensions) {
      const candidate = path.join(dir, `${id}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }

    try {
      const files = fs.readdirSync(dir);
      const match = files.find((f) => f.startsWith(`${id}.`));
      if (match) return path.join(dir, match);
    } catch {}
  }

  return null;
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const localFile = findLocalVideoFile(id);

  if (localFile && fs.existsSync(localFile)) {
    const stat = fs.statSync(localFile);
    const ext = path.extname(localFile).toLowerCase();
    const contentType = MIME_MAP[ext] || "video/mp4";

    return new Response(null, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": stat.size.toString(),
        "Content-Type": contentType,
      },
    });
  }

  const tigris = getTigrisClient();
  if (tigris?.publicUrl) {
    return NextResponse.redirect(`${tigris.publicUrl}/videos/${id}.mp4`, 302);
  }

  const r2 = getR2Client();
  if (r2?.publicUrl) {
    return NextResponse.redirect(`${r2.publicUrl}/videos/${id}.mp4`, 302);
  }

  return new Response(null, { status: 404 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const localFile = findLocalVideoFile(id);

  // 1. Stream from local server storage with YouTube-grade HTTP 206 Partial Content byte ranges
  if (localFile && fs.existsSync(localFile)) {
    const stat = fs.statSync(localFile);
    const fileSize = stat.size;
    const ext = path.extname(localFile).toLowerCase();
    const contentType = MIME_MAP[ext] || "video/mp4";
    const rangeHeader = req.headers.get("range");

    if (!rangeHeader) {
      const nodeStream = fs.createReadStream(localFile);
      const webStream = Readable.toWeb(nodeStream);
      return new Response(webStream as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || (parts[1] && isNaN(end)) || end >= fileSize || start > end) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(localFile, { start, end });
    const webStream = Readable.toWeb(nodeStream);

    return new Response(webStream as unknown as BodyInit, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 2. Stream from Tigris Object Storage
  const tigris = getTigrisClient();
  if (tigris) {
    if (tigris.publicUrl) {
      return NextResponse.redirect(`${tigris.publicUrl}/videos/${id}.mp4`, 302);
    }

    try {
      const rangeHeader = req.headers.get("range");
      const command = new GetObjectCommand({
        Bucket: tigris.bucket,
        Key: `videos/${id}.mp4`,
        Range: rangeHeader || undefined,
      });

      const response = await tigris.client.send(command);
      if (response.Body) {
        const webStream = response.Body.transformToWebStream();
        return new Response(webStream as unknown as BodyInit, {
          status: rangeHeader ? 206 : 200,
          headers: {
            "Content-Type": response.ContentType || "video/mp4",
            "Content-Length": response.ContentLength?.toString() || "",
            "Content-Range": response.ContentRange || "",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch {
      // try other extensions or fallback to R2/Blob
    }
  }

  // 3. Stream from Cloudflare R2 / S3
  const r2 = getR2Client();
  if (r2) {
    if (r2.publicUrl) {
      return NextResponse.redirect(`${r2.publicUrl}/videos/${id}.mp4`, 302);
    }

    try {
      const rangeHeader = req.headers.get("range");
      const command = new GetObjectCommand({
        Bucket: r2.bucket,
        Key: `videos/${id}.mp4`,
        Range: rangeHeader || undefined,
      });

      const response = await r2.client.send(command);
      if (response.Body) {
        const webStream = response.Body.transformToWebStream();
        return new Response(webStream as unknown as BodyInit, {
          status: rangeHeader ? 206 : 200,
          headers: {
            "Content-Type": response.ContentType || "video/mp4",
            "Content-Length": response.ContentLength?.toString() || "",
            "Content-Range": response.ContentRange || "",
            "Accept-Ranges": "bytes",
          },
        });
      }
    } catch {
      // ignore
    }
  }

  // 3. Stream / redirect from Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list: listBlobs } = await import("@vercel/blob");
      const { blobs } = await listBlobs();
      const match = blobs.find((b) => {
        const p = b.pathname.toLowerCase();
        return (
          p.includes(id.toLowerCase()) &&
          (p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".mov") || p.endsWith(".m4v") || p.endsWith(".mkv"))
        );
      });
      if (match) {
        return NextResponse.redirect(
          new URL(`/api/blob/serve?pathname=${encodeURIComponent(match.pathname)}`, req.url),
          302
        );
      }
    } catch {}
  }

  return new Response("Video media file not found on server", { status: 404 });
}
