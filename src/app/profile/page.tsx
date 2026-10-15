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
  Pencil,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";

const PROFILE_TABS = ["Videos", "Playlists", "Community", "About"];

export default function ProfilePage() {
  const { user, openAuthModal, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Videos");
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

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

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditBio(user.bio || "");
      setEditAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateUser({
      name: editName.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl.trim(),
    });
    setIsEditModalOpen(false);
  };

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
          <div className="max-w-5xl mx-auto">
            {/* Dark Rounded Banner (as in screenshot) */}
            <div className="relative h-36 sm:h-48 md:h-56 w-full rounded-2xl bg-[#171717] border border-white/5 overflow-hidden">
              {/* Optional user banner if available */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            </div>

            {/* Profile Info Header Bar (Overlapping Banner - exact match to screenshot) */}
            <div className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                {/* Left: Circular Avatar + Name/Handle */}
                <div className="flex items-end gap-3.5 sm:gap-4">
                  {/* Circular Avatar with Blue Status Dot */}
                  <div className="relative flex-shrink-0 z-10">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    {/* Sky Blue Active Indicator Dot */}
                    <span
                      className="absolute bottom-1 right-1.5 h-4 w-4 rounded-full bg-[#00a8ff] border-2 border-black shadow-md ring-2 ring-[#00a8ff]/20"
                      title="Online"
                    />
                  </div>

                  {/* Name, Luduvo Badges, and Handle */}
                  <div className="pb-1 sm:pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                        {user.name}
                      </h1>
                      {/* Cat-eared shield badge */}
                      <span title="Verified" className="inline-flex items-center text-zinc-300">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M4 8 L6 3 L9.5 5.2 C11 4.8 13 4.8 14.5 5.2 L18 3 L20 8 C20 14.5 12 21 12 21 C12 21 4 14.5 4 8 Z" />
                        </svg>
                      </span>
                      {/* Rocket badge */}
                      <span title="Booster" className="inline-flex items-center text-sm select-none">
                        🚀
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>@{user.handle}</span>
                      <span className="text-zinc-600">•</span>
                      <span>0 subscribers</span>
                      <span className="text-zinc-600">•</span>
                      <span>{userVideos.length} {userVideos.length === 1 ? "video" : "videos"}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Edit Profile & More Options Buttons */}
                <div className="flex items-center gap-2 pb-1 sm:pb-2 self-start sm:self-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#262626] border border-white/10 text-white px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-zinc-300" />
                    <span>Edit Profile</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 rounded-lg bg-[#1c1c1c] hover:bg-[#262626] border border-white/10 text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="More options"
                    >
                      <MoreHorizontal className="h-4 w-4 text-zinc-200" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#121212] border border-white/10 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 select-none">
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
                        <Link
                          href="/studio/upload"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                        >
                          <Plus className="h-4 w-4 text-zinc-400" />
                          <span>Upload video</span>
                        </Link>
                        <Link
                          href="/studio/videos"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                        >
                          <Tv className="h-4 w-4 text-zinc-400" />
                          <span>Entropy Studio</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio & Copied Feedback */}
              {user.bio && (
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed mb-4">
                  {user.bio}
                </p>
              )}

              {isCopied && (
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-4 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Profile link copied to clipboard!</span>
                </div>
              )}

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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsEditModalOpen(false)}
          />

          <div
            className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-zinc-400" />
                <span>Edit Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell your viewers about yourself..."
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
