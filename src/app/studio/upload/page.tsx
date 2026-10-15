"use client";

import React, { useState } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { UploadCloud, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function StudioUploadPage() {
  const { user, openAuthModal } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleStartUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !title) return;

    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        setUploadProgress(100);
        setIsUploading(false);
        setIsCompleted(true);
        clearInterval(interval);

        try {
          const newVideo = {
            id: `v-user-${Date.now()}`,
            title: title.trim() || file?.name || "Untitled Video",
            description: description.trim() || "Uploaded to Entropy",
            thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: 180,
            viewCount: 0,
            publishedAt: new Date().toISOString(),
            channel: {
              id: user?.id || "u-user",
              handle: user?.handle || "user",
              displayName: user?.name || "User",
              avatarUrl: user?.avatarUrl || user?.avatar || "",
            },
          };
          const existing = JSON.parse(localStorage.getItem("entropy_user_videos") || "[]");
          localStorage.setItem("entropy_user_videos", JSON.stringify([newVideo, ...existing]));
        } catch {
          // ignore
        }
      } else {
        setUploadProgress(progress);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 md:px-8 py-8 max-w-4xl mx-auto w-full">
          {!user ? (
            <div className="py-16 max-w-md mx-auto text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white mb-4">
                <UploadCloud className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Want to create and upload videos?</h2>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm">
                Sign in to your Entropy account to start uploading, managing videos, and growing your audience.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="rounded-full bg-white hover:bg-zinc-200 text-black px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Upload videos</h1>
                  <p className="text-xs text-zinc-400 mt-0.5">Post new video content to your channel</p>
                </div>
                <Link
                  href="/studio/videos"
                  className="text-xs text-zinc-400 hover:text-white font-semibold"
                >
                  Cancel & Exit
                </Link>
              </div>

              {!isCompleted ? (
                <form onSubmit={handleStartUpload} className="space-y-6">
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="relative border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-2xl p-10 flex flex-col items-center justify-center bg-zinc-950/60 text-center transition-colors cursor-pointer group"
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="h-16 w-16 rounded-full bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors mb-3">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-200">
                  {file ? file.name : "Drag and drop video files to upload"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Your videos will be private until you publish them.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-white text-zinc-900 px-5 py-2 text-xs font-bold hover:bg-zinc-200"
                >
                  Select files
                </button>
              </div>

              {/* Video Details Inputs */}
              <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Details</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Title (required)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Add a title that describes your video"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell viewers about your video"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 outline-none focus:border-white"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Music">Music</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>

              {/* Progress Bar when uploading */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Transcoding and processing HLS multi-bitrate streams...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUploading || (!file && !title)}
                  className="flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black px-6 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <span>{isUploading ? "Uploading..." : "Publish Video"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Upload Success Confirmation */
            <div className="bg-zinc-950 rounded-2xl p-10 border border-zinc-800 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Video Published Successfully!</h2>
              <p className="text-xs text-zinc-400 max-w-md mb-6">
                Your video &quot;{title}&quot; has been transcoded and is now live for viewers.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/studio/videos"
                  className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-2 text-xs font-bold transition-colors"
                >
                  Back to Dashboard
                </Link>
                <Link
                  href="/watch?v=sample-1"
                  className="rounded-full bg-white text-zinc-900 hover:bg-zinc-200 px-5 py-2 text-xs font-bold transition-colors"
                >
                  Watch Video
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </main>
      </div>
    </div>
  );
}
