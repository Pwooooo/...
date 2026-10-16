"use client";

import { VideoItem } from "@/types";
import { ALL_VIDEOS } from "@/lib/mock-data";

// ----------------- Video Frame Extraction (for upload preview) -----------------
export function extractVideoDetails(file: File): Promise<{
  duration: number;
  thumbnailUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ duration: 0, thumbnailUrl: "", width: 1280, height: 720 });
      return;
    }

    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "metadata";

    let hasResolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1.5, Math.max(0.5, (video.duration || 3) / 3));
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      if (hasResolved) return;
      hasResolved = true;

      try {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = Math.min(1280, w);
        canvas.height = Math.round(canvas.width * (h / w)) || 720;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL("image/jpeg", 0.85);
          cleanup();
          resolve({
            duration: Math.round(video.duration) || 0,
            thumbnailUrl: thumb,
            width: w,
            height: h,
          });
          return;
        }
      } catch {}

      cleanup();
      resolve({
        duration: Math.round(video.duration) || 0,
        thumbnailUrl: "",
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });
    };

    video.onerror = () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      resolve({ duration: 0, thumbnailUrl: "", width: 1280, height: 720 });
    };

    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({ duration: Math.round(video.duration) || 0, thumbnailUrl: "", width: 1280, height: 720 });
      }
    }, 6000);
  });
}

// ----------------- Filter Next.js Filler Video -----------------
export function isNextJsFillerVideo(video?: { id?: string; title?: string } | null): boolean {
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

// ----------------- Base Static Videos -----------------
export function getBaseVideos(): VideoItem[] {
  return ALL_VIDEOS.filter((v) => v && typeof v.id === "string" && !isNextJsFillerVideo(v));
}

// ----------------- Central Client Video Cache -----------------
const CACHE_KEY = "entropy_server_videos_cache";

export function getAllCombinedVideos(): VideoItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((v: VideoItem) => v && typeof v.id === "string" && !isNextJsFillerVideo(v));
          if (clean.length > 0) return clean;
        }
      }
    } catch {}
  }
  return getBaseVideos();
}

export function getUserVideos(): VideoItem[] {
  return getAllCombinedVideos();
}

export function saveUserVideoMetadata(video: VideoItem): void {
  if (!video || !video.id || isNextJsFillerVideo(video)) return;
  const current = getAllCombinedVideos();
  const filtered = current.filter((v) => v.id !== video.id);
  const updated = [video, ...filtered];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new Event("entropy_videos_updated"));
  }
}

// ----------------- Server-Driven Video Operations -----------------
export async function fetchServerVideos(): Promise<VideoItem[]> {
  if (typeof window === "undefined") return getBaseVideos();
  try {
    const res = await fetch(`/api/videos?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.videos)) {
      const cleanVideos: VideoItem[] = data.videos.filter(
        (v: VideoItem) => v && typeof v.id === "string" && !isNextJsFillerVideo(v)
      );
      if (cleanVideos.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cleanVideos));
        } catch {}
        window.dispatchEvent(new Event("entropy_videos_updated"));
        return cleanVideos;
      }
    }
  } catch (err) {
    console.warn("Could not fetch server videos:", err);
  }
  return getAllCombinedVideos();
}

export async function uploadVideoToServer(formData: FormData): Promise<{ success: boolean; video?: VideoItem; error?: string }> {
  try {
    const res = await fetch("/api/videos", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.video) {
      saveUserVideoMetadata(data.video);
      await fetchServerVideos();
      return { success: true, video: data.video };
    }
    return { success: false, error: data.error || "Upload failed" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during upload";
    return { success: false, error: msg };
  }
}

export async function deleteUserVideo(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const current = getAllCombinedVideos();
    const updated = current.filter((v) => v.id !== videoId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch {}
      window.dispatchEvent(new Event("entropy_videos_updated"));
    }
    await fetch(`/api/videos?id=${videoId}`, { method: "DELETE" });
    await fetchServerVideos();
  } catch (e) {
    console.warn("Could not delete video:", e);
  }
}

export function updateUserVideo(videoId: string, updates: Partial<VideoItem>): void {
  if (!videoId) return;
  const current = getAllCombinedVideos();
  const idx = current.findIndex((v) => v.id === videoId);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(current));
      } catch {}
      window.dispatchEvent(new Event("entropy_videos_updated"));
    }
  }
  fetch("/api/videos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: videoId, ...updates }),
  }).catch(() => {});
}

// ----------------- Legacy Stubs for Compatibility -----------------
export async function saveVideoBlob(videoId: string, blob: Blob): Promise<void> {}
export async function getVideoBlob(videoId: string): Promise<Blob | null> { return null; }
export async function deleteVideoBlob(videoId: string): Promise<void> {}
export function getDeletedVideoIds(): Set<string> { return new Set(["v-srv-1792152077838", "v-user-1792152077838", "sample-2"]); }
export function markVideoAsDeleted(videoId: string): void {}
