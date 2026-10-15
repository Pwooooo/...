"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import Link from "next/link";
import {
  Upload,
  Eye,
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
} from "lucide-react";
import { formatViews } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";

import { getUserVideos, deleteUserVideo, updateUserVideo } from "@/lib/video-storage";

const CATEGORIES = [
  "Technology",
  "Gaming",
  "Music",
  "Education",
  "Entertainment",
  "Science & Technology",
  "How-to & Style",
  "Film & Animation",
  "News & Politics",
  "Sports",
  "Travel & Events",
];

export default function StudioVideosPage() {
  const { user, openAuthModal } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Edit Video State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Technology");
  const [editTags, setEditTags] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = (video: VideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title || "");
    setEditDescription(video.description || "");
    setEditCategory(video.category || "Technology");
    setEditTags(video.tags ? video.tags.join(", ") : "");
    setEditThumbnailUrl(video.thumbnailUrl || "");
  };

  const handleCloseEdit = () => {
    setEditingVideo(null);
  };

  const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
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
      alert("Please provide a video title.");
      return;
    }

    const parsedTags = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    const updates: Partial<VideoItem> = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      tags: parsedTags,
      thumbnailUrl: editThumbnailUrl,
    };

    updateUserVideo(editingVideo.id, updates);
    setVideos((prev) =>
      prev.map((v) => (v.id === editingVideo.id ? { ...v, ...updates } : v))
    );
    setEditingVideo(null);
    showToast("Video details updated!");
  };

  const loadUserVideos = () => {
    try {
      if (user) {
        const stored = getUserVideos();
        const userVideos = stored.filter(
          (v: VideoItem) =>
            v.channel?.handle?.toLowerCase() === user.handle.toLowerCase() ||
            v.channel?.id === user.id
        );
        setVideos(userVideos);
      } else {
        setVideos([]);
      }
    } catch {
      setVideos([]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadUserVideos();
    window.addEventListener("entropy_videos_updated", loadUserVideos);
    window.addEventListener("storage", loadUserVideos);
    return () => {
      window.removeEventListener("entropy_videos_updated", loadUserVideos);
      window.removeEventListener("storage", loadUserVideos);
    };
  }, [user]);

  const deleteVideo = (id: string) => {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    deleteUserVideo(id);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h1 className="text-2xl font-bold text-white">Your videos</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Manage your uploads, visibility, and analytics</p>
            </div>

            {user && (
              <Link
                href="/studio/upload"
                className="flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-black shadow-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Upload video</span>
              </Link>
            )}
          </div>

          {!user ? (
            /* Unauthenticated State */
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-12 text-center max-w-md mx-auto my-12 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
                <VideoIcon className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Sign in to view your videos</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Your uploaded videos and channel content will be stored securely with your account.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          ) : isLoaded && videos.length === 0 ? (
            /* Empty State: No uploaded videos */
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-12 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1.5">No videos uploaded yet</h2>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                Your uploaded videos will appear here. Start creating to share content with your viewers on Entropy.
              </p>
              <Link
                href="/studio/upload"
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-lg"
              >
                Upload your first video
              </Link>
            </div>
          ) : (
            /* Videos Table */
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Video</th>
                    <th className="py-3 px-4 font-semibold">Visibility</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Views</th>
                    <th className="py-3 px-4 font-semibold">Comments</th>
                    <th className="py-3 px-4 font-semibold">Likes</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {videos.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-900/50 group transition-colors">
                      {/* Video Thumbnail & Title */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-video w-24 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
                            <img
                              src={v.thumbnailUrl || ""}
                              alt={v.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/watch?v=${v.id}`}
                              className="font-semibold text-zinc-200 hover:text-white line-clamp-1"
                            >
                              {v.title}
                            </Link>
                            <p className="text-[11px] text-zinc-500 line-clamp-1">{v.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Visibility */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          <Eye className="h-3 w-3" /> Public
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-4 text-zinc-300 font-medium">
                        {formatViews(v.viewCount || 0)}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>0</span>
                        </div>
                      </td>

                      {/* Likes */}
                      <td className="py-3 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>0</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white cursor-pointer transition-colors"
                            title="Edit video"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/watch?v=${v.id}`}
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                            title="Watch video"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteVideo(v.id)}
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white cursor-pointer transition-colors"
                            title="Delete video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Edit Video Details Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={handleCloseEdit} />
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-[#141414] border border-white/[0.08] shadow-2xl text-white z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Edit video details</h3>
                <p className="text-[11px] text-zinc-400">Update video title, description, category, tags, and thumbnail</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto scrollbar-none flex-1">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Category & Tags Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20 transition-colors cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-900 text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. coding, nextjs, tech"
                      className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Thumbnail Management */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Thumbnail
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.08]">
                    <div className="relative aspect-video w-36 sm:w-44 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                      {editThumbnailUrl ? (
                        <img
                          src={editThumbnailUrl}
                          alt="Thumbnail preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                          No thumbnail
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleThumbnailFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Change Thumbnail</span>
                      </button>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Select a 16:9 high quality image (JPG, PNG, WebP) to update your video thumbnail.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.08] bg-zinc-950/50">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.08] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
