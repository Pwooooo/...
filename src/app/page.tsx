"use client";

import React, { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { VideoItem } from "@/types";

const CATEGORIES = [
  "All",
  "Gaming",
  "Technology",
  "Music",
  "Web Development",
  "Artificial Intelligence",
  "Podcasts",
  "Design",
  "Live Streams",
  "Science & Nature",
  "Recently Uploaded",
];

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: "sample-1",
    title: "Building a Distributed Video Transcoder with Go, FFmpeg & S3",
    description: "Learn how modern video platforms transcode petabytes of video into multi-bitrate HLS streams asynchronously.",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 1420,
    viewCount: 142500,
    publishedAt: "2026-10-13T14:00:00.000Z",
    channel: {
      id: "ch-1",
      handle: "systemcraft",
      displayName: "SystemCraft Tech",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      subscribersCount: 245000,
    },
  },
  {
    id: "sample-2",
    title: "Next.js 16 Full Stack Architecture Deep Dive",
    description: "In-depth exploration of server actions, streaming rendering, and cache lifecycles.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 890,
    viewCount: 88400,
    publishedAt: "2026-10-14T10:30:00.000Z",
    channel: {
      id: "ch-2",
      handle: "reactmastery",
      displayName: "React Mastery",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
      subscribersCount: 112000,
    },
  },
  {
    id: "sample-3",
    title: "Why Modern Operating Systems Are So Complex",
    description: "Exploring memory paging, context switching, cache hierarchies, and kernel space architecture.",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 2310,
    viewCount: 420000,
    publishedAt: "2026-10-08T09:15:00.000Z",
    channel: {
      id: "ch-3",
      handle: "csinsights",
      displayName: "CS Insights",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      subscribersCount: 580000,
    },
  },
  {
    id: "sample-4",
    title: "Designing Interactive Visualizations with Shaders & WebGL",
    description: "Create mind-blowing graphical effects directly in the browser with fragment shaders and GLSL.",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 615,
    viewCount: 31200,
    publishedAt: "2026-10-12T16:45:00.000Z",
    channel: {
      id: "ch-4",
      handle: "creativecode",
      displayName: "Creative Code Labs",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      subscribersCount: 49000,
    },
  },
];

export default function HomePage() {
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar collapsed={collapsedSidebar} />

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden px-4 md:px-6 py-3">
          {/* Category Chips Bar */}
          <div className="sticky top-14 z-30 flex items-center gap-2 overflow-x-auto pb-4 pt-1 bg-[#0f0f0f]/95 backdrop-blur scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7 pt-2">
            {SAMPLE_VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
