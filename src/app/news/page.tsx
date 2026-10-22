"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import {
  Newspaper,
  Send,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
  Pin,
  Sparkles,
  CheckCircle2,
  X,
  MessageSquare,
  BarChart2,
  Plus,
  ChevronLeft,
  Tag,
  Folder,
  Shield,
  Lock,
  Unlock,
  Users,
  RefreshCw,
  ExternalLink,
  Search,
} from "lucide-react";
import { NewsPost, CommunityComment, CommunityPollOption } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getRegisteredUsers, UserRecord } from "@/lib/user-validation";
import Link from "next/link";

export interface DiscourseCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  subcategories: string[];
}

export const FORUM_CATEGORIES: DiscourseCategory[] = [
  {
    id: "updates",
    name: "Updates",
    color: "#F1592A",
    description: "Official platform announcements, patch notes, video player releases, and news from the Entropy team.",
    subcategories: ["Announcements", "Patch Notes", "Platform Releases", "Creator News"],
  },
  {
    id: "community",
    name: "Community",
    color: "#12A89D",
    description: "Show off your channels, share videos, collaborate with fellow creators, and discuss video creation.",
    subcategories: ["Creator Showcase", "General Discussion", "Collaborations", "Feedback & Advice", "Off-Topic"],
  },
  {
    id: "help-feedback",
    name: "Help & Feedback",
    color: "#0E76BD",
    description: "Get help with streaming, video uploads, Creator Studio tools, channel setup, and playback support.",
    subcategories: ["Studio & Uploads", "Streaming & Playback", "Channel & Customization", "Account Support", "Creator Tips"],
  },
  {
    id: "bug-reports",
    name: "Bug Reports",
    color: "#BF1A2F",
    description: "Found an issue with video playback, upload processing, Creator Studio, or the UI? Report it here.",
    subcategories: ["Video Player", "Studio & Uploads", "Website & UI", "Shorts & Feeds", "General Issues"],
  },
  {
    id: "feature-requests",
    name: "Feature Requests",
    color: "#3AB54A",
    description: "Share your ideas for new video player tools, Creator Studio enhancements, and platform improvements.",
    subcategories: ["Player & Viewing", "Creator Studio", "Channels & Social", "Shorts & Discovery", "Platform Ideas"],
  },
];

