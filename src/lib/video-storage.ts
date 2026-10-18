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
    }, 2500);
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
    id.startsWith("short-") ||
    id.startsWith("v-blob-") ||
    id === "v-entropy-test-video" ||
    id === "v-entropy-test-short" ||
    id.startsWith("v-entropy-") ||
    id.includes("entropy-test") ||
    id === "v-srv-1792152077838" ||
    id === "v-user-1792152077838" ||
    id === "v-srv-1792158340022" ||
    id.includes("CW scenario 1-1C6ka5PylZ6KeUnoSaJu9s82hRLYaK") ||
    channelHandle === "creator" ||
    channelId === "creator" ||
    channelName === "creator" ||
    title.includes("next.js") ||
    title.includes("entropy 2.0 walkthrough") ||
    title.includes("entropy mobile & theater mode demo") ||
    title.includes("distributed video transcoder") ||
    title.includes("operating systems are so complex") ||
    title.includes("shaders & webgl") ||
    title.includes("synthwave coding session") ||
    title.includes("pro league championship") ||
    title.includes("1 css property") ||
    title.includes("redis handles") ||
    title.includes("insane 3d shader") ||
    title.includes("big buck bunny")
  );
}

export function isNextJsFillerVideo(video?: { id?: string; title?: string; channel?: { id?: string; handle?: string; displayName?: string } } | null): boolean {
  return isFillerVideo(video);
}

// ----------------- Base Static Videos (All Stock Videos Removed) -----------------
export const DEFAULT_ENTROPY_VIDEOS: VideoItem[] = [];

export function getBaseVideos(): VideoItem[] {
  return DEFAULT_ENTROPY_VIDEOS;
}

// ----------------- Central Client Video Cache -----------------
const SERVER_CACHE_KEY = "entropy_server_videos_cache";
const USER_UPLOADS_KEY = "entropy_user_uploaded_videos";
const CACHE_PURGE_VERSION = "entropy_purge_v6";

if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem(CACHE_PURGE_VERSION) !== "done") {
      localStorage.setItem(CACHE_PURGE_VERSION, "done");
      // Clean out any cached filler videos across all devices
      const cached = localStorage.getItem(SERVER_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((v: VideoItem) => v && typeof v.id === "string" && !isFillerVideo(v));
            localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cleaned));
          }
        } catch {}
      }
      const uploads = localStorage.getItem(USER_UPLOADS_KEY);
      if (uploads) {
        try {
          const parsed = JSON.parse(uploads);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((v: VideoItem) => v && typeof v.id === "string" && !isFillerVideo(v));
            localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(cleaned));
          }
        } catch {}
      }
      // Purge any entropy_comments_* with filler comments
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("entropy_comments_")) {
          try {
            const raw = localStorage.getItem(key);
            if (raw && (raw.includes("Welcome to the video") || raw.includes("alex_dev") || raw.includes("design_lead") || raw.includes("Entropy Fan"))) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const cleaned = parsed.filter((c: any) => {
                  if (!c || typeof c !== "object") return false;
                  if (c.id?.startsWith("c-pinned-") && c.content?.includes("Welcome to the video")) return false;
                  if (c.user === "alex_dev" || c.userHandle === "alex_dev") return false;
                  if (c.user === "design_lead" || c.userHandle === "design_lead") return false;
                  if (c.user === "Entropy Fan" || c.userHandle === "entropy_fan") return false;
                  return true;
                });
                if (cleaned.length > 0) {
                  localStorage.setItem(key, JSON.stringify(cleaned));
                } else {
                  localStorage.removeItem(key);
                }
              }
            }
          } catch {}
        }
      }
    }
  } catch {}
}

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

