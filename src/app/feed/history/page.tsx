"use client";

import React, { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ALL_VIDEOS } from "@/lib/mock-data";
import { Trash2, PauseCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState(ALL_VIDEOS);
  const [searchHistory, setSearchHistory] = useState("");

  const filteredHistory = historyList.filter((video) =>
    video.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
    video.channel.displayName.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const removeItem = (id: string) => {
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllHistory = () => {
    setHistoryList([]);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-8">
          {/* Main List */}
          <div className="flex-1 max-w-4xl">
            <h1 className="text-xl font-bold text-zinc-100 mb-6">Watch history</h1>

            {filteredHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredHistory.map((video) => (
                  <div
                    key={video.id}
                    className="flex gap-4 group rounded-xl p-2 hover:bg-zinc-900/80 transition-colors"
                  >
                    <Link
                      href={`/watch?v=${video.id}`}
                      className="relative aspect-video w-56 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800"
                    >
                      <img
                        src={video.thumbnailUrl || ""}
                        alt={video.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {formatDuration(video.durationSeconds)}
                      </span>
                    </Link>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/watch?v=${video.id}`}
                            className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 line-clamp-2"
                          >
                            {video.title}
                          </Link>
                          <button
                            onClick={() => removeItem(video.id)}
                            className="text-zinc-500 hover:text-zinc-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from watch history"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <Link
                          href={`/@${video.channel.handle}`}
                          className="text-xs text-zinc-400 hover:text-zinc-200 mt-1 inline-block"
                        >
                          {video.channel.displayName}
                        </Link>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{video.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-base font-semibold">This list has no videos.</p>
              </div>
            )}
          </div>

          {/* Right Control Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 border-l border-zinc-800/80 pl-0 lg:pl-6">
            <div className="flex items-center gap-2 border-b border-zinc-700 pb-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search watch history"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors text-left font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear all watch history</span>
              </button>
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors text-left font-medium">
                <PauseCircle className="h-4 w-4" />
                <span>Pause watch history</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
