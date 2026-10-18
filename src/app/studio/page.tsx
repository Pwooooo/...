"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { VideoItem, CommentItem } from "@/types";
import { getAllCombinedVideos, fetchServerVideos, isShortVideo } from "@/lib/video-storage";
import { formatViews, formatDuration, formatTimeAgo } from "@/lib/utils";
import { resolveChannelAvatar } from "@/lib/user-validation";
import {
  Upload,
  Video as VideoIcon,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Eye,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  ExternalLink,
  Heart,
  Plus,
  Play,
  Share2,
} from "lucide-react";

interface RecentCommentWithVideo {
  comment: CommentItem;
  videoTitle: string;
  videoId: string;
  videoThumb: string;
}

export default function StudioDashboardPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [recentComments, setRecentComments] = useState<RecentCommentWithVideo[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const all = getAllCombinedVideos();
    setVideos(all);

    fetchServerVideos().then((srv) => {
      setVideos(getAllCombinedVideos());
    });
  }, []);

  // Collect recent comments across all videos
  useEffect(() => {
    if (typeof window === "undefined" || videos.length === 0) return;

    const collected: RecentCommentWithVideo[] = [];

    videos.slice(0, 10).forEach((v) => {
      try {
        const raw = localStorage.getItem(`entropy_comments_${v.id}`);
        if (raw) {
          const parsed: CommentItem[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              collected.push({
                comment: c,
                videoId: v.id,
                videoTitle: v.title,
                videoThumb: v.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg",
              });
            });
          }
        }
      } catch {}
    });

    // If no localStorage comments, provide friendly starter studio feedback
    if (collected.length === 0 && videos.length > 0) {
      const firstVid = videos[0];
      collected.push(
        {
          comment: {
            id: "dash-c1",
            user: "Alex Rivera",
            userHandle: "alex_r",
            avatar: "/default-avatar.png",
            content: "The theater mode and mini player workflow is insanely smooth! Huge release.",
            createdAt: Date.now() - 3600000 * 2,
            timeAgo: "2 hours ago",
            likes: 14,
            dislikes: 0,
            isHearted: true,
          },
          videoId: firstVid.id,
          videoTitle: firstVid.title,
          videoThumb: firstVid.thumbnailUrl || "",
        },
        {
          comment: {
            id: "dash-c2",
            user: "Devon Tech",
            userHandle: "devon_tech",
            avatar: "/default-avatar.png",
            content: "Zero cloud storage offline video test was brilliant. Love the dark studio UI.",
            createdAt: Date.now() - 3600000 * 8,
            timeAgo: "8 hours ago",
            likes: 7,
            dislikes: 0,
          },
          videoId: firstVid.id,
          videoTitle: firstVid.title,
          videoThumb: firstVid.thumbnailUrl || "",
        }
      );
    }

    setRecentComments(collected.slice(0, 5));
  }, [videos]);

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  const latestVideo = videos.find((v) => !isShortVideo(v)) || videos[0];
  const totalViews = videos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
  const totalWatchTimeHours = Number(
    (
      videos.reduce(
        (acc, v) => acc + (v.viewCount || 0) * (v.durationSeconds || 15) * 0.68,
        0
      ) / 3600
    ).toFixed(1)
  );
  const subscriberCount = user?.subscribersCount ?? videos[0]?.channel?.subscribersCount ?? 1280;
  const netSubsInPeriod = Math.max(1, Math.round(totalViews * 0.024));

  const handleToggleHeart = (commentId: string, videoId: string) => {
    setRecentComments((prev) =>
      prev.map((item) => {
        if (item.comment.id === commentId) {
          const nextState = !item.comment.isHearted;
          // Sync with localStorage
          try {
            const raw = localStorage.getItem(`entropy_comments_${videoId}`);
            if (raw) {
              const list: CommentItem[] = JSON.parse(raw);
              const updated = list.map((c) =>
                c.id === commentId ? { ...c, isHearted: nextState } : c
              );
              localStorage.setItem(`entropy_comments_${videoId}`, JSON.stringify(updated));
            }
          } catch {}
          showToast(nextState ? "Hearted comment" : "Unhearted comment");
          return {
            ...item,
            comment: { ...item.comment, isHearted: nextState },
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-white text-black font-semibold text-xs px-4 py-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Channel dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Welcome back, <span className="text-white font-medium">{user?.name || "Creator"}</span>. Here is what is happening with your channel today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload video</span>
          </Link>
          <Link
            href={`/@${(user?.handle || "creator").replace(/^@/, "")}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View channel</span>
          </Link>
        </div>
      </div>

      {/* Grid: Left Column (Video Performance) + Right Column (Analytics & Comments) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Latest Video Performance */}
          {latestVideo ? (
            <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl hover:border-white/15 transition-all">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                  <h3 className="font-bold text-sm text-white">Latest video performance</h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Published {formatTimeAgo(latestVideo.publishedAt)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Thumbnail & Title */}
                <div className="md:col-span-6 group relative rounded-xl overflow-hidden aspect-video bg-zinc-900 border border-white/10">
                  <img
                    src={latestVideo.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg"}
                    alt={latestVideo.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      href={`/watch?v=${latestVideo.id}`}
                      className="p-3 rounded-full bg-white text-black shadow-xl hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="h-5 w-5 fill-black ml-0.5" />
                    </Link>
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                    {formatDuration(latestVideo.durationSeconds || 15)}
                  </span>
                </div>

                {/* Performance Stats */}
                <div className="md:col-span-6 space-y-3">
                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                    {latestVideo.title}
                  </h4>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Ranking by views</span>
                      <span className="font-semibold text-white font-mono">1 of {videos.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Views</span>
                      <span className="font-bold text-white font-mono">{formatViews(latestVideo.viewCount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Impressions click-through rate</span>
                      <span className="font-semibold text-emerald-400 font-mono">8.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Average view duration</span>
                      <span className="font-semibold text-white font-mono">2:45 (68%)</span>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <Link
                      href="/studio/analytics"
                      className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Go to video analytics</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-zinc-600">•</span>
                    <Link
                      href="/studio/comments"
                      className="text-xs text-zinc-300 hover:text-white font-medium transition-colors"
                    >
                      See comments
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* 2. Published Videos Snapshot */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4 text-white" />
                <h3 className="font-bold text-sm text-white">Published videos</h3>
              </div>
              <Link
                href="/studio/videos"
                className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                <span>See all content</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-1">
              {videos.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
                    <VideoIcon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-white">No videos published yet</p>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                    Upload your first video to start tracking performance metrics and comments.
                  </p>
                  <Link
                    href="/studio/upload"
                    className="mt-4 px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow cursor-pointer"
                  >
                    Upload video
                  </Link>
                </div>
              ) : (
                videos.slice(0, 4).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative aspect-video w-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
                      <img
                        src={v.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg"}
                        alt={v.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/watch?v=${v.id}`}
                        className="font-semibold text-xs text-zinc-200 group-hover:text-white line-clamp-1 transition-colors"
                      >
                        {v.title}
                      </Link>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {formatTimeAgo(v.publishedAt)} • {v.category || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-zinc-400 font-mono flex-shrink-0">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{formatViews(v.viewCount || 0)}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-zinc-300">
                      <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                      <span>98%</span>
                    </div>
                    <Link
                      href={`/watch?v=${v.id}`}
                      className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Watch video"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )))
            }
            </div>
          </div>
        </div>

        {/* Right Column (1 col on lg) */}
        <div className="space-y-6">
          {/* 1. Channel Analytics Overview */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-white" />
                <h3 className="font-bold text-sm text-white">Channel analytics</h3>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Current subscribers</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white tracking-tight font-mono">
                    {subscriberCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 font-mono">+{netSubsInPeriod} in last 28 days</span>
                </div>
              </div>

              <div className="pt-3 space-y-3">
                <p className="text-xs font-bold text-zinc-300">Summary (Last 28 days)</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Views</span>
                  <span className="font-bold text-white font-mono">{formatNumber(totalViews)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Watch time (hours)</span>
                  <span className="font-bold text-white font-mono">{totalWatchTimeHours}</span>
                </div>
              </div>

              <div className="pt-3">
                <Link
                  href="/studio/analytics"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer"
                >
                  <span>Go to channel analytics</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Recent Comments Inbox */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-white" />
                <h3 className="font-bold text-sm text-white">Recent comments</h3>
              </div>
              <Link
                href="/studio/comments"
                className="text-xs text-zinc-300 hover:text-white font-semibold transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {recentComments.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No comments yet</p>
              ) : (
                recentComments.map((item) => (
                  <div key={item.comment.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img
                            src={item.comment.avatar || "/default-avatar.png"}
                            alt={item.comment.user}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold text-white truncate">{item.comment.user}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                        {item.comment.timeAgo || "Recently"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-2 pl-8">
                      {item.comment.content}
                    </p>

                    <div className="pl-8 pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                        on {item.videoTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleHeart(item.comment.id, item.videoId)}
                        className={`p-1 rounded-full transition-colors cursor-pointer hover:bg-white/10 ${
                          item.comment.isHearted
                            ? "text-white"
                            : "text-zinc-500 hover:text-white"
                        }`}
                        title={item.comment.isHearted ? "Unheart" : "Creator heart"}
                      >
                        <Heart className={`h-3.5 w-3.5 ${item.comment.isHearted ? "fill-white text-white" : ""}`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
