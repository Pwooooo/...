"use client";

import React, { useState, use, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_CHANNELS, ALL_VIDEOS } from "@/lib/mock-data";
import {
  CheckCircle2,
  Bell,
  Share2,
  Calendar,
  Film,
  Plus,
  Tv,
  Link as LinkIcon,
  Pencil,
  MoreHorizontal,
  Camera,
  Globe,
  Info,
  Users,
  PlaySquare,
  TrendingUp,
  X,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";
import Link from "next/link";
import CommunityTab from "@/components/channel/CommunityTab";
import { getAllCombinedVideos, getUserVideos, fetchServerVideos } from "@/lib/video-storage";
import { findUserByHandle, validateDisplayName, validateHandle, resolveChannelAvatar } from "@/lib/user-validation";

const CHANNEL_TABS = ["Videos", "Playlists", "Community", "About"];

export default function ChannelProfileView({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = use(params);
  const cleanHandle = decodeURIComponent(resolvedParams.handle).replace(/^%40|^@/, "");

  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Videos");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userHandle = (user?.handle || "").replace(/^@/, "").trim().toLowerCase();
  const userName = (user?.name || "").trim().toLowerCase();
  const targetClean = cleanHandle.trim().toLowerCase();
  const isOwnProfile = Boolean(
    user && (userHandle === targetClean || userName === targetClean)
  );

  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [channelLinks, setChannelLinks] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("entropy_channel_links");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.map((item: { title: string; url: string }) => {
              if (item.url && (item.url.includes("Pwooooo") || item.url.includes("..."))) {
                return { ...item, url: "https://github.com/YourUsername/YourProject" };
              }
              return item;
            });
            setChannelLinks(cleaned);
          }
        } else if (isOwnProfile) {
          setChannelLinks([
            { title: "Website", url: "https://entropy.video" },
            { title: "GitHub", url: "https://github.com/YourUsername/YourProject" },
          ]);
        }
      } catch {}
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam && ["Videos", "Playlists", "News", "About"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (user && isOwnProfile) {
      setEditName(user.name || "");
      setEditHandle(user.handle || "");
      setEditBio(user.bio || "");
      setEditCountry(user.country || "");
      setEditAvatarUrl(user.avatarUrl || user.avatar || "");
    }
  }, [user, isOwnProfile]);

  useEffect(() => {
    const loadVideos = () => {
      try {
        const allAvailable = getAllCombinedVideos();
        const filtered = allAvailable.filter(
          (v: VideoItem) => {
            if (!v || !v.channel) return false;
            const h = typeof v.channel.handle === "string" ? v.channel.handle.replace(/^@/, "").toLowerCase() : "";
            const id = typeof v.channel.id === "string" ? v.channel.id.toLowerCase() : "";
            const d = typeof v.channel.displayName === "string" ? v.channel.displayName.toLowerCase() : "";
            const target = cleanHandle.toLowerCase();
            return (h && h === target) || (id && id === target) || (d && d === target);
          }
        );
        setUserVideos(filtered);
      } catch {
        setUserVideos([]);
      }
    };

    loadVideos();
    fetchServerVideos().then(() => loadVideos());
    window.addEventListener("entropy_videos_updated", loadVideos);
    window.addEventListener("entropy_user_updated", loadVideos);
    window.addEventListener("storage", loadVideos);
    return () => {
      window.removeEventListener("entropy_videos_updated", loadVideos);
      window.removeEventListener("entropy_user_updated", loadVideos);
      window.removeEventListener("storage", loadVideos);
    };
  }, [cleanHandle]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.9);
          setEditAvatarUrl(compressed);
        } else {
          setEditAvatarUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const nameVal = validateDisplayName(editName);
    if (!nameVal.valid) {
      setEditError(nameVal.error || "Invalid name");
      return;
    }

    const handleVal = validateHandle(editHandle, user?.id);
    if (!handleVal.valid) {
      setEditError(handleVal.error || "Invalid handle");
      return;
    }

    updateUser({
      name: editName.trim(),
      handle: handleVal.cleanHandle,
      bio: editBio.trim(),
      country: editCountry.trim(),
      avatarUrl: editAvatarUrl.trim(),
    });
    setIsEditModalOpen(false);
  };

  // Resolve channel info
  const registeredUser = findUserByHandle(cleanHandle);

  const channel = isOwnProfile && user
    ? {
        id: user.id,
        handle: user.handle,
        displayName: user.name,
        avatarUrl: user.avatarUrl || user.avatar || "",
        bannerUrl: "",
        subscribersCount: 0,
        description: user.bio || "Welcome to my Entropy channel! Streaming, creating, and connecting.",
        country: user.country || "",
        joinedAt: user.joinedAt || "Joined recently",
      }
    : registeredUser
    ? {
        id: registeredUser.id,
        handle: registeredUser.handle,
        displayName: registeredUser.name,
        avatarUrl: registeredUser.avatarUrl || registeredUser.avatar || "",
        bannerUrl: "",
        subscribersCount: 0,
        description: registeredUser.bio || `Official channel for @${registeredUser.handle}. Watch the latest releases and live streams.`,
        country: registeredUser.country || "",
        joinedAt: registeredUser.joinedAt || "Joined recently",
      }
    : MOCK_CHANNELS[cleanHandle] || {
        id: userVideos[0]?.channel?.id || `ch-${cleanHandle}`,
        handle: cleanHandle,
        displayName: userVideos[0]?.channel?.displayName || (cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1)),
        avatarUrl: userVideos[0]?.channel?.avatarUrl || "",
        bannerUrl: "",
        subscribersCount: userVideos[0]?.channel?.subscribersCount || 0,
        description: `Official channel for @${cleanHandle}. Watch the latest releases and live streams.`,
        country: "",
        joinedAt: "Joined recently",
      };

  const channelVideos = userVideos;
  const totalViews = channelVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/profile/@${cleanHandle}`;
      navigator.clipboard?.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const channelInitial = (channel.displayName?.slice(0, 1) || cleanHandle.slice(0, 1) || "C").toUpperCase();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Dark Rounded Banner */}
            <div className="relative h-36 sm:h-48 md:h-56 w-full rounded-2xl bg-[#111111] overflow-hidden">
              {channel.bannerUrl && (
                <img
                  src={channel.bannerUrl}
                  alt={channel.displayName}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>

            {/* Profile Info Header Bar (Overlapping Banner - YouTube Desktop style) */}
            <div className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                {/* Left: Avatar + Channel Info */}
                <div className="flex items-end gap-3.5 sm:gap-4">
                  {/* Circular Avatar */}
                  <div className="relative flex-shrink-0 z-10">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl">
                      {channel.avatarUrl ? (
                        <img
                          src={resolveChannelAvatar(channel, undefined, isOwnProfile ? user : null)}
                          alt={channel.displayName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      ) : (
                        <span>{channelInitial}</span>
                      )}
                    </div>
                  </div>

                  {/* Name, Handle & Stats */}
                  <div className="pb-1 sm:pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                        {channel.displayName}
                      </h1>
                      <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-white">@{channel.handle}</span>
                      <span className="text-zinc-600">•</span>
                      <span>
                        {(channel.subscribersCount || 0) + (isSubscribed ? 1 : 0)} subscribers
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                    </p>

                    {/* Bio snippet & link to full about */}
                    <button
                      type="button"
                      onClick={() => setIsAboutModalOpen(true)}
                      className="text-xs text-zinc-400 hover:text-white mt-1.5 flex items-center gap-1 group text-left cursor-pointer transition-colors"
                    >
                      <span className="line-clamp-1 max-w-md">
                        {channel.description || "More about this channel"}
                      </span>
                      <span className="font-semibold text-white group-hover:underline">...more</span>
                    </button>
                  </div>
                </div>

                {/* Right: Actions (Subscribe or Edit Profile if own) */}
                <div className="flex items-center gap-2 pb-1 sm:pb-2 self-start sm:self-end">
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md ${
                        isSubscribed
                          ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                          : "bg-white hover:bg-zinc-200 text-black"
                      }`}
                    >
                      {isSubscribed ? (
                        <>
                          <Bell className="h-3.5 w-3.5" />
                          <span>Subscribed</span>
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-white transition-colors cursor-pointer flex items-center justify-center relative"
                    title="Share channel"
                  >
                    <Share2 className="h-4 w-4 text-zinc-300" />
                    {isCopied && (
                      <span className="absolute -top-8 right-0 bg-white text-black px-2 py-0.5 rounded text-[10px] font-bold shadow-lg animate-in fade-in">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs (Videos, Playlists, Community, About) */}
              <div className="flex items-center gap-6 border-b border-white/[0.08] mb-6 overflow-x-auto scrollbar-none">
                {CHANNEL_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-semibold transition-colors cursor-pointer relative flex-shrink-0 ${
                        isActive ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              {activeTab === "Videos" && (
                <div>
                  {channelVideos.length === 0 ? (
                    <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center animate-in fade-in">
                      <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
                        <Film className="h-8 w-8 text-zinc-400" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">No videos yet</h3>
                      <p className="text-xs text-zinc-400 mb-6">
                        {isOwnProfile
                          ? "Upload your first video to share with viewers on Entropy."
                          : "This channel hasn't uploaded any videos yet."}
                      </p>
                      {isOwnProfile && (
                        <Link
                          href="/studio/upload"
                          className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
                        >
                          Upload Video
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {channelVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Playlists" && (
                <div className="py-16 text-center max-w-sm mx-auto flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
                    <PlaySquare className="h-8 w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">No created playlists</h3>
                  <p className="text-xs text-zinc-400">
                    Public playlists created by this channel will appear here.
                  </p>
                </div>
              )}

              {activeTab === "Community" && (
                <CommunityTab
                  channel={{
                    id: channel.id,
                    handle: channel.handle,
                    displayName: channel.displayName,
                    avatarUrl: channel.avatarUrl || undefined,
                    subscribersCount: channel.subscribersCount,
                  }}
                  isOwnProfile={isOwnProfile}
                />
              )}

              {activeTab === "About" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">Description</h3>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {channel.description || "No description provided."}
                      </p>
                    </div>

                    {channel.country && (
                      <div className="pt-4 border-t border-white/[0.08]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Details
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Globe className="h-4 w-4 text-zinc-400" />
                          <span>Location: {channel.country}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Channel Stats Column */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/[0.08] md:pl-8 pt-4 md:pt-0">
                    <h3 className="text-sm font-bold text-white mb-4">Stats</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <Calendar className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span>{channel.joinedAt}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <Film className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span>{channelVideos.length} videos</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <TrendingUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span>{totalViews.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <Users className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span>{(channel.subscribersCount || 0) + (isSubscribed ? 1 : 0)} subscribers</span>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share Channel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsEditModalOpen(false)} />
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#141414] border border-white/[0.08] p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Edit Channel Profile</h3>
                <p className="text-xs text-zinc-400">Update how your channel appears on Entropy</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Display Name
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {editName.length}/20
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Channel Handle
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {editHandle.replace(/^@/, "").length}/30
                  </span>
                </div>
                <div className="flex items-center rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 focus-within:border-white/20 transition-colors">
                  <span className="text-zinc-500 text-xs font-mono select-none">@</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={editHandle.replace(/^@/, "")}
                    onChange={(e) => setEditHandle(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none ml-1 font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  3–30 chars. Letters, numbers, and _ - . · (cannot start or end with separators).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell your viewers about yourself..."
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Country / Location
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="e.g. United States, United Kingdom, Greece..."
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Avatar Direct Image Import */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Profile Avatar
                </label>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#0a0a0a] border border-white/[0.08]">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-[#181818] flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span>{editName.slice(0, 1).toUpperCase() || "U"}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-black px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Import Image</span>
                      </button>

                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl("")}
                          className="flex items-center gap-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-zinc-300 hover:text-white border border-white/[0.08] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.08] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
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

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAboutModalOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">About</h3>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-none">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Description</h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {channel.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Channel Details</h4>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>{channel.joinedAt}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                  <span>{totalViews.toLocaleString()} views</span>
                </div>
                {channel.country && (
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    <Globe className="h-4 w-4 text-zinc-400" />
                    <span>Location: {channel.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <LinkIcon className="h-4 w-4 text-zinc-400" />
                  <span className="font-mono text-zinc-400">entropyy.vercel.app/profile/@{channel.handle}</span>
                </div>
              </div>

              {/* Custom Channel Links */}
              {channelLinks.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Links</h4>
                  <div className="space-y-1.5">
                    {channelLinks.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs text-zinc-200 hover:text-white p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] hover:border-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                          <span className="font-semibold text-white">{l.title || "Link"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px] group-hover:text-zinc-300">
                          <span className="truncate max-w-[180px]">
                            {l.url.replace(/^https?:\/\//, "")}
                          </span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer shadow-md"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Channel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
