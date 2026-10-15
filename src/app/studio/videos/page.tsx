"use client";

import React, { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ALL_VIDEOS } from "@/lib/mock-data";
import Link from "next/link";
import {
  Upload,
  Eye,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import { formatViews } from "@/lib/utils";

export default function StudioVideosPage() {
  const [videos, setVideos] = useState(ALL_VIDEOS);

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h1 className="text-2xl font-bold text-white">Channel content</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Manage your uploads, visibility, and analytics</p>
            </div>

            <Link
              href="/studio/upload"
              className="flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Create / Upload</span>
            </Link>
          </div>

          {/* Videos Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Video</th>
                  <th className="py-3 px-4 font-semibold">Visibility</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Views</th>
                  <th className="py-3 px-4 font-semibold">Comments</th>
                  <th className="py-3 px-4 font-semibold">Likes (%)</th>
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
                            className="font-semibold text-zinc-200 hover:text-blue-400 line-clamp-1"
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
                      {formatViews(v.viewCount)}
                    </td>

                    {/* Comments */}
                    <td className="py-3 px-4 text-zinc-400">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>24</span>
                      </div>
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-4 text-zinc-400">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>98.4%</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                          title="Edit details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteVideo(v.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-red-400"
                          title="Delete video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                          title="Options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
