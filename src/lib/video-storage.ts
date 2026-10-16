"use client";

import { VideoItem } from "@/types";
import { ALL_VIDEOS } from "@/lib/mock-data";

const DB_NAME = "entropy_media_db";
const STORE_NAME = "videos";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available in this environment"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(videoId: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not save video blob to IndexedDB:", err);
  }
}

export async function getVideoBlob(videoId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteVideoBlob(videoId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

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
      } catch {
        // canvas export error fallback
      }

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
      resolve({
        duration: 0,
        thumbnailUrl: "",
        width: 1280,
        height: 720,
      });
    };

    // Timeout fallback after 6 seconds
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({
          duration: Math.round(video.duration) || 0,
          thumbnailUrl: "",
          width: 1280,
          height: 720,
        });
      }
    }, 6000);
  });
}

// ----------------- Deleted Videos Tracker -----------------
const DEFAULT_DELETED_IDS = ["v-srv-1792152077838"];

export function getDeletedVideoIds(): Set<string> {
  const set = new Set<string>(DEFAULT_DELETED_IDS);
  if (typeof window === "undefined") return set;
  try {
    const raw = localStorage.getItem("entropy_deleted_video_ids");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => set.add(id));
      }
    }
    return set;
  } catch {
    return set;
  }
}

export function markVideoAsDeleted(videoId: string): void {
  if (typeof window === "undefined") return;
  try {
    const deleted = getDeletedVideoIds();
    deleted.add(videoId);
    localStorage.setItem("entropy_deleted_video_ids", JSON.stringify(Array.from(deleted)));
  } catch {}
}

const syncingVideoIds = new Set<string>();

export async function syncVideoToServer(video: VideoItem): Promise<void> {
  const deleted = getDeletedVideoIds();
  if (deleted.has(video.id)) return;
  if (syncingVideoIds.has(video.id)) return;
  syncingVideoIds.add(video.id);

  try {
    const formData = new FormData();
    formData.append("id", video.id);
    formData.append("title", video.title);
    formData.append("description", video.description || "");
    formData.append("category", video.category || "Technology");
    formData.append("tags", (video.tags || []).join(","));
    formData.append("duration", (video.durationSeconds || 0).toString());
    formData.append("channel", JSON.stringify(video.channel || {}));
    if (video.rawVideoUrl && !video.rawVideoUrl.startsWith("blob:")) {
      formData.append("rawVideoUrl", video.rawVideoUrl);
    }

    const blob = await getVideoBlob(video.id);
    if (blob) {
      const ext = blob.type?.includes("webm") ? "webm" : "mp4";
      formData.append("file", blob, `${video.id}.${ext}`);
    }

    if (video.thumbnailUrl && video.thumbnailUrl.startsWith("data:image")) {
      formData.append("thumbnailDataUrl", video.thumbnailUrl);
    } else if (video.thumbnailUrl) {
      formData.append("thumbnailUrl", video.thumbnailUrl);
    }

    const res = await fetch("/api/videos", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.video) {
      saveUserVideoMetadata(data.video);
    }
  } catch (err) {
    console.warn("Could not sync local video to server:", err);
  } finally {
    syncingVideoIds.delete(video.id);
  }
}

export async function fetchServerVideos(): Promise<VideoItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/videos");
    const data = await res.json();
    if (data.success && Array.isArray(data.videos)) {
      const deleted = getDeletedVideoIds();
      const serverVideos: VideoItem[] = data.videos.filter((v: VideoItem) => !deleted.has(v.id));
      const localVideos = getUserVideos().filter((v) => !deleted.has(v.id));

      // Check if any locally stored videos are missing on the server and sync them
      const missingOnServer = localVideos.filter(
        (lv) => !deleted.has(lv.id) && !serverVideos.some((sv) => sv.id === lv.id)
      );
      if (missingOnServer.length > 0) {
        missingOnServer.forEach((v) => {
          syncVideoToServer(v);
        });
      }

      // Merge unique by ID
      const map = new Map<string, VideoItem>();
      serverVideos.forEach((v) => map.set(v.id, v));
      localVideos.forEach((v) => {
        if (!map.has(v.id)) map.set(v.id, v);
      });
      const merged = Array.from(map.values()).filter((v) => !deleted.has(v.id));
      localStorage.setItem("entropy_user_videos", JSON.stringify(merged));
      window.dispatchEvent(new Event("entropy_videos_updated"));
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch server videos:", err);
  }
  return getUserVideos();
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
      return { success: true, video: data.video };
    }
    return { success: false, error: data.error || "Upload failed" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during upload";
    return { success: false, error: msg };
  }
}

export function getUserVideos(): VideoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const deleted = getDeletedVideoIds();
    const stored = localStorage.getItem("entropy_user_videos");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v: VideoItem) => !deleted.has(v.id));
  } catch {
    return [];
  }
}

export function saveUserVideoMetadata(video: VideoItem): void {
  if (typeof window === "undefined") return;
  try {
    const deleted = getDeletedVideoIds();
    if (deleted.has(video.id)) return;

    const current = getUserVideos();
    const filtered = current.filter((v) => v.id !== video.id);
    const updated = [video, ...filtered];
    localStorage.setItem("entropy_user_videos", JSON.stringify(updated));
    window.dispatchEvent(new Event("entropy_videos_updated"));
  } catch (e) {
    console.warn("Could not save video metadata:", e);
  }
}

export function updateUserVideo(videoId: string, updates: Partial<VideoItem>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getUserVideos();
    const index = current.findIndex((v) => v.id === videoId);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      localStorage.setItem("entropy_user_videos", JSON.stringify(current));
      window.dispatchEvent(new Event("entropy_videos_updated"));
    }
    // Also update on server
    fetch("/api/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: videoId, ...updates }),
    }).catch(() => {});
  } catch (e) {
    console.warn("Could not update video metadata:", e);
  }
}

export async function deleteUserVideo(videoId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // 1. Immediately mark video as deleted so it can NEVER be re-synced or retrieved
    markVideoAsDeleted(videoId);

    // 2. Remove from local storage
    const current = getUserVideos();
    const filtered = current.filter((v) => v.id !== videoId);
    localStorage.setItem("entropy_user_videos", JSON.stringify(filtered));

    // 3. Remove IndexedDB media blob
    await deleteVideoBlob(videoId);

    // 4. Notify all tabs and listeners
    window.dispatchEvent(new Event("entropy_videos_updated"));

    // 5. Delete on server
    await fetch(`/api/videos?id=${videoId}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.warn("Could not delete video:", e);
  }
}

export function getAllCombinedVideos(): VideoItem[] {
  const deleted = getDeletedVideoIds();
  const userVideos = getUserVideos().filter((v) => !deleted.has(v.id));
  const baseVideos = ALL_VIDEOS.filter((v) => !deleted.has(v.id));

  // Merge unique by id
  const map = new Map<string, VideoItem>();
  userVideos.forEach((v) => map.set(v.id, v));
  baseVideos.forEach((v) => {
    if (!map.has(v.id)) map.set(v.id, v);
  });
  return Array.from(map.values());
}

// Auto-sync server videos on client load and sanitize cached entries
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("entropy_user_videos");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (v: VideoItem) =>
            v.id !== "v-srv-1792152077838" &&
            v.title?.toLowerCase() !== "next.js 16 deep dive"
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("entropy_user_videos", JSON.stringify(cleaned));
        }
      }
    }
  } catch {}
  fetchServerVideos();
}

