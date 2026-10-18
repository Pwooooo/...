"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { VideoItem } from "@/types";
import { Play, Pause, X, Maximize2, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import { resolveChannelAvatar } from "@/lib/user-validation";

interface MiniPlayerContextType {
  activeVideo: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  openMiniPlayer: (video: VideoItem, initialTime?: number, autoPlay?: boolean) => void;
  closeMiniPlayer: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  expandToWatch: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export function MiniPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isWatchPage = pathname === "/watch";

  const openMiniPlayer = (video: VideoItem, initialTime = 0, autoPlay = true) => {
    setActiveVideo(video);
    setCurrentTime(initialTime);
    setIsPlaying(autoPlay);
  };

  const closeMiniPlayer = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 0));
    setCurrentTime(videoRef.current.currentTime);
  };

  const expandToWatch = () => {
    if (!activeVideo) return;
    const seekSec = Math.floor(currentTime);
    router.push(`/watch?v=${activeVideo.id}&t=${seekSec}`);
    closeMiniPlayer();
  };

  // Sync video time and events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;

    if (currentTime > 0 && Math.abs(video.currentTime - currentTime) > 2) {
      video.currentTime = currentTime;
    }

    if (isPlaying) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeVideo]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (currentTime > 0) {
        videoRef.current.currentTime = currentTime;
      }
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const skipSeconds = (offset: number) => {
    if (videoRef.current) {
      const nextTime = Math.max(0, Math.min(videoRef.current.currentTime + offset, duration || 0));
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  // Video source resolution
  const videoSrc = activeVideo?.rawVideoUrl || activeVideo?.masterPlaylistUrl || "";

  return (
    <MiniPlayerContext.Provider
      value={{
        activeVideo,
        isPlaying,
        currentTime,
        duration,
        openMiniPlayer,
        closeMiniPlayer,
        togglePlay,
        seekTo,
        expandToWatch,
      }}
    >
      {children}

      {/* Floating In-App Mini Player (Hidden on /watch page of active video) */}
      {activeVideo && !isWatchPage && (
        <aside
          role="region"
          aria-label="Video miniplayer"
          className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 select-none"
        >
          {/* Top Video Area */}
          <div className="relative aspect-video w-full bg-black group overflow-hidden">
            <video
              ref={videoRef}
              src={videoSrc}
              poster={activeVideo.thumbnailUrl || undefined}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
              playsInline
              className="h-full w-full object-contain cursor-pointer"
              onClick={expandToWatch}
            />

            {/* Quick Hover Controls Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none">
              {/* Top Bar: Expand & Close */}
              <div className="flex items-center justify-between w-full pointer-events-auto">
                <button
                  type="button"
                  onClick={expandToWatch}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  title="Expand to watch page"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeMiniPlayer}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  title="Close miniplayer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Center Playback Controls */}
              <div className="flex items-center justify-center gap-4 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => skipSeconds(-10)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-lg"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => skipSeconds(10)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  title="Forward 10s"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom Volume Toggle & Timestamp */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="p-1 rounded bg-black/60 hover:bg-black/90 text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px]">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* Bottom Progress Scrub Bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group-hover:h-1.5 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seekTo(pos * (duration || 1));
              }}
            >
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Bottom Card Info */}
          <div className="p-3 flex items-center justify-between gap-3 bg-zinc-900/60">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                <img
                  src={resolveChannelAvatar(activeVideo.channel, activeVideo)}
                  alt={activeVideo.channel?.displayName || "Channel"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  onClick={expandToWatch}
                  className="text-xs font-semibold text-white truncate cursor-pointer hover:underline"
                  title={activeVideo.title}
                >
                  {activeVideo.title}
                </h4>
                <Link
                  href={`/@${(activeVideo.channel?.handle || activeVideo.channel?.displayName || "").replace(/^@/, "")}`}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 truncate block mt-0.5"
                >
                  {activeVideo.channel?.displayName || "Creator"}
                </Link>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={expandToWatch}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Expand"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeMiniPlayer}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error("useMiniPlayer must be used within a MiniPlayerProvider");
  }
  return context;
}