export default function GlobalNewsPage() {
  const { user, openAuthModal } = useAuth();
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);

  const isUserZero = (user?.handle || "").replace(/^@/, "").trim().toLowerCase() === "0";
  const [activeTab, setActiveTab] = useState<"categories" | "latest" | "top" | "users">("categories");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  // Locked Users Panel state (only for @0)
  const [isUsersUnlocked, setIsUsersUnlocked] = useState(false);
  const [usersPasswordInput, setUsersPasswordInput] = useState("");
  const [usersPasswordError, setUsersPasswordError] = useState("");
  const [allPlatformUsers, setAllPlatformUsers] = useState<UserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");

  const loadAllPlatformUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      const fromServer = data.success && Array.isArray(data.users) ? data.users : [];
      const fromLocal = getRegisteredUsers();
      const map = new Map<string, UserRecord>();
      fromServer.forEach((u: UserRecord) => map.set(u.handle.toLowerCase(), u));
      fromLocal.forEach((u: UserRecord) => map.set(u.handle.toLowerCase(), u));
      setAllPlatformUsers(Array.from(map.values()));
    } catch {
      setAllPlatformUsers(getRegisteredUsers());
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUnlockUsers = (e: React.FormEvent) => {
    e.preventDefault();
    if (usersPasswordInput === "entropy67") {
      setIsUsersUnlocked(true);
      setUsersPasswordError("");
      loadAllPlatformUsers();
    } else {
      setUsersPasswordError("Incorrect password. Access denied.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam === "users" && isUserZero) {
        setActiveTab("users");
        setActiveCategory(null);
        setActiveSubcategory(null);
      }
    }
  }, [isUserZero]);

  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState("");
  const [composerCategory, setComposerCategory] = useState(FORUM_CATEGORIES[0].name);
  const [composerSubcategory, setComposerSubcategory] = useState(FORUM_CATEGORIES[0].subcategories[0]);
  const [isPinned, setIsPinned] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
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

  const getCategoryPostCount = (category: DiscourseCategory) => {
    return posts.filter((p) => {
      if (!p.tag) return false;
      const tagLower = p.tag.toLowerCase();
      if (tagLower === category.name.toLowerCase()) return true;
      return category.subcategories.some((sub) => sub.toLowerCase() === tagLower);
    }).length;
  };

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

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleCategoryChange = (catName: string) => {
    setComposerCategory(catName);
    const cat = FORUM_CATEGORIES.find((c) => c.name === catName);
    if (cat && cat.subcategories.length > 0) {
      setComposerSubcategory(cat.subcategories[0]);
    } else {
      setComposerSubcategory("");
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || !user) return;

    let pollData: CommunityPollOption[] | undefined = undefined;
    if (showPollCreator) {
      const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (validOptions.length >= 2) {
        pollData = validOptions.map((opt, i) => ({
          id: `opt-${i}-${Date.now()}`,
          text: opt,
          votes: 0,
        }));
      }
    }

    const tagToUse = composerSubcategory || composerCategory;

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      channelHandle: user.handle,
      channelName: user.name || user.handle,
      channelAvatar: user.avatarUrl || user.avatar || "",
      content: postText.trim(),
      imageUrl: attachedImage || undefined,
      pollOptions: pollData,
      publishedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      hasLiked: false,
      hasDisliked: false,
      tag: tagToUse,
      isPinned,
      comments: [],
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
      setShowPollCreator(false);
      setPollOptions(["", ""]);
      setIsPinned(false);
      setShowComposer(false);
      showToast("Topic published successfully!");
    } catch {
      showToast("Failed to save topic");
    }
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId && post.pollOptions) {
          if (post.pollVotedId) return post;
          const options = post.pollOptions.map((opt) => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          });
          return { ...post, pollOptions: options, pollVotedId: optionId };
        }
        return post;
      });

      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_news_updated"));
      }
    } catch {
    }
  };

  const handleLikePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId) {
          const currentlyLiked = Boolean(post.hasLiked);
          const currentlyDisliked = Boolean(post.hasDisliked);
          return {
            ...post,
            hasLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
            hasDisliked: false,
            dislikes: currentlyDisliked ? Math.max(0, (post.dislikes || 1) - 1) : post.dislikes,
          };
        }
        return post;
      });

      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_news_updated"));
      }
    } catch {
    }
  };

  const handleDislikePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId) {
          const currentlyDisliked = Boolean(post.hasDisliked);
          const currentlyLiked = Boolean(post.hasLiked);
          return {
            ...post,
            hasDisliked: !currentlyDisliked,
            dislikes: currentlyDisliked ? Math.max(0, (post.dislikes || 1) - 1) : (post.dislikes || 0) + 1,
            hasLiked: false,
            likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes,
          };
        }
        return post;
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
        showToast("Topic deleted");
      }
    } catch {
      showToast("Failed to delete topic");
    }
  };

  const handleSharePost = (post: NewsPost) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/news#${post.id}`;
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;

    try {
      const stored = localStorage.getItem("entropy_news_posts");
      const allPosts: NewsPost[] = stored ? JSON.parse(stored) : [];

      const newComment: CommunityComment = {
        id: `comm-${Date.now()}`,
        authorHandle: user.handle,
        authorName: user.name || user.handle,
        authorAvatar: user.avatarUrl || user.avatar || "",
        content: text,
        createdAt: new Date().toISOString(),
        likes: 0,
        hasLiked: false,
      };

      const updated = allPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [newComment, ...(post.comments || [])],
          };
        }
        return post;
      });

      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_news_updated"));
      }

      setCommentInputs({ ...commentInputs, [postId]: "" });
      showToast("Reply posted");
    } catch {
      showToast("Failed to post reply");
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

  const selectedCategoryObj = activeCategory
    ? FORUM_CATEGORIES.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase())
    : null;

  const displayedPosts = posts.filter((p) => {
    if (activeCategory) {
      if (!p.tag) return false;
      const tagLower = p.tag.toLowerCase();
      if (activeSubcategory) {
        return tagLower === activeSubcategory.toLowerCase();
      }
      if (tagLower === activeCategory.toLowerCase()) return true;
      if (selectedCategoryObj) {
        return selectedCategoryObj.subcategories.some((sub) => sub.toLowerCase() === tagLower);
      }
      return false;
    }

    if (activeTab === "top") {
      return true;
    }

    return true;
  }).sort((a, b) => {
    if (activeTab === "top") {
      return (b.likes || 0) - (a.likes || 0);
    }
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      <div className="flex flex-1">
        <Sidebar collapsed={collapsedSidebar} />

        <main className="flex-1 min-w-0 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-6xl mx-auto w-full">
            {toastMessage && (
              <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Discourse Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
                {activeCategory ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(null);
                      setActiveSubcategory(null);
                      setActiveTab("categories");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>All Categories</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("categories");
                        setActiveCategory(null);
                        setActiveSubcategory(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none ${
                        activeTab === "categories"
                          ? "bg-white/[0.08] text-white shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      Categories
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("latest");
                        setActiveCategory(null);
                        setActiveSubcategory(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none ${
                        activeTab === "latest"
                          ? "bg-white/[0.08] text-white shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      Latest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("top");
                        setActiveCategory(null);
                        setActiveSubcategory(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none ${
                        activeTab === "top"
                          ? "bg-white/[0.08] text-white shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      Top
                    </button>
                    {isUserZero && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("users");
                          setActiveCategory(null);
                          setActiveSubcategory(null);
                          if (!isUsersUnlocked) {
                            loadAllPlatformUsers();
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer outline-none flex items-center gap-1.5 ${
                          activeTab === "users"
                            ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5 text-zinc-300" />
                        <span>Users Panel</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
                  {posts.length} {posts.length === 1 ? "topic" : "topics"}
                </span>
                {activeTab !== "users" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        openAuthModal();
                        return;
                      }
                      if (activeCategory) {
                        handleCategoryChange(activeCategory);
                      }
                      setShowComposer(!showComposer);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm ml-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Topic</span>
                  </button>
                )}
              </div>
            </div>

            {/* Topic Composer */}
            {showComposer && (
              <form
                onSubmit={handleCreatePost}
                className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 mb-8 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="h-4 w-4 text-zinc-400" />
                    <span>Create a New Topic</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowComposer(false)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Category
                      </label>
                      <select
                        value={composerCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-colors"
                      >
                        {FORUM_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name} className="bg-[#141414] text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Subcategory
                      </label>
                      <select
                        value={composerSubcategory}
                        onChange={(e) => setComposerSubcategory(e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-colors"
                      >
                        {FORUM_CATEGORIES.find((c) => c.name === composerCategory)?.subcategories.map((sub) => (
                          <option key={sub} value={sub} className="bg-[#141414] text-white">
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    required
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Write an announcement, start a discussion, or share an update with the Entropy community..."
                    className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                  />

                  {attachedImage && (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-72">
                      <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {showPollCreator && (
                    <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5 text-zinc-400" />
                          Poll Options
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPollCreator(false)}
                          className="text-zinc-500 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 rounded-lg bg-[#141414] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-white/20"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <button
                          type="button"
                          onClick={handleAddPollOption}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-medium pt-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Option
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
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
                        className="flex items-center gap-1.5 rounded-xl bg-[#0a0a0a] hover:bg-[#181818] text-zinc-300 hover:text-white border border-white/[0.08] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                        title="Add image"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPollCreator(!showPollCreator)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                          showPollCreator
                            ? "bg-white text-black font-semibold border-white"
                            : "bg-[#0a0a0a] text-zinc-300 hover:text-white hover:bg-[#181818] border-white/[0.08]"
                        }`}
                        title="Add poll"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                        <span>Poll</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPinned(!isPinned)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                          isPinned
                            ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                            : "bg-[#0a0a0a] text-zinc-400 hover:text-white hover:bg-[#181818] border-white/[0.08]"
                        }`}
                        title="Pin topic"
                      >
                        <Pin className="h-3.5 w-3.5" />
                        <span>Pin</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowComposer(false)}
                        className="rounded-xl px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!postText.trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black px-4 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Send className="h-3 w-3" />
                        <span>Create Topic</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Discourse Categories Table View */}
            {activeTab === "categories" && !activeCategory ? (
              <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-3.5 border-b border-white/[0.08] text-xs font-bold text-zinc-400 uppercase tracking-wider bg-white/[0.02]">
                  <div className="col-span-9 sm:col-span-10">Category</div>
                  <div className="col-span-3 sm:col-span-2 text-right">Topics</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/[0.06]">
                  {FORUM_CATEGORIES.map((cat) => {
                    const topicCount = getCategoryPostCount(cat);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.name);
                          setActiveSubcategory(null);
                        }}
                        className="grid grid-cols-12 px-6 py-5 hover:bg-white/[0.03] transition-colors cursor-pointer group items-start"
                      >
                        <div className="col-span-9 sm:col-span-10 pr-4">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-zinc-200 transition-colors">
                            {cat.name}
                          </h3>
                          <div className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                            {cat.description}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                            {cat.subcategories.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCategory(cat.name);
                                  setActiveSubcategory(sub);
                                }}
                                className="text-xs text-zinc-400 hover:text-white hover:underline transition-colors cursor-pointer"
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-3 sm:col-span-2 text-right pt-0.5">
                          <span className="text-sm font-semibold text-zinc-400 tabular-nums">
                            {topicCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === "users" && isUserZero ? (
              /* Users Panel (Password Locked for @0) */
              !isUsersUnlocked ? (
                <div className="max-w-md mx-auto py-12 px-6 sm:px-8 rounded-3xl bg-[#141414] border border-white/[0.08] shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-5 shadow-inner">
                    <Lock className="h-8 w-8 text-zinc-300" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Users Panel Locked</h2>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    This panel is strictly restricted to @0. Enter the password to access the platform user database.
                  </p>
                  <form onSubmit={handleUnlockUsers} className="w-full space-y-4">
                    <div>
                      <input
                        type="password"
                        autoFocus
                        value={usersPasswordInput}
                        onChange={(e) => {
                          setUsersPasswordInput(e.target.value);
                          setUsersPasswordError("");
                        }}
                        placeholder="Enter password..."
                        className="w-full rounded-xl bg-black border border-white/[0.1] px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/30 transition-colors font-mono"
                      />
                      {usersPasswordError && (
                        <p className="text-xs text-red-400 mt-2 font-medium">
                          {usersPasswordError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-white text-black py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer shadow-lg"
                    >
                      Unlock Panel
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Controls Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141414] border border-white/[0.08] shadow-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white tracking-tight">Platform Users Registry</h2>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[11px] font-mono text-zinc-300">
                          {allPlatformUsers.filter((u) => {
                            if (!usersSearchQuery.trim()) return true;
                            const q = usersSearchQuery.toLowerCase();
                            return (
                              (u.name && u.name.toLowerCase().includes(q)) ||
                              (u.handle && u.handle.toLowerCase().includes(q)) ||
                              (u.id && u.id.toLowerCase().includes(q)) ||
                              (u.email && u.email.toLowerCase().includes(q))
                            );
                          }).length} users
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Centralized overview of all registered creator accounts across Entropy.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadAllPlatformUsers}
                        disabled={isLoadingUsers}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                        title="Refresh users"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUsersUnlocked(false);
                          setUsersPasswordInput("");
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                        title="Lock panel"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Lock</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                      placeholder="Search users by name, handle, email, or user ID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/[0.08] text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  {/* Users List */}
                  {isLoadingUsers ? (
                    <div className="py-20 flex justify-center items-center">
                      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    </div>
                  ) : (
                    (() => {
                      const filtered = allPlatformUsers.filter((u) => {
                        if (!usersSearchQuery.trim()) return true;
                        const q = usersSearchQuery.toLowerCase();
                        return (
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.handle && u.handle.toLowerCase().includes(q)) ||
                          (u.id && u.id.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-16 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8">
                            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">No users found</h3>
                            <p className="text-xs text-zinc-500">No registered accounts match your filter.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-xl divide-y divide-white/[0.06]">
                          {filtered.map((u) => {
                            const isSelf = u.handle?.toLowerCase() === "0";
                            return (
                              <div
                                key={u.id || u.handle}
                                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="relative h-12 w-12 rounded-full border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                                    <img
                                      src={u.avatarUrl || u.avatar || "/default-avatar.png"}
                                      alt={u.name}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-white">{u.name}</span>
                                      {isSelf && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                                          Admin / You
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                      <span className="font-mono text-zinc-300">@{u.handle}</span>
                                      <span className="text-zinc-600">•</span>
                                      <span className="font-mono text-[11px] text-zinc-500">{u.id}</span>
                                      {u.email && (
                                        <>
                                          <span className="text-zinc-600">•</span>
                                          <span className="text-zinc-400">{u.email}</span>
                                        </>
                                      )}
                                      {u.joinedAt && (
                                        <>
                                          <span className="text-zinc-600">•</span>
                                          <span>{u.joinedAt}</span>
                                        </>
                                      )}
                                    </div>
                                    {u.bio && (
                                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-xl">
                                        {u.bio}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <Link
                                    href={`/profile/@${u.handle}`}
                                    target="_blank"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
                                  >
                                    <span>View Profile</span>
                                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              )
            ) : (
              /* Topic Feed View (Category focused, Latest, or Top) */
              <div className="space-y-6">
                {activeCategory && selectedCategoryObj && (
                  <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span>{selectedCategoryObj.name}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                          {selectedCategoryObj.description}
                        </p>
                      </div>

                      <span className="text-xs text-zinc-500 font-semibold tabular-nums self-start sm:self-auto">
                        {getCategoryPostCount(selectedCategoryObj)} topics
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setActiveSubcategory(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          !activeSubcategory
                            ? "bg-white/[0.08] text-white border border-white/20 shadow-sm"
                            : "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08]"
                        }`}
                      >
                        All
                      </button>
                      {selectedCategoryObj.subcategories.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setActiveSubcategory(sub)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            activeSubcategory === sub
                              ? "bg-white/[0.08] text-white border border-white/20 shadow-sm"
                              : "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08]"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {displayedPosts.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8 flex flex-col items-center shadow-xl">
                    <Sparkles className="h-10 w-10 text-zinc-600 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">No topics posted yet</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mb-4">
                      {user
                        ? "Be the first to post an announcement, report an issue, or start a discussion on Entropy!"
                        : "Check back soon for community posts, announcements, and patch notes."}
                    </p>
                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCategory) {
                            handleCategoryChange(activeCategory);
                          }
                          setShowComposer(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Topic</span>
                      </button>
                    )}
                  </div>
                ) : (
                  displayedPosts.map((post) => {
                    const isCommentsOpen = openCommentsPostId === post.id;
                    const totalPollVotes = post.pollOptions?.reduce((acc, o) => acc + o.votes, 0) || 0;

                    return (
                      <article
                        key={post.id}
                        id={post.id}
                        className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 sm:p-6 shadow-xl transition-all"
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                          </Link>

                          {user && (user.handle || "").toLowerCase() === (post.channelHandle || "").toLowerCase() && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="Delete topic"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-zinc-100 leading-relaxed whitespace-pre-line mb-4 font-normal">
                          {post.content}
                        </div>

                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 max-h-[520px] bg-[#0a0a0a]">
                            <img
                              src={post.imageUrl}
                              alt="Topic media"
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            />
                          </div>
                        )}

                        {post.pollOptions && post.pollOptions.length > 0 && (
                          <div className="space-y-2 mb-4 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-3">
                            <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                              <span>Poll</span>
                              <span>{totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}</span>
                            </div>
                            {post.pollOptions.map((opt) => {
                              const pct = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                              const isSelected = post.pollVotedId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={Boolean(post.pollVotedId)}
                                  onClick={() => handleVotePoll(post.id, opt.id)}
                                  className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all ${
                                    isSelected
                                      ? "border-white/40 bg-white/[0.08]"
                                      : "border-white/[0.08] bg-[#141414] hover:border-white/20"
                                  } ${!post.pollVotedId ? "cursor-pointer" : "cursor-default"}`}
                                >
                                  {post.pollVotedId && (
                                    <div
                                      className={`absolute inset-0 transition-all duration-500 ${
                                        isSelected ? "bg-white/[0.16]" : "bg-white/[0.05]"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  )}
                                  <div className="relative flex items-center justify-between text-xs font-medium">
                                    <span className="text-zinc-200">{opt.text}</span>
                                    {post.pollVotedId && (
                                      <span className="font-semibold text-zinc-300 ml-2">{pct}%</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              post.hasLiked
                                ? "text-white bg-white/[0.12]"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                            }`}
                            title="Like"
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${post.hasLiked ? "fill-white" : ""}`} />
                            <span>{post.likes > 0 ? post.likes : ""}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDislikePost(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              post.hasDisliked
                                ? "text-white bg-white/[0.12]"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                            }`}
                            title="Dislike"
                          >
                            <ThumbsDown className={`h-3.5 w-3.5 ${post.hasDisliked ? "fill-white" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSharePost(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-auto transition-colors cursor-pointer ${
                              isCommentsOpen
                                ? "text-white bg-white/[0.12]"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                            }`}
                            title="Replies"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{(post.comments || []).length}</span>
                          </button>
                        </div>

                        {/* Expandable replies */}
                        {isCommentsOpen && (
                          <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-200">
                            {user ? (
                              <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden">
                                  <img
                                    src={user.avatarUrl || "/default-avatar.png"}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                    }}
                                  />
                                </div>
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={commentInputs[post.id] || ""}
                                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(post.id);
                                      }
                                    }}
                                    placeholder="Write a reply..."
                                    className="flex-1 rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddComment(post.id)}
                                    disabled={!commentInputs[post.id]?.trim()}
                                    className="rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs text-zinc-500">
                                <button
                                  type="button"
                                  onClick={openAuthModal}
                                  className="text-white hover:underline font-semibold"
                                >
                                  Sign in
                                </button>{" "}
                                to reply to this topic.
                              </div>
                            )}

                            <div className="space-y-3">
                              {(post.comments || []).length === 0 ? (
                                <p className="text-xs text-zinc-500 text-center py-2">No replies yet. Be the first to reply!</p>
                              ) : (
                                post.comments?.map((comment) => (
                                  <div key={comment.id} className="flex gap-2.5 text-xs">
                                    <Link
                                      href={`/@${(comment.authorHandle || comment.authorName || "").replace(/^@/, "")}`}
                                      className="h-7 w-7 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                                      title={`View ${comment.authorName}'s profile`}
                                    >
                                      {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} alt={comment.authorName} className="h-full w-full object-cover" />
                                      ) : (
                                        <span>{(comment.authorName || "U").slice(0, 1).toUpperCase()}</span>
                                      )}
                                    </Link>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          href={`/@${(comment.authorHandle || comment.authorName || "").replace(/^@/, "")}`}
                                          className="font-semibold text-zinc-200 hover:text-white hover:underline transition-colors cursor-pointer"
                                        >
                                          {comment.authorName}
                                        </Link>
                                        <span className="text-[10px] text-zinc-500">
                                          {formatPostTime(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-zinc-300 mt-0.5 leading-relaxed">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
