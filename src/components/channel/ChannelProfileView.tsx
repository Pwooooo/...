"use client";

import React, { useState, use, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import {
  CheckCircle2,
  Bell,
  Share2,
  Film,
  Plus,
  Pencil,
  MoreHorizontal,
  Camera,
  Globe,
  Info,
  PlaySquare,
  TrendingUp,
  X,
  Settings,
  Sparkles,
  UserX,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";
import Link from "next/link";
import CommunityTab from "@/components/channel/CommunityTab";
import { getAllCombinedVideos, fetchServerVideos, isUserVideoOwner } from "@/lib/video-storage";
import {
  findUserByHandle,
  fetchRemoteUserByHandle,
  validateDisplayName,
  validateHandle,
  resolveChannelAvatar,
  UserRecord,
} from "@/lib/user-validation";

const PROFILE_TABS = ["Videos", "Playlists", "Community", "About"];

interface ChannelProfileViewProps {
  params?: Promise<{ handle: string }>;
  isSelfProfile?: boolean;
}

export default function ChannelProfileView({
  params,
  isSelfProfile = false,
}: ChannelProfileViewProps) {
  const resolvedParams = params ? use(params) : null;
  const { user, openAuthModal, updateUser } = useAuth();

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

  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [channelLinks, setChannelLinks] = useState<{ title: string; url: string }[]>([]);
  const [remoteUser, setRemoteUser] = useState<UserRecord | null>(null);
  const [isCheckingRemote, setIsCheckingRemote] = useState(false);

  // Resolve target handle
  const rawParamHandle = resolvedParams?.handle ? decodeURIComponent(resolvedParams.handle).replace(/^%40|^@/, "").trim() : "";
  const cleanHandle = isSelfProfile
    ? (user?.handle || "").replace(/^@/, "").trim()
    : rawParamHandle;

  const targetClean = cleanHandle.toLowerCase();
  const userHandle = (user?.handle || "").replace(/^@/, "").trim().toLowerCase();
  const userName = (user?.name || "").trim().toLowerCase();
  const userId = (user?.id || "").trim().toLowerCase();

  const isOwnProfile = Boolean(
    user && (isSelfProfile || userHandle === targetClean || userName === targetClean || userId === targetClean)
  );

  useEffect(() => {
    const loadVideos = () => {
      try {
        setAllVideos(getAllCombinedVideos());
      } catch {
        setAllVideos([]);
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
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam && PROFILE_TABS.includes(tabParam)) {
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
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("entropy_channel_links");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChannelLinks(parsed);
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

  // If handle is not found locally, query Key-Value store via API
  useEffect(() => {
    if (cleanHandle && !isOwnProfile && !findUserByHandle(cleanHandle)) {
      setIsCheckingRemote(true);
      fetchRemoteUserByHandle(cleanHandle)
        .then((found) => {
          if (found) setRemoteUser(found);
        })
        .finally(() => {
          setIsCheckingRemote(false);
        });
    }
  }, [cleanHandle, isOwnProfile]);

  // If visiting /profile while not logged in, prompt sign in
  if (isSelfProfile && !user) {
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
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
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

  // Filter videos that belong to this channel
  const channelVideos = allVideos.filter((v: VideoItem) => {
    if (!v) return false;
    if (isOwnProfile && user) {
      return isUserVideoOwner(v, user);
    }
    if (!v.channel) return false;
    const h = typeof v.channel.handle === "string" ? v.channel.handle.replace(/^@/, "").toLowerCase() : "";
    const id = typeof v.channel.id === "string" ? v.channel.id.toLowerCase() : "";
    const d = typeof v.channel.displayName === "string" ? v.channel.displayName.toLowerCase() : "";
    return h === targetClean || id === targetClean || d === targetClean;
  });

  // Check if channel exists (either logged in user, registered in localStorage/KV, or creator of uploaded videos)
  const registeredUser = (cleanHandle ? findUserByHandle(cleanHandle) : null) || remoteUser;
  const channelExists = isOwnProfile || Boolean(registeredUser) || channelVideos.length > 0;

  if (isCheckingRemote) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  // If handle does not exist anywhere, show a clean 404 screen (no fake user!)
  if (!channelExists) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-10 max-w-md w-full text-center flex flex-col items-center shadow-2xl">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                <UserX className="h-8 w-8 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">This channel does not exist</h2>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                The user <span className="text-white font-semibold">@{cleanHandle}</span> could not be found. Check the handle or explore creators and videos on Entropy.
              </p>
              <Link
                href="/"
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-lg"
              >
                Go to Home
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Resolve channel metadata
  const channel = isOwnProfile && user
    ? {
        id: user.id,
        handle: (user.handle || cleanHandle).replace(/^@/, ""),
        displayName: user.name || cleanHandle,
        avatarUrl: user.avatarUrl || user.avatar || "",
        description: user.bio || "Welcome to my Entropy channel!",
        country: user.country || "",
        joinedAt: user.joinedAt || "Joined recently",
        subscribersCount: 0,
      }
    : registeredUser
    ? {
        id: registeredUser.id,
        handle: (registeredUser.handle || cleanHandle).replace(/^@/, ""),
        displayName: registeredUser.name || cleanHandle,
        avatarUrl: registeredUser.avatarUrl || registeredUser.avatar || "",
        description: registeredUser.bio || `Official channel for @${registeredUser.handle}.`,
        country: registeredUser.country || "",
        joinedAt: registeredUser.joinedAt || "Joined recently",
        subscribersCount: 0,
      }
    : {
        id: channelVideos[0]?.channel?.id || `ch-${cleanHandle}`,
        handle: (channelVideos[0]?.channel?.handle || cleanHandle).replace(/^@/, ""),
        displayName: channelVideos[0]?.channel?.displayName || cleanHandle,
        avatarUrl: channelVideos[0]?.channel?.avatarUrl || "",
        description: `Official channel for @${cleanHandle}. Watch the latest releases and live streams.`,
        country: "",
        joinedAt: "Joined recently",
        subscribersCount: channelVideos[0]?.channel?.subscribersCount || 0,
      };

  const totalViews = channelVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/profile/@${channel.handle}`;
      navigator.clipboard?.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

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

  const channelAvatar = resolveChannelAvatar(
    channel,
    undefined,
    isOwnProfile ? user : null
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Dark Rounded Banner (borderless) */}
            <div className="relative h-36 sm:h-48 md:h-56 w-full rounded-2xl bg-[#171717] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            </div>

            {/* Profile Info Header Bar (Overlapping Banner) */}
            <div className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                {/* Left: Circular Avatar + Name/Handle */}
                <div className="flex items-end gap-3.5 sm:gap-4">
                  {/* Circular Avatar with Blue Status Dot */}
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="relative flex-shrink-0 z-10 cursor-pointer group text-left"
                      title="Click to edit profile"
                      aria-label="Edit profile and avatar"
                    >
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-105">
                        <img
                          src={channelAvatar}
                          alt={channel.displayName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                          <Camera className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-semibold">Change</span>
                        </div>
                      </div>
                      {/* Sky Blue Active Indicator Dot */}
                      <span
                        className="absolute bottom-1 right-1.5 h-4 w-4 rounded-full bg-[#00a8ff] border-2 border-black shadow-md ring-2 ring-[#00a8ff]/20"
                        title="Online"
                      />
                    </button>
                  ) : (
                    <div className="relative flex-shrink-0 z-10">
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-black bg-zinc-900 text-white shadow-2xl overflow-hidden flex items-center justify-center font-bold text-3xl sm:text-4xl">
                        <img
                          src={channelAvatar}
                          alt={channel.displayName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      </div>
                      <span
                        className="absolute bottom-1 right-1.5 h-4 w-4 rounded-full bg-[#00a8ff] border-2 border-black shadow-md ring-2 ring-[#00a8ff]/20"
                        title="Online"
                      />
                    </div>
                  )}

                  {/* Name and Handle */}
                  <div className="pb-1 sm:pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                        {channel.displayName}
                      </h1>
                      <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/profile/@${channel.handle}`}
                        className="font-semibold text-white hover:underline cursor-pointer"
                        title="Channel handle"
                      >
                        @{channel.handle}
                      </Link>
                      <span className="text-zinc-600">•</span>
                      <span>
                        {(channel.subscribersCount || 0) + (isSubscribed ? 1 : 0)} subscribers
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 pb-1 sm:pb-2 self-start sm:self-end">
                  {isOwnProfile ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] text-white px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-zinc-300" />
                        <span>Edit Profile</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          className="p-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-white transition-colors cursor-pointer flex items-center justify-center"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4 text-zinc-200" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#141414] border border-white/[0.08] shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 select-none">
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
                              <Film className="h-4 w-4 text-zinc-400" />
                              <span>Manage videos</span>
                            </Link>
                            <Link
                              href="/settings"
                              onClick={() => setIsMenuOpen(false)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                            >
                              <Settings className="h-4 w-4 text-zinc-400" />
                              <span>Settings</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* Bio & Copied Feedback */}
              <div className="mb-4 max-w-2xl">
                <div
                  onClick={() => setIsAboutModalOpen(true)}
                  className="cursor-pointer group flex items-start gap-1.5 text-xs sm:text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <p className="line-clamp-2 leading-relaxed">
                    {channel.description || "Welcome to my Entropy channel!"}
                  </p>
                  <span className="text-xs font-bold text-white group-hover:underline flex-shrink-0 pt-0.5">
                    ...more
                  </span>
                </div>
              </div>

              {isCopied && isOwnProfile && (
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-4 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  <span>Profile link copied to clipboard!</span>
                </div>
              )}

              {/* Navigation Tabs (Pill style - EXACT match) */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-none pb-1">
                {PROFILE_TABS.map((tab) => (
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
                        <h3 className="text-sm font-bold text-white mb-1">
                          {isOwnProfile ? "No uploaded videos" : "No videos yet"}
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4 max-w-sm">
                          {isOwnProfile
                            ? "Upload videos through Entropy Studio to showcase them on your profile."
                            : "This channel hasn't uploaded any videos yet."}
                        </p>
                        {isOwnProfile && (
                          <Link
                            href="/studio/upload"
                            className="rounded-full bg-white hover:bg-zinc-200 text-black px-4 py-2 text-xs font-bold transition-colors"
                          >
                            Upload a video
                          </Link>
                        )}
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
                  <div className="py-12 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8">
                    <p className="text-xs text-zinc-400">No public playlists created yet.</p>
                  </div>
                )}

                {activeTab === "Community" && (
                  <CommunityTab
                    channel={{
                      id: channel.id,
                      handle: channel.handle,
                      displayName: channel.displayName,
                      avatarUrl: channelAvatar,
                    }}
                    isOwnProfile={isOwnProfile}
                  />
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
                          <LinkIcon className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span className="truncate hover:underline cursor-pointer select-all" onClick={handleShare}>
                            entropyy.vercel.app/profile/@{channel.handle}
                          </span>
                        </div>

                        {channel.country && (
                          <div className="flex items-center gap-3.5">
                            <Globe className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <span>{channel.country}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3.5">
                          <Info className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>{channel.joinedAt || "Joined recently"}</span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <PlaySquare className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>{channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}</span>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <TrendingUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          <span>{totalViews.toLocaleString()} {totalViews === 1 ? "view" : "views"}</span>
                        </div>
                      </div>
                    </div>

                    {channelLinks.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-base font-bold text-white mb-3">Links</h4>
                        <div className="space-y-2">
                          {channelLinks.map((l, i) => (
                            <a
                              key={i}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-xs text-zinc-200 hover:text-white p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] transition-colors"
                            >
                              <span className="font-semibold">{l.title || "Link"}</span>
                              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                                <span className="truncate max-w-[200px]">{l.url.replace(/^https?:\/\//, "")}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsEditModalOpen(false)}
          />

          <div
            className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-zinc-400" />
                <span>Edit Profile</span>
              </h3>
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
                  <label className="block text-xs font-semibold text-zinc-400">
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
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-400">
                    Channel Handle
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {editHandle.replace(/^@/, "").length}/30
                  </span>
                </div>
                <div className="flex items-center rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 focus-within:border-white/20 transition-colors">
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
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell your viewers about yourself..."
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Country / Location
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="e.g. United States, Germany, Japan"
                  className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Profile Picture
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full border border-white/10 bg-zinc-900 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={editAvatarUrl || "/default-avatar.png"}
                      alt="Avatar Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Upload New Image
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Channel Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsAboutModalOpen(false)}
          />

          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-2xl text-white z-10 animate-in zoom-in-95 duration-200"
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

            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Description</h4>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {channel.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Channel Details</h4>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <Info className="h-4 w-4 text-zinc-400" />
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
