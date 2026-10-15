"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import Link from "next/link";
import {
  CheckCircle2,
  Share2,
  Upload,
  Tv,
  Calendar,
  Eye,
  Film,
  Users,
  Sparkles,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";

const PROFILE_TABS = ["Videos", "Playlists", "Community", "About"];

export default function ProfilePage() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState("Videos");
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    try {
      if (user) {
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
  }, [user]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-10 max-w-md w-full text-center flex flex-col items-center shadow-2xl">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white mb-4">
                <Sparkles className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in to view your profile</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Connect to customize your profile header, manage uploads, and track your channel activity.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const userInitial = user.name.slice(0, 1).toUpperCase();
  const totalViews = userVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          {/* Luduvo-style Profile Card Container */}
          <div className="max-w-5xl mx-auto rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl">
            {/* Banner Section */}
            <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 overflow-hidden">
              {/* Subtle Ambient Decorative Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.85))]" />

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-zinc-300">
                  ID #247
                </span>
              </div>
            </div>

            {/* Profile Info Header Bar (Overlapping Banner) */}
            <div className="px-6 sm:px-8 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
                {/* Avatar with Status Ring */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl sm:rounded-3xl border-4 border-zinc-950 bg-white text-black shadow-2xl overflow-hidden flex items-center justify-center font-extrabold text-4xl sm:text-5xl">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  {/* Online / Active status indicator dot */}
                  <span
                    className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-md ring-2 ring-emerald-500/20"
                    title="Active"
                  />
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 sm:mb-2">
                  <Link
                    href="/studio/upload"
                    className="flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload video</span>
                  </Link>

                  <Link
                    href="/studio/videos"
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 px-4 py-2 text-xs font-bold transition-all"
                  >
                    <Tv className="h-4 w-4 text-zinc-400" />
                    <span>Entropy Studio</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Share profile"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User Names, Handle, Badges & Bio */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {user.name}
                  </h1>
                  <CheckCircle2 className="h-5 w-5 text-white fill-white/10" />
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                    Creator
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="text-zinc-300 font-semibold">@{user.handle}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-zinc-400 font-sans">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined October 2026
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                  Welcome to my Entropy channel! Streaming, creating, and connecting.
                </p>

                {isCopied && (
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Profile link copied to clipboard!</span>
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-zinc-800/80">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5">Videos</p>
                  <p className="text-base sm:text-lg font-extrabold text-white">{userVideos.length}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5">Subscribers</p>
                  <p className="text-base sm:text-lg font-extrabold text-white">0</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5">Total Views</p>
                  <p className="text-base sm:text-lg font-extrabold text-white">{totalViews.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5">Platform</p>
                  <p className="text-base sm:text-lg font-extrabold text-white">Entropy</p>
                </div>
              </div>

              {/* Navigation Tabs (Luduvo Style) */}
              <div className="flex items-center gap-4 mt-6 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
                {PROFILE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                      activeTab === tab
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                        : "text-zinc-400 hover:text-white"
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
                    {userVideos.length === 0 ? (
                      <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8 flex flex-col items-center">
                        <Film className="h-10 w-10 text-zinc-600 mb-3" />
                        <h3 className="text-sm font-bold text-white mb-1">No uploaded videos</h3>
                        <p className="text-xs text-zinc-400 mb-4 max-w-sm">
                          Upload videos through Entropy Studio to showcase them on your profile.
                        </p>
                        <Link
                          href="/studio/upload"
                          className="rounded-full bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-colors"
                        >
                          Upload a video
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userVideos.map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Playlists" && (
                  <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8">
                    <p className="text-xs text-zinc-400">No public playlists created yet.</p>
                  </div>
                )}

                {activeTab === "Community" && (
                  <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 p-8">
                    <p className="text-xs text-zinc-400">Community posts will appear here.</p>
                  </div>
                )}

                {activeTab === "About" && (
                  <div className="space-y-4 max-w-xl text-xs text-zinc-300">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                      <h4 className="font-bold text-white text-sm">Channel Details</h4>
                      <p className="text-zinc-400">
                        Official Entropy profile for <span className="text-white font-semibold">{user.name}</span> (@{user.handle}).
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-zinc-400">
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span className="font-mono text-zinc-300">entropy.stream/@{user.handle}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
