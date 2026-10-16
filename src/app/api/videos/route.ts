import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { VideoItem } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const DELETED_VIDEOS_FILE = path.join(DATA_DIR, "deleted_videos.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

const CLOUD_DB_ID = "ff808181a09d98f701a1449311a87263";
const CLOUD_DB_URL = `https://api.restful-api.dev/objects/${CLOUD_DB_ID}`;

function safeEnsureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    if (!fs.existsSync(VIDEOS_FILE)) fs.writeFileSync(VIDEOS_FILE, JSON.stringify([], null, 2), "utf-8");
    if (!fs.existsSync(DELETED_VIDEOS_FILE)) fs.writeFileSync(DELETED_VIDEOS_FILE, JSON.stringify([], null, 2), "utf-8");
  } catch {
    // Read-only serverless environment
  }
}

function readDeletedVideoIds(): Set<string> {
  safeEnsureDirs();
  try {
    if (fs.existsSync(DELETED_VIDEOS_FILE)) {
      const raw = fs.readFileSync(DELETED_VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function recordDeletedVideoId(id: string): void {
  safeEnsureDirs();
  try {
    const set = readDeletedVideoIds();
    set.add(id);
    fs.writeFileSync(DELETED_VIDEOS_FILE, JSON.stringify(Array.from(set), null, 2), "utf-8");
  } catch {}
}

function unmarkDeletedVideoId(id: string): void {
  safeEnsureDirs();
  try {
    const set = readDeletedVideoIds();
    if (set.delete(id)) {
      fs.writeFileSync(DELETED_VIDEOS_FILE, JSON.stringify(Array.from(set), null, 2), "utf-8");
    }
  } catch {}
}

function readLocalVideos(): VideoItem[] {
  safeEnsureDirs();
  try {
    if (fs.existsSync(VIDEOS_FILE)) {
      const raw = fs.readFileSync(VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const deleted = readDeletedVideoIds();
      return Array.isArray(parsed) ? parsed.filter((v: VideoItem) => !deleted.has(v.id)) : [];
    }
  } catch {}
  return [];
}

function writeLocalVideos(videos: VideoItem[]): void {
  safeEnsureDirs();
  try {
    const deleted = readDeletedVideoIds();
    const filtered = videos.filter((v) => !deleted.has(v.id));
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  } catch {}
}

async function fetchCloudVideos(): Promise<VideoItem[]> {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.payload) {
        const parsed = JSON.parse(json.data.payload);
        if (Array.isArray(parsed)) {
          const deleted = readDeletedVideoIds();
          return parsed.filter((v: VideoItem) => !deleted.has(v.id));
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch cloud videos:", err);
  }
  return [];
}

async function saveCloudVideos(videos: VideoItem[]): Promise<void> {
  try {
    const deleted = readDeletedVideoIds();
    const filtered = videos.filter((v) => !deleted.has(v.id));
    await fetch(CLOUD_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "entropy_videos",
        data: {
          payload: JSON.stringify(filtered),
        },
      }),
    });
  } catch (err) {
    console.warn("Could not save cloud videos:", err);
  }
}

// Cloudflare R2 / S3 Configuration
function getR2Config() {
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID;

  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY ||
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;

  const bucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    process.env.S3_BUCKET_NAME ||
    "youtube-media";

  let endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    process.env.S3_ENDPOINT;

  if (accountId && !endpoint) {
    endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  }

  const publicUrl = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    process.env.S3_PUBLIC_DOMAIN ||
    ""
  ).replace(/\/$/, "");

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint, publicUrl };
}

let cachedR2Client: { client: S3Client; bucket: string; publicUrl: string; endpoint: string } | null = null;

function getR2Client() {
  const config = getR2Config();
  if (!config) return null;

  if (!cachedR2Client) {
    try {
      const client = new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
      cachedR2Client = { client, bucket: config.bucket, publicUrl: config.publicUrl, endpoint: config.endpoint };
    } catch (err) {
      console.warn("Could not create Cloudflare R2 / S3 client:", err);
      return null;
    }
  }
  return cachedR2Client;
}

