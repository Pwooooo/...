"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Video as VideoIcon,
  Image as ImageIcon,
  Play,
  X,
  FileVideo,
  Sparkles,
  Loader2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";
import {
  extractVideoDetails,
  saveVideoBlob,
  saveUserVideoMetadata,
  saveUserUploadedVideo,
  uploadVideoToServer,
  fetchServerVideos,
} from "@/lib/video-storage";
import { formatDuration } from "@/lib/utils";

const VIDEO_CATEGORIES = [
  "Technology",
  "Web Development",
  "Gaming",
  "Music",
  "Design",
  "Computer Science",
  "Entertainment",
  "Education",
];

export default function StudioUploadPage() {
  const { user, openAuthModal } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tagsInput, setTagsInput] = useState("");
  const [extractedDuration, setExtractedDuration] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [customThumbFile, setCustomThumbFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const processVideoFile = async (selected: File) => {
    if (!selected.type.startsWith("video/") && !selected.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      showToast("Please select a valid video file (MP4, WebM, MOV, MKV)");
      return;
    }

    setFile(selected);
    const cleanTitle = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setTitle(cleanTitle);

    const prevUrl = URL.createObjectURL(selected);
    setVideoPreviewUrl(prevUrl);

    setIsExtracting(true);
    try {
      const details = await extractVideoDetails(selected);
      setExtractedDuration(details.duration);
      if (details.thumbnailUrl) {
        setThumbnailUrl(details.thumbnailUrl);
      }
    } catch (err) {
      console.warn("Could not extract frame details:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const handleCustomThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const thumbFile = e.target.files?.[0];
    if (!thumbFile) return;

    if (!thumbFile.type.startsWith("image/")) {
      showToast("Please select an image file (PNG, JPG, WebP)");
      return;
    }

    setCustomThumbFile(thumbFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailUrl(event.target?.result as string);
      showToast("Custom thumbnail applied!");
    };
    reader.readAsDataURL(thumbFile);
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStage("Encoding and preparing media stream...");

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    try {
      setUploadProgress(35);
      setUploadStage("Uploading video to Entropy server...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim() || file.name);
      formData.append("description", description.trim() || "Uploaded to Entropy");
      formData.append("category", category);
      formData.append("tags", parsedTags.join(","));
      formData.append("duration", (extractedDuration || 0).toString());
      formData.append(
        "channel",
        JSON.stringify({
          id: user.id || "u-user",
          handle: user.handle,
          displayName: user.name || user.handle,
          avatarUrl: user.avatarUrl || user.avatar || "",
          subscribersCount: 0,
        })
      );
      if (customThumbFile) {
        formData.append("thumbnailFile", customThumbFile);
      } else if (thumbnailUrl) {
        formData.append("thumbnailDataUrl", thumbnailUrl);
      }

      setUploadProgress(70);
      setUploadStage("Saving media and finalizing stream indexing...");

      const srvResult = await uploadVideoToServer(formData, (stage, pct) => {
        setUploadStage(stage);
        setUploadProgress(pct);
      });

      if (!srvResult.success || !srvResult.video) {
        setIsUploading(false);
        const errMsg = srvResult.error || "Upload to cloud failed. Please check your Vercel Blob settings.";
        showToast(errMsg);
        return;
      }

      const finalVideo: VideoItem = srvResult.video;
      setCreatedVideoId(finalVideo.id);
      saveUserUploadedVideo(finalVideo);
      await fetchServerVideos();

      setUploadProgress(100);
      setUploadStage("Video published successfully to everyone!");
      setIsUploading(false);
      setIsCompleted(true);
      showToast("Video uploaded and published!");
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
      showToast("Failed to complete video upload");
    }
  };

  const handleReset = () => {
    setFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    setTitle("");
    setDescription("");
    setCategory("Technology");
    setTagsInput("");
    setExtractedDuration(0);
    setThumbnailUrl("");
    setUploadProgress(0);
    setUploadStage("");
    setIsUploading(false);
    setIsCompleted(false);
    setCreatedVideoId(null);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-8 max-w-4xl mx-auto w-full">
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {!user ? (
            <div className="py-20 max-w-md mx-auto text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white mb-4">
                <UploadCloud className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Want to upload videos?</h2>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                Sign in to your Entropy account to start uploading, managing videos, and sharing with viewers.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          ) : isCompleted ? (
            <div className="py-12 max-w-xl mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-bold text-white mb-2">Video Published!</h2>
              <p className="text-xs text-zinc-400 mb-8 max-w-md mx-auto">
                Your video has been processed and is ready for streaming on Entropy.
              </p>

              {/* Preview Card */}
              <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden p-4 mb-8 text-left shadow-2xl flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative aspect-video w-full sm:w-48 flex-shrink-0 rounded-xl overflow-hidden bg-black border border-white/[0.08]">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <VideoIcon className="h-8 w-8" />
                    </div>
                  )}
                  {extractedDuration > 0 && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                      {formatDuration(extractedDuration)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate mb-1">{title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{description || "No description provided."}</p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>Category: {category}</span>
                    <span>•</span>
                    <span>Ready to watch</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {createdVideoId && (
                  <Link
                    href={`/watch?v=${createdVideoId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>Watch Video</span>
                  </Link>
                )}
                <Link
                  href="/studio/videos"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.08] text-white px-5 py-2.5 text-xs font-semibold transition-all"
                >
                  <span>Go to Studio Videos</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Upload Another
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Upload video</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Post and publish video content directly to your channel.
                </p>
              </div>

              {!file ? (
                /* Drag & Drop File Zone */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-3xl border-2 border-dashed border-white/[0.12] hover:border-white/30 bg-[#141414]/60 hover:bg-[#141414] p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[380px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    className="hidden"
                  />
                  <div className="h-20 w-20 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white mb-5 shadow-xl group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-10 w-10 text-zinc-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Drag and drop video files to upload</h3>
                  <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                    MP4, WebM, MOV, or MKV. High definition resolution supported.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="rounded-xl bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Select files
                  </button>
                </div>
              ) : (
                /* Metadata & Video Details Form */
                <form
                  onSubmit={handleStartUpload}
                  className="rounded-3xl bg-[#141414] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6"
                >
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black border border-white/[0.08]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-zinc-300 flex-shrink-0">
                        <FileVideo className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{file.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB • {file.type || "Video"}
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Change file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left details */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Give your video a catchy title..."
                          className="w-full rounded-xl bg-black border border-white/[0.08] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          Description
                        </label>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tell viewers about your video..."
                          className="w-full rounded-xl bg-black border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl bg-black border border-white/[0.08] px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-colors"
                          >
                            {VIDEO_CATEGORIES.map((c) => (
                              <option key={c} value={c} className="bg-[#141414] text-white">
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                            Tags (comma separated)
                          </label>
                          <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="gaming, gameplay, tips"
                            className="w-full rounded-xl bg-black border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right preview & thumbnail */}
                    <div className="lg:col-span-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          Video Preview
                        </label>
                        <div className="relative aspect-video rounded-2xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center">
                          {videoPreviewUrl ? (
                            <video
                              src={videoPreviewUrl}
                              controls
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading preview...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-zinc-300">
                            Thumbnail
                          </label>
                          <input
                            type="file"
                            ref={thumbInputRef}
                            onChange={handleCustomThumbChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => thumbInputRef.current?.click()}
                            className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Upload Custom
                          </button>
                        </div>

                        <div className="relative aspect-video rounded-2xl bg-black border border-white/[0.08] overflow-hidden group">
                          {isExtracting ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-[11px]">Generating thumbnail...</span>
                            </div>
                          ) : thumbnailUrl ? (
                            <>
                              <img
                                src={thumbnailUrl}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => thumbInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer"
                              >
                                <ImageIcon className="h-5 w-5" />
                                <span className="text-[11px] font-semibold">Change thumbnail</span>
                              </button>
                            </>
                          ) : (
                            <div
                              onClick={() => thumbInputRef.current?.click()}
                              className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="h-6 w-6" />
                              <span className="text-[11px]">Choose an image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress Bar (if submitting) */}
                  {isUploading && (
                    <div className="p-4 rounded-2xl bg-black border border-white/[0.08] space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300 flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                          {uploadStage}
                        </span>
                        <span className="font-bold text-white tabular-nums">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isUploading || !title.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <span>Publish Video</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
