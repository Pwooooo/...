"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import VerifiedBadge from "@/components/common/VerifiedBadge";
import {
  getAllCombinedVideos,
  getBaseVideos,
  fetchServerVideos,
  isShortVideo,
} from "@/lib/video-storage";
import { getRegisteredUsers, resolveChannelAvatar } from "@/lib/user-validation";
import { VideoItem } from "@/types";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  PlaySquare,
  Flame,
  CheckCircle2,
  Film,
  Sparkles,
  SlidersHorizontal,
  Bell,
  UserCheck,
  Plus,
} from "lucide-react";

interface SubscribedChannel {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  subscribersCount?: number;
  hasNew?: boolean;
}

export default function SubscriptionsPage() {
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "videos" | "shorts">("all");
  const [allVideos, setAllVideos] = useState<VideoItem[]>(() => getBaseVideos());
  const [subscribedHandles, setSubscribedHandles] = useState<Set<string>>(new Set());
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);

  // Load all platform videos and listen for updates
  useEffect(() => {
    const updateVideos = () => {
      setAllVideos(getAllCombinedVideos());
    };

    updateVideos();
    fetchServerVideos().then(updateVideos);

    window.addEventListener("entropy_videos_updated", updateVideos);
    window.addEventListener("entropy_user_updated", updateVideos);
    window.addEventListener("storage", updateVideos);
    return () => {
      window.removeEventListener("entropy_videos_updated", updateVideos);
      window.removeEventListener("entropy_user_updated", updateVideos);
      window.removeEventListener("storage", updateVideos);
    };
  }, []);

  // Load active subscriptions from localStorage
  const loadSubscriptions = () => {
    if (typeof window === "undefined") return;
    try {
      const subs = new Set<string>();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("entropy_subscribed_")) {
          const val = localStorage.getItem(key);
          if (val === "true") {
            const h = key.replace("entropy_subscribed_", "").toLowerCase().trim();
            if (h) subs.add(h);
          }
        }
      }
      setSubscribedHandles(subs);
    } catch {
      setSubscribedHandles(new Set());
    }
  };

  useEffect(() => {
    loadSubscriptions();

    window.addEventListener("entropy_subscriptions_updated", loadSubscriptions);
    window.addEventListener("storage", loadSubscriptions);
    return () => {
      window.removeEventListener("entropy_subscriptions_updated", loadSubscriptions);
      window.removeEventListener("storage", loadSubscriptions);
    };
  }, []);

  // Build full list of channels on Entropy (from videos and registered users)
  const allKnownChannels = useMemo(() => {
    const map = new Map<string, SubscribedChannel>();

    // 1. Add official Entropy channel
    map.set("entropy", {
      id: "u-entropy-official",
      handle: "entropy",
      displayName: "Entropy",
      avatarUrl: "/entropy-icon.png",
      subscribersCount: 105000,
      hasNew: true,
    });

    // 2. Scan all combined videos
    allVideos.forEach((v) => {
      const ch = v.channel;
      if (!ch) return;
      const cleanH = (ch.handle || ch.displayName || "").replace(/^@/, "").toLowerCase().trim();
      if (!cleanH) return;

      if (!map.has(cleanH)) {
        map.set(cleanH, {
          id: ch.id || `ch-${cleanH}`,
          handle: cleanH,
          displayName: ch.displayName || cleanH,
          avatarUrl: resolveChannelAvatar(ch),
          subscribersCount: ch.subscribersCount,
          hasNew: true,
        });
      }
    });

    // 3. Scan registered users
    const registered = getRegisteredUsers();
    registered.forEach((u) => {
      const cleanH = (u.handle || "").replace(/^@/, "").toLowerCase().trim();
      if (!cleanH) return;
      if (!map.has(cleanH)) {
        map.set(cleanH, {
          id: u.id,
          handle: cleanH,
          displayName: u.name || cleanH,
          avatarUrl: u.avatarUrl || u.avatar || "/default-avatar.png",
          subscribersCount: u.subscribersCount,
          hasNew: false,
        });
      }
    });

    return Array.from(map.values());
  }, [allVideos]);

  // Channels the user is actively subscribed to
  const subscribedChannelsList = useMemo(() => {
    return allKnownChannels.filter((ch) => subscribedHandles.has(ch.handle.toLowerCase()));
  }, [allKnownChannels, subscribedHandles]);

  // Filtered videos based on subscriptions and selected channel
  const filteredVideos = useMemo(() => {
    return allVideos.filter((video) => {
      const ch = video.channel;
      const chHandle = (ch?.handle || ch?.displayName || "").replace(/^@/, "").toLowerCase().trim();

      // Real Subscription Filtering: must be subscribed to this channel
      if (!subscribedHandles.has(chHandle)) {
        return false;
      }

      // Channel avatar filter
      if (selectedHandle && chHandle !== selectedHandle.toLowerCase()) {
        return false;
      }

      // Content type filter
      const isShort = isShortVideo(video);
      if (filterType === "videos" && isShort) return false;
      if (filterType === "shorts" && !isShort) return false;

      return true;
    });
  }, [allVideos, subscribedHandles, selectedHandle, filterType]);

  // Quick subscribe toggle for recommended channels in empty state
  const handleToggleSubscribe = (channelHandle: string) => {
    if (typeof window === "undefined") return;
    const clean = channelHandle.toLowerCase().trim();
    const isSubbed = subscribedHandles.has(clean);
    const nextVal = !isSubbed;

    localStorage.setItem(`entropy_subscribed_${clean}`, nextVal ? "true" : "false");
    window.dispatchEvent(new Event("entropy_subscriptions_updated"));
    loadSubscriptions();
  };

  const selectedChannelInfo = useMemo(() => {
    if (!selectedHandle) return null;
    return allKnownChannels.find((c) => c.handle.toLowerCase() === selectedHandle.toLowerCase());
  }, [selectedHandle, allKnownChannels]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      <div className="flex flex-1">
        <Sidebar collapsed={collapsedSidebar} />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-5">
          {/* Subscribed Channels Avatar Story Bar */}
          {subscribedChannelsList.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-4 overflow-x-auto pt-3 pb-4 px-3 -mx-3 border-b border-white/[0.08] scrollbar-none">
                {/* "All" circular button */}
                <button
                  type="button"
                  onClick={() => setSelectedHandle(null)}
                  className={`flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer transition-all select-none p-1 ${
                    selectedHandle === null ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`}
                  title="View all subscriptions"
                >
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      selectedHandle === null
                        ? "bg-white text-black ring-2 ring-white ring-offset-2 ring-offset-black shadow-lg"
                        : "bg-[#181818] text-zinc-300 border border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span>All</span>
                  </div>
                  <span
                    className={`text-xs transition-colors ${
                      selectedHandle === null ? "text-white font-bold" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  >
                    All
                  </span>
                </button>

                {/* Subscribed Channel Avatars */}
                {subscribedChannelsList.map((channel) => {
                  const isSelected = selectedHandle === channel.handle;
                  return (
                    <button
                      key={channel.handle}
                      type="button"
                      onClick={() =>
                        setSelectedHandle(isSelected ? null : channel.handle)
                      }
                      className={`flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer transition-all select-none p-1 ${
                        isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                      }`}
                      title={`Filter by @${channel.handle}`}
                    >
                      <div className="relative">
                        <div
                          className={`h-14 w-14 rounded-full overflow-hidden bg-zinc-900 transition-all ${
                            isSelected
                              ? "ring-2 ring-white ring-offset-2 ring-offset-black shadow-lg"
                              : "border-2 border-transparent group-hover:border-white/40"
                          }`}
                        >
                          <img
                            src={channel.avatarUrl || "/default-avatar.png"}
                            alt={channel.displayName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                            }}
                          />
                        </div>

                        {/* Blue unread / new video indicator */}
                        {channel.hasNew && (
                          <span
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-blue-500 ring-2 ring-black"
                            title="New uploads available"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 max-w-[76px]">
                        <span
                          className={`text-xs truncate transition-colors ${
                            isSelected
                              ? "text-white font-bold"
                              : "text-zinc-300 group-hover:text-white"
                          }`}
                        >
                          {channel.displayName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subscriptions Header Controls & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-100">
                {selectedChannelInfo ? (
                  <span className="flex items-center gap-2">
                    <span>Videos from {selectedChannelInfo.displayName}</span>
                    <VerifiedBadge subscribersCount={selectedChannelInfo.subscribersCount} />
                    <button
                      type="button"
                      onClick={() => setSelectedHandle(null)}
                      className="text-xs font-normal text-zinc-400 hover:text-white underline cursor-pointer ml-1"
                    >
                      (Clear filter)
                    </button>
                  </span>
                ) : (
                  "Latest from your subscriptions"
                )}
              </h1>
            </div>

            {/* Filter Pills (All / Videos / Shorts) & View Mode */}
            {subscribedChannelsList.length > 0 && (
              <div className="flex items-center gap-2.5">
                {/* Content Type Filter Pills */}
                <div className="flex items-center gap-1 bg-[#141416] border border-white/[0.08] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filterType === "all"
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("videos")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filterType === "videos"
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    Videos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("shorts")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filterType === "shorts"
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    <span>Shorts</span>
                  </button>
                </div>

                {/* Grid / List Mode */}
                <div className="flex items-center gap-1 bg-[#141416] border border-white/[0.08] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white/[0.12] text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white/[0.12] text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Videos Grid or Empty State */}
          {subscribedChannelsList.length === 0 ? (
            /* Empty State when no channels are subscribed */
            <div className="py-16 text-center max-w-lg mx-auto flex flex-col items-center animate-in fade-in">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                <PlaySquare className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1.5">Don&apos;t miss a video</h2>
              <p className="text-xs text-zinc-400 mb-8 max-w-sm leading-relaxed">
                Subscribe to your favorite Entropy creators to get their latest videos, shorts, and announcements here.
              </p>

              {/* Quick Subscribe Recommendations */}
              <div className="w-full bg-[#121214] border border-white/[0.08] rounded-2xl p-4 sm:p-5 text-left mb-6 shadow-xl">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Recommended Channels
                  </h3>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {allKnownChannels.slice(0, 4).map((ch) => {
                    const isSubbed = subscribedHandles.has(ch.handle.toLowerCase());
                    return (
                      <div
                        key={ch.handle}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                      >
                        <Link
                          href={`/@${ch.handle}`}
                          className="flex items-center gap-3 min-w-0 group"
                        >
                          <div className="h-11 w-11 rounded-full overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                            <img
                              src={ch.avatarUrl || "/default-avatar.png"}
                              alt={ch.displayName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white group-hover:underline truncate">
                                {ch.displayName}
                              </span>
                              <VerifiedBadge subscribersCount={ch.subscribersCount} />
                            </div>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              @{ch.handle}
                            </span>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleSubscribe(ch.handle)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
                            isSubbed
                              ? "bg-[#272727] text-white hover:bg-[#333333]"
                              : "bg-white text-black hover:bg-zinc-200"
                          }`}
                        >
                          {isSubbed ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Subscribed</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Subscribe</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/"
                className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Browse Videos
              </Link>
            </div>
          ) : filteredVideos.length === 0 ? (
            /* Subscribed, but no videos match the filter */
            <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
                <Film className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {selectedChannelInfo
                  ? `No uploads found for ${selectedChannelInfo.displayName}`
                  : "No new uploads in this category"}
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                {selectedChannelInfo
                  ? "Try viewing all subscriptions or switching between Videos and Shorts."
                  : "Check back later when creators release new content."}
              </p>
              {selectedHandle && (
                <button
                  type="button"
                  onClick={() => setSelectedHandle(null)}
                  className="px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white border border-white/10 transition-colors cursor-pointer"
                >
                  View All Subscribed Channels
                </button>
              )}
            </div>
          ) : (
            /* Active Videos Grid / List */
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7"
                  : "flex flex-col gap-4 max-w-4xl"
              }
            >
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
