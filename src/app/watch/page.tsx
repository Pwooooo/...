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
  const [activeTab, setActiveTab] = useState<"overview" | "chapters" | "highlights">("chapters");
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

        {/* Video Highlights & Chapters Section */}
        <div className="mt-4 bg-zinc-950 rounded-2xl border border-white/10 p-4 overflow-hidden">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3 mb-4">
            <button
              onClick={() => setActiveTab("chapters")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                activeTab === "chapters"
                  ? "bg-white/[0.08] text-white border-white/40 shadow-sm"
                  : "bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Chapters ({chapters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("highlights")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                activeTab === "highlights"
                  ? "bg-white/[0.08] text-white border-white/40 shadow-sm"
                  : "bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Key Highlights ({highlights.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                activeTab === "overview"
                  ? "bg-white/[0.08] text-white border-white/40 shadow-sm"
                  : "bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Overview</span>
            </button>
          </div>

          {/* Chapters List */}
          {activeTab === "chapters" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chapters.map((ch, idx) => {
                const isActive =
                  currentPlaybackTime >= ch.seconds &&
                  (idx === chapters.length - 1 || currentPlaybackTime < chapters[idx + 1].seconds);

                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSeekToChapter(ch.seconds)}
                    className={`flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? "bg-white/10 border-white text-white shadow-md scale-[1.02]"
                        : "bg-zinc-900/60 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="relative aspect-video w-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                      <img src={ch.thumbnailUrl} alt={ch.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 fill-white" />
                      </div>
                      <span className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[9px] font-mono font-bold text-white">
                        {formatDuration(ch.seconds)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-2 leading-snug">{ch.title}</p>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                        Part {idx + 1}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Highlights List */}
          {activeTab === "highlights" && (
            <div className="space-y-2">
              {highlights.map((hl) => (
                <div
                  key={hl.id}
                  onClick={() => handleSeekToChapter(hl.startTime)}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/10 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-zinc-200">{hl.title}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {formatDuration(hl.startTime)} - {formatDuration(hl.endTime)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {hl.tag}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="cursor-pointer text-sm text-zinc-300"
            >
              <div className="font-semibold text-xs text-zinc-400 flex items-center gap-2 mb-1.5">
                <span>{formatViews(currentVideo.viewCount)}</span>
                <span>•</span>
                <span>2 days ago</span>
              </div>
              <p className={isDescriptionExpanded ? "whitespace-pre-line leading-relaxed" : "line-clamp-3 text-zinc-400"}>
                {currentVideo.description}
              </p>
              <button className="mt-2 text-xs font-bold text-white hover:underline">
                {isDescriptionExpanded ? "Show less" : "...more"}
              </button>
            </div>
          )}
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
