import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { VideoItem } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

const CLOUD_DB_ID = "ff808181a09d98f701a1449311a87263";
const CLOUD_DB_URL = `https://api.restful-api.dev/objects/${CLOUD_DB_ID}`;

function safeEnsureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    }
    if (!fs.existsSync(VIDEOS_FILE)) {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch {
    // Read-only environment like Vercel serverless function
  }
}

function readLocalVideos(): VideoItem[] {
  safeEnsureDirs();
  try {
    if (fs.existsSync(VIDEOS_FILE)) {
      const raw = fs.readFileSync(VIDEOS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalVideos(videos: VideoItem[]): void {
  safeEnsureDirs();
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), "utf-8");
  } catch {
    // Read-only filesystem on serverless
  }
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
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not fetch cloud videos:", err);
  }
  return [];
}

async function saveCloudVideos(videos: VideoItem[]): Promise<void> {
  try {
    await fetch(CLOUD_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "entropy_videos",
        data: {
          payload: JSON.stringify(videos),
        },
      }),
    });
  } catch (err) {
    console.warn("Could not save cloud videos:", err);
  }
}

async function uploadToCatbox(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("userhash", "");
    form.append("fileToUpload", file, file.name);

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });
    if (res.ok) {
      const text = await res.text();
      if (text.startsWith("http")) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("Catbox video upload failed:", err);
  }
  return null;
}

async function uploadThumbnailToCatbox(fileOrBlob: File | Blob, filename: string): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("userhash", "");
    form.append("fileToUpload", fileOrBlob, filename);

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });
    if (res.ok) {
      const text = await res.text();
      if (text.startsWith("http")) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("Catbox thumb upload failed:", err);
  }
  return null;
}

export async function GET() {
  try {
    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();

    // Merge by id (cloud priority, fallback to local)
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    cloudVideos.forEach((v) => map.set(v.id, v));

    const all = Array.from(map.values());
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
    let rawVideoUrl = (formData.get("rawVideoUrl") as string) || "";

    // 1. Upload Video to Catbox for worldwide fast CDN streaming
    if (file) {
      const catboxVideoUrl = await uploadToCatbox(file);
      if (catboxVideoUrl) {
        rawVideoUrl = catboxVideoUrl;
      }

      // Also save locally if filesystem is writable
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
        const videoFileName = `${videoId}.${ext}`;
        const videoFilePath = path.join(VIDEOS_DIR, videoFileName);
        const videoBuffer = Buffer.from(await file.arrayBuffer());
        await fs.promises.writeFile(videoFilePath, videoBuffer);
        if (!rawVideoUrl) {
          rawVideoUrl = `/uploads/videos/${videoFileName}`;
        }
      } catch {}
    }

    // 2. Handle Thumbnail
    let thumbnailUrl = (formData.get("thumbnailUrl") as string) || "";
    if (thumbnailFile) {
      const catboxThumbUrl = await uploadThumbnailToCatbox(thumbnailFile, thumbnailFile.name);
      if (catboxThumbUrl) {
        thumbnailUrl = catboxThumbUrl;
      }
      try {
        const thumbExt = thumbnailFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const thumbFileName = `${videoId}.${thumbExt}`;
        const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);
        const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
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
          const thumbBlob = new Blob([thumbBuffer], { type: "image/jpeg" });
          const catboxThumb = await uploadThumbnailToCatbox(thumbBlob, `${videoId}.jpg`);
          if (catboxThumb) {
            thumbnailUrl = catboxThumb;
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

    const cloudVideos = await fetchCloudVideos();
    const localVideos = readLocalVideos();
    const map = new Map<string, VideoItem>();
    localVideos.forEach((v) => map.set(v.id, v));
    cloudVideos.forEach((v) => map.set(v.id, v));

    const target = map.get(id);
    if (target) {
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

    map.delete(id);
    const updated = Array.from(map.values());

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
