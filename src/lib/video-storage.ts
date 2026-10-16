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

// ----------------- Filter Filler Videos -----------------
export function isFillerVideo(video?: { id?: string; title?: string; channel?: { id?: string; handle?: string; displayName?: string } } | null): boolean {
  if (!video || typeof video !== "object") return false;
  const id = typeof video.id === "string" ? video.id : "";
  const title = typeof video.title === "string" ? video.title.toLowerCase() : "";
  const channelHandle = typeof video.channel?.handle === "string" ? video.channel.handle.toLowerCase().replace(/^@/, "").trim() : "";
  const channelId = typeof video.channel?.id === "string" ? video.channel.id.toLowerCase().trim() : "";
  const channelName = typeof video.channel?.displayName === "string" ? video.channel.displayName.toLowerCase().trim() : "";

  return (
    id.startsWith("sample-") ||
    id.startsWith("v-blob-") ||
    id === "v-srv-1792152077838" ||
    id === "v-user-1792152077838" ||
    id === "v-srv-1792158340022" ||
    id.includes("CW scenario 1-1C6ka5PylZ6KeUnoSaJu9s82hRLYaK") ||
    channelHandle === "creator" ||
    channelId === "creator" ||
    channelName === "creator" ||
    title.includes("next.js") ||
    title.includes("distributed video transcoder") ||
    title.includes("operating systems are so complex") ||
    title.includes("shaders & webgl") ||
    title.includes("synthwave coding session") ||
    title.includes("pro league championship")
  );
}

export function isNextJsFillerVideo(video?: { id?: string; title?: string; channel?: { id?: string; handle?: string; displayName?: string } } | null): boolean {
  return isFillerVideo(video);
}

// ----------------- Base Static Videos (All filler removed) -----------------
export function getBaseVideos(): VideoItem[] {
  return [];
}

// ----------------- Central Client Video Cache -----------------
const SERVER_CACHE_KEY = "entropy_server_videos_cache";
const USER_UPLOADS_KEY = "entropy_user_uploaded_videos";

export function getUserUploadedVideos(): VideoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_UPLOADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((v: VideoItem) => v && typeof v.id === "string" && !isNextJsFillerVideo(v));
      }
    }
  } catch {}
  return [];
}

export function saveUserUploadedVideo(video: VideoItem): void {
  if (!video || !video.id || isNextJsFillerVideo(video)) return;
  if (typeof window !== "undefined") {
    try {
      const current = getUserUploadedVideos();
      const filtered = current.filter((v) => v.id !== video.id);
      const updated = [video, ...filtered];
      localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(updated));

      // Also ensure it is in the combined cache
      const cachedRaw = localStorage.getItem(SERVER_CACHE_KEY);
      let cached: VideoItem[] = [];
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) cached = parsed;
        } catch {}
      }
      const newCached = [video, ...cached.filter((v) => v.id !== video.id)];
      localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(newCached));
    } catch {}
    window.dispatchEvent(new Event("entropy_videos_updated"));
  }
}

export function getAllCombinedVideos(): VideoItem[] {
  if (typeof window !== "undefined") {
    try {
      const userUploads = getUserUploadedVideos();
      const cachedRaw = localStorage.getItem(SERVER_CACHE_KEY);
      let serverCached: VideoItem[] = [];
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) {
            serverCached = parsed.filter((v: VideoItem) => v && typeof v.id === "string" && !isNextJsFillerVideo(v));
          }
        } catch {}
      }

      // Merge: only keep real non-filler videos
      const nonSampleMap = new Map<string, VideoItem>();

      userUploads.forEach((v) => {
        if (!isFillerVideo(v)) nonSampleMap.set(v.id, v);
      });
      serverCached.forEach((v) => {
        if (!isFillerVideo(v)) nonSampleMap.set(v.id, v);
      });

      return Array.from(nonSampleMap.values());
    } catch {}
  }
  return [];
}

export function getUserVideos(): VideoItem[] {
  return getAllCombinedVideos();
}

