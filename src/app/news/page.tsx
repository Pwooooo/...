"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import {
  Newspaper,
  Megaphone,
  Send,
  Image as ImageIcon,
  Heart,
  Share2,
  Trash2,
  Pin,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
  TrendingUp,
  Radio,
  ExternalLink,
  Users,
} from "lucide-react";
import { NewsPost } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const NEWS_CATEGORIES = [
  "All",
  "Announcement",
  "Update",
  "Release",
  "Behind the Scenes",
  "General",
];

export default function GlobalNewsPage() {
  const { user, openAuthModal } = useAuth();
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [postText, setPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("Announcement");
  const [isPinned, setIsPinned] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      allPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = new Date(a.publishedAt).getTime();
        const timeB = new Date(b.publishedAt).getTime();
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      });

      setPosts(allPosts);
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
  }, []);

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
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
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
    if (!postText.trim() || !user) return;

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      channelHandle: user.handle,
      channelName: user.name || user.handle,
      channelAvatar: user.avatarUrl || user.avatar || "",
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
      showToast("News update published!");
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
      const shareUrl = `${window.location.origin}/@${post.channelHandle}?tab=Community#${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      showToast("Post link copied to clipboard!");
    }
  };

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return "Recently";
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

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === "All") return true;
    return p.tag?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      <div className="flex flex-1">
        <Sidebar collapsed={collapsedSidebar} />

        <main className="flex-1 min-w-0 px-4 md:px-8 lg:px-10 py-6">
          <div className="max-w-7xl mx-auto w-full">
            {toastMessage && (
              <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>{toastMessage}</span>
              </div>
            )}

            <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg flex-shrink-0">
                  <Newspaper className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">News & Updates</h1>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Live broadcasts, release notes, creator announcements, and platform updates.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-xl font-medium">
                  {posts.length} {posts.length === 1 ? "update" : "updates"} published
                </span>
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("post-composer-textarea");
                      el?.focus();
                    }}
                    className="rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Post Update
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                {user ? (
                  <form
                    onSubmit={handleCreatePost}
                    className="rounded-2xl bg-[#141414] border border-white/[0.08] p-4 sm:p-5 shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-3 text-xs font-semibold text-zinc-300">
                      <Megaphone className="h-4 w-4 text-white" />
                      <span>Post an Update to Entropy News</span>
                    </div>

                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{(user.name || user.handle || "C").slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <textarea
                          id="post-composer-textarea"
                          rows={3}
                          required
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          placeholder="Share an announcement, patch note, release, or preview..."
                          className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                        />

                        {attachedImage && (
                          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-72 group">
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
                            {["Announcement", "Update", "Release", "Behind the Scenes", "General"].map((tag) => (
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
                              title="Attach image"
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
                              title={isPinned ? "Pinned" : "Pin post"}
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
                              <span>Publish</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 flex items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-[#181818] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Share news with your audience</h3>
                        <p className="text-xs text-zinc-400">Sign in to broadcast updates and announcements.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="rounded-full bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {NEWS_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-[#141414] text-zinc-400 hover:text-white hover:bg-[#1a1a1a] border border-white/[0.08]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredPosts.length === 0 ? (
                    <div className="py-20 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8 flex flex-col items-center">
                      <Sparkles className="h-10 w-10 text-zinc-600 mb-3" />
                      <h3 className="text-base font-bold text-white mb-1">No updates posted yet</h3>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        {user
                          ? "Be the first to share an announcement, release, or update with the community above."
                          : "Check back soon for new creator posts and patch notes."}
                      </p>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <article
                        key={post.id}
                        id={post.id}
                        className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 sm:p-6 shadow-xl transition-all hover:border-white/[0.14]"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <Link
                            href={`/@${post.channelHandle}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="h-11 w-11 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white group-hover:ring-2 group-hover:ring-white/20 transition-all">
                              {post.channelAvatar ? (
                                <img src={post.channelAvatar} alt={post.channelName || "Channel"} className="h-full w-full object-cover" />
                              ) : (
                                <span>{(post.channelName || post.channelHandle || "C").slice(0, 1).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white group-hover:underline">
                                  {post.channelName || post.channelHandle}
                                </span>
                                {post.isPinned && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                    <Pin className="h-2.5 w-2.5 fill-amber-400" />
                                    <span>Pinned</span>
                                  </span>
                                )}
                                {post.tag && (
                                  <span className="text-[10px] font-semibold text-zinc-300 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full">
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
                          </Link>

                          {user && (user.handle.toLowerCase() === post.channelHandle.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="Delete update"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
                          {post.content}
                        </div>

                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 max-h-[520px] bg-[#0a0a0a]">
                            <img
                              src={post.imageUrl}
                              alt="Update attachment"
                              className="w-full h-full object-cover"
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

                          <Link
                            href={`/@${post.channelHandle}`}
                            className="ml-auto text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                          >
                            <span>Channel</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
                <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
                  <div className="flex items-center gap-2.5 mb-3 text-sm font-bold text-white">
                    <Radio className="h-4 w-4 text-white" />
                    <span>Entropy Broadcasts</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    The official feed for game patch notes, releases, community announcements, and developer updates.
                  </p>
                  <div className="pt-3 border-t border-white/[0.08] space-y-2.5 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Live Status</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Platform</span>
                      <span className="text-white font-medium">Entropy 2.0</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="space-y-1.5">
                    {NEWS_CATEGORIES.map((cat) => {
                      const count = cat === "All" ? posts.length : posts.filter((p) => p.tag?.toLowerCase() === cat.toLowerCase()).length;
                      const isSel = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isSel
                              ? "bg-white/[0.1] text-white font-semibold"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[11px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {user && (
                  <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-[#181818] border border-white/[0.08] overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{(user.name || "U").slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">@{user.handle}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.08] text-white py-2 text-xs font-semibold transition-colors"
                    >
                      <span>View Your Channel</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
