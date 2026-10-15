"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { USER_PLAYLISTS, ALL_VIDEOS } from "@/lib/mock-data";
import Link from "next/link";
import { Play, Shuffle, Lock, MoreVertical } from "lucide-react";
import { formatDuration } from "@/lib/utils";

function PlaylistContent() {
  const searchParams = useSearchParams();
  const listId = searchParams.get("list") || "WL";

  const playlist =
    USER_PLAYLISTS.find((p) => p.id === listId) || {
      id: listId,
      title: listId === "WL" ? "Watch Later" : listId === "LL" ? "Liked videos" : "Custom Playlist",
      videoCount: ALL_VIDEOS.length,
      thumbnailUrl: ALL_VIDEOS[0].thumbnailUrl || "",
      updatedAt: "Updated recently",
      visibility: "PRIVATE" as const,
    };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1720px] mx-auto px-4 lg:px-8 py-6 w-full">
      {/* Left Column: Playlist Card & Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-4 bg-gradient-to-b from-zinc-800/80 to-zinc-900/60 p-6 rounded-2xl border border-zinc-700/40 h-fit lg:sticky lg:top-20">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg">
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{playlist.title}</h1>
          <p className="text-xs text-zinc-300 font-semibold mb-1">CurrentUser</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>{ALL_VIDEOS.length} videos</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> {playlist.visibility}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/watch?v=${ALL_VIDEOS[0]?.id}&list=${listId}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-zinc-900 px-4 py-2.5 font-bold text-sm hover:bg-zinc-200 transition-colors"
          >
            <Play className="h-4 w-4 fill-zinc-900" />
            <span>Play all</span>
          </Link>
          <button className="flex items-center justify-center gap-2 rounded-full bg-zinc-800/80 text-white px-4 py-2.5 font-bold text-sm hover:bg-zinc-700 transition-colors border border-zinc-700/50">
            <Shuffle className="h-4 w-4" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Right Column: Video Items */}
      <div className="flex-1 space-y-2">
        {ALL_VIDEOS.map((video, index) => (
          <div
            key={video.id}
            className="flex items-center gap-4 p-2 rounded-xl hover:bg-zinc-900/80 group transition-colors"
          >
            <span className="w-4 text-center text-xs font-semibold text-zinc-500 group-hover:text-zinc-200">
              {index + 1}
            </span>

            <Link
              href={`/watch?v=${video.id}&list=${listId}`}
              className="relative aspect-video w-40 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800"
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

            <div className="flex-1 min-w-0">
              <Link
                href={`/watch?v=${video.id}&list=${listId}`}
                className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 line-clamp-2"
              >
                {video.title}
              </Link>
              <Link
                href={`/@${video.channel.handle}`}
                className="text-xs text-zinc-400 hover:text-zinc-200 mt-1 inline-block"
              >
                {video.channel.displayName}
              </Link>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-white rounded-full">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlaylistPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <Suspense fallback={<div className="p-8 text-zinc-400 text-center">Loading playlist...</div>}>
            <PlaylistContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
