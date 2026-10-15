"use client";

import React, { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ALL_VIDEOS } from "@/lib/mock-data";
import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/utils";
import { Flame, Music2, Gamepad2, Film } from "lucide-react";

const TRENDING_TABS = [
  { id: "now", label: "Now", icon: Flame },
  { id: "music", label: "Music", icon: Music2 },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "movies", label: "Movies", icon: Film },
];

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState("now");

  const trendingVideos = ALL_VIDEOS.filter((v) => {
    if (activeTab === "music") return v.category === "Music";
    if (activeTab === "gaming") return v.category === "Gaming";
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6 max-w-5xl">
          {/* Trending Header Banner */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg">
              <Flame className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">Trending</h1>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-3 mb-6">
            {TRENDING_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ease-out cursor-pointer border ${
                    isActive
                      ? "bg-white text-black border-white shadow-md scale-[1.02]"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ranked Video List */}
          <div className="space-y-4">
            {trendingVideos.map((video, idx) => (
              <div
                key={video.id}
                className="flex items-start gap-4 p-2 rounded-xl hover:bg-zinc-900/80 group transition-colors"
              >
                <span className="w-6 text-center text-base font-bold text-zinc-400 self-center">
                  #{idx + 1}
                </span>

                <Link
                  href={`/watch?v=${video.id}`}
                  className="relative aspect-video w-56 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800"
                >
                  <img
                    src={video.thumbnailUrl || ""}
                    alt={video.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-semibold text-white">
                    {formatDuration(video.durationSeconds)}
                  </span>
                </Link>

                <div className="flex-1 min-w-0 py-1">
                  <Link
                    href={`/watch?v=${video.id}`}
                    className="font-bold text-sm text-zinc-100 group-hover:text-blue-400 line-clamp-2"
                  >
                    {video.title}
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <Link href={`/@${video.channel.handle}`} className="hover:text-zinc-200">
                      {video.channel.displayName}
                    </Link>
                    <span>•</span>
                    <span>{formatViews(video.viewCount)}</span>
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 mt-2">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
