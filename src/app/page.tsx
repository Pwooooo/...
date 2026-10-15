"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import SkyPills from "@/components/ui/SkyPills";
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
        <main className="flex-1 min-w-0 px-4 md:px-8 pb-12">
          {/* Smooth Category Chips Bar (Sky Pill Buttons) */}
          <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-md py-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-6">
            <SkyPills
              items={CATEGORIES}
              activeId={activeCategory}
              onChange={setActiveCategory}
              variant="pill"
              fillColor="rgba(255, 255, 255, 0.08)"
            />
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
