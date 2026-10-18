"use client";

import React, { useState, useRef, useEffect } from "react";

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
  Flame,
  Music,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
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
import StudioDropdown from "@/components/ui/StudioDropdown";

const VIDEO_CATEGORIES = [
  "Shorts",
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
  const { addNotification } = useNotifications();

  const [uploadType, setUploadType] = useState<"video" | "short">("video");
  const [songName, setSongName] = useState("Original Audio");

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const typeParam = new URLSearchParams(window.location.search).get("type");
      if (typeParam === "short") {
        setUploadType("short");
        setCategory("Shorts");
      }
    }
  }, []);

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
      if (details.height > details.width) {
        setUploadType("short");
        setCategory("Shorts");
        showToast("Vertical video detected — set to Short format");
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

    if (title.trim().length > 100) {
      showToast("Video title cannot exceed 100 characters");
      return;
    }
    if (description.length > 10000) {
      showToast("Video description cannot exceed 10,000 characters");
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStage("Uploading");

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    if (parsedTags.length > 10) {
      showToast("Maximum 10 tags allowed for videos and shorts");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim() || file.name);
      formData.append("description", description.trim() || "Uploaded to Entropy");
      formData.append("category", uploadType === "short" ? "Shorts" : category);
      formData.append("tags", parsedTags.join(","));
      formData.append("duration", (extractedDuration || 0).toString());
      formData.append("isShort", (uploadType === "short").toString());
      if (uploadType === "short") {
        formData.append("songName", songName.trim() || "Original Audio");
      }
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

      // Dispatch real-time notification
      addNotification({
        type: "upload",
        title: uploadType === "short" ? "Short Published" : "Video Published",
        message: `${finalVideo.channel?.displayName || "You"} uploaded ${uploadType === "short" ? "a Short" : "a video"}: ${finalVideo.title}`,
        actorName: finalVideo.channel?.displayName || "Your Channel",
        actorAvatar: finalVideo.channel?.avatarUrl || user?.avatarUrl || "/default-avatar.png",
        thumbnailUrl: finalVideo.thumbnailUrl,
        linkUrl: uploadType === "short" ? `/shorts` : `/watch?v=${finalVideo.id}`,
      });

      setUploadProgress(100);
      setUploadStage(uploadType === "short" ? "Short published successfully to feed!" : "Video published successfully to everyone!");
      setIsUploading(false);
      setIsCompleted(true);
      showToast(uploadType === "short" ? "Short uploaded and published!" : "Video uploaded and published!");
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
    setCategory(uploadType === "short" ? "Shorts" : "Technology");
    setTagsInput("");
    setSongName("Original Audio");
    setExtractedDuration(0);
    setThumbnailUrl("");
    setUploadProgress(0);
    setUploadStage("");
    setIsUploading(false);
    setIsCompleted(false);
    setCreatedVideoId(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
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
              <h2 className="text-2xl font-bold text-white mb-2">
                {uploadType === "short" ? "Short Published!" : "Video Published!"}
              </h2>
              <p className="text-xs text-zinc-400 mb-8 max-w-md mx-auto">
                {uploadType === "short"
                  ? "Your YouTube Short has been processed and is ready for streaming in the Shorts feed."
                  : "Your video has been processed and is ready for streaming on Entropy."}
              </p>

              {/* Preview Card */}
              <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden p-4 mb-8 text-left shadow-2xl flex flex-col sm:flex-row gap-4 items-center">
                <div
                  className={`relative ${
                    uploadType === "short" ? "aspect-[9/16] w-28" : "aspect-video w-full sm:w-48"
                  } flex-shrink-0 rounded-xl overflow-hidden bg-black border border-white/[0.08]`}
                >
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
                  <div className="flex items-center gap-1.5 mb-1">
                    {uploadType === "short" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px] font-bold">
                        <Flame className="h-3 w-3" /> Short
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{description || "No description provided."}</p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>Category: {uploadType === "short" ? "Shorts" : category}</span>
                    <span>•</span>
                    <span>Ready to watch</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {uploadType === "short" ? (
                  <Link
                    href="/shorts"
                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md"
                  >
                    <Flame className="h-4 w-4 fill-black" />
                    <span>Watch in Shorts</span>
                  </Link>
                ) : (
                  createdVideoId && (
                    <Link
                      href={`/watch?v=${createdVideoId}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md"
                    >
                      <Play className="h-4 w-4 fill-black" />
                      <span>Watch Video</span>
                    </Link>
                  )
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {uploadType === "short" ? "Upload Short" : "Upload video"}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    {uploadType === "short"
                      ? "Publish vertical 9:16 short-form video to the Shorts feed."
                      : "Post and publish video content directly to your channel."}
                  </p>
                </div>

                {/* Format switcher tabs */}
                <div className="flex items-center p-1 bg-[#141414] border border-white/[0.08] rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadType("video");
                      if (category === "Shorts") setCategory("Technology");
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      uploadType === "video"
                        ? "bg-white text-black shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <VideoIcon className="h-3.5 w-3.5" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadType("short");
                      setCategory("Shorts");
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      uploadType === "short"
                        ? "bg-white text-black shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Short (9:16)</span>
                  </button>
                </div>
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
                    {uploadType === "short" ? (
                      <Flame className="h-10 w-10 text-zinc-300" />
                    ) : (
                      <UploadCloud className="h-10 w-10 text-zinc-300" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {uploadType === "short"
                      ? "Drag and drop vertical Short video to upload"
                      : "Drag and drop video files to upload"}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                    {uploadType === "short"
                      ? "MP4, WebM, MOV, or MKV. 9:16 vertical ratio recommended."
                      : "MP4, WebM, MOV, or MKV. High definition resolution supported."}
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
                        {uploadType === "short" ? (
                          <Flame className="h-5 w-5 text-zinc-300" />
                        ) : (
                          <FileVideo className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{file.name}</p>
                          {uploadType === "short" && (
                            <span className="bg-white/10 text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Short
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-zinc-300">
                            Title <span className="text-zinc-400">*</span>
                          </label>
                          <span
                            className={`text-[11px] font-mono ${
                              title.length >= 100 ? "text-white font-bold" : "text-zinc-500"
                            }`}
                          >
                            {title.length}/100
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Give your video a catchy title..."
                          className="w-full rounded-xl bg-black border border-white/[0.08] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                        />
                      </div>

                      {uploadType === "short" && (
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                            <Music className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Audio / Sound Name</span>
                          </label>
                          <input
                            type="text"
                            maxLength={100}
                            value={songName}
                            onChange={(e) => setSongName(e.target.value)}
                            placeholder="Original Audio or Sound Title"
                            className="w-full rounded-xl bg-black border border-white/[0.08] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-zinc-300">
                            Description
                          </label>
                          <span
                            className={`text-[11px] font-mono ${
                              description.length >= 10000 ? "text-white font-bold" : "text-zinc-500"
                            }`}
                          >
                            {description.length}/10000
                          </span>
                        </div>
                        <textarea
                          rows={uploadType === "short" ? 3 : 4}
                          maxLength={10000}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={
                            uploadType === "short"
                              ? "Brief description or #shorts tags..."
                              : "Tell viewers about your video..."
                          }
                          className="w-full rounded-xl bg-black border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                            Category
                          </label>
                          <StudioDropdown
                            value={category}
                            onChange={setCategory}
                            options={VIDEO_CATEGORIES}
                            className="w-full"
                            buttonClassName="w-full bg-black py-2 text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-zinc-300">
                              Tags (comma separated)
                            </label>
                            <span
                              className={`text-[11px] font-mono ${
                                tagsInput.split(",").map((t) => t.trim()).filter(Boolean).length > 10
                                  ? "text-white font-bold"
                                  : "text-zinc-500"
                              }`}
                            >
                              {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).length}/10 tags
                            </span>
                          </div>
                          <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder={uploadType === "short" ? "shorts, viral, trending (max 10)" : "gaming, tips, tutorial (max 10)"}
                            className="w-full rounded-xl bg-black border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right preview & thumbnail */}
                    <div className="lg:col-span-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          {uploadType === "short" ? "Short Preview (9:16)" : "Video Preview"}
                        </label>
                        <div
                          className={`relative ${
                            uploadType === "short"
                              ? "aspect-[9/16] max-w-[260px] mx-auto shadow-2xl"
                              : "aspect-video"
                          } rounded-2xl bg-black border border-white/[0.08] overflow-hidden flex items-center justify-center`}
                        >
                          {videoPreviewUrl ? (
                            <video
                              src={videoPreviewUrl}
                              controls
                              playsInline
                              className="w-full h-full object-cover"
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
                            Cover Thumbnail
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

                        <div
                          className={`relative ${
                            uploadType === "short"
                              ? "aspect-[9/16] max-w-[260px] mx-auto"
                              : "aspect-video"
                          } rounded-2xl bg-black border border-white/[0.08] overflow-hidden group`}
                        >
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
                          <span>{uploadType === "short" ? "Publish Short" : "Publish Video"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
    </div>
  );
}
