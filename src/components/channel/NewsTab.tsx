"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  Heart,
  Share2,
  Trash2,
  Pin,
  Sparkles,
  Megaphone,
  CheckCircle2,
  X,
} from "lucide-react";
import { NewsPost } from "@/types";

interface NewsTabProps {
  channel?: {
    id?: string;
    handle?: string;
    displayName?: string;
    avatarUrl?: string;
    subscribersCount?: number;
  };
  isOwnProfile?: boolean;
}

const TAG_OPTIONS = ["Update", "Announcement", "Release", "Behind the Scenes", "General"];

export default function NewsTab({ channel, isOwnProfile = false }: NewsTabProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [postText, setPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("Update");
  const [isPinned, setIsPinned] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanHandle = (channel?.handle || "").replace(/^@/, "");
  const displayName = channel?.displayName || cleanHandle || "Creator";
  const avatarUrl = channel?.avatarUrl || "";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPosts = () => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      let allPosts: NewsPost[] = [];
      if (stored) {
        allPosts = JSON.parse(stored);
        if (Array.isArray(allPosts)) {
          allPosts = allPosts.filter((p) => !p.id.startsWith("news-"));
          localStorage.setItem("entropy_news_posts", JSON.stringify(allPosts));
        } else {
          allPosts = [];
          localStorage.setItem("entropy_news_posts", JSON.stringify([]));
        }
      }

      const targetHandle = cleanHandle.toLowerCase();
      const filtered = allPosts.filter((p) => {
        const postHandle = (p.channelHandle || "").replace(/^@/, "").toLowerCase();
        return postHandle === targetHandle;
      });

      filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = new Date(a.publishedAt).getTime();
        const timeB = new Date(b.publishedAt).getTime();
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      });

      setPosts(filtered);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();

    if (typeof window !== "undefined") {
      window.addEventListener("entropy_news_updated", loadPosts);
      window.addEventListener("storage", loadPosts);
      return () => {
        window.removeEventListener("entropy_news_updated", loadPosts);
        window.removeEventListener("storage", loadPosts);
      };
    }
  }, [cleanHandle]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setAttachedImage(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          setAttachedImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      channelHandle: cleanHandle,
      channelName: displayName,
      channelAvatar: avatarUrl,
      content: postText.trim(),
      imageUrl: attachedImage || undefined,
      publishedAt: new Date().toISOString(),
      likes: 0,
      hasLiked: false,
      tag: selectedTag,
      isPinned,
    };

    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];
      const cleaned = Array.isArray(allPosts) ? allPosts.filter((p) => !p.id.startsWith("news-")) : [];
      const updated = [newPost, ...cleaned];
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_news_updated"));
      }

      setPostText("");
      setAttachedImage(null);
      setIsPinned(false);
      showToast("Channel update published!");
    } catch {
      showToast("Failed to save post");
    }
  };

  const handleToggleLike = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((p) => {
        if (p.id === postId) {
          const currentlyLiked = Boolean(p.hasLiked);
          return {
            ...p,
            hasLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, (p.likes || 1) - 1) : (p.likes || 0) + 1,
          };
        }
        return p;
      });

      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_news_updated"));
      }
    } catch {
    }
  };

  const handleDeletePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      if (stored) {
        const allPosts: NewsPost[] = JSON.parse(stored);
        const updated = allPosts.filter((p) => p.id !== postId);
        localStorage.setItem("entropy_news_posts", JSON.stringify(updated));

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("entropy_news_updated"));
        }
        showToast("Post deleted");
      }
    } catch {
    }
  };

  const handleSharePost = (post: NewsPost) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/@${cleanHandle}?tab=News#${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      showToast("Post link copied to clipboard!");
    }
  };

  const formatPostTime = (dateStr: string) => {
    if (dateStr.includes("ago") || dateStr.includes("Yesterday")) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isOwnProfile && (
        <form
          onSubmit={handleCreatePost}
          className="rounded-2xl bg-[#141414] border border-white/[0.08] p-4 sm:p-5 shadow-xl transition-all"
        >
          <div className="flex items-center gap-2.5 mb-3 text-xs font-semibold text-zinc-300">
            <Megaphone className="h-4 w-4 text-white" />
            <span>Post a News Update</span>
          </div>

          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white">
              <img
                src={avatarUrl || "/default-avatar.png"}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
            </div>

            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                required
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share news, patch notes, announcements, or upcoming videos with your viewers..."
                className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
              />

              {attachedImage && (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-60 group">
                  <img src={attachedImage} alt="Post attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedTag === tag
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#222222] border border-white/[0.06]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-zinc-300 hover:text-white border border-white/[0.08] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                    title="Attach an image"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                      isPinned
                        ? "bg-white text-black font-semibold border-white"
                        : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#222222] border-white/[0.08]"
                    }`}
                    title={isPinned ? "Pinned to top" : "Pin post"}
                  >
                    <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-black" : ""}`} />
                    <span className="hidden sm:inline">Pin</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!postText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8 flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <Sparkles className="h-6 w-6 text-zinc-300" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No updates posted yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              {isOwnProfile
                ? "Share updates, patch notes, announcements, and news above."
                : "This channel hasn't posted any updates yet."}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              id={post.id}
              className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl transition-all hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white">
                    {post.channelAvatar ? (
                      <img src={post.channelAvatar} alt={post.channelName || "Channel"} className="h-full w-full object-cover" />
                    ) : (
                      <span>{(post.channelName || post.channelHandle || "C").slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{post.channelName}</span>
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <Pin className="h-2.5 w-2.5 fill-amber-400" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {post.tag && (
                        <span className="text-[10px] font-semibold text-zinc-300 bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                          {post.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                      <span>@{post.channelHandle}</span>
                      <span>•</span>
                      <span>{formatPostTime(post.publishedAt)}</span>
                    </div>
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="Delete update"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line mb-3 font-normal">
                {post.content}
              </div>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 max-h-[480px] bg-[#0a0a0a]">
                  <img
                    src={post.imageUrl}
                    alt="Update media"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    post.hasLiked
                      ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                      : "text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#222222] border border-white/[0.08]"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${post.hasLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                  <span>{post.likes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSharePost(post)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#222222] border border-white/[0.08] transition-colors cursor-pointer"
                  title="Share update"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
