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
  X,
  Scissors,
  ListPlus,
  FileText,
  Flag,
} from "lucide-react";
import { formatDuration, formatViews, formatTimeAgo } from "@/lib/utils";
import { ALL_VIDEOS, SAMPLE_CHAPTERS, SAMPLE_HIGHLIGHTS } from "@/lib/mock-data";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserVideos, getVideoBlob, getAllCombinedVideos } from "@/lib/video-storage";
import { VideoItem } from "@/types";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "sample-1";
  const playerRef = useRef<VideoPlayerHandle>(null);
  const chaptersPanelRef = useRef<HTMLDivElement>(null);

  const [currentVideo, setCurrentVideo] = useState<VideoItem>(() => {
    const userVideos = getUserVideos();
    return userVideos.find((v) => v.id === videoId) || ALL_VIDEOS.find((v) => v.id === videoId) || ALL_VIDEOS[0];
  });
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const userVideos = getUserVideos();
    const found = userVideos.find((v) => v.id === videoId) || ALL_VIDEOS.find((v) => v.id === videoId) || ALL_VIDEOS[0];
    setCurrentVideo(found);

    let activeBlobUrl: string | null = null;
    if (found.id.startsWith("v-user-")) {
      getVideoBlob(found.id).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          activeBlobUrl = url;
          setResolvedVideoUrl(url);
        } else if (found.rawVideoUrl) {
          setResolvedVideoUrl(found.rawVideoUrl);
        } else {
          setResolvedVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
        }
      });
    } else {
      setResolvedVideoUrl(found.masterPlaylistUrl || found.rawVideoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
    }

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [videoId]);

  const chapters = currentVideo.chapters || SAMPLE_CHAPTERS;
  const highlights = currentVideo.highlights || SAMPLE_HIGHLIGHTS;
  const allRecommendedVideos = getAllCombinedVideos().filter((v) => v.id !== currentVideo.id);

  const { user, openAuthModal } = useAuth();
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
  interface CommentItem {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timeAgo: string;
    likes: number;
    dislikes: number;
  }

  const [commentText, setCommentText] = useState("");
  const [commentVotes, setCommentVotes] = useState<Record<string, "like" | "dislike">>({});
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
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
        setComments([]);
      }
    } catch {
      setLikes(0);
      setDislikes(0);
      setHasLiked(false);
      setHasDisliked(false);
      setComments([]);
    }
  }, [currentVideo.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLike = () => {
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
        localStorage.setItem(`entropy_comments_${currentVideo.id}`, JSON.stringify(updatedComments));
      } catch {}
      return newVotes;
    });
  };

  const handleCommentDislike = (commentId: string) => {
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
        localStorage.setItem(`entropy_comments_${currentVideo.id}`, JSON.stringify(updatedComments));
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
    if (!commentText.trim()) return;

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      user: user ? user.name : "Guest User",
      avatar: user?.avatarUrl || user?.avatar || "",
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
                  src={currentVideo.channel.avatarUrl || ""}
                  alt={currentVideo.channel.displayName}
                  className="h-full w-full object-cover"
                />
              </div>
            </Link>
            <div>
              <Link href={`/@${currentVideo.channel.handle}`} className="flex items-center gap-1 font-semibold text-sm text-white hover:text-zinc-300 transition-colors">
                <span>{currentVideo.channel.displayName}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
              <p className="text-xs text-zinc-400">
                {((currentVideo.channel.subscribersCount ?? 0) / 1000).toFixed(0)}K subscribers
              </p>
            </div>

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
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            {/* Like / Dislike with Visible Dislike Count */}
            <div className="flex items-center rounded-full bg-[#181818] text-white border border-white/[0.08]">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-l-full px-4 py-2 text-xs font-semibold hover:bg-[#222222] border-r border-white/[0.08] transition-colors cursor-pointer ${
                  hasLiked ? "text-white font-bold bg-[#222222]" : "text-zinc-300"
                }`}
                title="I like this"
              >
                <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-white" : ""}`} />
                <span>{likes.toLocaleString()}</span>
              </button>

              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 rounded-r-full px-4 py-2 text-xs font-semibold hover:bg-[#222222] transition-colors cursor-pointer ${
                  hasDisliked ? "text-white font-bold bg-[#222222]" : "text-zinc-300"
                }`}
                title="I dislike this"
              >
                <ThumbsDown className={`h-4 w-4 ${hasDisliked ? "fill-white" : ""}`} />
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
              {user?.avatarUrl || user?.avatar ? (
                <img src={user.avatarUrl || user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user ? user.name.slice(0, 1).toUpperCase() : "U"}</span>
              )}
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
            <div className="space-y-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0">
                    {comment.avatar ? (
                      <img src={comment.avatar} alt={comment.user} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#222222] flex items-center justify-center text-xs font-bold text-white">
                        {comment.user.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-zinc-200">@{comment.user}</span>
                      <span className="text-zinc-500">{comment.timeAgo}</span>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-zinc-400">
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
                      <button type="button" className="font-semibold hover:text-white transition-colors cursor-pointer">
                        Reply
                      </button>
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
