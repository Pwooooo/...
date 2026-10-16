"use client";

import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ALL_VIDEOS } from "@/lib/mock-data";
import { getAllCombinedVideos, getBaseVideos, fetchServerVideos } from "@/lib/video-storage";
import { VideoItem } from "@/types";
import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search_query") || "";
  const [allVideos, setAllVideos] = useState<VideoItem[]>(() => getBaseVideos());

  useEffect(() => {
    setAllVideos(getAllCombinedVideos());
    fetchServerVideos().then(() => {
      setAllVideos(getAllCombinedVideos());
    });

    const handleUpdate = () => {
      setAllVideos(getAllCombinedVideos());
    };

    window.addEventListener("entropy_videos_updated", handleUpdate);
    return () => window.removeEventListener("entropy_videos_updated", handleUpdate);
  }, []);

  const results = useMemo(() => {
    if (!Array.isArray(allVideos)) return [];
    const valid = allVideos.filter((v): v is VideoItem => Boolean(v && v.id));
    if (!query) return valid;
    const lower = query.toLowerCase();
    return valid.filter(
      (v) =>
        (typeof v.title === "string" && v.title.toLowerCase().includes(lower)) ||
        (typeof v.description === "string" && v.description.toLowerCase().includes(lower)) ||
        (typeof v.channel?.displayName === "string" && v.channel.displayName.toLowerCase().includes(lower)) ||
        (Array.isArray(v.tags) && v.tags.some((t) => typeof t === "string" && t.toLowerCase().includes(lower)))
    );
  }, [query, allVideos]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 w-full">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400">
          Search results for: <span className="text-white font-bold">&quot;{query}&quot;</span> ({results.length} results)
        </h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((video) => (
            <div
              key={video.id}
              className="flex flex-col sm:flex-row gap-4 p-2 rounded-xl hover:bg-zinc-900/80 group transition-colors"
            >
              <Link
                href={`/watch?v=${video.id}`}
                className="relative aspect-video w-full sm:w-80 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800"
              >
                <img
                  src={video.thumbnailUrl || ""}
                  alt={video.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {formatDuration(video.durationSeconds)}
                </span>
              </Link>

              <div className="flex-1 flex flex-col justify-start py-1">
                <Link
                  href={`/watch?v=${video.id}`}
                  className="font-semibold text-base text-zinc-100 group-hover:text-blue-400 line-clamp-2"
                >
                  {video.title}
                </Link>

                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span>{formatViews(video.viewCount)}</span>
                  <span>•</span>
                  <span>Recently uploaded</span>
                </div>

                <Link
                  href={`/@${(video.channel?.handle || "creator").replace(/^@/, "")}`}
                  className="flex items-center gap-2 my-2.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <div className="h-6 w-6 rounded-full overflow-hidden bg-zinc-800">
                    {video.channel?.avatarUrl ? (
                      <img
                        src={video.channel.avatarUrl}
                        alt={video.channel?.displayName || "Channel"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-[10px] text-zinc-300 bg-zinc-700">
                        {((video.channel?.displayName || "C").charAt(0)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span>{video.channel?.displayName || video.channel?.handle || "Creator"}</span>
                </Link>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-zinc-400">
          <p className="text-base font-semibold">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-zinc-500 mt-1">Try different keywords or check spelling.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <Suspense fallback={<div className="p-8 text-zinc-400 text-center">Loading search results...</div>}>
            <SearchResultsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
