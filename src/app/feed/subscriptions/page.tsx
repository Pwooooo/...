"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_CHANNELS } from "@/lib/mock-data";
import { getAllCombinedVideos, getBaseVideos, fetchServerVideos } from "@/lib/video-storage";
import { VideoItem } from "@/types";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";

export default function SubscriptionsPage() {
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [videos, setVideos] = useState<VideoItem[]>(() => getBaseVideos());

  useEffect(() => {
    setVideos(getAllCombinedVideos());
    fetchServerVideos().then(() => {
      setVideos(getAllCombinedVideos());
    });
    const update = () => setVideos(getAllCombinedVideos());
    window.addEventListener("entropy_videos_updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("entropy_videos_updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const channelsList = Object.values(MOCK_CHANNELS);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar onToggleSidebar={() => setCollapsedSidebar(!collapsedSidebar)} />

      <div className="flex flex-1">
        <Sidebar collapsed={collapsedSidebar} />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-5">
          {/* Subscribed Channels Avatar Bar */}
          <div className="flex items-center gap-6 overflow-x-auto pt-3 pb-4 border-b border-zinc-800 scrollbar-none mb-6">
            {channelsList.map((channel) => (
              <Link
                key={channel.id}
                href={`/@${channel.handle}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group pt-1"
              >
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-zinc-900 border-2 border-white group-hover:border-zinc-300 transition-colors">
                  <img
                    src={channel.avatarUrl || ""}
                    alt={channel.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs text-zinc-300 max-w-[70px] truncate group-hover:text-white">
                  {channel.displayName}
                </span>
              </Link>
            ))}
          </div>

          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-zinc-100">Latest from your subscriptions</h1>
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Videos Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7"
                : "flex flex-col gap-4 max-w-4xl"
            }
          >
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

