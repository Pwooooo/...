import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { put, del, list } from "@vercel/blob";
import { VideoItem } from "@/types";
import { ALL_VIDEOS } from "@/lib/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const BACKUP_VIDEOS_FILE = path.join(DATA_DIR, "videos_backup.json");
const DELETED_VIDEOS_FILE = path.join(DATA_DIR, "deleted_videos.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

function isNextJsFillerVideo(video?: { id?: string; title?: string } | null): boolean {
  if (!video || typeof video !== "object") return false;
  const id = typeof video.id === "string" ? video.id : "";
  const title = typeof video.title === "string" ? video.title.toLowerCase() : "";
  return (
    id === "v-srv-1792152077838" ||
    id === "v-user-1792152077838" ||
    id === "sample-2" ||
    (title.includes("next.js") && title.includes("deep dive")) ||
    title.includes("next.js 16")
  );
}

function safeEnsureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    if (!fs.existsSync(VIDEOS_FILE)) {
      const seed = ALL_VIDEOS.filter((v) => !isNextJsFillerVideo(v));
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(seed, null, 2), "utf-8");
    }
    if (!fs.existsSync(BACKUP_VIDEOS_FILE)) {
      fs.writeFileSync(BACKUP_VIDEOS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    if (!fs.existsSync(DELETED_VIDEOS_FILE)) {
      fs.writeFileSync(DELETED_VIDEOS_FILE, JSON.stringify(DEFAULT_SERVER_DELETED, null, 2), "utf-8");
    }
  } catch {
    // Read-only serverless environment
  }
}

const DEFAULT_SERVER_DELETED = ["v-srv-1792152077838", "v-user-1792152077838", "sample-2"];

function readDeletedVideoIds(): Set<string> {
  safeEnsureDirs();
  const set = new Set<string>(DEFAULT_SERVER_DELETED);
  try {
    if (fs.existsSync(DELETED_VIDEOS_FILE)) {
      const raw = fs.readFileSync(DELETED_VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => set.add(id));
      }
    }
  } catch {}
  return set;
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
  const deleted = readDeletedVideoIds();
  const map = new Map<string, VideoItem>();

  // 1. Base static videos
  ALL_VIDEOS.forEach((v) => {
    if (v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v)) {
      map.set(v.id, v);
    }
  });

  // 2. Backup videos file (persistent user uploads backup)
  try {
    if (fs.existsSync(BACKUP_VIDEOS_FILE)) {
      const raw = fs.readFileSync(BACKUP_VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((v: VideoItem) => {
          if (v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v)) {
            map.set(v.id, v);
          }
        });
      }
    }
  } catch {}

  // 3. Primary videos file
  try {
    if (fs.existsSync(VIDEOS_FILE)) {
      const raw = fs.readFileSync(VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((v: VideoItem) => {
          if (v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v)) {
            map.set(v.id, v);
          }
        });
      }
    }
  } catch {}

  const result = Array.from(map.values());
  return result;
}

function writeLocalVideos(videos: VideoItem[]): void {
  safeEnsureDirs();
  try {
    const deleted = readDeletedVideoIds();
    const filtered = videos.filter((v) => v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v));
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(filtered, null, 2), "utf-8");

    // Also persist user uploads to backup file so they are never lost
    const userOnly = filtered.filter((v) => !v.id.startsWith("sample-"));
    fs.writeFileSync(BACKUP_VIDEOS_FILE, JSON.stringify(userOnly, null, 2), "utf-8");
  } catch {}
}

