"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Pin,
  Trash2,
  Flame,
  Sparkles,
  TrendingUp,
  Rocket,
  Plus,
  Search,
  Image as ImageIcon,
  BarChart2,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Users,
  CheckCircle2,
  Tag,
  Filter,
  SlidersHorizontal,
  Layers,
  Send,
  CornerDownRight,
  Globe,
  Info,
} from "lucide-react";
import { NewsPost, CommunityComment, CommunityPollOption } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getRegisteredUsers, UserRecord } from "@/lib/user-validation";
import { formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

export interface SubredditInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  bannerColor: string;
  membersCount: number;
  onlineCount: number;
  flairs: string[];
  rules: string[];
}

export const SUBREDDITS: SubredditInfo[] = [
  {
    id: "all",
    name: "r/all",
    displayName: "All Communities",
    description: "The front page of Entropy. Explore the top trending discussions, guides, announcements, and polls from across the entire platform.",
    icon: "🌐",
    bannerColor: "from-orange-500/20 via-rose-500/10 to-transparent",
    membersCount: 105000,
    onlineCount: 2430,
    flairs: ["Official", "Guide", "Discussion", "Showcase", "Feature Request", "Bug"],
    rules: [
      "Be respectful to all members and creators",
      "No spam, harassment, or self-promotion without context",
      "Keep posts relevant to the Entropy platform and video creation",
      "Flair your posts appropriately",
    ],
  },
  {
    id: "announcements",
    name: "r/announcements",
    displayName: "Platform Announcements",
    description: "Official releases, patch notes, video player upgrades, and ecosystem updates straight from the Entropy team.",
    icon: "📢",
    bannerColor: "from-orange-600/25 via-amber-600/10 to-transparent",
    membersCount: 105000,
    onlineCount: 1840,
    flairs: ["Official", "Release", "Patch Notes", "Event"],
    rules: [
      "Official posts and discussions on updates only",
      "Keep comments constructive and focused on releases",
      "Report urgent issues directly to r/bugreports",
    ],
  },
  {
    id: "creators",
    name: "r/creators",
    displayName: "Creator Hub",
    description: "Connect with fellow creators, share video editing setups, trade production tips, and collaborate on new content.",
    icon: "🎬",
    bannerColor: "from-emerald-500/20 via-teal-500/10 to-transparent",
    membersCount: 42300,
    onlineCount: 890,
    flairs: ["Guide", "Collaboration", "Showcase", "Question", "Tip"],
    rules: [
      "Constructive feedback only when reviewing channels",
      "No sub4sub or spam links",
      "Share genuine production and growth insights",
    ],
  },
  {
    id: "videos",
    name: "r/videos",
    displayName: "Video Discussions",
    description: "Discuss uploaded videos, gameplay highlights, shorts, animations, and community video banter.",
    icon: "🍿",
    bannerColor: "from-blue-500/20 via-indigo-500/10 to-transparent",
    membersCount: 68100,
    onlineCount: 1220,
    flairs: ["Discussion", "Highlight", "Shorts", "Feedback"],
    rules: [
      "Keep discussions respectful and safe for work",
      "No copyright-violating content",
      "Provide context when sharing video highlights",
    ],
  },
  {
    id: "feedback",
    name: "r/feedback",
    displayName: "Feature Requests & Ideas",
    description: "Suggest new player controls, Creator Studio features, and website improvements. Vote on upcoming roadmaps.",
    icon: "💡",
    bannerColor: "from-amber-500/20 via-yellow-500/10 to-transparent",
    membersCount: 31400,
    onlineCount: 450,
    flairs: ["Feature Request", "UI/UX", "Idea", "In Review", "Implemented"],
    rules: [
      "Search before posting duplicate feature suggestions",
      "Be specific about what problem your idea solves",
      "Be civil in roadmap debates",
    ],
  },
  {
    id: "bugreports",
    name: "r/bugreports",
    displayName: "Bug Reports",
    description: "Found an issue with video playback, upload processing, Creator Studio, or browser glitches? Report it here.",
    icon: "🐛",
    bannerColor: "from-rose-500/20 via-red-500/10 to-transparent",
    membersCount: 18900,
    onlineCount: 310,
    flairs: ["Bug", "Investigating", "Fixed", "Playback", "Upload"],
    rules: [
      "Include browser, device, and reproduction steps",
      "Avoid duplicate bug reports when possible",
      "Respect moderators testing and verifying patches",
    ],
  },
];

