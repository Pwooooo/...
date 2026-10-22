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

  return (
    id.startsWith("sample-") ||
    id === "v-entropy-test-video" ||
    id === "v-entropy-test-short" ||
    id === "v-srv-1792152077838" ||
    id === "v-user-1792152077838" ||
    id === "v-srv-1792158340022" ||
    id === "v-blob-CW scenario 1-1C6ka5PylZ6KeUnoSaJu9s82hRLYaK" ||
    id.toLowerCase().includes("snowy in the forest") ||
    id.toLowerCase().includes("snowy-in-the-forest") ||
    title.includes("snowy in the forest")
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
const CLIENT_DELETED_KEY = "entropy_deleted_videos";
const CACHE_PURGE_VERSION = "entropy_purge_v8";

export function getClientDeletedVideos(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CLIENT_DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

export function markClientDeletedVideo(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const set = getClientDeletedVideos();
    set.add(id);
    localStorage.setItem(CLIENT_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem(CACHE_PURGE_VERSION) !== "done") {
      localStorage.setItem(CACHE_PURGE_VERSION, "done");
      // Add snowy to deleted videos
      markClientDeletedVideo("snowy in the forest.1920x1080");
      markClientDeletedVideo("snowy-in-the-forest.1920x1080");
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
    const deleted = getClientDeletedVideos();
    const raw = localStorage.getItem(USER_UPLOADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (v: VideoItem) => v && typeof v.id === "string" && !deleted.has(v.id) && !isNextJsFillerVideo(v)
        );
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
      const deleted = getClientDeletedVideos();
      const userUploads = getUserUploadedVideos();
      const cachedRaw = localStorage.getItem(SERVER_CACHE_KEY);
      let serverCached: VideoItem[] = [];
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) {
            serverCached = parsed.filter(
              (v: VideoItem) => v && typeof v.id === "string" && !deleted.has(v.id) && !isNextJsFillerVideo(v)
            );
          }
        } catch {}
      }

      // Merge: only keep real non-filler non-deleted videos
      const nonSampleMap = new Map<string, VideoItem>();

      getBaseVideos().forEach((v) => {
        if (!isFillerVideo(v) && !deleted.has(v.id)) nonSampleMap.set(v.id, v);
      });
      serverCached.forEach((v) => {
        if (!isFillerVideo(v) && !deleted.has(v.id)) nonSampleMap.set(v.id, v);
      });
      userUploads.forEach((v) => {
        if (!isFillerVideo(v) && !deleted.has(v.id)) nonSampleMap.set(v.id, v);
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
      const serverVideoIds = new Set(data.videos.map((v: VideoItem) => v.id));
      const deletedSet = getClientDeletedVideos();

      // Auto-sync ONLY items that are truly user uploads, not deleted and not already on server
      const userUploads = getUserUploadedVideos().filter((v) => !deletedSet.has(v.id));
      for (const localVid of userUploads) {
        if (
          localVid &&
          localVid.id &&
          !deletedSet.has(localVid.id) &&
          !serverVideoIds.has(localVid.id) &&
          !isNextJsFillerVideo(localVid)
        ) {
          let syncedVideoUrl = localVid.rawVideoUrl;
          try {
            const localBlob = await getVideoBlob(localVid.id);
            if (localBlob && (!syncedVideoUrl || syncedVideoUrl.includes("/stream"))) {
              const directForm = new FormData();
              directForm.append("file", localBlob, `${localVid.id}.mp4`);
              directForm.append("type", "video");
              directForm.append("videoId", localVid.id);
              const directRes = await fetch("/api/tigris/direct-upload", {
                method: "POST",
                body: directForm,
              });
              const directData = await directRes.json();
              if (directData.success && directData.fileUrl) {
                syncedVideoUrl = directData.fileUrl;
              }
            }
          } catch {}

          const syncForm = new FormData();
          syncForm.append("id", localVid.id);
          syncForm.append("title", localVid.title);
          syncForm.append("description", localVid.description || "");
          syncForm.append("category", localVid.category || "Technology");
          syncForm.append("tags", (localVid.tags || []).join(","));
          syncForm.append("duration", String(localVid.durationSeconds || 0));
          syncForm.append("isShort", String(Boolean(localVid.isShort)));
          syncForm.append(
            "rawVideoUrl",
            syncedVideoUrl || `/api/tigris/serve?key=${encodeURIComponent(`videos/${localVid.id}.mp4`)}`
          );
          syncForm.append("thumbnailUrl", localVid.thumbnailUrl || "");
          syncForm.append("channel", JSON.stringify(localVid.channel || {}));
          try {
            await fetch("/api/videos", { method: "POST", body: syncForm });
          } catch {}
        }
      }

      const cleanVideos: VideoItem[] = data.videos.filter(
        (v: VideoItem) => v && typeof v.id === "string" && !deletedSet.has(v.id) && !isNextJsFillerVideo(v)
      );
      try {
        localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cleanVideos));
      } catch {}
      window.dispatchEvent(new Event("entropy_videos_updated"));
      return cleanVideos.length > 0 ? cleanVideos : getAllCombinedVideos();
    }
  } catch (err) {
    console.warn("Could not fetch server videos:", err);
  }
  return getAllCombinedVideos();
}

