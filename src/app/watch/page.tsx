"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
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
} from "lucide-react";
import { formatDuration, formatViews } from "@/lib/utils";
import { ALL_VIDEOS, SAMPLE_CHAPTERS, SAMPLE_HIGHLIGHTS } from "@/lib/mock-data";
import Link from "next/link";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "sample-1";
  const playerRef = useRef<VideoPlayerHandle>(null);

  const currentVideo = ALL_VIDEOS.find((v) => v.id === videoId) || ALL_VIDEOS[0];
  const chapters = currentVideo.chapters || SAMPLE_CHAPTERS;
  const highlights = currentVideo.highlights || SAMPLE_HIGHLIGHTS;

  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(14250);
  const [dislikes, setDislikes] = useState(420);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    {
      id: "c-1",
      user: "DevOpsNinja",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content: "The explanation of multi-bitrate HLS ladders and segment packaging was crystal clear. Thanks!",
      timeAgo: "2 days ago",
      likes: 124,
    },
    {
      id: "c-2",
      user: "AsyncStreamer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "Are you planning to cover WebRTC low-latency streaming in a follow-up video?",
      timeAgo: "1 day ago",
      likes: 42,
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

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments([
      {
        id: `c-${Date.now()}`,
        user: "CurrentUser",
        avatar: "",
        content: commentText.trim(),
        timeAgo: "Just now",
        likes: 0,
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
          onTimeChange={setCurrentPlaybackTime}
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

            {/* More */}
            <button className="rounded-full bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* YouTube-Style Description Box with Clickable Timestamps and Chapters Shelf */}
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
            <p className="whitespace-pre-line mb-3 font-normal">{currentVideo.description}</p>

            {/* Clickable Timestamps in Description (like YouTube) */}
            {chapters.length > 0 && (
              <div className="mt-3 space-y-1.5 pt-3 border-t border-zinc-800/80 font-mono text-xs">
                <div className="text-xs font-semibold font-sans text-zinc-400 mb-2 tracking-wide">
                  TIMESTAMPS
                </div>
                {chapters.map((ch, idx) => (
                  <div key={ch.id} className="flex items-center gap-2.5 group py-0.5">
                    <button
                      onClick={() => handleSeekToChapter(ch.seconds)}
                      className="text-white bg-zinc-800/90 hover:bg-white hover:text-black px-2 py-0.5 rounded font-mono font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {formatDuration(ch.seconds)}
                    </button>
                    <span className="text-zinc-300 group-hover:text-white transition-colors font-sans text-xs">
                      {ch.title}
                    </span>
                    {idx === 2 && (
                      <span className="text-[10px] font-sans font-bold bg-white text-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Most watched
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YouTube-Style Chapters Shelf Carousel inside / under Description */}
          {chapters.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-zinc-300" />
                  <span className="font-bold text-white text-xs tracking-wide">Chapters</span>
                  <span className="text-zinc-500 text-xs">({chapters.length})</span>
                </div>

                {/* Most Watched Parts Callout in YouTube Chapters Shelf */}
                {highlights.length > 0 && (
                  <button
                    onClick={() => handleSeekToChapter(highlights[1]?.startTime || 525)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/10 hover:bg-white hover:text-black px-2.5 py-1 rounded-full transition-colors cursor-pointer border border-white/10"
                    title="Jump to Most Watched Part"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Most watched: {formatDuration(highlights[1]?.startTime || 525)}</span>
                  </button>
                )}
              </div>

              {/* Horizontal Scroll Carousel of Chapter Cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {chapters.map((ch, idx) => {
                  const isActive =
                    currentPlaybackTime >= ch.seconds &&
                    (idx === chapters.length - 1 || currentPlaybackTime < chapters[idx + 1].seconds);

                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleSeekToChapter(ch.seconds)}
                      className={`flex flex-col text-left rounded-xl overflow-hidden flex-shrink-0 w-44 p-1.5 border transition-all cursor-pointer group ${
                        isActive
                          ? "bg-white/10 border-white text-white shadow-lg"
                          : "bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-800 mb-1.5">
                        <img
                          src={ch.thumbnailUrl}
                          alt={ch.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 fill-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[9px] font-mono font-bold text-white">
                          {formatDuration(ch.seconds)}
                        </span>
                        {idx === 2 && (
                          <span className="absolute top-1 left-1 rounded bg-white text-black px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-tight shadow-sm">
                            Most watched
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold line-clamp-1 group-hover:text-white transition-colors">
                        {ch.title}
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {formatDuration(ch.seconds)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-3 text-xs font-bold text-white hover:underline cursor-pointer inline-flex items-center gap-1"
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
            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
              U
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
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
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likes || ""}</span>
                    </button>
                    <button className="hover:text-white transition-colors cursor-pointer">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button className="font-semibold hover:text-white transition-colors cursor-pointer">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Up Next Videos (Right Column) */}
      <div className="w-full lg:w-[400px] flex flex-col gap-3">
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
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading video player...</div>}>
          <WatchContent />
        </Suspense>
      </main>
    </div>
  );
}