const INITIAL_SEED_POSTS: NewsPost[] = [
  {
    id: "post-seed-announcement-1",
    title: "Entropy v2.4 Launch: Native Video Streaming Engine, Fluid Sidebar & Community Hub!",
    subreddit: "r/announcements",
    flair: "Official",
    channelHandle: "entropy",
    channelName: "Entropy",
    channelAvatar: "/entropy-icon.png",
    content: `We've officially rolled out our new desktop-grade responsive experience! Here is what's fresh in this release:

🚀 Performance & Media:
• Full H.264 smooth streaming with HTTP 206 byte-range partial content support for both horizontal videos and vertical shorts.
• High-definition responsive thumbnails and zero-delay playback resumption.
• Verified Creator Badges: Channels with 100k+ subscribers now sport the official checkmark badge.

💬 Reddit-Style Community:
• Upvote & downvote score system with live feedback.
• Community flairs, threaded replies, and interactive polls.
• Category subreddits for focused discussions, bug tracking, and creator collabs.

Let us know what you think in the comments below!`,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    likes: 428,
    dislikes: 6,
    tag: "Announcements",
    isPinned: true,
    comments: [
      {
        id: "c-seed-1",
        authorHandle: "0",
        authorName: "0",
        authorAvatar: "/entropy-icon.png",
        content: "Huge milestone for the platform. Drop your feature requests and bugs in r/feedback and r/bugreports!",
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        likes: 84,
        isOp: false,
      },
      {
        id: "c-seed-2",
        authorHandle: "entropy",
        authorName: "Entropy",
        authorAvatar: "/entropy-icon.png",
        content: "Video uploads are actively monitored. Feel free to test both landscape and vertical shorts!",
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        likes: 42,
        isOp: true,
      },
    ],
  },
  {
    id: "post-seed-creator-1",
    title: "Creator Guide: Recommended Export Settings for Shorts and Longform Videos",
    subreddit: "r/creators",
    flair: "Guide",
    channelHandle: "0",
    channelName: "0",
    channelAvatar: "/entropy-icon.png",
    content: `Hey creators! For the smoothest possible playback across all browsers (Chrome, Edge, Safari, Firefox):

📹 Shorts (Vertical):
• Resolution: 1080x1920 (9:16 aspect ratio)
• Length: Up to 60 seconds
• Codec: H.264 High Profile / AAC Audio

🎥 Longform (Horizontal):
• Resolution: 1920x1080 or 4K (16:9 aspect ratio)
• Codec: H.264 / AAC 48kHz

Drop any encoding or DaVinci / Premiere export questions below!`,
    publishedAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    likes: 215,
    dislikes: 3,
    tag: "Creator Showcase",
    comments: [],
  },
  {
    id: "post-seed-poll-1",
    title: "Community Poll: What feature should we prioritize next on Entropy?",
    subreddit: "r/feedback",
    flair: "Feature Request",
    channelHandle: "entropy",
    channelName: "Entropy",
    channelAvatar: "/entropy-icon.png",
    content: "We're planning out the next roadmap sprint. Cast your vote below to help shape what we build next!",
    pollOptions: [
      { id: "opt-1", text: "Custom Playlists & Video Queuing", votes: 142 },
      { id: "opt-2", text: "Live Streaming & Real-Time Chat", votes: 218 },
      { id: "opt-3", text: "Creator Studio Analytics Dashboard V2", votes: 97 },
      { id: "opt-4", text: "Dark/OLED Custom Theme Packs", votes: 64 },
    ],
    publishedAt: new Date(Date.now() - 3600 * 1000 * 22).toISOString(),
    likes: 356,
    dislikes: 4,
    tag: "Feature Requests",
    comments: [],
  },
];