export function isShortVideo(v: VideoItem | null | undefined): boolean {
  if (!v || !v.id) return false;
  return Boolean(
    v.isShort === true ||
    v.category === "Shorts" ||
    (Array.isArray(v.tags) && v.tags.some((t) => typeof t === "string" && t.toLowerCase() === "shorts"))
  );
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

      getBaseVideos().forEach((v) => {
        if (!isFillerVideo(v)) nonSampleMap.set(v.id, v);
      });
      serverCached.forEach((v) => {
        if (!isFillerVideo(v)) nonSampleMap.set(v.id, v);
      });
      userUploads.forEach((v) => {
        if (!isFillerVideo(v)) nonSampleMap.set(v.id, v);
      });

      return Array.from(nonSampleMap.values());
    } catch {}
  }
  return getBaseVideos();
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
      try {
        localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cleanVideos));
      } catch {}
      window.dispatchEvent(new Event("entropy_videos_updated"));
      return getAllCombinedVideos();
    }
  } catch (err) {
    console.warn("Could not fetch server videos:", err);
  }
  return getAllCombinedVideos();
}

async function uploadToR2Presigned(
  file: File | Blob,
  filename: string,
  contentType: string,
  type: "video" | "thumbnail",
  videoId: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; fileUrl?: string; key?: string; configured?: boolean }> {
  try {
    const res = await fetch("/api/r2/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType, type, videoId }),
    });
    const data = await res.json();
    if (!data.configured) {
      return { success: false, configured: false };
    }
    if (!data.success || !data.uploadUrl) {
      return { success: false, configured: true };
    }

    const uploaded = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl);
      xhr.setRequestHeader("Content-Type", contentType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          console.warn("Direct R2 upload failed with status:", xhr.status);
          resolve(false);
        }
      };

      xhr.onerror = () => {
        console.warn("Direct R2 upload network error");
        resolve(false);
      };

      xhr.send(file);
    });

    if (uploaded) {
      return { success: true, fileUrl: data.fileUrl, key: data.key, configured: true };
    }
    return { success: false, configured: true };
  } catch (err) {
    console.warn("R2 presigned upload error:", err);
    return { success: false };
  }
}

