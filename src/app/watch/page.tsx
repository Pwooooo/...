"use client";

import React, { useState, useRef, Suspense } from "react";
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
import { formatDuration, formatViews } from "@/lib/utils";
import { ALL_VIDEOS, SAMPLE_CHAPTERS, SAMPLE_HIGHLIGHTS } from "@/lib/mock-data";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "sample-1";
  const playerRef = useRef<VideoPlayerHandle>(null);
  const chaptersPanelRef = useRef<HTMLDivElement>(null);

  const currentVideo = ALL_VIDEOS.find((v) => v.id === videoId) || ALL_VIDEOS[0];
  const chapters = currentVideo.chapters || SAMPLE_CHAPTERS;
  const highlights = currentVideo.highlights || SAMPLE_HIGHLIGHTS;

  const { user, openAuthModal } = useAuth();
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isChaptersPanelOpen, setIsChaptersPanelOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(14250);
  const [dislikes, setDislikes] = useState(420);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentVotes, setCommentVotes] = useState<Record<string, "like" | "dislike">>({});
  const [comments, setComments] = useState([
    {
      id: "c-1",
      user: "DevOpsNinja",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content: "The explanation of multi-bitrate HLS ladders and segment packaging was crystal clear. Thanks!",
      timeAgo: "2 days ago",
      likes: 124,
      dislikes: 3,
    },
    {
      id: "c-2",
      user: "AsyncStreamer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "Are you planning to cover WebRTC low-latency streaming in a follow-up video?",
      timeAgo: "1 day ago",
      likes: 42,
      dislikes: 1,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      setHasLiked(true);
      if (hasDisliked) {
        setHasDisliked(false);
        setDislikes((prev) => prev - 1);
      }
      setLikes((prev) => prev + 1);
      showToast("Added to Liked videos");
    }
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
      setDislikes((prev) => prev - 1);
    } else {
      setHasDisliked(true);
      if (hasLiked) {
        setHasLiked(false);
        setLikes((prev) => prev - 1);
      }
      setDislikes((prev) => prev + 1);
      showToast("Feedback recorded");
    }
  };

  const handleCommentLike = (commentId: string) => {
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const newVotes = { ...prev };
      if (current === "like") {
        delete newVotes[commentId];
        setComments((list) =>
          list.map((c) => (c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c))
        );
      } else {
        newVotes[commentId] = "like";
        setComments((list) =>
          list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likes: c.likes + 1,
                dislikes: current === "dislike" ? Math.max(0, c.dislikes - 1) : c.dislikes,
              };
            }
            return c;
          })
        );
      }
      return newVotes;
    });
  };

  const handleCommentDislike = (commentId: string) => {
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const newVotes = { ...prev };
      if (current === "dislike") {
        delete newVotes[commentId];
        setComments((list) =>
          list.map((c) => (c.id === commentId ? { ...c, dislikes: Math.max(0, c.dislikes - 1) } : c))
        );
      } else {
        newVotes[commentId] = "dislike";
        setComments((list) =>
          list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                dislikes: c.dislikes + 1,
                likes: current === "like" ? Math.max(0, c.likes - 1) : c.likes,
              };
            }
            return c;
          })
        );
      }
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

    setComments([
      {
        id: `c-${Date.now()}`,
        user: user ? user.name : "Guest User",
        avatar: user?.avatar || "",
        content: commentText.trim(),
        timeAgo: "Just now",
        likes: 0,
        dislikes: 0,
      },
      ...comments,
    ]);
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
          src={currentVideo.masterPlaylistUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}
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
              <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
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
                  ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1.5"
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
            <div className="flex items-center rounded-full bg-zinc-900 text-white border border-zinc-800">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-l-full px-4 py-2 text-xs font-semibold hover:bg-zinc-800 border-r border-zinc-800 transition-colors cursor-pointer ${
                  hasLiked ? "text-white font-bold bg-zinc-800" : "text-zinc-300"
                }`}
                title="I like this"
              >
                <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-white" : ""}`} />
                <span>{likes.toLocaleString()}</span>
              </button>

              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 rounded-r-full px-4 py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer ${
                  hasDisliked ? "text-white font-bold bg-zinc-800" : "text-zinc-300"
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
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
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
              className={`hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer ${
                isSaved ? "bg-white text-black" : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
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
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800"
                }`}
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-zinc-950 border border-white/10 p-1.5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-1 duration-150 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Transcript opened");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <span>Show transcript</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Clip editor opened");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Scissors className="h-4 w-4 text-zinc-400" />
                    <span>Clip</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Saved to playlist");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <ListPlus className="h-4 w-4 text-zinc-400" />
                    <span>Save to playlist</span>
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      showToast("Report submitted");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
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
        <div className="mt-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/80 p-4 text-xs text-zinc-300 transition-colors border border-white/5">
          {/* Views, Date & Hashtags Header */}
          <div className="flex flex-wrap items-center gap-2 font-semibold text-white mb-2">
            <span>{formatViews(currentVideo.viewCount)}</span>
            <span>•</span>
            <span>2 days ago</span>
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
            <div className="h-9 w-9 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
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
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none pb-1.5 text-sm text-white placeholder-zinc-500 transition-colors"
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
          <div className="space-y-5">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800 flex-shrink-0">
                  {comment.avatar ? (
                    <img src={comment.avatar} alt={comment.user} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
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
        </div>
      </div>

      {/* Recommended Up Next Videos & Chapters Side Panel (Right Column) */}
      <div className="w-full lg:w-[400px] flex flex-col gap-3">
        {/* Chapters & Most Watched Parts Side Panel (Opened by clicking chapter text in player) */}
        {isChaptersPanelOpen && chapters.length > 0 && (
          <div
            ref={chaptersPanelRef}
            className="rounded-2xl bg-zinc-950 border border-white/10 p-3.5 mb-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Header with Title and Close X */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-300" />
                <h3 className="font-bold text-white text-sm">Chapters</h3>
                <span className="text-zinc-500 text-xs">({chapters.length})</span>
              </div>
              <button
                onClick={() => setIsChaptersPanelOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close chapters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Most Watched Part Highlight Card */}
            {highlights.length > 0 && (
              <div
                onClick={() => handleSeekToChapter(highlights[1]?.startTime || 525)}
                className="mb-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all flex items-center justify-between group"
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
                        ? "bg-white/10 border-white text-white shadow-md scale-[1.01]"
                        : "bg-zinc-900/50 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <div className="relative aspect-video w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
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
        {ALL_VIDEOS.filter((v) => v.id !== videoId).map((rec) => (
          <Link
            key={rec.id}
            href={`/watch?v=${rec.id}`}
            className="flex gap-2.5 group cursor-pointer p-1 rounded-xl hover:bg-zinc-950 transition-colors"
          >
            <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
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
