"use client";

import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { getAllCombinedVideos, getBaseVideos, fetchServerVideos, isShortVideo } from "@/lib/video-storage";
import { VideoItem } from "@/types";
import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/utils";
import { resolveChannelAvatar, getRegisteredUsers, findUserByHandle, UserRecord } from "@/lib/user-validation";
import { SlidersHorizontal, CheckCircle2 } from "lucide-react";

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
    window.addEventListener("entropy_user_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("entropy_videos_updated", handleUpdate);
      window.removeEventListener("entropy_user_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const cleanQuery = query.replace(/^%40|^@/, "").trim().toLowerCase();

  // Find matching channels/users
  const matchingChannel = useMemo<UserRecord | null>(() => {
    if (!cleanQuery) return null;
    const direct = findUserByHandle(cleanQuery);
    if (direct) return direct;

    const allRegistered = getRegisteredUsers();
    return (
      allRegistered.find(
        (u) =>
          (u.handle && u.handle.toLowerCase().includes(cleanQuery)) ||
          (u.name && u.name.toLowerCase().includes(cleanQuery))
      ) || null
    );
  }, [cleanQuery]);

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
          Search results for: <span className="text-white font-bold">&quot;{query}&quot;</span> ({results.length} videos)
        </h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Matching Channel Card */}
      {matchingChannel && (
        <Link
          href={`/profile/@${matchingChannel.handle}`}
          className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.06] mb-6 transition-colors group"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/10 bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-2xl text-white flex-shrink-0">
            <img
              src={matchingChannel.avatarUrl || "/default-avatar.png"}
              alt={matchingChannel.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                {matchingChannel.name}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              @{matchingChannel.handle} • Channel
            </p>
            {matchingChannel.bio && (
              <p className="text-xs text-zinc-300 mt-1 line-clamp-1">
                {matchingChannel.bio}
              </p>
            )}
          </div>
          <div className="hidden sm:block">
            <span className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">
              View Channel
            </span>
          </div>
        </Link>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((video) => {
            const isShort = isShortVideo(video);
            const targetUrl = isShort ? `/shorts?id=${video.id}` : `/watch?v=${video.id}`;

            return (
              <div
                key={video.id}
                className="flex flex-col sm:flex-row gap-4 p-2 rounded-xl hover:bg-zinc-900/80 group transition-colors"
              >
                <Link
                  href={targetUrl}
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
                  {isShort && (
                    <span className="absolute top-2 left-2 rounded bg-white text-black px-1.5 py-0.5 text-[10px] font-bold">
                      Short
                    </span>
                  )}
                </Link>

                <div className="flex-1 flex flex-col justify-start py-1">
                  <Link
                    href={targetUrl}
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
                      <img
                        src={resolveChannelAvatar(video.channel, video)}
                        alt={video.channel?.displayName || "Channel"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    </div>
                    <span>{video.channel?.displayName || video.channel?.handle || "Creator"}</span>
                  </Link>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : !matchingChannel ? (
        <div className="py-20 text-center text-zinc-400">
          <p className="text-base font-semibold">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-zinc-500 mt-1">Try different keywords or check spelling.</p>
        </div>
      ) : null}
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