// ----------------- Vercel Blob Operations -----------------
function hasVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function fetchBlobVideosIndex(): Promise<VideoItem[]> {
  if (!hasVercelBlob()) return [];
  try {
    const { blobs } = await list({ prefix: "metadata/videos.json" });
    if (blobs.length > 0) {
      const res = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const parsed = await res.json();
        if (Array.isArray(parsed)) {
          const deleted = readDeletedVideoIds();
          return parsed.filter((v: VideoItem) => v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v));
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch Blob videos index:", err);
  }
  return [];
}

async function saveBlobVideosIndex(videos: VideoItem[]): Promise<void> {
  if (!hasVercelBlob()) return;
  try {
    const deleted = readDeletedVideoIds();
    const filtered = videos.filter((v) => v && v.id && !deleted.has(v.id) && !isNextJsFillerVideo(v));
    await put("metadata/videos.json", JSON.stringify(filtered, null, 2), {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
  } catch (err) {
    console.warn("Could not save Blob videos index:", err);
  }
}

// ----------------- Cloudflare R2 / S3 Configuration -----------------
function getR2Config() {
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

let cachedR2Client: { client: S3Client; bucket: string; publicUrl: string; endpoint: string } | null = null;

function getR2Client() {
  const config = getR2Config();
  if (!config) return null;

  if (!cachedR2Client) {
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
      cachedR2Client = { client, bucket: config.bucket, publicUrl: config.publicUrl, endpoint: config.endpoint };
    } catch (err) {
      console.warn("Could not create Cloudflare R2 client:", err);
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

async function fetchR2VideosIndex(): Promise<VideoItem[]> {
  const r2 = getR2Client();
  if (!r2) return [];

  try {
    const command = new GetObjectCommand({
      Bucket: r2.bucket,
      Key: "metadata/videos.json",
    });
    const response = await r2.client.send(command);
    const bodyStr = await response.Body?.transformToString();
    if (bodyStr) {
      const parsed = JSON.parse(bodyStr);
      if (Array.isArray(parsed)) {
        const deleted = readDeletedVideoIds();
        return parsed.filter((v: VideoItem) => !deleted.has(v.id));
      }
    }
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name !== "NoSuchKey" && name !== "NotFound") {
      console.warn("Could not fetch R2 videos index:", err);
    }
  }
  return [];
}

async function saveR2VideosIndex(videos: VideoItem[]): Promise<void> {
  const r2 = getR2Client();
  if (!r2) return;

  try {
    const deleted = readDeletedVideoIds();
    const filtered = videos.filter((v) => !deleted.has(v.id));
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: "metadata/videos.json",
      Body: Buffer.from(JSON.stringify(filtered, null, 2)),
      ContentType: "application/json",
    });
    await r2.client.send(command);
  } catch (err) {
    console.warn("Could not save R2 videos index:", err);
  }
}

export async function GET() {
  try {
    const deleted = readDeletedVideoIds();
    const blobVideos = await fetchBlobVideosIndex();
    const r2Videos = await fetchR2VideosIndex();
    const localVideos = readLocalVideos();

    // Priority merge: local disk -> R2 cloud -> Vercel Blob cloud
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => {
      if (!deleted.has(v.id)) map.set(v.id, v);
    });
    r2Videos.forEach((v) => {
      if (!deleted.has(v.id)) map.set(v.id, v);
    });
    blobVideos.forEach((v) => {
      if (!deleted.has(v.id)) map.set(v.id, v);
    });

    const all = Array.from(map.values()).filter((v) => !deleted.has(v.id));

    // Keep local store warm if running locally and cloud had new items
    if (r2Videos.length > 0 || blobVideos.length > 0) {
      writeLocalVideos(all);
    }

    return NextResponse.json(
      { success: true, videos: all },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
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

    // Block the Next.js filler video from ever being accepted or revived
    if (
      videoId === "v-srv-1792152077838" ||
      videoId === "v-user-1792152077838" ||
      videoId === "sample-2" ||
      (title.toLowerCase().includes("next.js") && (title.toLowerCase().includes("deep dive") || title.toLowerCase().includes("16")))
    ) {
      recordDeletedVideoId(videoId);
      return NextResponse.json({ success: false, error: "Filler video is permanently removed" }, { status: 400 });
    }

    if (!readDeletedVideoIds().has(videoId)) {
      unmarkDeletedVideoId(videoId);
    }

    let rawVideoUrl = (formData.get("rawVideoUrl") as string) || "";

    // 1. Video file handling (Vercel Blob -> Cloudflare R2 -> local disk fallback)
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoBuffer = Buffer.from(await file.arrayBuffer());

      // Try Vercel Blob
      if (hasVercelBlob()) {
        try {
          const blob = await put(`videos/${videoId}.${ext}`, videoBuffer, {
            access: "public",
            contentType: file.type || "video/mp4",
          });
          rawVideoUrl = blob.url;
        } catch (err) {
          console.warn("Could not upload to Vercel Blob:", err);
        }
      }

      // Try Cloudflare R2
      if (!rawVideoUrl) {
        const r2VideoKey = `videos/${videoId}.${ext}`;
        const r2VideoUrl = await uploadToCloudflareR2(
          videoBuffer,
          r2VideoKey,
          file.type || "video/mp4"
        );
        const r2Config = getR2Config();
        if (r2Config?.publicUrl && r2VideoUrl) {
          rawVideoUrl = r2VideoUrl;
        }
      }

      // Local disk fallback
      try {
        const videoFileName = `${videoId}.${ext}`;
        const videoFilePath = path.join(VIDEOS_DIR, videoFileName);
        await fs.promises.writeFile(videoFilePath, videoBuffer);
        if (!rawVideoUrl) {
          rawVideoUrl = `/api/videos/${videoId}/stream`;
        }
      } catch (err) {
        console.warn("Could not write video file locally:", err);
      }
    }

    if (!rawVideoUrl) {
      rawVideoUrl = `/api/videos/${videoId}/stream`;
    }

    // 2. Thumbnail handling (Vercel Blob -> Cloudflare R2 -> local disk fallback)
    let thumbnailUrl = (formData.get("thumbnailUrl") as string) || "";

    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());

      if (hasVercelBlob()) {
        try {
          const blob = await put(`thumbnails/${videoId}.${thumbExt}`, thumbBuffer, {
            access: "public",
            contentType: thumbnailFile.type || "image/jpeg",
          });
          thumbnailUrl = blob.url;
        } catch {}
      }

      if (!thumbnailUrl) {
        const r2ThumbKey = `thumbnails/${videoId}.${thumbExt}`;
        const r2ThumbUrl = await uploadToCloudflareR2(
          thumbBuffer,
          r2ThumbKey,
          thumbnailFile.type || "image/jpeg"
        );
        if (r2ThumbUrl) {
          thumbnailUrl = r2ThumbUrl;
        }
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

          if (hasVercelBlob()) {
            try {
              const blob = await put(`thumbnails/${videoId}.jpg`, thumbBuffer, {
                access: "public",
                contentType: "image/jpeg",
              });
              thumbnailUrl = blob.url;
            } catch {}
          }

          if (!thumbnailUrl) {
            const r2ThumbKey = `thumbnails/${videoId}.jpg`;
            const r2ThumbUrl = await uploadToCloudflareR2(
              thumbBuffer,
              r2ThumbKey,
              "image/jpeg"
            );
            if (r2ThumbUrl) {
              thumbnailUrl = r2ThumbUrl;
            }
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

    if (!thumbnailUrl) {
      thumbnailUrl = "/placeholder-thumb.jpg";
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
      thumbnailUrl: thumbnailUrl || "/placeholder-thumb.jpg",
      masterPlaylistUrl: null,
      rawVideoUrl: rawVideoUrl || null,
      durationSeconds: Math.round(Number(durationRaw)) || 0,
      viewCount: 0,
      publishedAt: new Date().toISOString(),
      category,
      tags: tags.length > 0 ? tags : [category],
      channel,
    };

    // Merge into Vercel Blob, R2, and local disk stores
    const blobVideos = await fetchBlobVideosIndex();
    const r2Videos = await fetchR2VideosIndex();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    r2Videos.forEach((v) => map.set(v.id, v));
    blobVideos.forEach((v) => map.set(v.id, v));
    map.set(newVideo.id, newVideo);

    const updatedVideos = [newVideo, ...Array.from(map.values()).filter((v) => v.id !== newVideo.id)];

    await saveBlobVideosIndex(updatedVideos);
    await saveR2VideosIndex(updatedVideos);
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

    recordDeletedVideoId(id);

    const blobVideos = await fetchBlobVideosIndex();
    const r2Videos = await fetchR2VideosIndex();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    r2Videos.forEach((v) => map.set(v.id, v));
    blobVideos.forEach((v) => map.set(v.id, v));

    const target = map.get(id);
    if (target) {
      // Delete from Vercel Blob if applicable
      if (hasVercelBlob()) {
        try {
          if (target.rawVideoUrl?.includes("blob.vercel-storage.com")) {
            await del(target.rawVideoUrl);
          }
          if (target.thumbnailUrl?.includes("blob.vercel-storage.com")) {
            await del(target.thumbnailUrl);
          }
        } catch {}
      }

      // Delete from Cloudflare R2 if applicable
      if (target.rawVideoUrl) {
        await deleteFromCloudflareR2(target.rawVideoUrl);
      }
      if (target.thumbnailUrl) {
        await deleteFromCloudflareR2(target.thumbnailUrl);
      }

      // Delete from local filesystem
      const exts = [".mp4", ".webm", ".mov", ".mkv", ".m4v"];
      for (const ext of exts) {
        const videoPath = path.join(VIDEOS_DIR, `${id}${ext}`);
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
      const thumbExts = [".jpg", ".png", ".webp"];
      for (const ext of thumbExts) {
        const thumbPath = path.join(THUMBNAILS_DIR, `${id}${ext}`);
        try {
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch {}
      }
    }

    await deleteFromCloudflareR2(`videos/${id}.mp4`);
    await deleteFromCloudflareR2(`videos/${id}.webm`);
    await deleteFromCloudflareR2(`thumbnails/${id}.jpg`);
    await deleteFromCloudflareR2(`thumbnails/${id}.png`);

    map.delete(id);
    const updated = Array.from(map.values()).filter((v) => v.id !== id);

    await saveBlobVideosIndex(updated);
    await saveR2VideosIndex(updated);
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

    const blobVideos = await fetchBlobVideosIndex();
    const r2Videos = await fetchR2VideosIndex();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    r2Videos.forEach((v) => map.set(v.id, v));
    blobVideos.forEach((v) => map.set(v.id, v));

    const existing = map.get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    const updatedVideo: VideoItem = {
      ...existing,
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      category: category !== undefined ? category : existing.category,
      tags: tags !== undefined ? tags : existing.tags,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
    };

    map.set(id, updatedVideo);
    const updatedList = Array.from(map.values());

    await saveBlobVideosIndex(updatedList);
    await saveR2VideosIndex(updatedList);
    writeLocalVideos(updatedList);

    return NextResponse.json({ success: true, video: updatedVideo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating video";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