export function saveUserVideoMetadata(video: VideoItem): void {
  saveUserUploadedVideo(video);
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
          localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cleanVideos));
        } catch {}
        window.dispatchEvent(new Event("entropy_videos_updated"));
        return getAllCombinedVideos();
      }
    }
  } catch (err) {
    console.warn("Could not fetch server videos:", err);
  }
  return getAllCombinedVideos();
}

export async function uploadVideoToServer(
  formData: FormData,
  onProgress?: (stage: string, percent: number) => void
): Promise<{ success: boolean; video?: VideoItem; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    const thumbFile = formData.get("thumbnailFile") as File | null;

    // Direct browser-to-blob upload on Vercel (bypasses 4.5MB serverless body limit)
    if (file && typeof window !== "undefined") {
      try {
        if (onProgress) onProgress("Uploading directly to Vercel Blob cloud...", 45);
        const { upload } = await import("@vercel/blob/client");
        let videoBlob;
        try {
          videoBlob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/blob/upload",
          });
        } catch {
          videoBlob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
          });
        }

        if (videoBlob) {
          const serveUrl = videoBlob.pathname
            ? `/api/blob/serve?pathname=${encodeURIComponent(videoBlob.pathname)}`
            : videoBlob.url;
          formData.set("rawVideoUrl", serveUrl);
          formData.delete("file"); // Already stored in Blob!
        }

        if (thumbFile) {
          let thumbBlob;
          try {
            thumbBlob = await upload(thumbFile.name, thumbFile, {
              access: "private",
              handleUploadUrl: "/api/blob/upload",
            });
          } catch {
            thumbBlob = await upload(thumbFile.name, thumbFile, {
              access: "public",
              handleUploadUrl: "/api/blob/upload",
            });
          }
          if (thumbBlob) {
            const thumbUrl = thumbBlob.pathname
              ? `/api/blob/serve?pathname=${encodeURIComponent(thumbBlob.pathname)}`
              : thumbBlob.url;
            formData.set("thumbnailUrl", thumbUrl);
            formData.delete("thumbnailFile");
          }
        }

        const thumbDataUrl = formData.get("thumbnailDataUrl") as string | null;
        if (thumbDataUrl && thumbDataUrl.startsWith("data:image")) {
          try {
            const resBlob = await fetch(thumbDataUrl);
            const imgBlob = await resBlob.blob();
            let thumbBlob;
            try {
              thumbBlob = await upload(`thumb-${Date.now()}.jpg`, imgBlob, {
                access: "private",
                handleUploadUrl: "/api/blob/upload",
              });
            } catch {
              thumbBlob = await upload(`thumb-${Date.now()}.jpg`, imgBlob, {
                access: "public",
                handleUploadUrl: "/api/blob/upload",
              });
            }
            if (thumbBlob) {
              const thumbUrl = thumbBlob.pathname
                ? `/api/blob/serve?pathname=${encodeURIComponent(thumbBlob.pathname)}`
                : thumbBlob.url;
              formData.set("thumbnailUrl", thumbUrl);
              formData.delete("thumbnailDataUrl");
            }
          } catch {}
        }
      } catch (blobErr) {
        // Blob token not configured on this environment; fall back to standard route upload
        console.info("Direct Blob upload not active, falling back to standard upload:", blobErr);
      }
    }

    if (onProgress) onProgress("Indexing and finalizing media stream...", 80);
    const res = await fetch("/api/videos", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.video) {
      saveUserUploadedVideo(data.video);
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
  if (typeof window !== "undefined") {
    try {
      const uploads = getUserUploadedVideos().filter((v) => v.id !== videoId);
      localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(uploads));
      const cached = getAllCombinedVideos().filter((v) => v.id !== videoId);
      localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cached));
      window.dispatchEvent(new Event("entropy_videos_updated"));
    } catch {}
  }
  try {
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
        localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(current));
        const uploads = getUserUploadedVideos();
        const uIdx = uploads.findIndex((v) => v.id === videoId);
        if (uIdx !== -1) {
          uploads[uIdx] = { ...uploads[uIdx], ...updates };
          localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(uploads));
        }
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
