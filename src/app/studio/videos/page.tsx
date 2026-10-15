"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import Link from "next/link";
import {
  Upload,
  Eye,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  Trash2,
  Video as VideoIcon,
  Plus,
} from "lucide-react";
import { formatViews } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";

export default function StudioVideosPage() {
  const { user, openAuthModal } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        const stored = JSON.parse(localStorage.getItem("entropy_user_videos") || "[]");
        // Only keep videos uploaded by this user or matching their handle
        const userVideos = stored.filter(
          (v: VideoItem) =>
            v.channel?.handle?.toLowerCase() === user.handle.toLowerCase() ||
            v.channel?.id === user.id
        );
        setVideos(userVideos);
      } else {
        setVideos([]);
      }
    } catch {
      setVideos([]);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  const deleteVideo = (id: string) => {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    try {
      const stored = JSON.parse(localStorage.getItem("entropy_user_videos") || "[]");
      const filtered = stored.filter((v: VideoItem) => v.id !== id);
      localStorage.setItem("entropy_user_videos", JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h1 className="text-2xl font-bold text-white">Your videos</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Manage your uploads, visibility, and analytics</p>
            </div>

            {user && (
              <Link
                href="/studio/upload"
                className="flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-black shadow-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Upload video</span>
              </Link>
            )}
          </div>

          {!user ? (
            /* Unauthenticated State */
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-12 text-center max-w-md mx-auto my-12 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
                <VideoIcon className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Sign in to view your videos</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Your uploaded videos and channel content will be stored securely with your account.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          ) : isLoaded && videos.length === 0 ? (
            /* Empty State: No uploaded videos */
            <div className="rounded-3xl bg-zinc-950 border border-white/10 p-12 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1.5">No videos uploaded yet</h2>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                Your uploaded videos will appear here. Start creating to share content with your viewers on Entropy.
              </p>
              <Link
                href="/studio/upload"
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-lg"
              >
                Upload your first video
              </Link>
            </div>
          ) : (
            /* Videos Table */
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Video</th>
                    <th className="py-3 px-4 font-semibold">Visibility</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Views</th>
                    <th className="py-3 px-4 font-semibold">Comments</th>
                    <th className="py-3 px-4 font-semibold">Likes</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {videos.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-900/50 group transition-colors">
                      {/* Video Thumbnail & Title */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-video w-24 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
                            <img
                              src={v.thumbnailUrl || ""}
                              alt={v.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/watch?v=${v.id}`}
                              className="font-semibold text-zinc-200 hover:text-white line-clamp-1"
                            >
                              {v.title}
                            </Link>
                            <p className="text-[11px] text-zinc-500 line-clamp-1">{v.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Visibility */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          <Eye className="h-3 w-3" /> Public
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-4 text-zinc-300 font-medium">
                        {formatViews(v.viewCount || 0)}
                      </td>

                      {/* Comments */}
                      <td className="py-3 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>0</span>
                        </div>
                      </td>

                      {/* Likes */}
                      <td className="py-3 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>0</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/watch?v=${v.id}`}
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                            title="Watch video"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteVideo(v.id)}
                            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Delete video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
