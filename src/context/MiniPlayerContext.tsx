"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { VideoItem } from "@/types";
import { Play, Pause, X, Maximize2, RotateCcw, RotateCw, Volume2, VolumeX, PictureInPicture2 } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import { resolveChannelAvatar } from "@/lib/user-validation";
import { getVideoBlob } from "@/lib/video-storage";
import Hls from "hls.js";

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
  const [resolvedSrc, setResolvedSrc] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const openMiniPlayer = (video: VideoItem, initialTime = 0, autoPlay = true) => {
    setActiveVideo(video);
    setCurrentTime(initialTime);
    setIsPlaying(autoPlay);
  };

  const closeMiniPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setActiveVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setResolvedSrc("");
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
    const target = Math.max(0, Math.min(seconds, duration || 0));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const expandToWatch = () => {
    if (!activeVideo) return;
    const seekSec = Math.floor(currentTime);
    const targetId = activeVideo.id;
    closeMiniPlayer();
    if (pathname === "/watch") {
      router.replace(`/watch?v=${targetId}&t=${seekSec}`);
    } else {
      router.push(`/watch?v=${targetId}&t=${seekSec}`);
    }
  };

  // Resolve source URL whenever activeVideo changes
  useEffect(() => {
    let isCancelled = false;
    let blobUrl: string | null = null;

    async function resolveSource() {
      if (!activeVideo) {
        setResolvedSrc("");
        return;
      }

      // Check IndexedDB first for offline/local videos
      const localBlob = await getVideoBlob(activeVideo.id);
      if (isCancelled) return;
      if (localBlob) {
        blobUrl = URL.createObjectURL(localBlob);
        setResolvedSrc(blobUrl);
        return;
      }

      let src = activeVideo.rawVideoUrl || "";
      if (!src) {
        if (activeVideo.id.startsWith("v-srv-") || activeVideo.id.startsWith("v-user-")) {
          src = `/api/videos/${activeVideo.id}/stream`;
        } else if (activeVideo.masterPlaylistUrl) {
          src = activeVideo.masterPlaylistUrl;
        } else {
          src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
        }
      }

      if (!isCancelled) {
        setResolvedSrc(src);
      }
    }

    resolveSource();

    return () => {
      isCancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [activeVideo]);

  // Attach resolvedSrc to video element (with HLS support)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = resolvedSrc.endsWith(".m3u8") || resolvedSrc.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true });
      hlsRef.current = hls;
      hls.loadSource(resolvedSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (currentTime > 0) {
          video.currentTime = currentTime;
        }
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      video.src = resolvedSrc;
      if (currentTime > 0) {
        video.currentTime = currentTime;
      }
      if (isPlaying) {
        video.play().catch(() => {});
      }
    }
  }, [resolvedSrc]);

  // Keep state synchronized with video element
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

  const toggleNativePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

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

      {/* Floating In-App Mini Player */}
      {activeVideo && (
        <aside
          role="region"
          aria-label="Video miniplayer"
          className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 select-none"
        >
          {/* Top Video Area */}
          <div className="relative aspect-video w-full bg-black group overflow-hidden">
            <video
              ref={videoRef}
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
              {/* Top Bar: PiP, Expand & Close */}
              <div className="flex items-center justify-between w-full pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={expandToWatch}
                    className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                    title="Expand to watch page"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleNativePiP}
                    className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                    title="Picture-in-Picture window"
                  >
                    <PictureInPicture2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeMiniPlayer}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                  title="Close miniplayer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Center Playback Controls */}
              <div className="flex items-center justify-center gap-4 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    skipSeconds(-10);
                  }}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-lg cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    skipSeconds(10);
                  }}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                  title="Forward 10s"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom Volume Toggle & Timestamp */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => !m);
                  }}
                  className="p-1 rounded bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
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
                e.stopPropagation();
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
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={expandToWatch}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Expand"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeMiniPlayer}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
