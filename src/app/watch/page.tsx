"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import VideoPlayer from "@/components/video/VideoPlayer";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MoreHorizontal,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { formatViews } from "@/lib/utils";
import Link from "next/link";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "sample-1";

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(14250);
  const [dislikes, setDislikes] = useState(420);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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
    }
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
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1720px] mx-auto px-4 lg:px-6 py-4">
      {/* Primary Left Column: Player & Info */}
      <div className="flex-1">
        {/* Adaptive Video Player */}
        <VideoPlayer
          src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
          autoPlay={true}
        />

        {/* Video Title */}
        <h1 className="mt-4 text-xl md:text-2xl font-bold text-white tracking-tight">
          Building a Distributed Video Transcoder with Go, FFmpeg & S3 (Video ID: {videoId})
        </h1>

        {/* Channel & Engagement Actions Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-900">
          {/* Channel Info & Subscribe */}
          <div className="flex items-center gap-3">
            <Link href="/@systemcraft">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                  alt="SystemCraft Tech"
                  className="h-full w-full object-cover"
                />
              </div>
            </Link>
            <div>
              <Link href="/@systemcraft" className="flex items-center gap-1 font-semibold text-sm text-white hover:text-zinc-300 transition-colors">
                <span>SystemCraft Tech</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
              <p className="text-xs text-zinc-400">245K subscribers</p>
            </div>

            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
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
            <button className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>

            {/* Save */}
            <button className="hidden sm:flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer">
              <Bookmark className="h-4 w-4" />
              <span>Save</span>
            </button>

            {/* More */}
            <button className="rounded-full bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expandable Description */}
        <div
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          className="cursor-pointer rounded-2xl bg-zinc-950 p-4 hover:bg-zinc-900/60 transition-colors text-sm text-zinc-200 border border-zinc-900 mt-4"
        >
          <div className="font-semibold text-xs text-zinc-400 flex items-center gap-2 mb-1.5">
            <span>{formatViews(142500)}</span>
            <span>•</span>
            <span>2 days ago</span>
          </div>
          <p className={isDescriptionExpanded ? "whitespace-pre-line text-zinc-300 leading-relaxed" : "line-clamp-2 text-zinc-400"}>
            In this complete architecture walkthrough, we build an end-to-end distributed video transcoding pipeline.
            We examine chunked uploads, direct S3 uploads with presigned URLs, asynchronous job queues using Redis and BullMQ,
            and FFmpeg HLS segmentation for multi-bitrate adaptive streaming.
            {"\n\n"}
            Chapters:
            {"\n"}0:00 - Introduction & Architecture Overview
            {"\n"}3:20 - Direct Ingestion & S3 Setup
            {"\n"}8:45 - FFmpeg Multi-bitrate Command Formulation
            {"\n"}15:30 - HLS Master Playlist & Chunk Generation
            {"\n"}22:00 - Client-side Adaptive Bitrate Playback
          </p>
          <button className="mt-2 text-xs font-bold text-zinc-400 hover:text-white">
            {isDescriptionExpanded ? "Show less" : "...more"}
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
                    className="rounded-full bg-white hover:bg-zinc-200 text-black px-4 py-1.5 text-xs font-bold transition-colors"
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
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likes || ""}</span>
                    </button>
                    <button className="hover:text-white transition-colors">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button className="font-semibold hover:text-white transition-colors">Reply</button>
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
        {[
          {
            id: "sample-2",
            title: "Next.js 16 Full Stack Architecture Deep Dive",
            channel: "React Mastery",
            views: "88K views",
            timeAgo: "12 hours ago",
            thumb: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
            duration: "14:50",
          },
          {
            id: "sample-3",
            title: "Why Modern Operating Systems Are So Complex",
            channel: "CS Insights",
            views: "420K views",
            timeAgo: "1 week ago",
            thumb: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
            duration: "38:30",
          },
          {
            id: "sample-4",
            title: "Designing Interactive Visualizations with Shaders & WebGL",
            channel: "Creative Code Labs",
            views: "31K views",
            timeAgo: "2 days ago",
            thumb: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
            duration: "10:15",
          },
        ].map((rec) => (
          <Link
            key={rec.id}
            href={`/watch?v=${rec.id}`}
            className="flex gap-2.5 group cursor-pointer p-1 rounded-xl hover:bg-zinc-950 transition-colors"
          >
            <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
              <img
                src={rec.thumb}
                alt={rec.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[10px] font-semibold text-white">
                {rec.duration}
              </span>
            </div>
            <div className="flex flex-col flex-1">
              <h4 className="line-clamp-2 text-xs font-semibold text-zinc-100 group-hover:text-zinc-300 transition-colors">
                {rec.title}
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400">{rec.channel}</p>
              <p className="text-[11px] text-zinc-500">
                {rec.views} • {rec.timeAgo}
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
