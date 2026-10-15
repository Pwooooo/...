"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { ALL_VIDEOS } from "@/lib/mock-data";

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

  const filteredVideos = useMemo(() => {
    if (activeCategory === "All") return ALL_VIDEOS;
    return ALL_VIDEOS.filter(
      (video) =>
        video.category.toLowerCase() === activeCategory.toLowerCase() ||
        video.tags.some((t) => t.toLowerCase().includes(activeCategory.toLowerCase()))
    );
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar collapsed={collapsedSidebar} />

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden px-4 md:px-6 py-3">
          {/* Category Chips Bar */}
          <div className="sticky top-14 z-30 flex items-center gap-2 overflow-x-auto pb-4 pt-1 bg-black/95 backdrop-blur scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Videos Grid */}
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7 pt-2">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <p className="text-base font-semibold">No videos found in this category.</p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-3 text-xs text-blue-400 hover:underline"
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
