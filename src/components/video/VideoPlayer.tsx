"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { VideoChapter } from "@/types";

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  chapters?: VideoChapter[];
  onTimeChange?: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, poster, autoPlay = false, chapters = [], onTimeChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
    const [showSettings, setShowSettings] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<number>(0);

    // Expose seekTo method to parent components
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(seconds, duration || video.duration));
        setCurrentTime(video.currentTime);
        if (video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        }
      },
      play: () => {
        videoRef.current?.play().catch(() => {});
        setIsPlaying(true);
      },
      pause: () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      },
      getCurrentTime: () => videoRef.current?.currentTime || 0,
    }));

    // Initialize Video & HLS
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      const isHlsStream = src.endsWith(".m3u8") || src.includes(".m3u8");

      if (isHlsStream && Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const parsedLevels = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height,
            bitrate: lvl.bitrate,
          }));
          setLevels(parsedLevels);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setCurrentLevel(data.level);
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl") || !isHlsStream) {
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      }
    }, [src, autoPlay]);

    const togglePlay = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }, []);

    const toggleMute = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isMuted) {
        video.muted = false;
        setIsMuted(false);
        video.volume = volume > 0 ? volume : 0.5;
      } else {
        video.muted = true;
        setIsMuted(true);
      }
    }, [isMuted, volume]);

    const toggleFullscreen = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }, []);

    // Global Hotkeys when player is in view
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const activeTag = (document.activeElement?.tagName || "").toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;

        if (e.code === "Space" || e.key === "k") {
          e.preventDefault();
          togglePlay();
        } else if (e.key === "f") {
          e.preventDefault();
          toggleFullscreen();
        } else if (e.key === "m") {
          e.preventDefault();
          toggleMute();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
          }
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          }
        } else if (e.key === "j") {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
        } else if (e.key === "l") {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePlay, toggleFullscreen, toggleMute]);

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;
      setCurrentTime(video.currentTime);
      if (onTimeChange) onTimeChange(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (!video) return;
      setDuration(video.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const seekTime = parseFloat(e.target.value);
      video.currentTime = seekTime;
      setCurrentTime(seekTime);
    };

    const handleMouseMoveTimeline = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const clampedPos = Math.max(0, Math.min(1, pos));
      setHoverPos(clampedPos * 100);
      setHoverTime(clampedPos * (duration || 100));
    };

    const handleMouseLeaveTimeline = () => {
      setHoverTime(null);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const newVol = parseFloat(e.target.value);
      video.volume = newVol;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    };

    const handleQualityChange = (levelIndex: number) => {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = levelIndex;
        setCurrentLevel(levelIndex);
        setShowSettings(false);
      }
    };

    return (
      <div
        ref={containerRef}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl select-none"
      >
        <video
          ref={videoRef}
          poster={poster}
          className="h-full w-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Control Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
              Press [Space] to pause • [F] for Fullscreen
            </span>
          </div>

          {/* Center Big Play/Pause Button on Pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="self-center rounded-full bg-white text-black p-4 shadow-2xl hover:scale-110 transition-transform cursor-pointer"
              aria-label="Play video"
            >
              <Play className="h-8 w-8 fill-black translate-x-0.5" />
            </button>
          )}

          {/* Bottom Bar */}
          <div className="flex flex-col gap-2">
            {/* Interactive Timeline with Chapter Ticks and Hover Tooltip */}
            <div
              className="relative w-full py-1 cursor-pointer"
              onMouseMove={handleMouseMoveTimeline}
              onMouseLeave={handleMouseLeaveTimeline}
            >
              {/* Hover Tooltip with Chapter Title and Most Watched Indicator */}
              {hoverTime !== null && (
                <div
                  className="absolute bottom-6 -translate-x-1/2 bg-black/95 backdrop-blur-md border border-white/20 px-2.5 py-1.5 rounded-xl text-xs text-white pointer-events-none shadow-2xl z-30 flex flex-col items-center gap-0.5"
                  style={{ left: `${hoverPos}%` }}
                >
                  {hoverTime >= 480 && hoverTime <= 680 && (
                    <span className="text-[9px] font-sans font-extrabold uppercase tracking-wider bg-white text-black px-2 py-0.5 rounded-full mb-0.5 shadow-sm">
                      Most watched
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold">{formatDuration(Math.floor(hoverTime))}</span>
                  {chapters.length > 0 && (
                    <span className="text-[10px] text-zinc-400 max-w-[160px] truncate">
                      {(chapters.slice().reverse().find((c) => hoverTime >= c.seconds) || chapters[0]).title}
                    </span>
                  )}
                </div>
              )}

              {/* Chapter Tick Marks */}
              {duration > 0 &&
                chapters.map((ch) => {
                  const leftPercent = (ch.seconds / duration) * 100;
                  return (
                    <div
                      key={ch.id}
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/40 pointer-events-none z-10"
                      style={{ left: `${leftPercent}%` }}
                      title={ch.title}
                    />
                  );
                })}

              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white hover:h-2 transition-all relative z-20"
              />
            </div>

            <div className="flex items-center justify-between text-white text-xs">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="hover:text-zinc-300 transition-colors cursor-pointer">
                  {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime -= 10;
                  }}
                  className="hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Rewind 10s (J)"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="hover:text-zinc-300 cursor-pointer" title="Mute (M)">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-white"
                  />
                </div>

                <div className="flex items-center gap-1 font-mono text-zinc-300">
                  <span>{formatDuration(Math.floor(currentTime))}</span>
                  <span>/</span>
                  <span>{formatDuration(Math.floor(duration))}</span>
                  {chapters.length > 0 && (
                    <span className="hidden md:inline-flex items-center text-xs text-zinc-300 font-sans font-medium ml-1.5 truncate max-w-[220px]">
                      • {(chapters.slice().reverse().find((c) => currentTime >= c.seconds) || chapters[0]).title}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4 relative">
                {levels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Playback Quality"
                    >
                      <Settings className="h-5 w-5" />
                    </button>

                    {showSettings && (
                      <div className="absolute right-0 bottom-8 bg-zinc-950 border border-white/20 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-32 z-50">
                        <button
                          onClick={() => handleQualityChange(-1)}
                          className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            currentLevel === -1 ? "font-bold bg-white text-black" : "text-zinc-300 hover:bg-zinc-900"
                          }`}
                        >
                          Auto
                        </button>
                        {levels.map((lvl) => (
                          <button
                            key={lvl.id}
                            onClick={() => handleQualityChange(lvl.id)}
                            className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              currentLevel === lvl.id ? "font-bold bg-white text-black" : "text-zinc-300 hover:bg-zinc-900"
                            }`}
                          >
                            {lvl.height}p
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={toggleFullscreen} className="hover:text-zinc-300 transition-colors cursor-pointer" title="Fullscreen (F)">
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
