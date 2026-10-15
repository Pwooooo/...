"use client";

import React, { useState, use } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import VideoCard from "@/components/video/VideoCard";
import { MOCK_CHANNELS, ALL_VIDEOS } from "@/lib/mock-data";
import { CheckCircle2, Bell, Share2 } from "lucide-react";

const CHANNEL_TABS = ["Videos", "Playlists", "Community", "About"];

export default function ChannelProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = use(params);
  const cleanHandle = resolvedParams.handle.replace(/^%40|^@/, "");

  const [activeTab, setActiveTab] = useState("Videos");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const channel = MOCK_CHANNELS[cleanHandle] || {
    id: "custom-channel",
    handle: cleanHandle,
    displayName: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 15400,
    description: `Official channel for @${cleanHandle}. Watch the latest releases and live streams.`,
  };

  const channelVideos = ALL_VIDEOS.filter(
    (v) => v.channel.handle.toLowerCase() === cleanHandle.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden">
          {/* Channel Banner */}
          <div className="h-44 sm:h-56 md:h-72 w-full overflow-hidden bg-zinc-900">
            {channel.bannerUrl && (
              <img
                src={channel.bannerUrl}
                alt={channel.displayName}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {/* Header / Avatar / Subscribe */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6 border-b border-zinc-800">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden bg-zinc-800 ring-4 ring-black shadow-xl flex-shrink-0">
                  <img
                    src={channel.avatarUrl || ""}
                    alt={channel.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
                    <span>{channel.displayName}</span>
                    <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-400 mt-1 font-mono">
                    @{channel.handle} • {((channel.subscribersCount ?? 0) / 1000).toFixed(1)}K subscribers • {channelVideos.length} videos
                  </p>
                  <p className="text-xs text-zinc-300 mt-2 line-clamp-1 max-w-xl">
                    {channel.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-center">
                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`flex-1 sm:flex-none rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                    isSubscribed
                      ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center justify-center gap-2"
                      : "bg-white text-zinc-900 hover:bg-zinc-200"
                  }`}
                >
                  {isSubscribed && <Bell className="h-3.5 w-3.5" />}
                  <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
                </button>
                <button className="rounded-full bg-zinc-800 hover:bg-zinc-700 p-2.5 text-zinc-200">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs with Smooth Transitions */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-3 pt-2">
              {CHANNEL_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ease-out cursor-pointer outline-none ${
                    activeTab === tab
                      ? "bg-white/[0.08] text-white shadow-sm scale-[1.02]"
                      : "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="py-6">
              {activeTab === "Videos" && (
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 mb-4">Uploads</h3>
                  {channelVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {channelVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ALL_VIDEOS.slice(0, 4).map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "About" && (
                <div className="max-w-2xl bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
                  <h3 className="text-base font-bold text-white mb-3">Description</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line mb-6">
                    {channel.description}
                  </p>
                  <h3 className="text-base font-bold text-white mb-3">Stats</h3>
                  <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                    <p>Joined Oct 2026</p>
                    <p>{((channel.subscribersCount ?? 0) * 8.4).toLocaleString()} total video views</p>
                  </div>
                </div>
              )}

              {activeTab !== "Videos" && activeTab !== "About" && (
                <div className="py-16 text-center text-zinc-500 text-sm">
                  No {activeTab.toLowerCase()} posted yet.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