export async function uploadVideoToServer(
  formData: FormData,
  onProgress?: (stage: string, percent: number) => void
): Promise<{ success: boolean; video?: VideoItem; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    const thumbFile = formData.get("thumbnailFile") as File | null;
    const requestedId = (formData.get("id") as string) || "";
    const videoId = requestedId || `v-user-${Date.now()}`;
    formData.set("id", videoId);

    // Save full original video into local IndexedDB immediately (instant playability & zero bandwidth cost)
    if (file) {
      await saveVideoBlob(videoId, file);
    }

    let isCloudUploaded = false;

    // 1. Try Cloudflare R2 direct browser upload first (highest capacity, zero egress fees)
    if (file && typeof window !== "undefined") {
      try {
        if (onProgress) onProgress("Uploading to Cloudflare R2", 10);
        const r2Res = await uploadToR2Presigned(
          file,
          file.name,
          file.type || "video/mp4",
          "video",
          videoId,
          (pct) => {
            const currentPct = Math.min(85, Math.max(10, Math.round(10 + pct * 0.75)));
            if (onProgress) onProgress("Uploading to Cloudflare R2", currentPct);
          }
        );

        if (r2Res.success && r2Res.fileUrl) {
          formData.set("rawVideoUrl", r2Res.fileUrl);
          formData.delete("file");
          isCloudUploaded = true;

          // Also upload thumbnail to Cloudflare R2
          if (thumbFile) {
            try {
              const thumbR2 = await uploadToR2Presigned(
                thumbFile,
                thumbFile.name,
                thumbFile.type || "image/jpeg",
                "thumbnail",
                videoId
              );
              if (thumbR2.success && thumbR2.fileUrl) {
                formData.set("thumbnailUrl", thumbR2.fileUrl);
                formData.delete("thumbnailFile");
              }
            } catch {}
          } else {
            const thumbDataUrl = formData.get("thumbnailDataUrl") as string | null;
            if (thumbDataUrl && thumbDataUrl.startsWith("data:image")) {
              try {
                const resBlob = await fetch(thumbDataUrl);
                const imgBlob = await resBlob.blob();
                const thumbR2 = await uploadToR2Presigned(
                  imgBlob,
                  `thumb-${videoId}.jpg`,
                  "image/jpeg",
                  "thumbnail",
                  videoId
                );
                if (thumbR2.success && thumbR2.fileUrl) {
                  formData.set("thumbnailUrl", thumbR2.fileUrl);
                  formData.delete("thumbnailDataUrl");
                }
              } catch {}
            }
          }
        }
      } catch (r2Err) {
        console.warn("Cloudflare R2 upload attempt error:", r2Err);
      }
    }

    // 2. Fallback to Vercel Blob if R2 was not configured or direct upload was bypassed
    if (!isCloudUploaded && file && typeof window !== "undefined") {
      try {
        if (onProgress) onProgress("Uploading to cloud", 10);
        const { upload } = await import("@vercel/blob/client");

        // Upload video file with real-time byte progress & multipart
        const videoBlob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/blob/upload",
          multipart: true,
          onUploadProgress: (progress) => {
            const currentPct = Math.min(85, Math.max(10, Math.round(10 + progress.percentage * 0.75)));
            if (onProgress) onProgress("Uploading to cloud", currentPct);
          },
        });

        if (videoBlob) {
          const serveUrl = videoBlob.pathname
            ? `/api/blob/serve?pathname=${encodeURIComponent(videoBlob.pathname)}`
            : videoBlob.url;
          formData.set("rawVideoUrl", serveUrl);
          formData.delete("file"); // Stored in Blob
          isCloudUploaded = true;
        }

        // Upload thumbnail
        if (thumbFile) {
          try {
            const thumbBlob = await upload(thumbFile.name, thumbFile, {
              access: "private",
              handleUploadUrl: "/api/blob/upload",
            });
            if (thumbBlob) {
              const thumbUrl = thumbBlob.pathname
                ? `/api/blob/serve?pathname=${encodeURIComponent(thumbBlob.pathname)}`
                : thumbBlob.url;
              formData.set("thumbnailUrl", thumbUrl);
              formData.delete("thumbnailFile");
            }
          } catch {}
        } else {
          const thumbDataUrl = formData.get("thumbnailDataUrl") as string | null;
          if (thumbDataUrl && thumbDataUrl.startsWith("data:image")) {
            try {
              const resBlob = await fetch(thumbDataUrl);
              const imgBlob = await resBlob.blob();
              const thumbBlob = await upload(`thumb-${Date.now()}.jpg`, imgBlob, {
                access: "private",
                handleUploadUrl: "/api/blob/upload",
              });
              if (thumbBlob) {
                const thumbUrl = thumbBlob.pathname
                  ? `/api/blob/serve?pathname=${encodeURIComponent(thumbBlob.pathname)}`
                  : thumbBlob.url;
                formData.set("thumbnailUrl", thumbUrl);
                formData.delete("thumbnailDataUrl");
              }
            } catch {}
          }
        }
      } catch (blobErr: any) {
        const errorMsg = blobErr?.message || String(blobErr);
        console.warn("Direct Blob upload error (store suspended/maxed out, saving locally):", errorMsg);
        // Avoid 413 Payload Too Large on Vercel serverless function body
        if (file && file.size > 4.5 * 1024 * 1024) {
          formData.delete("file");
        }
      }
    }

    if (onProgress) onProgress("Publishing video", 90);

    try {
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
    } catch (netErr) {
      console.warn("Server API error, using client-side video entry:", netErr);
    }

    // Client fallback: register video locally if server API or Vercel Blob is maxed out
    if (file) {
      const rawTitle = (formData.get("title") as string) || file.name.replace(/\.[^/.]+$/, "") || "Uploaded Video";
      const channelRaw = (formData.get("channel") as string) || "{}";
      let channel = { id: "creator", handle: "creator", displayName: "You", avatarUrl: "/default-avatar.png" };
      try { channel = JSON.parse(channelRaw); } catch {}

      const localVideo: VideoItem = {
        id: videoId,
        title: rawTitle,
        description: (formData.get("description") as string) || "",
        thumbnailUrl: (formData.get("thumbnailDataUrl") as string) || (formData.get("thumbnailUrl") as string) || "/placeholder-thumb.jpg",
        masterPlaylistUrl: null,
        rawVideoUrl: (formData.get("rawVideoUrl") as string) || null,
        durationSeconds: Number(formData.get("duration")) || 0,
        viewCount: 0,
        publishedAt: new Date().toISOString(),
        category: (formData.get("category") as string) || "Technology",
        tags: ((formData.get("tags") as string) || "").split(",").map((t) => t.trim()).filter(Boolean),
        channel,
        isShort: (formData.get("category") as string) === "Shorts",
      };

      saveUserUploadedVideo(localVideo);
      return { success: true, video: localVideo };
    }

    return { success: false, error: "Upload failed" };
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

