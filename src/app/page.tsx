"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { ALL_VIDEOS } from "@/lib/mock-data";
import Link from "next/link";
import { Play, Sparkles, CheckCircle2 } from "lucide-react";
import { formatDuration, formatViews } from "@/lib/utils";

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

  const featuredVideo = useMemo(() => {
    return ALL_VIDEOS.find((v) => v.featured) || ALL_VIDEOS[0];
  }, []);

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
        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-4">
          {/* Featured Video Highlight Hero Card (Only on 'All' tab) */}
          {activeCategory === "All" && featuredVideo && (
            <div className="relative mb-8 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 md:p-8 shadow-2xl group">
              <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity duration-700 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url(${featuredVideo.thumbnailUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black text-[11px] font-bold tracking-wider uppercase shadow-md">
                    <Sparkles className="h-3 w-3" />
                    <span>Featured Highlight</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {featuredVideo.title}
                  </h2>

                  <p className="text-xs md:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                    {featuredVideo.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                    <Link
                      href={`/@${featuredVideo.channel.handle}`}
                      className="flex items-center gap-1.5 font-semibold text-white hover:underline"
                    >
                      <img
                        src={featuredVideo.channel.avatarUrl || ""}
                        alt={featuredVideo.channel.displayName}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <span>{featuredVideo.channel.displayName}</span>
                      <CheckCircle2 className="h-3 w-3 text-zinc-400" />
                    </Link>
                    <span>•</span>
                    <span>{formatViews(featuredVideo.viewCount)}</span>
                    <span>•</span>
                    <span className="font-mono">{formatDuration(featuredVideo.durationSeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-stretch md:self-auto flex-shrink-0">
                  <Link
                    href={`/watch?v=${featuredVideo.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2.5 rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-3 font-bold text-sm shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>Watch Highlight</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Smooth Category Chips Bar */}
          <div className="sticky top-14 z-30 flex items-center gap-2 overflow-x-auto pb-4 pt-1 bg-black/95 backdrop-blur-md scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ease-out cursor-pointer border ${
                  activeCategory === cat
                    ? "bg-white text-black border-white shadow-md scale-[1.03]"
                    : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Videos Grid with Smooth Fade Transition */}
          {filteredVideos.length > 0 ? (
            <div
              key={activeCategory}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 pt-3 transition-opacity duration-300 animate-in fade-in"
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