export default function RedditNewsPage() {
  const { user, openAuthModal } = useAuth();
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);

  // Subreddit & Filter state
  const [activeSubredditId, setActiveSubredditId] = useState<string>("all");
  const [activeFlair, setActiveFlair] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top" | "rising">("hot");
  const [viewMode, setViewMode] = useState<"card" | "compact">("card");

  // Admin / @0 check
  const [localIsZero, setLocalIsZero] = useState(false);
  const [isUsersUnlocked, setIsUsersUnlocked] = useState(false);
  const [usersPasswordInput, setUsersPasswordInput] = useState("");
  const [usersPasswordError, setUsersPasswordError] = useState("");
  const [allPlatformUsers, setAllPlatformUsers] = useState<UserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [showAdminTab, setShowAdminTab] = useState(false);

  useEffect(() => {
    const checkUserZero = () => {
      try {
        const check = (u: any) => {
          if (!u) return false;
          const h = String(u.handle || "").replace(/^@/, "").trim().toLowerCase();
          const n = String(u.name || "").trim().toLowerCase();
          const dn = String(u.displayName || "").trim().toLowerCase();
          const id = String(u.id || "").trim().toLowerCase();
          const em = String(u.email || "").trim().toLowerCase();
          return h === "0" || n === "0" || dn === "0" || id === "u-1792083556851" || em.startsWith("0@");
        };

        if (check(user)) {
          setLocalIsZero(true);
          return;
        }

        const raw = localStorage.getItem("entropy_user");
        if (raw && check(JSON.parse(raw))) {
          setLocalIsZero(true);
          return;
        }
        setLocalIsZero(false);
      } catch {
        setLocalIsZero(false);
      }
    };

    checkUserZero();
    window.addEventListener("entropy_user_updated", checkUserZero);
    window.addEventListener("storage", checkUserZero);
    return () => {
      window.removeEventListener("entropy_user_updated", checkUserZero);
      window.removeEventListener("storage", checkUserZero);
    };
  }, [user]);

  // Load URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const subParam = sp.get("sub") || sp.get("r");
      if (subParam) {
        const match = SUBREDDITS.find((s) => s.id === subParam.toLowerCase() || s.name.toLowerCase() === subParam.toLowerCase());
        if (match) setActiveSubredditId(match.id);
      }
      const tabParam = sp.get("tab");
      if (tabParam === "users" && localIsZero) {
        setShowAdminTab(true);
      }
    }
  }, [localIsZero]);

  // Composer modal state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerSubreddit, setComposerSubreddit] = useState("r/announcements");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerFlair, setComposerFlair] = useState("");
  const [composerTab, setComposerTab] = useState<"text" | "image" | "poll">("text");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [composerPin, setComposerPin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments & Saved Map
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [nestedReplyInput, setNestedReplyInput] = useState("");
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load and sync posts
  const loadPosts = () => {
    try {
      const stored = localStorage.getItem("entropy_news_posts");
      let loaded: NewsPost[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed;
        }
      }

      if (loaded.length === 0) {
        loaded = INITIAL_SEED_POSTS;
        localStorage.setItem("entropy_news_posts", JSON.stringify(loaded));
      } else {
        // Ensure initial seed posts exist if user hasn't seen them
        const idSet = new Set(loaded.map((p) => p.id));
        const missingSeeds = INITIAL_SEED_POSTS.filter((s) => !idSet.has(s.id));
        if (missingSeeds.length > 0) {
          loaded = [...missingSeeds, ...loaded];
          localStorage.setItem("entropy_news_posts", JSON.stringify(loaded));
        }
      }

      // Check saved posts
      const savedRaw = localStorage.getItem("entropy_saved_news_posts");
      if (savedRaw) {
        try {
          setSavedPosts(JSON.parse(savedRaw));
        } catch {}
      }

      setPosts(loaded);
    } catch {
      setPosts(INITIAL_SEED_POSTS);
    }
  };

  useEffect(() => {
    loadPosts();
    window.addEventListener("entropy_news_updated", loadPosts);
    window.addEventListener("storage", loadPosts);
    return () => {
      window.removeEventListener("entropy_news_updated", loadPosts);
      window.removeEventListener("storage", loadPosts);
    };
  }, []);

  const currentSubreddit = useMemo(() => {
    return SUBREDDITS.find((s) => s.id === activeSubredditId) || SUBREDDITS[0];
  }, [activeSubredditId]);

  // Image upload compression
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

  // Poll option controls
  const handleAddPollOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, ""]);
  };
  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };
  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  // Create post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTitle.trim()) {
      showToast("Please provide a title for your post");
      return;
    }
    if (!user) {
      openAuthModal();
      return;
    }

    let pollData: CommunityPollOption[] | undefined = undefined;
    if (composerTab === "poll") {
      const valid = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (valid.length >= 2) {
        pollData = valid.map((opt, idx) => ({
          id: `opt-${idx}-${Date.now()}`,
          text: opt,
          votes: 0,
        }));
      }
    }

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      title: composerTitle.trim(),
      subreddit: composerSubreddit,
      flair: composerFlair || undefined,
      channelHandle: user.handle,
      channelName: user.name || user.handle,
      channelAvatar: user.avatarUrl || user.avatar || "/default-avatar.png",
      content: composerBody.trim() || composerTitle.trim(),
      imageUrl: composerTab === "image" && attachedImage ? attachedImage : undefined,
      pollOptions: pollData,
      publishedAt: new Date().toISOString(),
      likes: 1, // Author automatic upvote
      dislikes: 0,
      hasLiked: true,
      hasDisliked: false,
      tag: composerSubreddit.replace(/^r\//, ""),
      isPinned: composerPin,
      comments: [],
    };

    try {
      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));

      setComposerTitle("");
      setComposerBody("");
      setAttachedImage(null);
      setComposerFlair("");
      setPollOptions(["", ""]);
      setComposerPin(false);
      setIsComposerOpen(false);
      showToast(`Posted to ${composerSubreddit}!`);
    } catch {
      showToast("Failed to create post. Please try again.");
    }
  };

  // Upvote & Downvote handler
  const handleVote = (postId: string, direction: "up" | "down") => {
    if (!user) {
      openAuthModal();
      return;
    }

    const updated = posts.map((p) => {
      if (p.id !== postId) return p;

      let likes = p.likes || 0;
      let dislikes = p.dislikes || 0;
      let hasLiked = Boolean(p.hasLiked);
      let hasDisliked = Boolean(p.hasDisliked);

      if (direction === "up") {
        if (hasLiked) {
          likes = Math.max(0, likes - 1);
          hasLiked = false;
        } else {
          likes += 1;
          hasLiked = true;
          if (hasDisliked) {
            dislikes = Math.max(0, dislikes - 1);
            hasDisliked = false;
          }
        }
      } else {
        if (hasDisliked) {
          dislikes = Math.max(0, dislikes - 1);
          hasDisliked = false;
        } else {
          dislikes += 1;
          hasDisliked = true;
          if (hasLiked) {
            likes = Math.max(0, likes - 1);
            hasLiked = false;
          }
        }
      }

      return { ...p, likes, dislikes, hasLiked, hasDisliked };
    });

    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));
    } catch {}
  };

  // Save / Bookmark post
  const handleToggleSave = (postId: string) => {
    const nextVal = !savedPosts[postId];
    const updated = { ...savedPosts, [postId]: nextVal };
    setSavedPosts(updated);
    try {
      localStorage.setItem("entropy_saved_news_posts", JSON.stringify(updated));
    } catch {}
    showToast(nextVal ? "Post saved to your bookmarks" : "Post removed from saved");
  };

  // Share post
  const handleShare = (post: NewsPost) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/news?post=${post.id}`;
      navigator.clipboard?.writeText(url);
      showToast("Reddit post link copied to clipboard!");
    }
  };

  // Delete post
  const handleDeletePost = (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));
    } catch {}
    showToast("Post deleted");
  };

  // Pin post (admin / author)
  const handleTogglePin = (postId: string) => {
    const updated = posts.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));
    } catch {}
    showToast("Post pin status updated");
  };

  // Vote on poll
  const handleVotePoll = (postId: string, optionId: string) => {
    const updated = posts.map((p) => {
      if (p.id !== postId || !p.pollOptions || p.pollVotedId) return p;
      const options = p.pollOptions.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt));
      return { ...p, pollOptions: options, pollVotedId: optionId };
    });

    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));
    } catch {}
  };

  // Add Comment
  const handleAddComment = (postId: string, parentCommentId?: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const text = parentCommentId ? nestedReplyInput.trim() : (replyInputs[postId] || "").trim();
    if (!text) return;

    const newComment: CommunityComment = {
      id: `c-${Date.now()}`,
      authorHandle: user.handle,
      authorName: user.name || user.handle,
      authorAvatar: user.avatarUrl || user.avatar || "/default-avatar.png",
      content: text,
      createdAt: new Date().toISOString(),
      likes: 1,
      hasLiked: true,
      parentId: parentCommentId,
    };

    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const currentComments = p.comments || [];
      return { ...p, comments: [...currentComments, newComment] };
    });

    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
      window.dispatchEvent(new Event("entropy_news_updated"));
    } catch {}

    if (parentCommentId) {
      setNestedReplyInput("");
      setReplyingToCommentId(null);
    } else {
      setReplyInputs({ ...replyInputs, [postId]: "" });
    }
    showToast("Comment posted!");
  };

  // Vote on Comment
  const handleCommentVote = (postId: string, commentId: string, direction: "up" | "down") => {
    if (!user) {
      openAuthModal();
      return;
    }

    const updated = posts.map((p) => {
      if (p.id !== postId || !p.comments) return p;
      const updatedComments = p.comments.map((c) => {
        if (c.id !== commentId) return c;
        let likes = c.likes || 0;
        let dislikes = c.dislikes || 0;
        let hasLiked = Boolean(c.hasLiked);
        let hasDisliked = Boolean(c.hasDisliked);

        if (direction === "up") {
          if (hasLiked) {
            likes = Math.max(0, likes - 1);
            hasLiked = false;
          } else {
            likes += 1;
            hasLiked = true;
            if (hasDisliked) {
              dislikes = Math.max(0, dislikes - 1);
              hasDisliked = false;
            }
          }
        } else {
          if (hasDisliked) {
            dislikes = Math.max(0, dislikes - 1);
            hasDisliked = false;
          } else {
            dislikes += 1;
            hasDisliked = true;
            if (hasLiked) {
              likes = Math.max(0, likes - 1);
              hasLiked = false;
            }
          }
        }

        return { ...c, likes, dislikes, hasLiked, hasDisliked };
      });
      return { ...p, comments: updatedComments };
    });

    setPosts(updated);
    try {
      localStorage.setItem("entropy_news_posts", JSON.stringify(updated));
    } catch {}
  };

  // Admin users panel loader
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

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by Subreddit
    if (activeSubredditId !== "all") {
      const targetSub = SUBREDDITS.find((s) => s.id === activeSubredditId);
      if (targetSub) {
        result = result.filter((p) => {
          const sub = (p.subreddit || `r/${p.tag || ""}`).toLowerCase();
          return sub === targetSub.name.toLowerCase() || sub.includes(targetSub.id);
        });
      }
    }

    // Filter by Flair
    if (activeFlair) {
      result = result.filter((p) => p.flair === activeFlair);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        return (
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q) ||
          (p.channelName && p.channelName.toLowerCase().includes(q)) ||
          p.channelHandle.toLowerCase().includes(q) ||
          (p.flair && p.flair.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      // Pinned posts stay at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const scoreA = (a.likes || 0) - (a.dislikes || 0);
      const scoreB = (b.likes || 0) - (b.dislikes || 0);
      const timeA = new Date(a.publishedAt).getTime() || 0;
      const timeB = new Date(b.publishedAt).getTime() || 0;
      const hoursA = Math.max(0.1, (Date.now() - timeA) / (1000 * 3600));
      const hoursB = Math.max(0.1, (Date.now() - timeB) / (1000 * 3600));

      if (sortBy === "new") {
        return timeB - timeA;
      }
      if (sortBy === "top") {
        return scoreB - scoreA;
      }
      if (sortBy === "rising") {
        const risingA = scoreA / Math.sqrt(hoursA);
        const risingB = scoreB / Math.sqrt(hoursB);
        return risingB - risingA;
      }
      // Hot: Reddit style time-decay score
      const hotA = scoreA / Math.pow(hoursA + 2, 1.4);
      const hotB = scoreB / Math.pow(hoursB + 2, 1.4);
      return hotB - hotA;
    });

    return result;
  }, [posts, activeSubredditId, activeFlair, searchQuery, sortBy]);

  // Flair badge helper
  const getFlairColor = (flair?: string) => {
    switch (flair) {
      case "Official":
        return "bg-orange-500/15 text-[#FF4500] border-orange-500/30";
      case "Release":
      case "Patch Notes":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Guide":
      case "Tip":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Showcase":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "Feature Request":
      case "Idea":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Bug":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-white/[0.08] text-zinc-300 border-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-zinc-100 flex flex-col font-sans select-none">
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1c1f] text-white border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#FF4500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar collapsed={collapsedSidebar} />

        <main className="flex-1 overflow-x-hidden min-w-0 bg-[#0c0c0e]">
          {/* Subreddit Banner Header */}
          <div className="relative border-b border-white/[0.08] bg-[#121214]">
            <div className={`h-24 sm:h-32 w-full bg-gradient-to-r ${currentSubreddit.bannerColor} bg-[#18181b] relative overflow-hidden`}>
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 relative z-10">
                <div className="flex items-end gap-3.5 sm:gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#18181b] border-4 border-[#0c0c0e] flex items-center justify-center text-3xl sm:text-4xl shadow-xl flex-shrink-0">
                    {currentSubreddit.icon}
                  </div>
                  <div className="pb-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {currentSubreddit.displayName}
                      </h1>
                      <span className="font-mono text-xs font-semibold text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/10">
                        {currentSubreddit.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-xl">
                      {currentSubreddit.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-1">
                  {localIsZero && (
                    <button
                      type="button"
                      onClick={() => setShowAdminTab(!showAdminTab)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        showAdminTab
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                          : "bg-white/[0.04] text-zinc-300 hover:text-white border-white/[0.08]"
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Mod Panel</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        openAuthModal();
                        return;
                      }
                      setComposerSubreddit(currentSubreddit.name);
                      setIsComposerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-white px-5 py-2 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#FF4500]/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Post</span>
                  </button>
                </div>
              </div>

              {/* Subreddit Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-4 scrollbar-none">
                {SUBREDDITS.map((sub) => {
                  const isActive = activeSubredditId === sub.id && !showAdminTab;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setShowAdminTab(false);
                        setActiveSubredditId(sub.id);
                        setActiveFlair(null);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-white text-black font-bold shadow-md"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Feed Container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {showAdminTab && localIsZero ? (
              /* Admin Moderation Panel */
              <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-6 shadow-2xl mb-8">
                {!isUsersUnlocked ? (
                  <div className="max-w-md mx-auto text-center py-10">
                    <div className="h-14 w-14 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Restricted Mod Panel</h2>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      This administration console is restricted to creator @0. Enter the moderation key to view the user registry.
                    </p>
                    <form onSubmit={handleUnlockUsers} className="space-y-4 text-left">
                      <div>
                        <input
                          type="password"
                          value={usersPasswordInput}
                          onChange={(e) => {
                            setUsersPasswordInput(e.target.value);
                            setUsersPasswordError("");
                          }}
                          placeholder="Enter moderation key..."
                          className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/30 font-mono"
                        />
                        {usersPasswordError && (
                          <p className="text-xs text-red-400 mt-2 font-medium">{usersPasswordError}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-white text-black py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        Unlock Registry
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                      <div>
                        <h2 className="text-base font-bold text-white">Platform Users Registry</h2>
                        <p className="text-xs text-zinc-400">All registered creator channels on Entropy</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={loadAllPlatformUsers}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingUsers ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsUsersUnlocked(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
                        >
                          Lock
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        value={usersSearchQuery}
                        onChange={(e) => setUsersSearchQuery(e.target.value)}
                        placeholder="Filter by name, handle, id, or email..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-black border border-white/10 text-xs text-white placeholder-zinc-500 outline-none"
                      />
                    </div>

                    <div className="divide-y divide-white/[0.06] max-h-96 overflow-y-auto">
                      {allPlatformUsers
                        .filter((u) => {
                          if (!usersSearchQuery.trim()) return true;
                          const q = usersSearchQuery.toLowerCase();
                          return (
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.handle && u.handle.toLowerCase().includes(q)) ||
                            (u.id && u.id.toLowerCase().includes(q)) ||
                            (u.email && u.email.toLowerCase().includes(q))
                          );
                        })
                        .map((u) => (
                          <div key={u.id || u.handle} className="py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatarUrl || u.avatar || "/default-avatar.png"}
                                alt={u.name}
                                className="h-9 w-9 rounded-full object-cover bg-zinc-800"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white">{u.name}</span>
                                  <span className="text-[11px] font-mono text-zinc-400">@{u.handle}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">{u.id} • {u.joinedAt || "Joined recently"}</span>
                              </div>
                            </div>
                            <Link
                              href={`/@${u.handle}`}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-zinc-200"
                            >
                              Profile
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Reddit Grid: Main Feed + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Center Column (Feed) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Reddit Quick Post Bar */}
                <div
                  onClick={() => {
                    if (!user) {
                      openAuthModal();
                      return;
                    }
                    setComposerSubreddit(currentSubreddit.name);
                    setIsComposerOpen(true);
                  }}
                  className="rounded-xl bg-[#141416] border border-white/[0.08] p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer hover:border-white/20 transition-all shadow-md group"
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                    <img
                      src={user?.avatarUrl || user?.avatar || "/default-avatar.png"}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    readOnly
                    placeholder={user ? `Create Post in ${currentSubreddit.name}...` : "Sign in to post or participate..."}
                    className="flex-1 bg-[#1a1a1e] group-hover:bg-[#202024] border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-zinc-300 placeholder-zinc-500 outline-none transition-colors cursor-pointer"
                  />
                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
                      title="Post image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors"
                      title="Create poll"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

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
                    <button
                      type="button"
                      onClick={() => setSortBy("rising")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sortBy === "rising"
                          ? "bg-white/[0.12] text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Rocket className={`h-3.5 w-3.5 ${sortBy === "rising" ? "text-amber-400" : ""}`} />
                      <span>Rising</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <button
                      type="button"
                      onClick={() => setViewMode(viewMode === "card" ? "compact" : "card")}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title={viewMode === "card" ? "Switch to Compact View" : "Switch to Card View"}
                    >
                      <Layers className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Active Filter Pills (if search or flair active) */}
                {(activeFlair || searchQuery) && (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-zinc-500 font-medium">Filtering by:</span>
                    {activeFlair && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">
                        <span>Flair: {activeFlair}</span>
                        <button
                          type="button"
                          onClick={() => setActiveFlair(null)}
                          className="hover:text-zinc-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">
                        <span>Search: {searchQuery}</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="hover:text-zinc-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Post Feed */}
                {filteredPosts.length === 0 ? (
                  <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-12 text-center shadow-lg">
                    <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No posts found</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed">
                      {searchQuery || activeFlair
                        ? "No community posts match your current search or flair filters."
                        : `Be the first to post something in ${currentSubreddit.name}!`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setComposerSubreddit(currentSubreddit.name);
                        setIsComposerOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-white px-5 py-2 text-xs font-bold transition-all shadow-md"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create the first post</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPosts.map((post) => {
                      const netScore = (post.likes || 0) - (post.dislikes || 0);
                      const isCommentsOpen = openCommentsPostId === post.id;
                      const isSaved = Boolean(savedPosts[post.id]);
                      const totalPollVotes = post.pollOptions?.reduce((acc, o) => acc + o.votes, 0) || 0;
                      const displayTitle = post.title || post.content.split("\n")[0].slice(0, 90);
                      const isAuthor = user && (user.handle || "").toLowerCase() === (post.channelHandle || "").toLowerCase();

                      return (
                        <article
                          key={post.id}
                          className="rounded-xl bg-[#141416] border border-white/[0.08] hover:border-white/20 transition-all shadow-md overflow-hidden flex"
                        >
                          {/* Reddit Vertical Vote Pillar */}
                          <div className="w-11 sm:w-12 bg-[#101012] flex flex-col items-center py-3 flex-shrink-0 select-none border-r border-white/[0.04]">
                            <button
                              type="button"
                              onClick={() => handleVote(post.id, "up")}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                post.hasLiked
                                  ? "text-[#FF4500] bg-[#FF4500]/15"
                                  : "text-zinc-500 hover:text-[#FF4500] hover:bg-white/[0.04]"
                              }`}
                              title="Upvote"
                              aria-label="Upvote"
                            >
                              <ArrowBigUp className={`h-6 w-6 ${post.hasLiked ? "fill-[#FF4500]" : ""}`} strokeWidth={1.5} />
                            </button>

                            <span
                              className={`text-xs font-bold my-1 ${
                                post.hasLiked
                                  ? "text-[#FF4500]"
                                  : post.hasDisliked
                                  ? "text-[#7193FF]"
                                  : "text-zinc-300"
                              }`}
                            >
                              {netScore}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleVote(post.id, "down")}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                post.hasDisliked
                                  ? "text-[#7193FF] bg-[#7193FF]/15"
                                  : "text-zinc-500 hover:text-[#7193FF] hover:bg-white/[0.04]"
                              }`}
                              title="Downvote"
                              aria-label="Downvote"
                            >
                              <ArrowBigDown className={`h-6 w-6 ${post.hasDisliked ? "fill-[#7193FF]" : ""}`} strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Post Body Content */}
                          <div className="flex-1 p-3.5 sm:p-4 min-w-0">
                            {/* Metadata Header */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs text-zinc-400 mb-2">
                              {/* Subreddit Link */}
                              <button
                                type="button"
                                onClick={() => {
                                  const rawSub = (post.subreddit || "r/announcements").replace(/^r\//, "");
                                  setActiveSubredditId(rawSub);
                                }}
                                className="font-extrabold text-white hover:underline cursor-pointer"
                              >
                                {post.subreddit || `r/${post.tag || "announcements"}`}
                              </button>
                              <span className="text-zinc-600">•</span>

                              {/* Author */}
                              <span className="text-zinc-500">Posted by</span>
                              <Link
                                href={`/@${post.channelHandle.replace(/^@/, "")}`}
                                className="font-semibold text-zinc-300 hover:text-white hover:underline flex items-center gap-1"
                              >
                                <span>u/{post.channelHandle.replace(/^@/, "")}</span>
                                <VerifiedBadge subscribersCount={105000} className="h-3 w-3" />
                              </Link>
                              <span className="text-zinc-600">•</span>

                              {/* Time */}
                              <span className="text-zinc-500">{formatTimeAgo(post.publishedAt)}</span>

                              {/* Flair Tag */}
                              {post.flair && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFlairColor(post.flair)}`}>
                                  {post.flair}
                                </span>
                              )}

                              {/* Pinned Pill */}
                              {post.isPinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                  <Pin className="h-2.5 w-2.5 fill-emerald-400" />
                                  <span>Pinned</span>
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h2 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug tracking-tight">
                              {displayTitle}
                            </h2>

                            {/* Content Snippet / Full Text */}
                            {post.content && post.content !== post.title && (
                              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line mb-3 font-normal">
                                {post.content}
                              </div>
                            )}

                            {/* Attached Image */}
                            {post.imageUrl && (
                              <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-3 max-h-[500px] bg-black">
                                <img
                                  src={post.imageUrl}
                                  alt="Post media"
                                  className="w-full h-full object-contain max-h-[500px]"
                                />
                              </div>
                            )}

                            {/* Interactive Poll */}
                            {post.pollOptions && post.pollOptions.length > 0 && (
                              <div className="space-y-2 mb-3 bg-[#0d0d0f] border border-white/[0.06] rounded-xl p-3.5">
                                <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                                  <span>Community Poll</span>
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
                                          : "border-white/[0.08] bg-[#141416] hover:border-white/20"
                                      } ${!post.pollVotedId ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                      {post.pollVotedId && (
                                        <div
                                          className={`absolute inset-0 transition-all duration-500 ${
                                            isSelected ? "bg-white/[0.18]" : "bg-white/[0.05]"
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      )}
                                      <div className="relative flex items-center justify-between text-xs font-medium">
                                        <span className="text-zinc-200">{opt.text}</span>
                                        {post.pollVotedId && (
                                          <span className="font-bold text-zinc-300 ml-2">{pct}%</span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Reddit Action Bar */}
                            <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-white/[0.06] text-xs font-semibold text-zinc-400">
                              <button
                                type="button"
                                onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
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
                                onClick={() => handleShare(post)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                              >
                                <Share2 className="h-4 w-4" />
                                <span>Share</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleSave(post.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSaved
                                    ? "text-[#FF4500] hover:text-[#e03d00]"
                                    : "hover:bg-white/[0.06] hover:text-white"
                                }`}
                              >
                                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-[#FF4500]" : ""}`} />
                                <span>{isSaved ? "Saved" : "Save"}</span>
                              </button>

                              {localIsZero && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(post.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    post.isPinned
                                      ? "text-emerald-400 bg-emerald-400/10"
                                      : "hover:bg-white/[0.06] hover:text-white"
                                  }`}
                                  title="Pin to top of feed"
                                >
                                  <Pin className="h-4 w-4" />
                                  <span>{post.isPinned ? "Unpin" : "Pin"}</span>
                                </button>
                              )}

                              {(isAuthor || localIsZero) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer ml-auto"
                                  title="Delete post"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              )}
                            </div>

                            {/* Reddit Threaded Comments Section */}
                            {isCommentsOpen && (
                              <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-200">
                                {/* Comment Composer Box */}
                                <div className="space-y-2">
                                  <p className="text-[11px] text-zinc-400">
                                    Comment as{" "}
                                    <span className="text-white font-semibold">
                                      {user ? `u/${user.handle}` : "Guest"}
                                    </span>
                                  </p>
                                  <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] focus-within:border-white/20 transition-all overflow-hidden">
                                    <textarea
                                      rows={3}
                                      value={replyInputs[post.id] || ""}
                                      onChange={(e) => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                                      placeholder="What are your thoughts?"
                                      className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none resize-none"
                                    />
                                    <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-t border-white/[0.04]">
                                      <span className="text-[10px] text-zinc-500">Markdown supported</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={!replyInputs[post.id]?.trim()}
                                        className="rounded-full bg-[#FF4500] hover:bg-[#e03d00] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1 text-xs font-bold transition-all cursor-pointer shadow-sm"
                                      >
                                        Comment
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3 pt-2">
                                  {(post.comments || []).length === 0 ? (
                                    <p className="text-xs text-zinc-500 text-center py-4">
                                      No comments yet. Be the first to share your thoughts!
                                    </p>
                                  ) : (
                                    (post.comments || []).map((comment) => {
                                      const isOp = (comment.authorHandle || "").toLowerCase() === (post.channelHandle || "").toLowerCase();
                                      const commentScore = (comment.likes || 0) - (comment.dislikes || 0);

                                      return (
                                        <div key={comment.id} className="relative pl-3 border-l-2 border-white/[0.08] hover:border-white/20 transition-colors">
                                          <div className="flex items-center gap-2 mb-1">
                                            <img
                                              src={comment.authorAvatar || "/default-avatar.png"}
                                              alt={comment.authorName}
                                              className="h-5 w-5 rounded-full object-cover bg-zinc-800"
                                            />
                                            <Link
                                              href={`/@${(comment.authorHandle || "").replace(/^@/, "")}`}
                                              className="text-xs font-bold text-zinc-200 hover:text-white hover:underline"
                                            >
                                              u/{(comment.authorHandle || comment.authorName || "").replace(/^@/, "")}
                                            </Link>
                                            {isOp && (
                                              <span className="text-[10px] font-bold text-[#FF4500] bg-[#FF4500]/10 px-1.5 py-0.2 rounded border border-[#FF4500]/20">
                                                OP
                                              </span>
                                            )}
                                            <span className="text-[10px] text-zinc-500">• {formatTimeAgo(comment.createdAt)}</span>
                                          </div>

                                          <p className="text-xs text-zinc-200 leading-relaxed pl-7 whitespace-pre-line">
                                            {comment.content}
                                          </p>

                                          {/* Comment Votes & Reply Action */}
                                          <div className="flex items-center gap-3 pl-7 pt-1 text-xs text-zinc-400">
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleCommentVote(post.id, comment.id, "up")}
                                                className={`p-1 rounded hover:bg-white/[0.06] ${
                                                  comment.hasLiked ? "text-[#FF4500]" : "text-zinc-500 hover:text-[#FF4500]"
                                                }`}
                                              >
                                                <ArrowBigUp className={`h-4 w-4 ${comment.hasLiked ? "fill-[#FF4500]" : ""}`} />
                                              </button>
                                              <span className="text-[11px] font-bold text-zinc-300">{commentScore}</span>
                                              <button
                                                type="button"
                                                onClick={() => handleCommentVote(post.id, comment.id, "down")}
                                                className={`p-1 rounded hover:bg-white/[0.06] ${
                                                  comment.hasDisliked ? "text-[#7193FF]" : "text-zinc-500 hover:text-[#7193FF]"
                                                }`}
                                              >
                                                <ArrowBigDown className={`h-4 w-4 ${comment.hasDisliked ? "fill-[#7193FF]" : ""}`} />
                                              </button>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!user) {
                                                  openAuthModal();
                                                  return;
                                                }
                                                setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id);
                                              }}
                                              className="flex items-center gap-1 hover:text-white cursor-pointer font-semibold text-[11px]"
                                            >
                                              <MessageSquare className="h-3 w-3" />
                                              <span>Reply</span>
                                            </button>
                                          </div>

                                          {/* Nested Reply Composer */}
                                          {replyingToCommentId === comment.id && (
                                            <div className="mt-2 pl-7 flex gap-2">
                                              <input
                                                type="text"
                                                value={nestedReplyInput}
                                                onChange={(e) => setNestedReplyInput(e.target.value)}
                                                placeholder={`Reply to u/${comment.authorHandle}...`}
                                                className="flex-1 rounded-xl bg-[#0c0c0e] border border-white/10 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleAddComment(post.id, comment.id)}
                                                className="px-3 py-1 rounded-xl bg-[#FF4500] text-white text-xs font-bold"
                                              >
                                                Reply
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Sidebar Column (Reddit Widgets) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Search Bar Widget */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-3 shadow-md">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${currentSubreddit.name}...`}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0c0c0e] border border-white/[0.06] text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                </div>

                {/* About Community Widget */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] overflow-hidden shadow-md">
                  <div className={`h-12 bg-gradient-to-r ${currentSubreddit.bannerColor} bg-zinc-900 px-4 flex items-center`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">About Community</span>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{currentSubreddit.icon}</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-white">{currentSubreddit.displayName}</h3>
                        <p className="font-mono text-[11px] text-zinc-400">{currentSubreddit.name}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {currentSubreddit.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/[0.06] text-center">
                      <div>
                        <span className="block font-extrabold text-sm text-white">
                          {(currentSubreddit.membersCount / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Members</span>
                      </div>
                      <div>
                        <span className="block font-extrabold text-sm text-emerald-400">
                          {(currentSubreddit.onlineCount / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Online</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          openAuthModal();
                          return;
                        }
                        setComposerSubreddit(currentSubreddit.name);
                        setIsComposerOpen(true);
                      }}
                      className="w-full rounded-full bg-white hover:bg-zinc-200 text-black py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Create Post
                    </button>
                  </div>
                </div>

                {/* Community Rules Widget */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-4 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#FF4500]" />
                    <span>{currentSubreddit.name} Rules</span>
                  </h4>
                  <ol className="space-y-2 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                    {currentSubreddit.rules.map((rule, idx) => (
                      <li key={idx} className="pb-1 border-b border-white/[0.04] last:border-none">
                        <span className="text-zinc-200 font-medium">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Filter by Flair Widget */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-4 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-zinc-400" />
                    <span>Filter by Flair</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubreddit.flairs.map((flair) => {
                      const isActive = activeFlair === flair;
                      return (
                        <button
                          key={flair}
                          type="button"
                          onClick={() => setActiveFlair(isActive ? null : flair)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isActive
                              ? "bg-white text-black font-bold border-white"
                              : `${getFlairColor(flair)} hover:opacity-80`
                          }`}
                        >
                          {flair}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Moderators Widget */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-4 shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span>Moderators</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Link href="/@0" className="text-zinc-300 hover:text-white font-semibold">
                        u/0
                      </Link>
                      <span className="text-[10px] text-zinc-500 font-mono">Lead Dev</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href="/@entropy" className="text-zinc-300 hover:text-white font-semibold">
                        u/entropy
                      </Link>
                      <span className="text-[10px] text-zinc-500 font-mono">Platform Admin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reddit Create Post Modal */}
          {isComposerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div
                className="relative w-full max-w-2xl rounded-2xl bg-[#141416] border border-white/[0.08] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#FF4500]" />
                    <span>Create a Post</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  {/* Community Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Choose a Community
                    </label>
                    <select
                      value={composerSubreddit}
                      onChange={(e) => {
                        setComposerSubreddit(e.target.value);
                        const match = SUBREDDITS.find((s) => s.name === e.target.value);
                        if (match && match.flairs.length > 0) {
                          setComposerFlair(match.flairs[0]);
                        }
                      }}
                      className="w-full rounded-xl bg-[#0c0c0e] border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-white/20"
                    >
                      {SUBREDDITS.filter((s) => s.id !== "all").map((sub) => (
                        <option key={sub.id} value={sub.name} className="bg-[#141416] text-white">
                          {sub.icon} {sub.name} — {sub.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Post Type Tabs: Text vs Image vs Poll */}
                  <div className="flex items-center border-b border-white/[0.08] pb-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerTab("text")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        composerTab === "text"
                          ? "bg-white/10 text-white border-b-2 border-[#FF4500]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      <span>Post</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerTab("image")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        composerTab === "image"
                          ? "bg-white/10 text-white border-b-2 border-[#FF4500]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Images & Media</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerTab("poll")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        composerTab === "poll"
                          ? "bg-white/10 text-white border-b-2 border-[#FF4500]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <BarChart2 className="h-4 w-4" />
                      <span>Poll</span>
                    </button>
                  </div>

                  {/* Title Input */}
                  <div>
                    <input
                      type="text"
                      value={composerTitle}
                      onChange={(e) => setComposerTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-xl bg-[#0c0c0e] border border-white/10 px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-500 outline-none focus:border-white/20"
                    />
                  </div>

                  {/* Flair Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Select Flair (Optional)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(SUBREDDITS.find((s) => s.name === composerSubreddit)?.flairs || []).map((flair) => {
                        const isSelected = composerFlair === flair;
                        return (
                          <button
                            key={flair}
                            type="button"
                            onClick={() => setComposerFlair(isSelected ? "" : flair)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white text-black font-bold border-white"
                                : `${getFlairColor(flair)} opacity-70 hover:opacity-100`
                            }`}
                          >
                            {flair}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Tab Body */}
                  {composerTab === "text" && (
                    <div>
                      <textarea
                        rows={5}
                        value={composerBody}
                        onChange={(e) => setComposerBody(e.target.value)}
                        placeholder="Text (optional)"
                        className="w-full rounded-xl bg-[#0c0c0e] border border-white/10 p-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Image Tab Body */}
                  {composerTab === "image" && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      {attachedImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-h-64">
                          <img src={attachedImage} alt="Upload preview" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setAttachedImage(null)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 p-8 text-center cursor-pointer transition-colors bg-[#0c0c0e]"
                        >
                          <ImageIcon className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-zinc-300">Click to upload an image</p>
                          <p className="text-[11px] text-zinc-500 mt-1">PNG, JPG, or WebP</p>
                        </div>
                      )}
                      <textarea
                        rows={2}
                        value={composerBody}
                        onChange={(e) => setComposerBody(e.target.value)}
                        placeholder="Caption or description (optional)"
                        className="w-full rounded-xl bg-[#0c0c0e] border border-white/10 p-3 text-xs text-white placeholder-zinc-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Poll Tab Body */}
                  {composerTab === "poll" && (
                    <div className="space-y-3 bg-[#0c0c0e] p-4 rounded-xl border border-white/10">
                      <p className="text-xs font-semibold text-zinc-400">Add Poll Options</p>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 rounded-xl bg-[#141416] border border-white/10 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="p-1.5 text-zinc-500 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <button
                          type="button"
                          onClick={handleAddPollOption}
                          className="text-xs font-bold text-[#FF4500] hover:underline"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Moderator Pin Option */}
                  {localIsZero && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={composerPin}
                        onChange={(e) => setComposerPin(e.target.checked)}
                        className="rounded border-white/20 text-[#FF4500] focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-zinc-300">
                        Pin post as moderator announcement
                      </span>
                    </label>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(false)}
                      className="px-4 py-2 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!composerTitle.trim()}
                      className="px-6 py-2 rounded-full bg-[#FF4500] hover:bg-[#e03d00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-[#FF4500]/20"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