async function uploadToTigrisPresigned(
  file: File | Blob,
  filename: string,
  contentType: string,
  type: "video" | "thumbnail",
  videoId: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; fileUrl?: string; key?: string; configured?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/tigris/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType, type, videoId }),
    });
    const data = await res.json();
    if (!data.configured) {
      return { success: false, configured: false };
    }
    if (!data.success || !data.uploadUrl) {
      return { success: false, configured: true, error: data.error || "Failed to create upload URL" };
    }

    const uploaded = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl);
      if (contentType) {
        xhr.setRequestHeader("Content-Type", contentType);
      }

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
          resolve({ success: true });
        } else {
          const errMsg = `Direct Tigris upload failed with status ${xhr.status}: ${xhr.responseText || xhr.statusText}`;
          console.warn(errMsg);
          resolve({ success: false, error: errMsg });
        }
      };

      xhr.onerror = () => {
        const errMsg = "Direct Tigris upload failed due to network or CORS issue.";
        console.warn(errMsg);
        resolve({ success: false, error: errMsg });
      };

      xhr.send(file);
    });

    if (uploaded.success) {
      return { success: true, fileUrl: data.fileUrl, key: data.key, configured: true };
    }

    // Direct upload fallback through server gateway (bypasses browser CORS completely)
    if (file.size < 4.5 * 1024 * 1024) {
      try {
        const directForm = new FormData();
        directForm.append("file", file, filename);
        directForm.append("type", type);
        directForm.append("videoId", videoId);
        const directRes = await fetch("/api/tigris/direct-upload", {
          method: "POST",
          body: directForm,
        });
        const directData = await directRes.json();
        if (directData.success && directData.fileUrl) {
          return { success: true, fileUrl: directData.fileUrl, key: directData.key, configured: true };
        }
      } catch (directErr) {
        console.warn("Direct upload gateway fallback error:", directErr);
      }
    }

    return { success: false, configured: true, error: uploaded.error };
  } catch (err: any) {
    console.warn("Tigris presigned upload error:", err);
    return { success: false, error: err?.message || String(err) };
  }
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
    let isTigrisConfigured = false;
    let tigrisError: string | null = null;

    // 1. Try Tigris direct browser upload first (globally distributed S3 object storage)
    if (file && typeof window !== "undefined") {
      try {
        if (onProgress) onProgress("Uploading to Tigris Storage", 10);
        const tigrisRes = await uploadToTigrisPresigned(
          file,
          file.name,
          file.type || "video/mp4",
          "video",
          videoId,
          (pct) => {
            const currentPct = Math.min(85, Math.max(10, Math.round(10 + pct * 0.75)));
            if (onProgress) onProgress("Uploading to Tigris Storage", currentPct);
          }
        );

        if (tigrisRes.configured) {
          isTigrisConfigured = true;
        }

        if (tigrisRes.success && tigrisRes.fileUrl) {
          formData.set("rawVideoUrl", tigrisRes.fileUrl);
          formData.delete("file");
          isCloudUploaded = true;

          // Also upload thumbnail to Tigris
          if (thumbFile) {
            try {
              const thumbTigris = await uploadToTigrisPresigned(
                thumbFile,
                thumbFile.name,
                thumbFile.type || "image/jpeg",
                "thumbnail",
                videoId
              );
              if (thumbTigris.success && thumbTigris.fileUrl) {
                formData.set("thumbnailUrl", thumbTigris.fileUrl);
                formData.delete("thumbnailFile");
              }
            } catch {}
          } else {
            const thumbDataUrl = formData.get("thumbnailDataUrl") as string | null;
            if (thumbDataUrl && thumbDataUrl.startsWith("data:image")) {
              try {
                const resBlob = await fetch(thumbDataUrl);
                const imgBlob = await resBlob.blob();
                const thumbTigris = await uploadToTigrisPresigned(
                  imgBlob,
                  `thumb-${videoId}.jpg`,
                  "image/jpeg",
                  "thumbnail",
                  videoId
                );
                if (thumbTigris.success && thumbTigris.fileUrl) {
                  formData.set("thumbnailUrl", thumbTigris.fileUrl);
                  formData.delete("thumbnailDataUrl");
                }
              } catch {}
            }
          }
        } else if (tigrisRes.configured) {
          tigrisError = tigrisRes.error || "Tigris storage rejected upload";
        }
      } catch (tigrisErr: any) {
        console.warn("Tigris upload attempt error:", tigrisErr);
        tigrisError = tigrisErr?.message || String(tigrisErr);
      }
    }

    if (isTigrisConfigured && !isCloudUploaded) {
      return {
        success: false,
        error: `Could not upload to Tigris: ${tigrisError || "Storage connection failed. Please verify Tigris bucket credentials."}`,
      };
    }

    // 2. Try Cloudflare R2 direct browser upload second
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
      } else if (data && !data.success) {
        return { success: false, error: data.error || "Server rejected video save" };
      }
    } catch (netErr) {
      console.warn("Server API error during video upload:", netErr);
    }

    return {
      success: false,
      error: "Could not publish video to Tigris cloud storage. Please ensure TIGRIS_ACCESS_KEY_ID and TIGRIS_SECRET_ACCESS_KEY are added to your deployment environment variables.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during upload";
    return { success: false, error: msg };
  }
}

export async function deleteUserVideo(videoId: string): Promise<void> {
  if (!videoId) return;

  // 1. Mark permanently deleted on client immediately
  markClientDeletedVideo(videoId);

  // 2. Remove from local caches
  if (typeof window !== "undefined") {
    try {
      const uploads = getUserUploadedVideos().filter((v) => v.id !== videoId);
      localStorage.setItem(USER_UPLOADS_KEY, JSON.stringify(uploads));
      const cached = getAllCombinedVideos().filter((v) => v.id !== videoId);
      localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(cached));
      window.dispatchEvent(new Event("entropy_videos_updated"));
    } catch {}
  }

  // 3. Purge binary blob from local IndexedDB so it cannot be auto-synced
  await deleteVideoBlob(videoId);

  // 4. Send DELETE request to server
  try {
    await fetch(`/api/videos?id=${encodeURIComponent(videoId)}`, { method: "DELETE" });
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

export function getDeletedVideoIds(): Set<string> {
  return getClientDeletedVideos();
}

export function markVideoAsDeleted(videoId: string): void {
  markClientDeletedVideo(videoId);
}
