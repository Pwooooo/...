"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoPlayer, { VideoPlayerHandle } from "@/components/video/VideoPlayer";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MoreHorizontal,
  Bell,
  CheckCircle2,
  Layers,
  Sparkles,
  Play,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Scissors,
  ListPlus,
  FileText,
  Flag,
  Pin,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatDuration, formatViews, formatTimeAgo, formatSubscribers } from "@/lib/utils";
import { ALL_VIDEOS, SAMPLE_CHAPTERS, SAMPLE_HIGHLIGHTS } from "@/lib/mock-data";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserVideos, getVideoBlob, getAllCombinedVideos, getBaseVideos, fetchServerVideos, isShortVideo } from "@/lib/video-storage";
import { VideoItem } from "@/types";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "";
  const playerRef = useRef<VideoPlayerHandle>(null);
  const chaptersPanelRef = useRef<HTMLDivElement>(null);

  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(() => {
    const combined = getAllCombinedVideos();
    const found = combined.find((v) => v.id === videoId);
    if (found) return found;
    const base = getBaseVideos();
    return base.find((v) => v.id === videoId) || combined.find((v) => !isShortVideo(v)) || combined[0] || null;
  });
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [allRecommendedVideos, setAllRecommendedVideos] = useState<VideoItem[]>(() => {
    const combined = getAllCombinedVideos();
    return combined.filter((v) => v.id !== videoId && !isShortVideo(v));
  });

  useEffect(() => {
    let isCancelled = false;
    let activeBlobUrl: string | null = null;

    const applyVideo = async (video: VideoItem) => {
      if (isCancelled) return;
      setCurrentVideo(video);
      if (video.id.startsWith("v-user-") || video.id.startsWith("v-srv-") || video.rawVideoUrl) {
        if (video.rawVideoUrl) {
          setResolvedVideoUrl(video.rawVideoUrl);
        } else if (video.id.startsWith("v-srv-") || video.id.startsWith("v-user-")) {
          setResolvedVideoUrl(`/api/videos/${video.id}/stream`);
        } else {
          const blob = await getVideoBlob(video.id);
          if (isCancelled) return;
          if (blob) {
            const url = URL.createObjectURL(blob);
            activeBlobUrl = url;
            setResolvedVideoUrl(url);
          } else {
            setResolvedVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
          }
        }
      } else {
        setResolvedVideoUrl(
          video.masterPlaylistUrl || video.rawVideoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        );
      }
    };

    const combined = getAllCombinedVideos();
    const found = combined.find((v) => v.id === videoId);

    if (found) {
      if (isShortVideo(found)) {
        window.location.replace(`/shorts?id=${found.id}`);
        return;
      }
      applyVideo(found);
    }

    fetchServerVideos().then((serverVideos) => {
      if (isCancelled) return;
      const allCurrent = getAllCombinedVideos();
      const srvFound = allCurrent.find((v) => v.id === videoId);
      if (srvFound) {
        if (isShortVideo(srvFound)) {
          window.location.replace(`/shorts?id=${srvFound.id}`);
          return;
        }
        applyVideo(srvFound);
      }
      setAllRecommendedVideos(allCurrent.filter((v) => v.id !== videoId && !isShortVideo(v)));
    });

    const handleVideosUpdated = () => {
      if (isCancelled) return;
      const combined = getAllCombinedVideos();
      const match = combined.find((v) => v.id === videoId);
      if (match) {
        if (isShortVideo(match)) {
          window.location.replace(`/shorts?id=${match.id}`);
          return;
        }
        applyVideo(match);
      }
      setAllRecommendedVideos(combined.filter((v) => v.id !== (match ? match.id : videoId) && !isShortVideo(v)));
    };

    window.addEventListener("entropy_videos_updated", handleVideosUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener("entropy_videos_updated", handleVideosUpdated);
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [videoId]);

  const chapters = currentVideo?.chapters || [];
  const highlights = currentVideo?.highlights || [];

  const { user, openAuthModal } = useAuth();
  const uHandle = (user?.handle || user?.name || "").replace(/^@/, "").toLowerCase();
  const vHandle = (currentVideo?.channel?.handle || currentVideo?.channel?.displayName || "").replace(/^@/, "").toLowerCase();
  const isOwnVideo = Boolean(
    user &&
      ((vHandle && uHandle && vHandle === uHandle) ||
        (currentVideo?.channel?.id && user?.id && currentVideo.channel.id === user.id))
  );

  const isChannelOwner = Boolean(
    isOwnVideo ||
    currentVideo?.id.startsWith("v-user-") ||
    (user && (
      uHandle === vHandle ||
      user.id === currentVideo?.channel?.id ||
      user.name === currentVideo?.channel?.displayName ||
      user.name === "Guest User" ||
      !currentVideo?.channel
    )) ||
    (currentVideo?.channel?.displayName === "Entropy Team")
  );

  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isChaptersPanelOpen, setIsChaptersPanelOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  interface CommentReply {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timeAgo: string;
    likes: number;
    dislikes?: number;
  }

  interface CommentItem {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timeAgo: string;
    likes: number;
    dislikes: number;
    isPinned?: boolean;
    isHearted?: boolean;
    isEdited?: boolean;
    pinnedBy?: string;
    heartedBy?: string;
    replies?: CommentReply[];
  }

  const [commentText, setCommentText] = useState("");
  const [commentVotes, setCommentVotes] = useState<Record<string, "like" | "dislike">>({});
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyVotes, setReplyVotes] = useState<Record<string, "like" | "dislike">>({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    if (!currentVideo) {
      setLikes(0);
      setDislikes(0);
      setHasLiked(false);
      setHasDisliked(false);
      setComments([]);
      return;
    }

    try {
      const storedLikes = localStorage.getItem(`entropy_video_likes_${currentVideo.id}`);
      const storedDislikes = localStorage.getItem(`entropy_video_dislikes_${currentVideo.id}`);
      const userVote = localStorage.getItem(`entropy_video_vote_${currentVideo.id}`);
      setLikes(storedLikes ? parseInt(storedLikes, 10) : 0);
      setDislikes(storedDislikes ? parseInt(storedDislikes, 10) : 0);
      setHasLiked(userVote === "like");
      setHasDisliked(userVote === "dislike");

      const stored = localStorage.getItem(`entropy_comments_${currentVideo.id}`);
      if (stored) {
        setComments(JSON.parse(stored));
      } else {
        const creatorName = currentVideo.channel?.displayName || currentVideo.channel?.handle || "Entropy Official";
        const defaultComments: CommentItem[] = [
          {
            id: `c-pinned-${currentVideo.id}`,
            user: creatorName,
            avatar: currentVideo.channel?.avatarUrl || "/entropy-icon.png",
            content: "Welcome to the video! What was your favorite moment? Pinning the best insights and discussions below! ✨",
            timeAgo: "2 hours ago",
            likes: 42,
            dislikes: 0,
            isPinned: true,
            isHearted: true,
            pinnedBy: creatorName,
            heartedBy: creatorName,
            replies: [
              {
                id: `r-1-${currentVideo.id}`,
                user: "Entropy Fan",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                content: "The workflow breakdowns around 4:20 are pure gold! Thanks for pinning this.",
                timeAgo: "1 hour ago",
                likes: 4,
                dislikes: 0,
              },
            ],
          },
          {
            id: `c-2-${currentVideo.id}`,
            user: "alex_dev",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            content: "The Next.js 15 Turbopack speed and adaptive HLS video streaming is insanely fast. Loving the modern UI!",
            timeAgo: "1 hour ago",
            likes: 19,
            dislikes: 0,
            isHearted: true,
            heartedBy: creatorName,
          },
          {
            id: `c-3-${currentVideo.id}`,
            user: "design_lead",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            content: "The multi-window layout and creator studio constraints make this feel like a native desktop app.",
            timeAgo: "35 minutes ago",
            likes: 7,
            dislikes: 0,
          },
        ];
        setComments(defaultComments);
        try {
          localStorage.setItem(`entropy_comments_${currentVideo.id}`, JSON.stringify(defaultComments));
        } catch {}
      }
    } catch {
      setLikes(0);
      setDislikes(0);
      setHasLiked(false);
      setHasDisliked(false);
      setComments([]);
    }
  }, [currentVideo?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLike = () => {
    if (!currentVideo) return;
    let newLikes = likes;
    let newDislikes = dislikes;
    let newVote: "like" | null = null;

    if (hasLiked) {
      setHasLiked(false);
      newLikes = Math.max(0, likes - 1);
      setLikes(newLikes);
    } else {
      setHasLiked(true);
      newVote = "like";
      if (hasDisliked) {
        setHasDisliked(false);
        newDislikes = Math.max(0, dislikes - 1);
        setDislikes(newDislikes);
      }
      newLikes = likes + 1;
      setLikes(newLikes);
      showToast("Added to Liked videos");
    }

    try {
      localStorage.setItem(`entropy_video_likes_${currentVideo.id}`, newLikes.toString());
      localStorage.setItem(`entropy_video_dislikes_${currentVideo.id}`, newDislikes.toString());
      if (newVote) {
        localStorage.setItem(`entropy_video_vote_${currentVideo.id}`, newVote);
      } else {
        localStorage.removeItem(`entropy_video_vote_${currentVideo.id}`);
      }
    } catch {}
  };

  const handleDislike = () => {
    if (!currentVideo) return;
    let newLikes = likes;
    let newDislikes = dislikes;
    let newVote: "dislike" | null = null;

    if (hasDisliked) {
      setHasDisliked(false);
      newDislikes = Math.max(0, dislikes - 1);
      setDislikes(newDislikes);
    } else {
      setHasDisliked(true);
      newVote = "dislike";
      if (hasLiked) {
        setHasLiked(false);
        newLikes = Math.max(0, likes - 1);
        setLikes(newLikes);
      }
      newDislikes = dislikes + 1;
      setDislikes(newDislikes);
      showToast("Feedback recorded");
    }

    try {
      localStorage.setItem(`entropy_video_likes_${currentVideo.id}`, newLikes.toString());
      localStorage.setItem(`entropy_video_dislikes_${currentVideo.id}`, newDislikes.toString());
      if (newVote) {
        localStorage.setItem(`entropy_video_vote_${currentVideo.id}`, newVote);
      } else {
        localStorage.removeItem(`entropy_video_vote_${currentVideo.id}`);
      }
    } catch {}
  };

  const handleCommentLike = (commentId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const newVotes = { ...prev };
      let updatedComments: CommentItem[];
      if (current === "like") {
        delete newVotes[commentId];
        updatedComments = comments.map((c) =>
          c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c
        );
      } else {
        newVotes[commentId] = "like";
        updatedComments = comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              likes: c.likes + 1,
              dislikes: current === "dislike" ? Math.max(0, c.dislikes - 1) : c.dislikes,
            };
          }
          return c;
        });
      }
      setComments(updatedComments);
      try {
        localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updatedComments));
      } catch {}
      return newVotes;
    });
  };

  const handleCommentDislike = (commentId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const newVotes = { ...prev };
      let updatedComments: CommentItem[];
      if (current === "dislike") {
        delete newVotes[commentId];
        updatedComments = comments.map((c) =>
          c.id === commentId ? { ...c, dislikes: Math.max(0, c.dislikes - 1) } : c
        );
      } else {
        newVotes[commentId] = "dislike";
        updatedComments = comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              dislikes: c.dislikes + 1,
              likes: current === "like" ? Math.max(0, c.likes - 1) : c.likes,
            };
          }
          return c;
        });
      }
      setComments(updatedComments);
      try {
        localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updatedComments));
      } catch {}
      return newVotes;
    });
  };

  const handleTogglePin = (commentId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;
    const willBePinned = !target.isPinned;
    const creatorName = currentVideo.channel?.displayName || currentVideo.channel?.handle || "Creator";

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          isPinned: willBePinned,
          pinnedBy: willBePinned ? creatorName : undefined,
        };
      }
      return willBePinned ? { ...c, isPinned: false } : c;
    });

    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updated));
    } catch {}
    showToast(willBePinned ? "📌 Comment pinned to the top" : "Comment unpinned");
  };

  const handleToggleHeart = (commentId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;
    const willBeHearted = !target.isHearted;
    const creatorName = currentVideo.channel?.displayName || currentVideo.channel?.handle || "Creator";

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          isHearted: willBeHearted,
          heartedBy: willBeHearted ? creatorName : undefined,
        };
      }
      return c;
    });

    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updated));
    } catch {}
    showToast(willBeHearted ? "❤️ Awarded creator heart" : "Removed creator heart");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updated));
    } catch {}
    showToast("Comment deleted");
  };

  const handleSaveEdit = (commentId: string) => {
    if (!currentVideo || !editingContent.trim()) return;
    const vidId = currentVideo.id;
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          content: editingContent.trim(),
          isEdited: true,
        };
      }
      return c;
    });
    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updated));
    } catch {}
    setEditingCommentId(null);
    setEditingContent("");
    showToast("Comment edited");
  };

  const handleToggleReply = (commentId: string) => {
    if (replyingToId === commentId) {
      setReplyingToId(null);
      setReplyText("");
    } else {
      setReplyingToId(commentId);
      setReplyText("");
    }
  };

  const handleAddReply = (commentId: string) => {
    if (!currentVideo || !replyText.trim()) return;
    const vidId = currentVideo.id;
    const newReply: CommentReply = {
      id: `r-${Date.now()}`,
      user: user ? user.name : "Guest User",
      avatar: user?.avatarUrl || user?.avatar || "/default-avatar.png",
      content: replyText.trim(),
      timeAgo: "Just now",
      likes: 0,
      dislikes: 0,
    };

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      }
      return c;
    });

    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updated));
    } catch {}
    setReplyText("");
    setReplyingToId(null);
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    showToast("Reply published");
  };

  const toggleExpandReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplyLike = (commentId: string, replyId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    setReplyVotes((prev) => {
      const current = prev[replyId];
      const newVotes = { ...prev };
      let updatedComments: CommentItem[];

      if (current === "like") {
        delete newVotes[replyId];
        updatedComments = comments.map((c) => {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId ? { ...r, likes: Math.max(0, r.likes - 1) } : r
              ),
            };
          }
          return c;
        });
      } else {
        newVotes[replyId] = "like";
        updatedComments = comments.map((c) => {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === replyId) {
                  return {
                    ...r,
                    likes: r.likes + 1,
                    dislikes: current === "dislike" ? Math.max(0, (r.dislikes || 0) - 1) : r.dislikes,
                  };
                }
                return r;
              }),
            };
          }
          return c;
        });
      }

      setComments(updatedComments);
      try {
        localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updatedComments));
      } catch {}
      return newVotes;
    });
  };

  const handleReplyDislike = (commentId: string, replyId: string) => {
    if (!currentVideo) return;
    const vidId = currentVideo.id;
    setReplyVotes((prev) => {
      const current = prev[replyId];
      const newVotes = { ...prev };
      let updatedComments: CommentItem[];

      if (current === "dislike") {
        delete newVotes[replyId];
        updatedComments = comments.map((c) => {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId ? { ...r, dislikes: Math.max(0, (r.dislikes || 0) - 1) } : r
              ),
            };
          }
          return c;
        });
      } else {
        newVotes[replyId] = "dislike";
        updatedComments = comments.map((c) => {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === replyId) {
                  return {
                    ...r,
                    dislikes: (r.dislikes || 0) + 1,
                    likes: current === "like" ? Math.max(0, r.likes - 1) : r.likes,
                  };
                }
                return r;
              }),
            };
          }
          return c;
        });
      }

      setComments(updatedComments);
      try {
        localStorage.setItem(`entropy_comments_${vidId}`, JSON.stringify(updatedComments));
      } catch {}
      return newVotes;
    });
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      showToast("Video link copied to clipboard!");
    }
  };

  const handleToggleSubscribe = () => {
    if (!currentVideo) return;
    setIsSubscribed(!isSubscribed);
    showToast(!isSubscribed ? `Subscribed to @${currentVideo.channel.handle}` : "Subscription removed");
  };

  const handleSeekToChapter = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    showToast(`Jumped to ${formatDuration(seconds)}`);
  };

  const handleToggleChapters = () => {
    setIsChaptersPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        showToast("Opened Chapters & Most Watched Parts");
        setTimeout(() => {
          chaptersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
      return next;
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVideo) return;
    if (!commentText.trim()) return;

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      user: user ? user.name : "Guest User",
      avatar: user?.avatarUrl || user?.avatar || "/default-avatar.png",
      content: commentText.trim(),
      timeAgo: "Just now",
      likes: 0,
      dislikes: 0,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    try {
      localStorage.setItem(`entropy_comments_${currentVideo.id}`, JSON.stringify(updated));
    } catch {}
    setCommentText("");
    showToast("Comment published");
  };

  if (!currentVideo) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
          <Play className="h-7 w-7 text-zinc-400 ml-0.5" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Video not found</h2>
        <p className="text-xs text-zinc-400 mb-6 max-w-sm">
          This video does not exist or is no longer available.
        </p>
        <Link
          href="/"
          className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
        >
          Explore Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1720px] mx-auto px-4 lg:px-6 py-4 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Left Column: Player & Info */}
      <div className="flex-1 min-w-0">
        {/* Adaptive Video Player with Chapters & forwardRef */}
        <VideoPlayer
          ref={playerRef}
          src={resolvedVideoUrl || currentVideo.rawVideoUrl || currentVideo.masterPlaylistUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}
          poster={currentVideo.thumbnailUrl || undefined}
          autoPlay={true}
          chapters={chapters}
          highlights={highlights}
          onTimeChange={setCurrentPlaybackTime}
          onToggleChapters={handleToggleChapters}
        />

        {/* Video Title */}
        <h1 className="mt-4 text-xl md:text-2xl font-bold text-white tracking-tight">
          {currentVideo.title}
        </h1>

        {/* Channel & Engagement Actions Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-900">
          {/* Channel Info & Subscribe */}
          <div className="flex items-center gap-3">
            <Link href={`/@${currentVideo.channel.handle}`}>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#181818] border border-white/[0.08]">
                <img
                  src={currentVideo.channel.avatarUrl || "/default-avatar.png"}
                  alt={currentVideo.channel.displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
            </Link>
            <div>
              <Link href={`/@${currentVideo.channel.handle}`} className="font-semibold text-sm text-white hover:text-zinc-300 transition-colors">
                <span>{currentVideo.channel.displayName}</span>
              </Link>
              <p className="text-xs text-zinc-400">
                {formatSubscribers(currentVideo.channel.subscribersCount)}
              </p>
            </div>

            {!isOwnVideo && (
              <button
                onClick={handleToggleSubscribe}
                className={`ml-3 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSubscribed
                    ? "bg-[#181818] text-zinc-300 hover:bg-[#222222] border border-white/[0.08] flex items-center gap-1.5"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isSubscribed && <Bell className="h-3.5 w-3.5" />}
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            {/* Like / Dislike with Visible Dislike Count */}
            <div className="flex items-center rounded-full bg-[#181818] p-1 text-white border border-white/[0.08]">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  hasLiked ? "text-white font-bold bg-white/[0.12]" : "text-zinc-300 hover:bg-white/[0.08]"
                }`}
                title="I like this"
              >
                <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-white text-white" : ""}`} />
                <span>{likes.toLocaleString()}</span>
              </button>

              <div className="w-[1px] h-4 bg-white/[0.1] mx-0.5" />

              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  hasDisliked ? "text-white font-bold bg-white/[0.12]" : "text-zinc-300 hover:bg-white/[0.08]"
                }`}
                title="I dislike this"
              >
                <ThumbsDown className={`h-4 w-4 ${hasDisliked ? "fill-white text-white" : ""}`} />
                <span>{dislikes.toLocaleString()}</span>
              </button>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full bg-[#181818] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#222222] border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>

            {/* Save */}
            <button
              onClick={() => {
                setIsSaved(!isSaved);
                showToast(!isSaved ? "Saved to Watch Later" : "Removed from Watch Later");
              }}
              className={`hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer ${
                isSaved ? "bg-white text-black" : "bg-[#181818] text-zinc-200 hover:bg-[#222222]"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-black" : ""}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            {/* More / Action Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`rounded-full p-2 transition-colors cursor-pointer border ${
                  isMoreMenuOpen
                    ? "bg-white text-black border-white"
                    : "bg-[#181818] text-zinc-300 hover:bg-[#222222] border-white/[0.08]"
                }`}
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#141414] border border-white/[0.08] p-1.5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-1 duration-150 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Transcript opened");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <span>Show transcript</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Clip editor opened");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                  >
                    <Scissors className="h-4 w-4 text-zinc-400" />
                    <span>Clip</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Saved to playlist");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                  >
                    <ListPlus className="h-4 w-4 text-zinc-400" />
                    <span>Save to playlist</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.08]" />

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Report submitted");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                  >
                    <Flag className="h-4 w-4 text-zinc-400" />
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* YouTube-Style Description Box */}
        <div className="mt-4 rounded-2xl bg-[#111111] hover:bg-[#141414] p-4 text-xs text-zinc-300 transition-colors border border-white/[0.08]">
          {/* Views, Date & Hashtags Header */}
          <div className="flex flex-wrap items-center gap-2 font-semibold text-white mb-2">
            <span>{formatViews(currentVideo.viewCount)}</span>
            <span>•</span>
            <span>{formatTimeAgo(currentVideo.publishedAt)}</span>
            {currentVideo.tags && (
              <div className="flex items-center gap-2 ml-1">
                {currentVideo.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description Text */}
          <div className={`leading-relaxed text-zinc-300 text-sm ${isDescriptionExpanded ? "" : "line-clamp-2"}`}>
            <p className="whitespace-pre-line mb-1 font-normal">{currentVideo.description}</p>
          </div>

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 text-xs font-bold text-white hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <span>{isDescriptionExpanded ? "Show less" : "...more"}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <div className="flex items-center gap-6 mb-4">
            <h3 className="text-base font-bold text-white">
              {comments.length} Comments
            </h3>
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
            <div className="h-9 w-9 rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden">
              <img
                src={user?.avatarUrl || user?.avatar || "/default-avatar.png"}
                alt={user?.name || "User"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                placeholder={user ? `Comment as ${user.name}...` : "Add a comment..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent border-b border-white/[0.08] focus:border-white/30 outline-none pb-1.5 text-sm text-white placeholder-zinc-500 transition-colors"
              />
              {commentText.trim() && (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCommentText("")}
                    className="px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-white hover:bg-zinc-200 text-black px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Comment
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Comment List */}
          {comments.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments
                .slice()
                .sort((a, b) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return 0;
                })
                .map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "relative flex flex-col p-3.5 rounded-2xl transition-all duration-200 group",
                      comment.isHearted
                        ? "border border-rose-500/30 bg-rose-500/[0.04] shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/15"
                        : comment.isPinned
                        ? "border border-white/[0.08] bg-white/[0.02]"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    {/* Pinned by Channel Owner Banner */}
                    {comment.isPinned && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2 pl-12">
                        <Pin className="h-3.5 w-3.5 text-zinc-300 fill-zinc-300 rotate-45" />
                        <span>
                          Pinned by{" "}
                          <span className="text-zinc-200">
                            @{comment.pinnedBy || currentVideo.channel?.displayName || currentVideo.channel?.handle || "Creator"}
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0">
                        <img
                          src={comment.avatar || "/default-avatar.png"}
                          alt={comment.user}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-zinc-200">@{comment.user}</span>
                            {(comment.user === currentVideo.channel?.displayName ||
                              comment.user === currentVideo.channel?.handle?.replace(/^@/, "")) && (
                              <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                                Creator
                              </span>
                            )}
                            <span className="text-zinc-500">{comment.timeAgo}</span>
                          </div>

                          {/* 3-Dots Action Menu (Pin, Heart, Edit, Delete) */}
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveMenuCommentId(activeMenuCommentId === comment.id ? null : comment.id)}
                              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
                              title="Action menu"
                              aria-label="Comment options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeMenuCommentId === comment.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveMenuCommentId(null)}
                                />
                                <div className="absolute right-0 top-8 z-50 w-36 rounded-xl bg-[#212121] border border-white/[0.12] py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
                                  {/* Pin option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTogglePin(comment.id);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
                                  >
                                    <Pin className={cn("h-4 w-4 rotate-45", comment.isPinned ? "fill-sky-400 text-sky-400" : "")} />
                                    <span>{comment.isPinned ? "Unpin" : "Pin"}</span>
                                  </button>

                                  {/* Heart option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleToggleHeart(comment.id);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
                                  >
                                    <Heart className={cn("h-4 w-4", comment.isHearted ? "fill-rose-500 text-rose-500" : "")} />
                                    <span>{comment.isHearted ? "Remove heart" : "Heart"}</span>
                                  </button>

                                  {/* Edit option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingContent(comment.content);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-left"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Delete option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteComment(comment.id);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Comment Content or Inline Edit Box */}
                        {editingCommentId === comment.id ? (
                          <div className="mt-1 space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-[#181818] border border-white/[0.15] focus:border-white rounded-xl p-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none min-h-[60px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(comment.id);
                                }
                                if (e.key === "Escape") {
                                  setEditingCommentId(null);
                                  setEditingContent("");
                                }
                              }}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingContent("");
                                }}
                                className="px-3 py-1 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={!editingContent.trim()}
                                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-zinc-300 text-sm leading-relaxed">
                            {comment.content}
                            {comment.isEdited && (
                              <span className="text-[11px] text-zinc-500 ml-1.5">(edited)</span>
                            )}
                          </p>
                        )}

                        <div className="flex items-center gap-3.5 mt-2.5 text-zinc-400 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCommentLike(comment.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                              commentVotes[comment.id] === "like" ? "text-white font-semibold" : "hover:text-white"
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${commentVotes[comment.id] === "like" ? "fill-white" : ""}`} />
                            <span>{comment.likes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommentDislike(comment.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                              commentVotes[comment.id] === "dislike" ? "text-white font-semibold" : "hover:text-white"
                            }`}
                          >
                            <ThumbsDown className={`h-3.5 w-3.5 ${commentVotes[comment.id] === "dislike" ? "fill-white" : ""}`} />
                            <span>{comment.dislikes ?? 0}</span>
                          </button>

                          {/* Creator Heart Badge (only shown when hearted, no heart outline when unhearted) */}
                          {comment.isHearted && (
                            <button
                              type="button"
                              onClick={() => handleToggleHeart(comment.id)}
                              className="flex items-center cursor-pointer group transition-transform hover:scale-110"
                              title={`Hearted by @${comment.heartedBy || currentVideo.channel?.displayName || "Creator"}${isChannelOwner ? " (click to remove)" : ""}`}
                            >
                              <div className="relative flex items-center justify-center">
                                <img
                                  src={currentVideo.channel?.avatarUrl || "/entropy-icon.png"}
                                  alt="Creator"
                                  className="h-4 w-4 rounded-full object-cover border border-white/20"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                  }}
                                />
                                <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500 absolute -bottom-0.5 -right-1 drop-shadow-sm" />
                              </div>
                            </button>
                          )}

                          {/* Reply Button (Colored white like the icons and count) */}
                          <button
                            type="button"
                            onClick={() => handleToggleReply(comment.id)}
                            className="font-medium text-white hover:text-zinc-300 transition-colors cursor-pointer text-xs"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Inline Reply Input Box */}
                        {replyingToId === comment.id && (
                          <div className="mt-3 flex gap-3 pl-2 border-l-2 border-zinc-700/60 animate-in fade-in duration-200">
                            <div className="h-7 w-7 rounded-full overflow-hidden bg-[#181818] border border-white/[0.08] flex-shrink-0 mt-0.5">
                              <img
                                src={user?.avatarUrl || user?.avatar || "/default-avatar.png"}
                                alt="You"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                }}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to @${comment.user}...`}
                                className="w-full bg-transparent border-b border-zinc-700 focus:border-white text-xs text-zinc-100 placeholder-zinc-500 pb-1.5 outline-none transition-colors"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddReply(comment.id);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyText("");
                                  }}
                                  className="px-3 py-1 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyText.trim()}
                                  className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Replies Thread Section */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => toggleExpandReplies(comment.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 px-2.5 py-1 rounded-full transition-colors cursor-pointer w-fit"
                            >
                              {expandedReplies[comment.id] ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  <span>Hide {comment.replies.length === 1 ? "reply" : `${comment.replies.length} replies`}</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  <span>{comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}</span>
                                </>
                              )}
                            </button>

                            {expandedReplies[comment.id] && (
                              <div className="mt-2.5 pl-3 space-y-3 border-l-2 border-zinc-800 ml-2 animate-in fade-in duration-200">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-2.5 pt-1">
                                    <div className="h-6 w-6 overflow-hidden rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0">
                                      <img
                                        src={reply.avatar || "/default-avatar.png"}
                                        alt={reply.user}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 text-xs">
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className="font-semibold text-zinc-200">@{reply.user}</span>
                                        {(reply.user === currentVideo.channel?.displayName ||
                                          reply.user === currentVideo.channel?.handle?.replace(/^@/, "")) && (
                                          <span className="bg-white/10 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                            Creator
                                          </span>
                                        )}
                                        <span className="text-zinc-500 text-[11px]">{reply.timeAgo}</span>
                                      </div>
                                      <p className="text-zinc-300 text-xs leading-relaxed">{reply.content}</p>
                                      <div className="flex items-center gap-3 mt-1.5 text-zinc-400">
                                        <button
                                          type="button"
                                          onClick={() => handleReplyLike(comment.id, reply.id)}
                                          className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                            replyVotes[reply.id] === "like" ? "text-white font-semibold" : "hover:text-white"
                                          }`}
                                        >
                                          <ThumbsUp className={`h-3 w-3 ${replyVotes[reply.id] === "like" ? "fill-white text-white" : ""}`} />
                                          {reply.likes > 0 && <span>{reply.likes}</span>}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleReplyDislike(comment.id, reply.id)}
                                          className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                            replyVotes[reply.id] === "dislike" ? "text-white font-semibold" : "hover:text-white"
                                          }`}
                                        >
                                          <ThumbsDown className={`h-3 w-3 ${replyVotes[reply.id] === "dislike" ? "fill-white text-white" : ""}`} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Up Next Videos & Chapters Side Panel (Right Column) */}
      <div className="w-full lg:w-[400px] flex flex-col gap-3">
        {/* Chapters & Most Watched Parts Side Panel (Opened by clicking chapter text in player) */}
        {isChaptersPanelOpen && chapters.length > 0 && (
          <div
            ref={chaptersPanelRef}
            className="rounded-2xl bg-[#141414] border border-white/[0.08] p-3.5 mb-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Header with Title and Close X */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-300" />
                <h3 className="font-bold text-white text-sm">Chapters</h3>
                <span className="text-zinc-500 text-xs">({chapters.length})</span>
              </div>
              <button
                onClick={() => setIsChaptersPanelOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Close chapters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Most Watched Part Highlight Card */}
            {highlights.length > 0 && (
              <div
                onClick={() => handleSeekToChapter(highlights[1]?.startTime || 525)}
                className="mb-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="h-3.5 w-3.5 fill-black ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white text-black px-1.5 py-0.5 rounded shadow-sm">
                        Most watched
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {formatDuration(highlights[1]?.startTime || 525)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 truncate mt-0.5 group-hover:text-white font-medium">
                      {highlights[1]?.title || chapters[2]?.title}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            )}

            {/* Chapters Vertical List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {chapters.map((ch, idx) => {
                const isActive =
                  currentPlaybackTime >= ch.seconds &&
                  (idx === chapters.length - 1 || currentPlaybackTime < chapters[idx + 1].seconds);

                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSeekToChapter(ch.seconds)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? "bg-white/[0.1] border-white text-white shadow-md scale-[1.01]"
                        : "bg-[#111111] border-white/[0.08] text-zinc-300 hover:bg-[#181818] hover:border-white/[0.14] hover:text-white"
                    }`}
                  >
                    <div className="relative aspect-video w-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#181818]">
                      <img src={ch.thumbnailUrl} alt={ch.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 fill-white" />
                      </div>
                      <span className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[9px] font-mono font-bold text-white">
                        {formatDuration(ch.seconds)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-zinc-400">
                          {formatDuration(ch.seconds)}
                        </span>
                        {idx === 2 && (
                          <span className="text-[9px] font-extrabold uppercase bg-white text-black px-1.5 py-0.2 rounded">
                            Most watched
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold line-clamp-2 leading-snug mt-0.5">
                        {ch.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <h3 className="text-sm font-bold text-zinc-300 mb-1">Up next</h3>
        {allRecommendedVideos.map((rec) => (
          <Link
            key={rec.id}
            href={`/watch?v=${rec.id}`}
            className="flex gap-2.5 group cursor-pointer p-1 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-xl bg-[#111111] border border-white/[0.08]">
              <img
                src={rec.thumbnailUrl || ""}
                alt={rec.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[10px] font-semibold text-white">
                {formatDuration(rec.durationSeconds)}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="line-clamp-2 text-xs font-semibold text-zinc-100 group-hover:text-zinc-300 transition-colors">
                {rec.title}
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400">{rec.channel.displayName}</p>
              <p className="text-[11px] text-zinc-500">
                {formatViews(rec.viewCount)} • Recently
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function WatchPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar drawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading video player...</div>}>
          <WatchContent />
        </Suspense>
      </main>
    </div>
  );
}
