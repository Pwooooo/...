"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ShortItem } from "@/lib/mock-data";
import { getAllCombinedVideos, fetchServerVideos } from "@/lib/video-storage";
import { VideoItem } from "@/types";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  MoreVertical,
  Music,
  ChevronUp,
  ChevronDown,
  Flame,
  Volume2,
  VolumeX,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function ShortsPage() {
  const [shortsList, setShortsList] = useState<ShortItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [dislikes, setDislikes] = useState<Record<string, number>>({});
  const [dislikedMap, setDislikedMap] = useState<Record<string, boolean>>({});
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const syncShorts = (videos: VideoItem[]) => {
      const shortsOnly = videos.filter((v) => {
        if (!v || !v.id) return false;
        return (
          v.isShort === true ||
          v.category === "Shorts" ||
          v.tags?.includes("shorts") ||
          (v.durationSeconds > 0 && v.durationSeconds <= 60)
        );
      });

      const mapped: ShortItem[] = shortsOnly.map((v) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.rawVideoUrl || v.masterPlaylistUrl || "",
        likesCount: v.viewCount ? Math.round(v.viewCount * 0.1) : 0,
        commentsCount: 0,
        channel: v.channel || {
          id: "creator",
          handle: "creator",
          displayName: "Creator",
        },
        songName: v.songName || "Original Audio",
      }));

      setShortsList(mapped);

      // Restore saved vote states
      try {
        const storedLiked: Record<string, boolean> = {};
        const storedDisliked: Record<string, boolean> = {};
        const storedLikes: Record<string, number> = {};
        const storedDislikes: Record<string, number> = {};

        mapped.forEach((s) => {
          const vote = localStorage.getItem(`entropy_video_vote_${s.id}`);
          if (vote === "like") storedLiked[s.id] = true;
          if (vote === "dislike") storedDisliked[s.id] = true;

          const l = localStorage.getItem(`entropy_video_likes_${s.id}`);
          if (l) storedLikes[s.id] = parseInt(l, 10);

          const d = localStorage.getItem(`entropy_video_dislikes_${s.id}`);
          if (d) storedDislikes[s.id] = parseInt(d, 10);
        });

        setLikedMap(storedLiked);
        setDislikedMap(storedDisliked);
        setLikes(storedLikes);
        setDislikes(storedDislikes);
      } catch {}
    };

    syncShorts(getAllCombinedVideos());

    fetchServerVideos().then(() => {
      syncShorts(getAllCombinedVideos());
    });

    const handleUpdate = () => {
      syncShorts(getAllCombinedVideos());
    };

    window.addEventListener("entropy_videos_updated", handleUpdate);
    return () => window.removeEventListener("entropy_videos_updated", handleUpdate);
  }, []);

  const currentShort = shortsList[currentIndex] || null;

  const handleNext = () => {
    if (currentIndex < shortsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "m") {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shortsList.length]);

  const toggleLike = (id: string) => {
    const isLiked = likedMap[id];
    const newLiked = !isLiked;
    setLikedMap((prev) => ({ ...prev, [id]: newLiked }));

    const baseLikes = likes[id] ?? currentShort?.likesCount ?? 0;
    const newCount = Math.max(0, baseLikes + (newLiked ? 1 : -1));
    setLikes((prev) => ({ ...prev, [id]: newCount }));

    if (dislikedMap[id]) {
      setDislikedMap((prev) => ({ ...prev, [id]: false }));
      const newDCount = Math.max(0, (dislikes[id] ?? 0) - 1);
      setDislikes((prev) => ({ ...prev, [id]: newDCount }));
      try {
        localStorage.setItem(`entropy_video_dislikes_${id}`, newDCount.toString());
      } catch {}
    }

    try {
      localStorage.setItem(`entropy_video_likes_${id}`, newCount.toString());
      if (newLiked) {
        localStorage.setItem(`entropy_video_vote_${id}`, "like");
      } else {
        localStorage.removeItem(`entropy_video_vote_${id}`);
      }
    } catch {}
  };

  const toggleDislike = (id: string) => {
    const isDisliked = dislikedMap[id];
    const newDisliked = !isDisliked;
    setDislikedMap((prev) => ({ ...prev, [id]: newDisliked }));

    const baseDislikes = dislikes[id] ?? 0;
    const newDCount = Math.max(0, baseDislikes + (newDisliked ? 1 : -1));
    setDislikes((prev) => ({ ...prev, [id]: newDCount }));

    if (likedMap[id]) {
      setLikedMap((prev) => ({ ...prev, [id]: false }));
      const newLCount = Math.max(0, (likes[id] ?? currentShort?.likesCount ?? 0) - 1);
      setLikes((prev) => ({ ...prev, [id]: newLCount }));
      try {
        localStorage.setItem(`entropy_video_likes_${id}`, newLCount.toString());
      } catch {}
    }

    try {
      localStorage.setItem(`entropy_video_dislikes_${id}`, newDCount.toString());
      if (newDisliked) {
        localStorage.setItem(`entropy_video_vote_${id}`, "dislike");
      } else {
        localStorage.removeItem(`entropy_video_vote_${id}`);
      }
    } catch {}
  };

  const toggleSubscribe = (handle: string) => {
    setSubscribedMap((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar drawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-1">
        <Sidebar collapsed={true} />

        <main className="flex-1 flex items-center justify-center py-6 px-4 relative">
          {!currentShort ? (
            <div className="text-center max-w-sm py-20 animate-in fade-in">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4 mx-auto shadow-inner">
                <Flame className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">No shorts yet</h2>
              <p className="text-xs text-zinc-400 mb-6">Short vertical videos will appear here.</p>
              <Link
                href="/studio/upload?type=short"
                className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Upload Short
              </Link>
            </div>
          ) : (
            <div className="flex items-end gap-4 max-w-[480px] w-full">
            {/* Vertical Video Container */}
            <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800 flex items-center justify-center">
              <video
                key={currentShort.id}
                src={currentShort.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-between items-center pointer-events-auto">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                    <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                    <span>Shorts</span>
                  </div>
                  <button
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>

                {/* Bottom Channel & Title Info */}
                <div className="pointer-events-auto flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/@${currentShort.channel.handle}`}
                      className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0"
                    >
                      <img
                        src={currentShort.channel.avatarUrl || "/default-avatar.png"}
                        alt={currentShort.channel.displayName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    </Link>
                    <Link
                      href={`/@${currentShort.channel.handle}`}
                      className="font-semibold text-sm text-white flex items-center gap-1.5 hover:underline"
                    >
                      <span>@{currentShort.channel.handle}</span>
                    </Link>
                    <button
                      onClick={() => toggleSubscribe(currentShort.channel.handle)}
                      className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        subscribedMap[currentShort.channel.handle]
                          ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {subscribedMap[currentShort.channel.handle] ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>

                  <p className="text-sm text-zinc-100 font-medium line-clamp-2">
                    {currentShort.title}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Music className="h-3.5 w-3.5" />
                    <span className="truncate">{currentShort.songName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex flex-col items-center gap-4 pb-2">
              {/* Like */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => toggleLike(currentShort.id)}
                  className={`rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 transition-colors border border-zinc-800 cursor-pointer ${
                    likedMap[currentShort.id] ? "text-white bg-zinc-800 border-white" : "text-zinc-300"
                  }`}
                >
                  <ThumbsUp className={`h-6 w-6 ${likedMap[currentShort.id] ? "fill-white text-white" : ""}`} />
                </button>
                <span className="text-xs font-semibold text-zinc-300">
                  {(likes[currentShort.id] ?? currentShort.likesCount ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Dislike with Visible Dislike Count */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => toggleDislike(currentShort.id)}
                  className={`rounded-full p-3 transition-colors border cursor-pointer ${
                    dislikedMap[currentShort.id]
                      ? "text-white bg-zinc-800 border-white"
                      : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                  }`}
                  title="Dislike"
                >
                  <ThumbsDown className={`h-6 w-6 ${dislikedMap[currentShort.id] ? "fill-white" : ""}`} />
                </button>
                <span className="text-xs font-semibold text-zinc-300">
                  {(dislikes[currentShort.id] ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Comments */}
              <div className="flex flex-col items-center gap-1">
                <button className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </button>
                <span className="text-xs font-semibold text-zinc-200">{currentShort.commentsCount}</span>
              </div>

              {/* Share */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard?.writeText(`${window.location.origin}/shorts`);
                    }
                  }}
                  className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                >
                  <Share2 className="h-6 w-6" />
                </button>
                <span className="text-xs font-semibold text-zinc-200">Share</span>
              </div>

              {/* Upload Short Quick CTA */}
              <Link
                href="/studio/upload?type=short"
                className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-orange-400 hover:text-orange-300 transition-colors border border-white/10"
                title="Upload Short"
              >
                <Upload className="h-5 w-5" />
              </Link>
            </div>

            {/* Up/Down Navigation Controls */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-full p-3 bg-zinc-800 text-white disabled:opacity-30 hover:bg-zinc-700 transition-colors"
                title="Previous Short"
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === shortsList.length - 1}
                className="rounded-full p-3 bg-zinc-800 text-white disabled:opacity-30 hover:bg-zinc-700 transition-colors"
                title="Next Short"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