/**
 * Synchronizes user's updated profile picture, name, and handle across all
 * stored videos in localStorage cache so channel avatars update instantly.
 */
export function syncUserChannelInfo(user: { id?: string | null; handle?: string | null; name?: string | null; avatarUrl?: string | null; avatar?: string | null }): void {
  if (typeof window === "undefined" || !user) return;
  const targetAvatar = user.avatarUrl || user.avatar || "";
  const targetHandle = (user.handle || "").replace(/^@/, "").trim().toLowerCase();
  const targetName = (user.name || "").trim();
  const targetId = (user.id || "").trim().toLowerCase();

  const updateList = (videos: VideoItem[]): { updated: VideoItem[]; changed: boolean } => {
    let changed = false;
    const updated = videos.map((v) => {
      if (!v) return v;
      const vChan = v.channel || { id: "", handle: "", displayName: "", avatarUrl: "" };
      const vChanHandle = (vChan.handle || "").replace(/^@/, "").trim().toLowerCase();
      const vChanName = (vChan.displayName || "").trim().toLowerCase();
      const vChanId = (vChan.id || "").trim().toLowerCase();
      const isUserVideo =
        (targetId && vChanId && targetId === vChanId) ||
        (targetHandle && vChanHandle === targetHandle) ||
        (targetName && (vChanName === targetName.toLowerCase() || vChanName === targetHandle)) ||
        (v.id && (v.id.startsWith("v-user-") || v.id.startsWith("v-custom-")));

      if (isUserVideo) {
        changed = true;
        return {
          ...v,
          channel: {
            ...vChan,
            id: vChan.id || user.id || "u-user",
            handle: user.handle || vChan.handle,
            displayName: user.name || vChan.displayName,
            avatarUrl: targetAvatar || vChan.avatarUrl,
          },
        };
      }
      return v;
    });
    return { updated, changed };
  };

  try {
    const uploads = getUserUploadedVideos();
    const res1 = updateList(uploads);
    if (res1.changed) {
      localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(res1.updated));
    }

    const cachedRaw = localStorage.getItem(SERVER_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed)) {
        const res2 = updateList(parsed);
        if (res2.changed) {
          localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(res2.updated));
        }
      }
    }
  } catch {}

  window.dispatchEvent(new Event("entropy_videos_updated"));
}

// ----------------- Client-Side IndexedDB Storage (High-Capacity Local Media) -----------------
const DB_NAME = "entropy_video_store";
const STORE_NAME = "videos";

function getIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
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
  if (typeof window === "undefined") return;
  try {
    const db = await getIndexedDB();
    await new Promise<void>((resolve, reject) => {
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
  if (typeof window === "undefined") return null;
  try {
    const db = await getIndexedDB();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteVideoBlob(videoId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await getIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

export function getDeletedVideoIds(): Set<string> { return new Set(["v-srv-1792152077838", "v-user-1792152077838", "sample-2"]); }
export function markVideoAsDeleted(videoId: string): void {}
