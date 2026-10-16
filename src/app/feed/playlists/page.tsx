"use client";

import React from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { USER_PLAYLISTS } from "@/lib/mock-data";
import Link from "next/link";
import { PlaySquare, ListVideo, Lock } from "lucide-react";

export default function PlaylistsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-zinc-100">Playlists</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {USER_PLAYLISTS.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist?list=${playlist.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  {playlist.thumbnailUrl ? (
                    <img
                      src={playlist.thumbnailUrl}
                      alt={playlist.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ListVideo className="h-8 w-8 text-zinc-600" />
                  )}
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold">
                    <ListVideo className="h-5 w-5" />
                    <span>{playlist.videoCount}</span>
                    <span>videos</span>
                  </div>
                </div>

                <div className="px-1">
                  <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 line-clamp-1">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                    {playlist.visibility === "PRIVATE" && <Lock className="h-3 w-3" />}
                    <span>{playlist.visibility}</span>
                    <span>•</span>
                    <span>{playlist.updatedAt}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 group-hover:text-white mt-1 inline-flex items-center gap-1">
                    <PlaySquare className="h-3.5 w-3.5" /> View full playlist
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
