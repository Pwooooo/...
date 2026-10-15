"use client";

import React, { useState, use, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_CHANNELS, ALL_VIDEOS } from "@/lib/mock-data";
import {
  Bell,
  Share2,
  Calendar,
  Film,
  Plus,
  Tv,
  Link as LinkIcon,
  Pencil,
  MoreHorizontal,
  CheckCircle2,
  Camera,
  Globe,
  Info,
  Users,
  PlaySquare,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";
import Link from "next/link";

const USER_TABS = ["Videos", "Playlists", "Community", "About"];

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = use(params);
  const cleanHandle = decodeURIComponent(resolvedParams.handle).replace(/^%40|^@/, "");

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Videos");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);

  const isOwnProfile = Boolean(
    user &&
      (user.handle.toLowerCase() === cleanHandle.toLowerCase() ||
        user.id.toLowerCase() === cleanHandle.toLowerCase())
  );

  useEffect(() => {
    try {
      if (isOwnProfile && user) {
        const stored = JSON.parse(localStorage.getItem("entropy_user_videos") || "[]");
        const filtered = stored.filter(
          (v: VideoItem) =>
            v.channel?.handle?.toLowerCase() === user.handle.toLowerCase() ||
            v.channel?.id === user.id
        );
        setUserVideos(filtered);
      }
    } catch {
      setUserVideos([]);
    }
  }, [isOwnProfile, user]);

  // Determine user data
  const isZeroUser = cleanHandle === "0";

  const channel = isOwnProfile && user
    ? {
        id: user.id,
        handle: user.handle,
        displayName: user.name,
        avatarUrl: user.avatarUrl || user.avatar || "",
        bannerUrl: "",
        subscribersCount: 0,
        description: user.bio || "Welcome to my Entropy channel! Streaming, creating, and connecting.",
      }
    : isZeroUser
    ? {
        id: "user-0",
        handle: "0",
        displayName: "0",
        avatarUrl: "/entropy-icon.png",
        bannerUrl: "",
        subscribersCount: 69,
        description: "Entropy User #0 • Genesis Pioneer & Founder",
      }
    : MOCK_CHANNELS[cleanHandle] || {
        id: `user-${cleanHandle}`,
        handle: cleanHandle,
        displayName: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
        avatarUrl: "",
        bannerUrl: "",
        subscribersCount: 0,
        description: `Official Entropy profile for @${cleanHandle}.`,
      };

  const channelVideos = isOwnProfile
    ? userVideos
    : isZeroUser
    ? ALL_VIDEOS.slice(0, 5) // Show 5 showcase videos for User #0
    : ALL_VIDEOS.filter(
        (v) => v.channel.handle.toLowerCase() === cleanHandle.toLowerCase()
      );

  const totalViews = channelVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const channelInitial = channel.displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Dark Rounded Banner (borderless) */}
            <div className="relative h-36 sm:h-48 md:h-56 w-full rounded-2xl bg-[#171717] overflow-hidden">
              {channel.bannerUrl && (
                <img
                  src={channel.bannerUrl}
                  alt={channel.displayName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {/* Profile Info Header Bar (Overlapping Banner) */}
            <div className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                {/* Left: Circular Avatar + Name/Handle */}
                <div className="flex items-end gap-3.5 sm:gap-4">
                  {/* Circular Avatar with Sky-Blue Status Dot */}
                  {isOwnProfile ? (
                    <Link
                      href="/profile"
                      className="relative flex-shrink-0 z-10 cursor-pointer group text-left"
                      title="Click to edit profile"
                    >
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-105">
                        {channel.avatarUrl ? (
                          <img src={channel.avatarUrl} alt={channel.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{channelInitial}</span>
                        )}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                          <Camera className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-semibold">Change</span>
                        </div>
                      </div>
                      <span
                        className="absolute bottom-1 right-1.5 h-4 w-4 rounded-full bg-[#00a8ff] border-2 border-black shadow-md ring-2 ring-[#00a8ff]/20"
                        title="Online"
                      />
                    </Link>
                  ) : (
                    <div className="relative flex-shrink-0 z-10">
                      <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl">
                        {channel.avatarUrl ? (
                          <img src={channel.avatarUrl} alt={channel.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{channelInitial}</span>
                        )}
                      </div>
                      <span
                        className="absolute bottom-1 right-1.5 h-4 w-4 rounded-full bg-[#00a8ff] border-2 border-black shadow-md ring-2 ring-[#00a8ff]/20"
                        title="Online"
                      />
                    </div>
                  )}

                  {/* Name and Handle with Subscriber/Video Count */}
                  <div className="pb-1 sm:pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                        {channel.displayName}
                      </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>@{channel.handle}</span>
                      <span className="text-zinc-600">•</span>
                      <span>
                        {isOwnProfile
                          ? "0 subscribers"
                          : channel.subscribersCount != null
                          ? `${channel.subscribersCount >= 1000 ? `${(channel.subscribersCount / 1000).toFixed(1)}K` : channel.subscribersCount} subscribers`
                          : "0 subscribers"}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons (borderless) */}
                <div className="flex items-center gap-2 pb-1 sm:pb-2 self-start sm:self-end">
                  {isOwnProfile ? (
                    <Link
                      href="/profile"
                      className="flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#262626] text-white px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Edit Profile</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isSubscribed
                          ? "bg-[#1c1c1c] text-zinc-300 hover:bg-[#262626]"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isSubscribed && <Bell className="h-3.5 w-3.5" />}
                      <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
                    </button>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 rounded-lg bg-[#1c1c1c] hover:bg-[#262626] text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="More options"
                    >
                      <MoreHorizontal className="h-4 w-4 text-zinc-200" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#121212] shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            handleShare();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer text-left"
                        >
                          <Share2 className="h-4 w-4 text-zinc-400" />
                          <span>Copy profile link</span>
                        </button>
                        {isOwnProfile && (
                          <Link
                            href="/studio/upload"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                          >
                            <Plus className="h-4 w-4 text-zinc-400" />
                            <span>Upload video</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio & More info */}
              <div className="mb-4 max-w-2xl">
                <div
                  onClick={() => setIsAboutModalOpen(true)}
                  className="cursor-pointer group flex items-start gap-1.5 text-xs sm:text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <p className="line-clamp-2 leading-relaxed">
                    {channel.description || "Welcome to this Entropy channel!"}
                  </p>
                  <span className="text-xs font-bold text-white group-hover:underline flex-shrink-0 pt-0.5">
                    ...more
                  </span>
                </div>
              </div>

              {isCopied && (
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-4 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Profile link copied to clipboard!</span>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-none pb-1">
                {USER_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ease-out cursor-pointer ${
                      activeTab === tab
                        ? "bg-white/[0.08] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="py-6">
                {activeTab === "Videos" && (
                  <div>
                    {channelVideos.length === 0 ? (
                      <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8 flex flex-col items-center">
                        <Film className="h-10 w-10 text-zinc-600 mb-3" />
                        <h3 className="text-sm font-bold text-white mb-1">No uploaded videos</h3>
                        <p className="text-xs text-zinc-400 mb-4 max-w-sm">
                          This creator has not published any videos yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {channelVideos.map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Playlists" && (
                  <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8">
                    <p className="text-xs text-zinc-400">No public playlists available.</p>
                  </div>
                )}

                {activeTab === "Community" && (
                  <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8">
                    <p className="text-xs text-zinc-400">Community posts will appear here.</p>
                  </div>
                )}

                {activeTab === "About" && (
                  <div className="space-y-6 max-w-xl text-xs sm:text-sm text-zinc-300">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-2">Description</h4>
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                        {channel.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-base font-bold text-white mb-4">More info</h4>
                      <div className="space-y-4 text-xs sm:text-sm text-zinc-200">
                        <div className="flex items-center gap-3.5">
                          <Tv className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span className="truncate hover:underline cursor-pointer select-all">
                            www.entropy.tv/@{channel.handle}
                          </span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <Globe className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>Greece</span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <Info className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>Joined Nov 10, 2025</span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <Users className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>
                            {channel.subscribersCount != null
                              ? `${channel.subscribersCount >= 1000 ? `${(channel.subscribersCount / 1000).toFixed(1)}K` : channel.subscribersCount} subscribers`
                              : "69 subscribers"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <PlaySquare className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <TrendingUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>{totalViews > 0 ? totalViews.toLocaleString() : "5,144"} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* About Channel / More Info Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAboutModalOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl bg-black border border-white/10 p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">About</h3>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-none">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Description</h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {channel.description || "No description provided."}
                </p>
              </div>

              {/* More info (matching user screenshot) */}
              <div>
                <h4 className="text-base font-bold text-white mb-4">More info</h4>
                <div className="space-y-4 text-xs sm:text-sm text-zinc-200">
                  <div className="flex items-center gap-3.5">
                    <Tv className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span className="truncate hover:underline cursor-pointer select-all">
                      www.entropy.tv/@{channel.handle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Globe className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span>Greece</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Info className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span>Joined Nov 10, 2025</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <Users className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span>
                      {channel.subscribersCount != null
                        ? `${channel.subscribersCount >= 1000 ? `${(channel.subscribersCount / 1000).toFixed(1)}K` : channel.subscribersCount} subscribers`
                        : "69 subscribers"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <PlaySquare className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <TrendingUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span>{totalViews > 0 ? totalViews.toLocaleString() : "5,144"} views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
