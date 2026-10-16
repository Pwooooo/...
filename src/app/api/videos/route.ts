import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { VideoItem } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, "thumbnails");

function ensureDirs() {
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
}

function readVideos(): VideoItem[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(VIDEOS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeVideos(videos: VideoItem[]): void {
  ensureDirs();
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), "utf-8");
}

export async function GET() {
  try {
    const videos = readVideos();
    return NextResponse.json({ success: true, videos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error reading videos";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureDirs();
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

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoFileName = `${videoId}.${ext}`;
      const videoFilePath = path.join(VIDEOS_DIR, videoFileName);
      const videoBuffer = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(videoFilePath, videoBuffer);
      rawVideoUrl = `/uploads/videos/${videoFileName}`;
    }

    // Handle Thumbnail
    let thumbnailUrl = (formData.get("thumbnailUrl") as string) || "";
    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const thumbFileName = `${videoId}.${thumbExt}`;
      const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await fs.promises.writeFile(thumbFilePath, thumbBuffer);
      thumbnailUrl = `/uploads/thumbnails/${thumbFileName}`;
    } else if (thumbnailDataUrl && thumbnailDataUrl.startsWith("data:image")) {
      const matches = thumbnailDataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const thumbBuffer = Buffer.from(matches[2], "base64");
        const thumbFileName = `${videoId}.jpg`;
        const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFileName);
        await fs.promises.writeFile(thumbFilePath, thumbBuffer);
        thumbnailUrl = `/uploads/thumbnails/${thumbFileName}`;
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

    const currentVideos = readVideos();
    const updatedVideos = [newVideo, ...currentVideos.filter((v) => v.id !== videoId)];
    writeVideos(updatedVideos);

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

    const currentVideos = readVideos();
    const target = currentVideos.find((v) => v.id === id);
    if (target) {
      // Remove video file from disk if local
      if (target.rawVideoUrl && target.rawVideoUrl.startsWith("/uploads/videos/")) {
        const videoPath = path.join(process.cwd(), "public", target.rawVideoUrl);
        if (fs.existsSync(videoPath)) {
          try {
            fs.unlinkSync(videoPath);
          } catch {}
        }
      }
      // Remove thumbnail file from disk if local
      if (target.thumbnailUrl && target.thumbnailUrl.startsWith("/uploads/thumbnails/")) {
        const thumbPath = path.join(process.cwd(), "public", target.thumbnailUrl);
        if (fs.existsSync(thumbPath)) {
          try {
            fs.unlinkSync(thumbPath);
          } catch {}
        }
      }
    }

    const updated = currentVideos.filter((v) => v.id !== id);
    writeVideos(updated);

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

    const currentVideos = readVideos();
    const index = currentVideos.findIndex((v) => v.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
    }

    const target = currentVideos[index];
    const updated: VideoItem = {
      ...target,
      title: title !== undefined ? title : target.title,
      description: description !== undefined ? description : target.description,
      category: category !== undefined ? category : target.category,
      tags: tags !== undefined ? tags : target.tags,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : target.thumbnailUrl,
    };

    currentVideos[index] = updated;
    writeVideos(currentVideos);

    return NextResponse.json({ success: true, video: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating video";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