async function uploadToCloudflareR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await r2.client.send(command);

    if (r2.publicUrl) {
      return `${r2.publicUrl}/${key}`;
    }
    return `${r2.endpoint}/${r2.bucket}/${key}`;
  } catch (err) {
    console.error(`Failed to upload ${key} to Cloudflare R2:`, err);
    return null;
  }
}

async function deleteFromCloudflareR2(keyOrUrl: string): Promise<boolean> {
  const r2 = getR2Client();
  if (!r2 || !keyOrUrl) return false;

  try {
    let key = keyOrUrl;
    if (key.startsWith("http://") || key.startsWith("https://")) {
      try {
        const u = new URL(key);
        key = u.pathname.replace(/^\//, "");
        if (key.startsWith(`${r2.bucket}/`)) {
          key = key.replace(`${r2.bucket}/`, "");
        }
      } catch {}
    }

    const command = new DeleteObjectCommand({
      Bucket: r2.bucket,
      Key: key,
    });
    await r2.client.send(command);
    return true;
  } catch (err) {
    console.warn(`Could not delete object ${keyOrUrl} from Cloudflare R2:`, err);
    return false;
  }
}

export async function GET() {
  try {
    const deleted = readDeletedVideoIds();
    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();

    // Merge by id (cloud priority, fallback to local)
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => {
      if (!deleted.has(v.id)) map.set(v.id, v);
    });
    cloudVideos.forEach((v) => {
      if (!deleted.has(v.id)) map.set(v.id, v);
    });

    const all = Array.from(map.values()).filter((v) => !deleted.has(v.id));
    writeLocalVideos(all);

    return NextResponse.json({ success: true, videos: all });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error reading videos";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    safeEnsureDirs();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Untitled Video";
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "Technology";
    const tagsRaw = (formData.get("tags") as string) || "";
    const durationRaw = (formData.get("duration") as string) || "0";
    const channelRaw = (formData.get("channel") as string) || "{}";
    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    const thumbnailDataUrl = (formData.get("thumbnailDataUrl") as string) || "";

    const requestedId = (formData.get("id") as string) || "";
    const videoId = requestedId || `v-srv-${Date.now()}`;
    unmarkDeletedVideoId(videoId);

    let rawVideoUrl = (formData.get("rawVideoUrl") as string) || "";

    // 1. Video file handling (Cloudflare R2 primary, local disk fallback)
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoBuffer = Buffer.from(await file.arrayBuffer());
      const r2VideoKey = `videos/${videoId}.${ext}`;

      // Upload to Cloudflare R2
      const r2VideoUrl = await uploadToCloudflareR2(
        videoBuffer,
        r2VideoKey,
        file.type || "video/mp4"
      );

      if (r2VideoUrl) {
        rawVideoUrl = r2VideoUrl;
      }

      // Also save locally if writable
      try {
        const videoFileName = `${videoId}.${ext}`;
        const videoFilePath = path.join(VIDEOS_DIR, videoFileName);
        await fs.promises.writeFile(videoFilePath, videoBuffer);
        if (!rawVideoUrl) {
          rawVideoUrl = `/uploads/videos/${videoFileName}`;
        }
      } catch {}
    }

    // 2. Thumbnail handling (Cloudflare R2 primary, local disk fallback)
    let thumbnailUrl = (formData.get("thumbnailUrl") as string) || "";

    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const r2ThumbKey = `thumbnails/${videoId}.${thumbExt}`;

      const r2ThumbUrl = await uploadToCloudflareR2(
        thumbBuffer,
        r2ThumbKey,
        thumbnailFile.type || "image/jpeg"
      );

      if (r2ThumbUrl) {
        thumbnailUrl = r2ThumbUrl;
      }

      try {
        const thumbFileName = `${videoId}.${thumbExt}`;
        const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);
        await fs.promises.writeFile(thumbFilePath, thumbBuffer);
        if (!thumbnailUrl) {
          thumbnailUrl = `/uploads/thumbnails/${thumbFileName}`;
        }
      } catch {}
    } else if (thumbnailDataUrl && thumbnailDataUrl.startsWith("data:image")) {
      const matches = thumbnailDataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches[2]) {
        try {
          const thumbBuffer = Buffer.from(matches[2], "base64");
          const r2ThumbKey = `thumbnails/${videoId}.jpg`;

          const r2ThumbUrl = await uploadToCloudflareR2(
            thumbBuffer,
            r2ThumbKey,
            "image/jpeg"
          );

          if (r2ThumbUrl) {
            thumbnailUrl = r2ThumbUrl;
          }

          const thumbFileName = `${videoId}.jpg`;
          const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);
          await fs.promises.writeFile(thumbFilePath, thumbBuffer);
          if (!thumbnailUrl) {
            thumbnailUrl = `/uploads/thumbnails/${thumbFileName}`;
          }
        } catch {
          if (!thumbnailUrl) thumbnailUrl = thumbnailDataUrl;
        }
      } else {
        thumbnailUrl = thumbnailDataUrl;
      }
    }

    let channel = {
      id: "unknown",
      handle: "anonymous",
      displayName: "Creator",
      avatarUrl: "",
      subscribersCount: 0,
    };

    try {
      channel = { ...channel, ...JSON.parse(channelRaw) };
    } catch {}

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    const newVideo: VideoItem = {
      id: videoId,
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl || null,
      masterPlaylistUrl: null,
      rawVideoUrl: rawVideoUrl || null,
      durationSeconds: Math.round(Number(durationRaw)) || 0,
      viewCount: 0,
      publishedAt: new Date().toISOString(),
      category,
      tags,
      channel,
    };

    // Merge into cloud and local stores
    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    cloudVideos.forEach((v) => map.set(v.id, v));
    map.set(newVideo.id, newVideo);

    const updatedVideos = [newVideo, ...Array.from(map.values()).filter((v) => v.id !== newVideo.id)];

    await saveCloudVideos(updatedVideos);
    writeLocalVideos(updatedVideos);

    return NextResponse.json({ success: true, video: newVideo });
  } catch (err: unknown) {
    console.error("Failed to upload video:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    // 1. Immediately record tombstone so this video cannot be returned or revived
    recordDeletedVideoId(id);

    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    cloudVideos.forEach((v) => map.set(v.id, v));

    const target = map.get(id);
    if (target) {
      // Delete from Cloudflare R2 if applicable
      if (target.rawVideoUrl) {
        await deleteFromCloudflareR2(target.rawVideoUrl);
      }
      if (target.thumbnailUrl) {
        await deleteFromCloudflareR2(target.thumbnailUrl);
      }

      // Delete from local filesystem
      if (target.rawVideoUrl && target.rawVideoUrl.startsWith("/uploads/videos/")) {
        const videoPath = path.join(process.cwd(), "public", target.rawVideoUrl);
        try {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        } catch {}
      }
      if (target.thumbnailUrl && target.thumbnailUrl.startsWith("/uploads/thumbnails/")) {
        const thumbPath = path.join(process.cwd(), "public", target.thumbnailUrl);
        try {
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch {}
      }
    }

    // Delete common R2 key patterns for this video
    await deleteFromCloudflareR2(`videos/${id}.mp4`);
    await deleteFromCloudflareR2(`videos/${id}.webm`);
    await deleteFromCloudflareR2(`thumbnails/${id}.jpg`);
    await deleteFromCloudflareR2(`thumbnails/${id}.png`);

    map.delete(id);
    const updated = Array.from(map.values()).filter((v) => v.id !== id);

    await saveCloudVideos(updated);
    writeLocalVideos(updated);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting video";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, category, tags, thumbnailUrl } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    cloudVideos.forEach((v) => map.set(v.id, v));

    const target = map.get(id);
    if (!target) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    const updated: VideoItem = {
      ...target,
      title: title !== undefined ? title : target.title,
      description: description !== undefined ? description : target.description,
      category: category !== undefined ? category : target.category,
      tags: tags !== undefined ? tags : target.tags,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : target.thumbnailUrl,
    };

    map.set(id, updated);
    const all = Array.from(map.values());

    await saveCloudVideos(all);
    writeLocalVideos(all);

    return NextResponse.json({ success: true, video: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating video";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
