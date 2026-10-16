"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import Link from "next/link";
import { Play, Flame } from "lucide-react";
import { ALL_VIDEOS } from "@/lib/mock-data";
import { getAllCombinedVideos, getBaseVideos, fetchServerVideos, isShortVideo } from "@/lib/video-storage";
import { VideoItem } from "@/types";

const CATEGORIES = [
  "All",
  "Technology",
  "Web Development",
  "Gaming",
  "Music",
  "Design",
  "Computer Science",
];

export default function HomePage() {
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [allVideos, setAllVideos] = useState<VideoItem[]>(() => {
    if (typeof window !== "undefined") {
      return getAllCombinedVideos();
    }
    return getBaseVideos();
  });

  useEffect(() => {
    // Immediately after mount, sync with client-side localStorage
    setAllVideos(getAllCombinedVideos());

    // Fetch server videos
    fetchServerVideos().then(() => {
      setAllVideos(getAllCombinedVideos());
    });

    const loadVideos = () => {
      setAllVideos(getAllCombinedVideos());
    };

    window.addEventListener("entropy_videos_updated", loadVideos);
    window.addEventListener("storage", loadVideos);
    return () => {
      window.removeEventListener("entropy_videos_updated", loadVideos);
      window.removeEventListener("storage", loadVideos);
    };
  }, []);

  // Standard videos (excluding shorts)
  const regularVideos = useMemo(() => {
    if (!Array.isArray(allVideos)) return [];
    const valid = allVideos.filter(
      (v): v is VideoItem => Boolean(v && typeof v === "object" && v.id && !isShortVideo(v))
    );
    if (activeCategory === "All") return valid;
    return valid.filter(
      (video) =>
        (typeof video.category === "string" && video.category.toLowerCase() === activeCategory.toLowerCase()) ||
        (Array.isArray(video.tags) &&
          video.tags.some((t) => typeof t === "string" && t.toLowerCase().includes(activeCategory.toLowerCase())))
    );
  }, [activeCategory, allVideos]);

  // Dedicated shorts
  const shortsVideos = useMemo(() => {
    if (!Array.isArray(allVideos)) return [];
    return allVideos.filter(
      (v): v is VideoItem => Boolean(v && typeof v === "object" && v.id && isShortVideo(v))
    );
  }, [allVideos]);

  const firstBatchVideos = useMemo(() => regularVideos.slice(0, 4), [regularVideos]);
  const secondBatchVideos = useMemo(() => regularVideos.slice(4), [regularVideos]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar collapsed={collapsedSidebar} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 px-4 md:px-8 pb-12">
          {/* Smooth Category Chips Bar */}
          <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-md py-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ease-out cursor-pointer outline-none ${
                    activeCategory === cat
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "bg-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Grid with Smooth Fade Transition */}
          {regularVideos.length > 0 || shortsVideos.length > 0 ? (
            <div key={activeCategory} className="space-y-8 animate-in fade-in duration-300">
              {/* First Row / Batch of Regular Videos */}
              {firstBatchVideos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                  {firstBatchVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {/* Dedicated Shorts Section (like YouTube) */}
              {shortsVideos.length > 0 && activeCategory === "All" && (
                <div className="my-8 py-6 border-y border-white/[0.08]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-white" />
                      <h2 className="text-xl font-bold text-white tracking-tight">Shorts</h2>
                    </div>
                    <Link
                      href="/shorts"
                      className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {shortsVideos.slice(0, 6).map((short) => (
                      <Link
                        key={short.id}
                        href={`/shorts?id=${short.id}`}
                        className="group flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.08] group-hover:scale-[1.02] group-hover:border-white/25 transition-all duration-200 shadow-lg">
                          {short.thumbnailUrl ? (
                            <img
                              src={short.thumbnailUrl}
                              alt={short.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-black">
                              <Flame className="h-8 w-8 text-zinc-500" />
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5">
                          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-zinc-200 transition-colors">
                            {short.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            {(short.viewCount || 0).toLocaleString()} views
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining Regular Videos */}
              {secondBatchVideos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                  {secondBatchVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          ) : allVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center max-w-md mx-auto animate-in fade-in duration-300">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                <Play className="h-7 w-7 text-zinc-300 ml-1" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">No videos uploaded yet</h3>
              <p className="text-xs text-zinc-400 mb-6 max-w-xs">
                Your feed is currently clean. Start by uploading your first video to share with viewers.
              </p>
              <Link
                href="/studio/upload"
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Upload Video
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <p className="text-base font-semibold">No videos found in this category.</p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-3 text-xs text-white underline hover:text-zinc-300 cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
