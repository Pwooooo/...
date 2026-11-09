"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Trash2,
  Image as ImageIcon,
  BarChart2,
  CheckCircle2,
  X,
  Plus,
  Flame,
  Sparkles,
  TrendingUp,
  Pin,
  Bookmark,
  Send,
  CornerDownRight,
  Shield,
  Tag,
} from "lucide-react";
import { CommunityPost, CommunityComment, CommunityPollOption } from "@/types";
import { useAuth } from "@/context/AuthContext";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import Link from "next/link";

interface CommunityTabProps {
  channel: {
    id?: string;
    handle: string;
    displayName: string;
    avatarUrl?: string;
    subscribersCount?: number;
  };
  isOwnProfile: boolean;
}

const FLAIR_OPTIONS = [
  { label: "Announcement", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { label: "Update", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { label: "Patch Notes", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { label: "Behind the Scenes", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { label: "Discussion", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { label: "Sneak Peek", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
];

export default function CommunityTab({ channel, isOwnProfile }: CommunityTabProps) {
  const { user, openAuthModal } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [selectedFlair, setSelectedFlair] = useState("Announcement");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [activeFlairFilter, setActiveFlairFilter] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
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
      // Check both community and news storage to ensure all posts display
      const storedComm = localStorage.getItem("entropy_community_posts");
      const storedNews = localStorage.getItem("entropy_news_posts");
      let commList: any[] = storedComm ? JSON.parse(storedComm) : [];
      let newsList: any[] = storedNews ? JSON.parse(storedNews) : [];

      if (!Array.isArray(commList)) commList = [];
      if (!Array.isArray(newsList)) newsList = [];

      const targetHandle = cleanHandle.toLowerCase();

      // Normalize all posts
      const mergedMap = new Map<string, CommunityPost>();

      const addPost = (raw: any) => {
        const postHandle = (raw.channelHandle || "").replace(/^@/, "").toLowerCase();
        if (postHandle !== targetHandle) return;

        const p: CommunityPost = {
          id: raw.id || `post-${Date.now()}`,
          channelHandle: raw.channelHandle || cleanHandle,
          channelName: raw.channelName || displayName,
          channelAvatar: raw.channelAvatar || avatarUrl,
          content: raw.content || "",
          imageUrl: raw.imageUrl,
          pollOptions: raw.pollOptions,
          pollVotedId: raw.pollVotedId,
          publishedAt: raw.publishedAt || new Date().toISOString(),
          likes: typeof raw.likes === "number" ? raw.likes : 0,
          dislikes: typeof raw.dislikes === "number" ? raw.dislikes : 0,
          hasLiked: Boolean(raw.hasLiked),
          hasDisliked: Boolean(raw.hasDisliked),
          comments: Array.isArray(raw.comments) ? raw.comments : [],
        };
        // Preserve flair/tag and title if present
        (p as any).tag = raw.tag || raw.flair || "Update";
        (p as any).title = raw.title || "";
        (p as any).isPinned = Boolean(raw.isPinned);

        mergedMap.set(p.id, p);
      };

      commList.forEach(addPost);
      newsList.forEach(addPost);

      // Default mock posts if empty
      if (mergedMap.size === 0 && targetHandle === "entropy") {
        const seedPosts: CommunityPost[] = [
          {
            id: "entropy-post-welcome",
            channelHandle: "entropy",
            channelName: "Entropy",
            channelAvatar: "/entropy-icon.png",
            content: "Welcome to the official Entropy channel news & community hub! We are building the next generation open creator ecosystem. Share your feedback, discuss patch updates, and vote on upcoming releases right here.",
            publishedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
            likes: 1240,
            dislikes: 12,
            hasLiked: true,
            hasDisliked: false,
            comments: [
              {
                id: "seed-comm-1",
                authorHandle: "0",
                authorName: "0",
                authorAvatar: "/entropy-icon.png",
                content: "Awesome progress on the video streaming pipeline! Smooth 1080p and shorts playback.",
                createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
                likes: 89,
                isOp: false,
              },
            ],
            pollOptions: [
              { id: "opt-1", text: "New Video Filters & Studio Tools", votes: 312 },
              { id: "opt-2", text: "Live Streaming & Superchats", votes: 489 },
              { id: "opt-3", text: "Creator Monetization Badges", votes: 198 },
            ],
          },
        ];
        (seedPosts[0] as any).title = "Welcome to the official Entropy Creator Hub!";
        (seedPosts[0] as any).tag = "Announcement";
        (seedPosts[0] as any).isPinned = true;
        seedPosts.forEach((sp) => mergedMap.set(sp.id, sp));
      }

      setPosts(Array.from(mergedMap.values()));
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();

    const storedSaved = localStorage.getItem("entropy_saved_posts");
    if (storedSaved) {
      try {
        setSavedPostIds(JSON.parse(storedSaved));
      } catch {}
    }

    if (typeof window !== "undefined") {
      window.addEventListener("entropy_community_updated", loadPosts);
      window.addEventListener("entropy_news_updated", loadPosts);
      window.addEventListener("storage", loadPosts);
      return () => {
        window.removeEventListener("entropy_community_updated", loadPosts);
        window.removeEventListener("entropy_news_updated", loadPosts);
        window.removeEventListener("storage", loadPosts);
      };
    }
  }, [cleanHandle]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file (PNG, JPG, WebP)");
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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !postTitle.trim()) return;

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

    const newPost: any = {
      id: `cpost-${Date.now()}`,
      title: postTitle.trim() || undefined,
      channelHandle: cleanHandle,
      channelName: displayName,
      channelAvatar: avatarUrl,
      content: postText.trim(),
      imageUrl: attachedImage || undefined,
      pollOptions: pollData,
      publishedAt: new Date().toISOString(),
      likes: 1,
      dislikes: 0,
      hasLiked: true,
      hasDisliked: false,
      tag: selectedFlair,
      comments: [],
    };

    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts = stored ? JSON.parse(stored) : [];
      const updated = [newPost, ...allPosts];
      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));

      // Also mirror to news posts
      const storedNews = localStorage.getItem("entropy_news_posts");
      const allNews = storedNews ? JSON.parse(storedNews) : [];
      localStorage.setItem("entropy_news_posts", JSON.stringify([newPost, ...allNews]));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
        window.dispatchEvent(new Event("entropy_news_updated"));
      }

      setPostTitle("");
      setPostText("");
      setAttachedImage(null);
      setShowPollCreator(false);
      setPollOptions(["", ""]);
      setIsComposerOpen(false);
      showToast("Post published to creator news!");
    } catch {
      showToast("Failed to publish post");
    }
  };

  const handleUpvote = (postId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const wasUpvoted = Boolean(post.hasLiked);
        const wasDownvoted = Boolean(post.hasDisliked);

        return {
          ...post,
          hasLiked: !wasUpvoted,
          hasDisliked: false,
          likes: wasUpvoted ? Math.max(0, post.likes - 1) : post.likes + 1,
          dislikes: wasDownvoted ? Math.max(0, (post.dislikes || 1) - 1) : post.dislikes || 0,
        };
      })
    );

    // Save to localStorage
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.map((p) => {
          if (p.id !== postId) return p;
          const wasUpvoted = Boolean(p.hasLiked);
          const wasDownvoted = Boolean(p.hasDisliked);
          return {
            ...p,
            hasLiked: !wasUpvoted,
            hasDisliked: false,
            likes: wasUpvoted ? Math.max(0, p.likes - 1) : p.likes + 1,
            dislikes: wasDownvoted ? Math.max(0, (p.dislikes || 1) - 1) : p.dislikes || 0,
          };
        });
        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      }
    } catch {}
  };

  const handleDownvote = (postId: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const wasDownvoted = Boolean(post.hasDisliked);
        const wasUpvoted = Boolean(post.hasLiked);

        return {
          ...post,
          hasDisliked: !wasDownvoted,
          hasLiked: false,
          dislikes: wasDownvoted ? Math.max(0, (post.dislikes || 1) - 1) : (post.dislikes || 0) + 1,
          likes: wasUpvoted ? Math.max(0, post.likes - 1) : post.likes,
        };
      })
    );

    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.map((p) => {
          if (p.id !== postId) return p;
          const wasDownvoted = Boolean(p.hasDisliked);
          const wasUpvoted = Boolean(p.hasLiked);
          return {
            ...p,
            hasDisliked: !wasDownvoted,
            hasLiked: false,
            dislikes: wasDownvoted ? Math.max(0, (p.dislikes || 1) - 1) : (p.dislikes || 0) + 1,
            likes: wasUpvoted ? Math.max(0, p.likes - 1) : p.likes,
          };
        });
        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      }
    } catch {}
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

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

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }
    } catch {}
  };

  const handleDeletePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.filter((p) => p.id !== postId);
        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      }
      const storedNews = localStorage.getItem("entropy_news_posts");
      if (storedNews) {
        const allNews = JSON.parse(storedNews);
        localStorage.setItem("entropy_news_posts", JSON.stringify(allNews.filter((p: any) => p.id !== postId)));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
        window.dispatchEvent(new Event("entropy_news_updated"));
      }
      showToast("Post deleted");
    } catch {}
  };

  const handleSharePost = (post: CommunityPost) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/@${post.channelHandle}?tab=News#${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      showToast("Reddit post link copied!");
    }
  };

  const handleToggleSave = (postId: string) => {
    const isSaved = savedPostIds.includes(postId);
    const updated = isSaved ? savedPostIds.filter((id) => id !== postId) : [...savedPostIds, postId];
    setSavedPostIds(updated);
    try {
      localStorage.setItem("entropy_saved_posts", JSON.stringify(updated));
      showToast(isSaved ? "Post unsaved" : "Saved to your Reddit bookmarks!");
    } catch {}
  };

  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    if (!user) {
      openAuthModal();
      return;
    }

    const isOp = (user.handle || "").toLowerCase() === cleanHandle.toLowerCase();

    const newComment: CommunityComment = {
      id: `comm-${Date.now()}`,
      authorHandle: user.handle,
      authorName: user.name || user.handle,
      authorAvatar: user.avatarUrl || user.avatar || "",
      content: text,
      createdAt: new Date().toISOString(),
      likes: 1,
      hasLiked: true,
      isOp,
    };

    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [newComment, ...(p.comments || [])],
          };
        }
        return p;
      });

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }

      setCommentInputs({ ...commentInputs, [postId]: "" });
      showToast("Comment posted!");
    } catch {}
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: (p.comments || []).filter((c) => c.id !== commentId),
            };
          }
          return p;
        });

        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("entropy_community_updated"));
        }
      }
    } catch {}
  };

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    if (dateStr.includes("ago") || dateStr.includes("Yesterday")) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Filter and Sort
  const filteredPosts = posts.filter((p) => {
    if (!activeFlairFilter) return true;
    const tag = (p as any).tag || (p as any).flair;
    return tag === activeFlairFilter;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const isPinnedA = Boolean((a as any).isPinned);
    const isPinnedB = Boolean((b as any).isPinned);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;

    const scoreA = (a.likes || 0) - (a.dislikes || 0);
    const scoreB = (b.likes || 0) - (b.dislikes || 0);
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();

    if (sortBy === "top") return scoreB - scoreA;
    if (sortBy === "new") return timeB - timeA;
    // hot: combination of score + recency
    return (scoreB * 2 + timeB / 10000000) - (scoreA * 2 + timeA / 10000000);
  });

  return (
    <div className="space-y-4 max-w-3xl">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reddit Subreddit Header Banner for this Channel */}
      <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-[#1c1c20] border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-base text-white shadow-inner">
            <img
              src={avatarUrl || "/default-avatar.png"}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">u/{cleanHandle}</span>
              <VerifiedBadge subscribersCount={channel.subscribersCount} />
              <span className="text-[11px] font-mono text-zinc-500">feed</span>
            </div>
            <p className="text-xs text-zinc-400">
              Official news, community discussion, dev updates & polls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/news"
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            Explore r/all
          </Link>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsComposerOpen(!isComposerOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Reddit Quick Post Composer (Click to expand or always accessible for creator) */}
      {isOwnProfile && (
        <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-3 sm:p-4 shadow-xl transition-all">
          {!isComposerOpen ? (
            <div
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-full bg-[#1c1c20] border border-white/10 overflow-hidden flex-shrink-0">
                <img src={avatarUrl || "/default-avatar.png"} alt={displayName} className="h-full w-full object-cover" />
              </div>
              <input
                type="text"
                readOnly
                placeholder={`Create a post in u/${cleanHandle}...`}
                className="flex-1 bg-[#1a1a1e] group-hover:bg-[#202024] border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-zinc-300 placeholder-zinc-500 outline-none transition-colors cursor-pointer"
              />
              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposerOpen(true);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
                  title="Attach image"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsComposerOpen(true);
                    setShowPollCreator(true);
                  }}
                  className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
                  title="Create poll"
                >
                  <BarChart2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreatePost} className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Create a Post</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-xs font-mono text-[#FF4500]">u/{cleanHandle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title (optional, e.g. 'Upcoming Feature Preview & Roadmap')"
                className="w-full rounded-xl bg-[#0e0e10] border border-white/[0.08] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
              />

              {/* Content Textarea */}
              <textarea
                rows={3}
                required
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's new? Share announcements, release notes, or questions with your community..."
                className="w-full rounded-xl bg-[#0e0e10] border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
              />

              {/* Flair Tag Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-zinc-500" />
                  <span>Select Flair:</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {FLAIR_OPTIONS.map((flair) => (
                    <button
                      key={flair.label}
                      type="button"
                      onClick={() => setSelectedFlair(flair.label)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        selectedFlair === flair.label
                          ? "bg-white text-black border-white shadow-sm font-bold scale-105"
                          : `${flair.color} hover:opacity-80`
                      }`}
                    >
                      {flair.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attached Image Preview */}
              {attachedImage && (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-72 group bg-[#0a0a0a]">
                  <img src={attachedImage} alt="Post attachment" className="w-full h-full object-cover" />
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

              {/* Poll Creator */}
              {showPollCreator && (
                <div className="rounded-xl bg-[#0e0e10] border border-white/[0.08] p-3 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Poll Options</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPollCreator(false)}
                      className="text-zinc-500 hover:text-white p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 rounded-xl bg-[#141416] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 py-1 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
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
                    className="flex items-center gap-1.5 rounded-xl bg-[#1c1c20] hover:bg-[#28282e] text-zinc-300 hover:text-white border border-white/[0.08] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPollCreator(!showPollCreator)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                      showPollCreator
                        ? "bg-white text-black font-semibold border-white"
                        : "bg-[#1c1c20] text-zinc-300 hover:text-white hover:bg-[#28282e] border-white/[0.08]"
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>Poll</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!postText.trim() && !postTitle.trim()}
                    className="rounded-xl bg-[#FF4500] hover:bg-[#e03d00] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reddit Sort Bar */}
      <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-1.5 sm:p-2 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSortBy("hot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortBy === "hot"
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${sortBy === "hot" ? "text-[#FF4500]" : ""}`} />
            <span>Hot</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy("new")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortBy === "new"
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${sortBy === "new" ? "text-cyan-400" : ""}`} />
            <span>New</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy("top")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortBy === "top"
                ? "bg-white/[0.12] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <TrendingUp className={`h-3.5 w-3.5 ${sortBy === "top" ? "text-emerald-400" : ""}`} />
            <span>Top</span>
          </button>
        </div>

        {/* Flair Filter Dropdown or Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {activeFlairFilter && (
            <button
              type="button"
              onClick={() => setActiveFlairFilter(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <span>{activeFlairFilter}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Reddit Feed List */}
      <div className="space-y-3">
        {sortedPosts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#141416] border border-white/[0.08] p-8 flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-[#1a1a1e] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <Sparkles className="h-6 w-6 text-zinc-300" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No posts in this channel feed yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              {isOwnProfile
                ? "Post your first announcement, sneak peek, or community poll above!"
                : `Subscribe to u/${cleanHandle} to catch all upcoming creator updates.`}
            </p>
          </div>
        ) : (
          sortedPosts.map((post) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const score = (post.likes || 0) - (post.dislikes || 0);
            const totalPollVotes = post.pollOptions?.reduce((acc, o) => acc + o.votes, 0) || 0;
            const postFlair = (post as any).tag || (post as any).flair;
            const postTitleText = (post as any).title;
            const isPinned = Boolean((post as any).isPinned);
            const isSaved = savedPostIds.includes(post.id);

            return (
              <article
                key={post.id}
                id={post.id}
                className="rounded-2xl bg-[#141416] border border-white/[0.08] hover:border-white/20 transition-all shadow-lg overflow-hidden flex flex-row"
              >
                {/* Reddit Vertical Vote Pillar */}
                <div className="w-11 sm:w-12 bg-[#101012] flex-shrink-0 flex flex-col items-center py-3 select-none border-r border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => handleUpvote(post.id)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      post.hasLiked
                        ? "text-[#FF4500] bg-[#FF4500]/15"
                        : "text-zinc-500 hover:text-[#FF4500] hover:bg-white/[0.06]"
                    }`}
                    title="Upvote"
                  >
                    <ArrowBigUp className={`h-6 w-6 ${post.hasLiked ? "fill-[#FF4500]" : ""}`} strokeWidth={1.8} />
                  </button>

                  <span
                    className={`text-xs font-bold my-1 tracking-tight ${
                      post.hasLiked
                        ? "text-[#FF4500]"
                        : post.hasDisliked
                        ? "text-[#7193FF]"
                        : "text-zinc-300"
                    }`}
                  >
                    {score}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownvote(post.id)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${
                      post.hasDisliked
                        ? "text-[#7193FF] bg-[#7193FF]/15"
                        : "text-zinc-500 hover:text-[#7193FF] hover:bg-white/[0.06]"
                    }`}
                    title="Downvote"
                  >
                    <ArrowBigDown className={`h-6 w-6 ${post.hasDisliked ? "fill-[#7193FF]" : ""}`} strokeWidth={1.8} />
                  </button>
                </div>

                {/* Main Reddit Post Content */}
                <div className="flex-1 p-3.5 sm:p-4 min-w-0">
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Link
                        href={`/@${cleanHandle}`}
                        className="flex items-center gap-1.5 font-bold text-white hover:underline truncate"
                      >
                        <span className="text-[#FF4500] font-mono">u/{cleanHandle}</span>
                      </Link>

                      <VerifiedBadge subscribersCount={channel.subscribersCount} />

                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500 text-[11px] whitespace-nowrap">
                        Posted {formatPostTime(post.publishedAt)}
                      </span>

                      {isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <Pin className="h-2.5 w-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}

                      {postFlair && (
                        <button
                          type="button"
                          onClick={() => setActiveFlairFilter(postFlair)}
                          className="px-2 py-0.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 text-[10px] font-semibold border border-white/10 transition-colors"
                        >
                          {postFlair}
                        </button>
                      )}
                    </div>

                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Post Title */}
                  {postTitleText && (
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug">
                      {postTitleText}
                    </h3>
                  )}

                  {/* Post Content Body */}
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line mb-3 font-normal">
                    {post.content}
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-3 max-h-[500px] bg-[#0a0a0a]">
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      />
                    </div>
                  )}

                  {/* Post Poll */}
                  {post.pollOptions && post.pollOptions.length > 0 && (
                    <div className="space-y-2 mb-3 bg-[#0e0e10] border border-white/[0.06] rounded-xl p-3">
                      {post.pollOptions.map((opt) => {
                        const percent = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                        const hasVotedThis = post.pollVotedId === opt.id;
                        const hasVotedAny = Boolean(post.pollVotedId);

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={hasVotedAny}
                            onClick={() => handleVotePoll(post.id, opt.id)}
                            className={`relative w-full overflow-hidden rounded-lg p-2 text-xs font-semibold text-left transition-all flex items-center justify-between border ${
                              hasVotedThis
                                ? "border-[#FF4500]/50 text-white"
                                : "border-white/[0.08] text-zinc-300 hover:border-white/20"
                            } ${!hasVotedAny ? "cursor-pointer" : "cursor-default"}`}
                          >
                            {hasVotedAny && (
                              <div
                                className={`absolute inset-0 transition-all duration-500 ${
                                  hasVotedThis ? "bg-[#FF4500]/25" : "bg-white/[0.06]"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            )}

                            <span className="relative z-10 flex items-center gap-2">
                              {hasVotedThis && <CheckCircle2 className="h-3.5 w-3.5 text-[#FF4500]" />}
                              <span>{opt.text}</span>
                            </span>

                            {hasVotedAny && (
                              <span className="relative z-10 font-bold text-zinc-300 ml-2">
                                {percent}%
                              </span>
                            )}
                          </button>
                        );
                      })}

                      <p className="text-[11px] text-zinc-500 pt-1">
                        {totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  )}

                  {/* Reddit Action Bar */}
                  <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        isCommentsOpen
                          ? "bg-white/[0.12] text-white"
                          : "hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{(post.comments || []).length} Comments</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSave(post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        isSaved ? "text-[#FF4500]" : "hover:bg-white/[0.06] hover:text-white"
                      }`}
                      title={isSaved ? "Saved" : "Save post"}
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved ? "fill-[#FF4500]" : ""}`} />
                      <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                    </button>
                  </div>

                  {/* Reddit Threaded Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-150">
                      {/* Comment Input */}
                      <div className="flex gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#1c1c20] overflow-hidden flex-shrink-0">
                          <img
                            src={user?.avatarUrl || "/default-avatar.png"}
                            alt={user?.name || "User"}
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
                            onChange={(e) =>
                              setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            placeholder={user ? `Comment as u/${user.handle}...` : "Sign in to comment..."}
                            className="flex-1 rounded-xl bg-[#0e0e10] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!(commentInputs[post.id] || "").trim()}
                            className="rounded-xl bg-[#FF4500] hover:bg-[#e03d00] disabled:opacity-40 text-white px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                          >
                            Comment
                          </button>
                        </div>
                      </div>

                      {/* Comments Tree */}
                      {(post.comments || []).length > 0 && (
                        <div className="space-y-3 pt-2 pl-2 border-l-2 border-white/10 ml-3">
                          {post.comments.map((comm) => (
                            <div key={comm.id} className="space-y-1 group">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    href={`/@${(comm.authorHandle || "").replace(/^@/, "")}`}
                                    className="font-bold text-white hover:underline flex items-center gap-1"
                                  >
                                    <span>u/{comm.authorHandle}</span>
                                    {comm.isOp && (
                                      <span className="px-1.5 py-0.2 rounded bg-[#FF4500] text-[9px] font-bold text-white">
                                        OP
                                      </span>
                                    )}
                                  </Link>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-500">{formatPostTime(comm.createdAt)}</span>
                                </div>

                                {user && (user.handle || "").toLowerCase() === (comm.authorHandle || "").toLowerCase() && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post.id, comm.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              <p className="text-xs text-zinc-200 leading-relaxed pl-1">{comm.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
