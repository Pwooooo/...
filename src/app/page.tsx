"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import Link from "next/link";
import { Play } from "lucide-react";
import { ALL_VIDEOS } from "@/lib/mock-data";
import { getAllCombinedVideos, getBaseVideos, fetchServerVideos } from "@/lib/video-storage";
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

  const filteredVideos = useMemo(() => {
    if (!Array.isArray(allVideos)) return [];
    const valid = allVideos.filter((v): v is VideoItem => Boolean(v && typeof v === "object" && v.id));
    if (activeCategory === "All") return valid;
    return valid.filter(
      (video) =>
        (typeof video.category === "string" && video.category.toLowerCase() === activeCategory.toLowerCase()) ||
        (Array.isArray(video.tags) && video.tags.some((t) => typeof t === "string" && t.toLowerCase().includes(activeCategory.toLowerCase())))
    );
  }, [activeCategory, allVideos]);

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
          {filteredVideos.length > 0 ? (
            <div
              key={activeCategory}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 transition-opacity duration-300 animate-in fade-in"
            >
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
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
