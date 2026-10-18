"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  Trash2,
  Video as VideoIcon,
  Plus,
  Pencil,
  X,
  Camera,
  Check,
  Search,
  Filter,
  BarChart3,
  ExternalLink,
  Film,
  Globe,
} from "lucide-react";
import { formatViews, formatDuration, formatTimeAgo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { VideoItem, CommentItem } from "@/types";
import {
  getAllCombinedVideos,
  deleteUserVideo,
  updateUserVideo,
  fetchServerVideos,
  isShortVideo,
} from "@/lib/video-storage";

const CATEGORIES = [
  "All Categories",
  "Technology",
  "Gaming",
  "Music",
  "Education",
  "Entertainment",
  "Science & Technology",
  "How-to & Style",
  "Shorts",
];

function StudioVideosContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<"videos" | "shorts">("videos");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedVisibility, setSelectedVisibility] = useState<"all" | "public" | "unlisted" | "private">("all");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  // Edit Modal State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Technology");
  const [editTags, setEditTags] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "unlisted" | "private">("public");

  // Delete Confirm State
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setVideos(getAllCombinedVideos());
    fetchServerVideos().then(() => {
      setVideos(getAllCombinedVideos());
    });
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Read live comments and likes counts from localStorage
  const getLiveStats = (videoId: string, fallbackViews = 0) => {
    let commentCount = 0;
    let likeCount = 0;
    let visibility: "public" | "unlisted" | "private" = "public";

    if (typeof window !== "undefined") {
      try {
        const rawComments = localStorage.getItem(`entropy_comments_${videoId}`);
        if (rawComments) {
          const parsed = JSON.parse(rawComments);
          if (Array.isArray(parsed)) commentCount = parsed.length;
        }
      } catch {}

      try {
        const rawLikes = localStorage.getItem(`entropy_video_likes_${videoId}`);
        if (rawLikes) likeCount = parseInt(rawLikes, 10) || 0;
      } catch {}

      try {
        const rawVis = localStorage.getItem(`entropy_video_vis_${videoId}`);
        if (rawVis === "unlisted" || rawVis === "private" || rawVis === "public") {
          visibility = rawVis;
        }
      } catch {}
    }

    return { commentCount, likeCount, visibility };
  };

  // Filtered list
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const isShort = isShortVideo(v);
      if (activeTab === "videos" && isShort) return false;
      if (activeTab === "shorts" && !isShort) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = v.title?.toLowerCase().includes(q);
        const matchesDesc = v.description?.toLowerCase().includes(q);
        const matchesTags = Array.isArray(v.tags) && v.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      if (selectedCategory !== "All Categories" && v.category !== selectedCategory) {
        return false;
      }

      if (selectedVisibility !== "all") {
        const { visibility } = getLiveStats(v.id);
        if (visibility !== selectedVisibility) return false;
      }

      return true;
    });
  }, [videos, activeTab, searchQuery, selectedCategory, selectedVisibility]);

  const handleOpenEdit = (video: VideoItem) => {
    const { visibility } = getLiveStats(video.id);
    setEditingVideo(video);
    setEditTitle(video.title || "");
    setEditDescription(video.description || "");
    setEditCategory(video.category || "Technology");
    setEditTags(Array.isArray(video.tags) ? video.tags.join(", ") : "");
    setEditThumbnailUrl(video.thumbnailUrl || "");
    setEditVisibility(visibility);
  };

  const handleCloseEdit = () => {
    setEditingVideo(null);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditThumbnailUrl(event.target?.result as string);
      showToast("Thumbnail updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    if (!editTitle.trim()) {
      showToast("Please provide a title");
      return;
    }

    const updatedTags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: VideoItem = {
      ...editingVideo,
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      tags: updatedTags,
      thumbnailUrl: editThumbnailUrl,
    };

    updateUserVideo(editingVideo.id, updated);

    try {
      localStorage.setItem(`entropy_video_vis_${editingVideo.id}`, editVisibility);
    } catch {}

    setVideos(getAllCombinedVideos());
    setEditingVideo(null);
    showToast("Video details saved successfully");
  };

  const handleDeleteConfirm = () => {
    if (!deletingVideoId) return;
    deleteUserVideo(deletingVideoId);
    setVideos(getAllCombinedVideos());
    setDeletingVideoId(null);
    setSelectedVideoIds((prev) => prev.filter((id) => id !== deletingVideoId));
    showToast("Video deleted permanently");
  };

  const handleToggleSelectAll = () => {
    if (selectedVideoIds.length === filteredVideos.length) {
      setSelectedVideoIds([]);
    } else {
      setSelectedVideoIds(filteredVideos.map((v) => v.id));
    }
  };

  const handleToggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedVideoIds.length === 0) return;
    if (confirm(`Delete ${selectedVideoIds.length} selected videos permanently?`)) {
      selectedVideoIds.forEach((id) => deleteUserVideo(id));
      setVideos(getAllCombinedVideos());
      setSelectedVideoIds([]);
      showToast(`Deleted ${selectedVideoIds.length} videos`);
    }
  };

  const handleInlineVisibilityChange = (videoId: string, newVis: "public" | "unlisted" | "private") => {
    try {
      localStorage.setItem(`entropy_video_vis_${videoId}`, newVis);
    } catch {}
    setVideos([...getAllCombinedVideos()]);
    showToast(`Visibility updated to ${newVis}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-white text-black font-semibold text-xs px-4 py-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Channel content</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your channel uploads, edit metadata, track visibility, and monitor engagement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Upload video</span>
          </Link>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs: Videos vs Shorts */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 md:border-b-0 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "videos"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <VideoIcon className="h-4 w-4" />
            <span>Videos</span>
            <span className="ml-1 text-[11px] opacity-70">
              ({videos.filter((v) => !isShortVideo(v)).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shorts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "shorts"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Film className="h-4 w-4" />
            <span>Shorts</span>
            <span className="ml-1 text-[11px] opacity-70">
              ({videos.filter((v) => isShortVideo(v)).length})
            </span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-zinc-900 text-white">
                {c}
              </option>
            ))}
          </select>

          {/* Visibility Dropdown */}
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value as any)}
            className="bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900 text-white">All Visibility</option>
            <option value="public" className="bg-zinc-900 text-white">Public</option>
            <option value="unlisted" className="bg-zinc-900 text-white">Unlisted</option>
            <option value="private" className="bg-zinc-900 text-white">Private</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedVideoIds.length > 0 && (
        <div className="rounded-xl bg-white/[0.08] border border-white/10 p-3 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white font-mono">
              {selectedVideoIds.length} video{selectedVideoIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedVideoIds([])}
              className="text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Clear selection
            </button>
          </div>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete selected</span>
          </button>
        </div>
      )}

      {/* Main Content Table */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1a1a] text-zinc-400 border-b border-white/[0.08] font-semibold uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredVideos.length > 0 &&
                      selectedVideoIds.length === filteredVideos.length
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded bg-zinc-800 border-zinc-700 text-red-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 min-w-[280px]">Video</th>
                <th className="py-3 px-4 min-w-[130px]">Visibility</th>
                <th className="py-3 px-4 min-w-[100px]">Date</th>
                <th className="py-3 px-4 min-w-[80px]">Views</th>
                <th className="py-3 px-4 min-w-[90px]">Comments</th>
                <th className="py-3 px-4 min-w-[80px]">Likes</th>
                <th className="py-3 px-4 text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <VideoIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-sm text-zinc-400">No content matches your filter</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Upload a new video or clear search filters to view your content.
                    </p>
                    <Link
                      href="/studio/upload"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload video</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredVideos.map((v) => {
                  const { commentCount, likeCount, visibility } = getLiveStats(v.id, v.viewCount);
                  const isSelected = selectedVideoIds.includes(v.id);

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-white/[0.02] group transition-colors ${
                        isSelected ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectVideo(v.id)}
                          className="rounded bg-zinc-800 border-zinc-700 text-red-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Video Thumbnail & Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-video w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:scale-105 transition-transform">
                            <img
                              src={v.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg"}
                              alt={v.title}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-white">
                              {formatDuration(v.durationSeconds || 15)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/watch?v=${v.id}`}
                              className="font-bold text-zinc-200 hover:text-white line-clamp-1 text-xs transition-colors"
                            >
                              {v.title}
                            </Link>
                            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                              {v.description || "No description provided."}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-mono text-zinc-500">
                              {v.category || "General"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Visibility with inline switcher */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          {visibility === "public" && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                              <Globe className="h-3.5 w-3.5" /> Public
                            </span>
                          )}
                          {visibility === "unlisted" && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold text-xs">
                              <EyeOff className="h-3.5 w-3.5" /> Unlisted
                            </span>
                          )}
                          {visibility === "private" && (
                            <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                              <Lock className="h-3.5 w-3.5" /> Private
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-4 text-white font-bold font-mono">
                        {formatViews(v.viewCount || 0)}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-4 text-zinc-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{commentCount}</span>
                        </div>
                      </td>

                      {/* Likes */}
                      <td className="py-3 px-4 text-zinc-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{likeCount}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit video details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            href="/studio/analytics"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="View analytics"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href="/studio/comments"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="View comments"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/watch?v=${v.id}`}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="Watch on Entropy"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingVideoId(v.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete video"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Video Details Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-[#141414] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-sm text-white">Video details</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title (required)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none"
                  placeholder="Add a title that describes your video"
                />
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block text-right">
                  {editTitle.length} / 100
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none resize-none"
                  placeholder="Tell viewers about your video"
                />
              </div>

              {/* Thumbnail Change */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Thumbnail
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative aspect-video w-36 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                    <img
                      src={editThumbnailUrl || "/videos/entropy-test-video-thumb.jpg"}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleThumbnailSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Upload thumbnail</span>
                    </button>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      1280x720 or 16:9 recommended
                    </p>
                  </div>
                </div>
              </div>

              {/* Category & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value as any)}
                    className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="public">Public (Everyone can see)</option>
                    <option value="unlisted">Unlisted (Anyone with link)</option>
                    <option value="private">Private (Only you)</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none"
                  placeholder="tech, streaming, walkthrough"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-full hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-white/10 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Permanently delete this video?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deleting is permanent and cannot be undone. Comments, likes, and local playback data for this video will also be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVideoId(null)}
                className="px-4 py-2 rounded-full hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer shadow"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioVideosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-zinc-500 text-xs font-mono">
          Loading channel content...
        </div>
      }
    >
      <StudioVideosContent />
    </Suspense>
  );
}

