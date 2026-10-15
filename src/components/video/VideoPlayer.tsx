"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
}: VideoPlayerProps) {
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
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
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
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
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-black border border-zinc-900 shadow-2xl select-none"
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
        <div />

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
          {/* Monochrome White Scrubber Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white hover:h-2 transition-all"
          />

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
                title="Rewind 10s"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="hover:text-zinc-300 cursor-pointer">
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
                  className="w-16 h-1 bg-zinc-600 rounded appearance-none cursor-pointer accent-white"
                />
              </div>

              <span className="font-mono text-zinc-300">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
              </span>
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
                    <div className="absolute right-0 bottom-8 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-32 z-50">
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

              <button onClick={toggleFullscreen} className="hover:text-zinc-300 transition-colors cursor-pointer">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
