"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ShortItem } from "@/lib/mock-data";
import { getAllCombinedVideos, fetchServerVideos } from "@/lib/video-storage";
import { VideoItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  MoreVertical,
  Music,
  ChevronUp,
  ChevronDown,
  Flame,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Pause,
  X,
  RotateCw,
  SlidersHorizontal,
  Flag,
  Check,
} from "lucide-react";
import Link from "next/link";

interface ShortComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timeAgo: string;
  likes: number;
  dislikes: number;
}

export default function ShortsPage() {
  const { user } = useAuth();

  const [shortsList, setShortsList] = useState<ShortItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [dislikes, setDislikes] = useState<Record<string, number>>({});
  const [dislikedMap, setDislikedMap] = useState<Record<string, boolean>>({});
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, ShortComment[]>>({});
  const [commentInput, setCommentInput] = useState("");
  const [commentVotes, setCommentVotes] = useState<Record<string, "like" | "dislike">>({});

  // Settings menu state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const syncShorts = (videos: VideoItem[]) => {
      const shortsOnly = videos.filter((v) => {
        if (!v || !v.id) return false;
        return (
          v.isShort === true ||
          v.category === "Shorts" ||
          v.tags?.includes("shorts") ||
          (v.durationSeconds > 0 && v.durationSeconds <= 60)
        );
      });

      const mapped: ShortItem[] = shortsOnly.map((v) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.rawVideoUrl || v.masterPlaylistUrl || "",
        likesCount: v.viewCount ? Math.round(v.viewCount * 0.1) : 0,
        commentsCount: 0,
        channel: v.channel || {
          id: "creator",
          handle: "creator",
          displayName: "Creator",
        },
        songName: v.songName || "Original Audio",
      }));

      setShortsList(mapped);

      // Restore saved vote states
      try {
        const storedLiked: Record<string, boolean> = {};
        const storedDisliked: Record<string, boolean> = {};
        const storedLikes: Record<string, number> = {};
        const storedDislikes: Record<string, number> = {};

        mapped.forEach((s) => {
          const vote = localStorage.getItem(`entropy_video_vote_${s.id}`);
          if (vote === "like") storedLiked[s.id] = true;
          if (vote === "dislike") storedDisliked[s.id] = true;

          const l = localStorage.getItem(`entropy_video_likes_${s.id}`);
          if (l) storedLikes[s.id] = parseInt(l, 10);

          const d = localStorage.getItem(`entropy_video_dislikes_${s.id}`);
          if (d) storedDislikes[s.id] = parseInt(d, 10);
        });

        setLikedMap(storedLiked);
        setDislikedMap(storedDisliked);
        setLikes(storedLikes);
        setDislikes(storedDislikes);
      } catch {}
    };

    syncShorts(getAllCombinedVideos());

    fetchServerVideos().then(() => {
      syncShorts(getAllCombinedVideos());
    });

    const handleUpdate = () => {
      syncShorts(getAllCombinedVideos());
    };

    window.addEventListener("entropy_videos_updated", handleUpdate);
    return () => window.removeEventListener("entropy_videos_updated", handleUpdate);
  }, []);

  const currentShort = shortsList[currentIndex] || null;

  // Restore and initialize comments for current short
  useEffect(() => {
    if (!currentShort) return;
    try {
      const stored = localStorage.getItem(`entropy_comments_${currentShort.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCommentsMap((prev) => ({ ...prev, [currentShort.id]: parsed }));
          return;
        }
      }
    } catch {}

    setCommentsMap((prev) => {
      if (prev[currentShort.id]) return prev;
      return {
        ...prev,
        [currentShort.id]: [
          {
            id: `c-1-${currentShort.id}`,
            author: currentShort.channel.displayName || "Viewer",
            avatar: currentShort.channel.avatarUrl || "/default-avatar.png",
            content: "Check out this short!",
            timeAgo: "2h ago",
            likes: 5,
            dislikes: 0,
          },
        ],
      };
    });
  }, [currentShort?.id]);

  // When switching shorts, keep playback rate & reset playing state
  useEffect(() => {
    setIsPlaying(true);
    setIsSettingsOpen(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.loop = isLooping;
    }
  }, [currentIndex, playbackSpeed, isLooping]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showToast(`Speed set to ${speed === 1 ? "Normal" : `${speed}x`}`);
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (videoRef.current) {
      videoRef.current.loop = next;
    }
    showToast(next ? "Loop video: On" : "Loop video: Off");
  };

  const handleNext = () => {
    if (currentIndex < shortsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation & playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "m") {
        setIsMuted((prev) => !prev);
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "Escape") {
        if (isCommentsOpen) setIsCommentsOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shortsList.length, isCommentsOpen, isSettingsOpen, isPlaying]);

  const toggleLike = (id: string) => {
    const isLiked = likedMap[id];
    const newLiked = !isLiked;
    setLikedMap((prev) => ({ ...prev, [id]: newLiked }));

    const baseLikes = likes[id] ?? currentShort?.likesCount ?? 0;
    const newCount = Math.max(0, baseLikes + (newLiked ? 1 : -1));
    setLikes((prev) => ({ ...prev, [id]: newCount }));

    if (dislikedMap[id]) {
      setDislikedMap((prev) => ({ ...prev, [id]: false }));
      const newDCount = Math.max(0, (dislikes[id] ?? 0) - 1);
      setDislikes((prev) => ({ ...prev, [id]: newDCount }));
      try {
        localStorage.setItem(`entropy_video_dislikes_${id}`, newDCount.toString());
      } catch {}
    }

    try {
      localStorage.setItem(`entropy_video_likes_${id}`, newCount.toString());
      if (newLiked) {
        localStorage.setItem(`entropy_video_vote_${id}`, "like");
      } else {
        localStorage.removeItem(`entropy_video_vote_${id}`);
      }
    } catch {}
  };

  const toggleDislike = (id: string) => {
    const isDisliked = dislikedMap[id];
    const newDisliked = !isDisliked;
    setDislikedMap((prev) => ({ ...prev, [id]: newDisliked }));

    const baseDislikes = dislikes[id] ?? 0;
    const newDCount = Math.max(0, baseDislikes + (newDisliked ? 1 : -1));
    setDislikes((prev) => ({ ...prev, [id]: newDCount }));

    if (likedMap[id]) {
      setLikedMap((prev) => ({ ...prev, [id]: false }));
      const newLCount = Math.max(0, (likes[id] ?? currentShort?.likesCount ?? 0) - 1);
      setLikes((prev) => ({ ...prev, [id]: newLCount }));
      try {
        localStorage.setItem(`entropy_video_likes_${id}`, newLCount.toString());
      } catch {}
    }

    try {
      localStorage.setItem(`entropy_video_dislikes_${id}`, newDCount.toString());
      if (newDisliked) {
        localStorage.setItem(`entropy_video_vote_${id}`, "dislike");
      } else {
        localStorage.removeItem(`entropy_video_vote_${id}`);
      }
    } catch {}
  };

  const toggleSubscribe = (handle: string) => {
    setSubscribedMap((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentShort) return;

    const newComment: ShortComment = {
      id: `c-${Date.now()}`,
      author: user?.name || user?.handle || "Viewer",
      avatar: user?.avatarUrl || user?.avatar || "/default-avatar.png",
      content: commentInput.trim(),
      timeAgo: "Just now",
      likes: 0,
      dislikes: 0,
    };

    const currentList = commentsMap[currentShort.id] || [];
    const updated = [newComment, ...currentList];
    setCommentsMap((prev) => ({ ...prev, [currentShort.id]: updated }));
    setCommentInput("");

    try {
      localStorage.setItem(`entropy_comments_${currentShort.id}`, JSON.stringify(updated));
    } catch {}
  };

  const handleCommentVote = (commentId: string, type: "like" | "dislike") => {
    if (!currentShort) return;
    const currentVote = commentVotes[commentId];
    const newVote = currentVote === type ? undefined : type;

    setCommentVotes((prev) => {
      const next = { ...prev };
      if (newVote) next[commentId] = newVote;
      else delete next[commentId];
      return next;
    });

    setCommentsMap((prev) => {
      const list = prev[currentShort.id] || [];
      const updated = list.map((c) => {
        if (c.id !== commentId) return c;
        let l = c.likes;
        let d = c.dislikes;

        if (currentVote === "like") l = Math.max(0, l - 1);
        if (currentVote === "dislike") d = Math.max(0, d - 1);

        if (newVote === "like") l += 1;
        if (newVote === "dislike") d += 1;

        return { ...c, likes: l, dislikes: d };
      });
      try {
        localStorage.setItem(`entropy_comments_${currentShort.id}`, JSON.stringify(updated));
      } catch {}
      return { ...prev, [currentShort.id]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar drawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar collapsed={true} />

        <main className="flex-1 flex items-center justify-center py-6 px-4 relative">
          {!currentShort ? (
            <div className="text-center max-w-sm py-20 animate-in fade-in">
              <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4 mx-auto shadow-inner">
                <Flame className="h-8 w-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5">No shorts yet</h2>
              <p className="text-xs text-zinc-400 mb-6">Short vertical videos will appear here.</p>
              <Link
                href="/studio/upload?type=short"
                className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Upload Short
              </Link>
            </div>
          ) : (
            <div className="flex items-end gap-4 max-w-[480px] w-full">
              {/* Vertical Video Container */}
              <div
                onClick={togglePlayPause}
                className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800 flex items-center justify-center cursor-pointer select-none group"
              >
                <video
                  ref={videoRef}
                  key={currentShort.id}
                  src={currentShort.videoUrl}
                  autoPlay
                  loop={isLooping}
                  muted={isMuted}
                  playsInline
                  className="h-full w-full object-cover"
                />

                {/* Paused Play Icon Indicator */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-10 animate-in fade-in zoom-in-75 duration-150">
                    <div className="h-16 w-16 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-2xl">
                      <Play className="h-7 w-7 fill-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-4 pointer-events-none">
                  <div className="flex justify-end items-center pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted((prev) => !prev);
                      }}
                      className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                      title={isMuted ? "Unmute (M)" : "Mute (M)"}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Bottom Channel & Title Info */}
                  <div className="pointer-events-auto flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/@${currentShort.channel.handle}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0"
                      >
                        <img
                          src={currentShort.channel.avatarUrl || "/default-avatar.png"}
                          alt={currentShort.channel.displayName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      </Link>
                      <Link
                        href={`/@${currentShort.channel.handle}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-sm text-white flex items-center gap-1.5 hover:underline"
                      >
                        <span>@{currentShort.channel.handle}</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubscribe(currentShort.channel.handle);
                        }}
                        className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                          subscribedMap[currentShort.channel.handle]
                            ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                            : "bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {subscribedMap[currentShort.channel.handle] ? "Subscribed" : "Subscribe"}
                      </button>
                    </div>

                    <p className="text-sm text-zinc-100 font-medium line-clamp-2">
                      {currentShort.title}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Music className="h-3.5 w-3.5" />
                      <span className="truncate">{currentShort.songName}</span>
                    </div>
                  </div>
                </div>

                {/* Comments Overlay Drawer */}
                {isCommentsOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl flex flex-col rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">Comments</h3>
                        <span className="text-xs text-zinc-400">
                          {(commentsMap[currentShort.id]?.length ?? 0)}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsCommentsOpen(false)}
                        className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Comment List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {(!commentsMap[currentShort.id] || commentsMap[currentShort.id].length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-10">
                          <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                          <p>No comments yet.</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">Be the first to comment!</p>
                        </div>
                      ) : (
                        commentsMap[currentShort.id].map((comment) => (
                          <div key={comment.id} className="flex gap-2.5 text-xs">
                            <img
                              src={comment.avatar || "/default-avatar.png"}
                              alt={comment.author}
                              className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-zinc-200 truncate">@{comment.author}</span>
                                <span className="text-[10px] text-zinc-500">{comment.timeAgo}</span>
                              </div>
                              <p className="text-zinc-300 text-xs leading-relaxed break-words">{comment.content}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-zinc-400">
                                <button
                                  type="button"
                                  onClick={() => handleCommentVote(comment.id, "like")}
                                  className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                                    commentVotes[comment.id] === "like" ? "text-white font-bold" : ""
                                  }`}
                                >
                                  <ThumbsUp className={`h-3 w-3 ${commentVotes[comment.id] === "like" ? "fill-white" : ""}`} />
                                  <span className="text-[11px]">{comment.likes}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCommentVote(comment.id, "dislike")}
                                  className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                                    commentVotes[comment.id] === "dislike" ? "text-white font-bold" : ""
                                  }`}
                                >
                                  <ThumbsDown className={`h-3 w-3 ${commentVotes[comment.id] === "dislike" ? "fill-white" : ""}`} />
                                  <span className="text-[11px]">{comment.dislikes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input Form */}
                    <form
                      onSubmit={handleAddComment}
                      className="p-3 border-t border-white/[0.08] bg-black flex items-center gap-2"
                    >
                      <img
                        src={user?.avatarUrl || user?.avatar || "/default-avatar.png"}
                        alt="Avatar"
                        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!commentInput.trim()}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-bold transition-colors cursor-pointer"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Right Action Bar */}
              <div className="flex flex-col items-center gap-4 pb-2">
                {/* Like */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleLike(currentShort.id)}
                    className={`rounded-full p-3 transition-colors cursor-pointer ${
                      likedMap[currentShort.id]
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300"
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`h-6 w-6 ${likedMap[currentShort.id] ? "fill-white text-white" : ""}`} />
                  </button>
                  <span className="text-xs font-semibold text-zinc-300">
                    {(likes[currentShort.id] ?? currentShort.likesCount ?? 0).toLocaleString()}
                  </span>
                </div>

                {/* Dislike - cleanly matches like button with NO outline border */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleDislike(currentShort.id)}
                    className={`rounded-full p-3 transition-colors cursor-pointer ${
                      dislikedMap[currentShort.id]
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300"
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className={`h-6 w-6 ${dislikedMap[currentShort.id] ? "fill-white text-white" : ""}`} />
                  </button>
                  <span className="text-xs font-semibold text-zinc-300">
                    {(dislikes[currentShort.id] ?? 0).toLocaleString()}
                  </span>
                </div>

                {/* Comments */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setIsCommentsOpen(true)}
                    className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                    title="Comments"
                  >
                    <MessageSquare className="h-6 w-6" />
                  </button>
                  <span className="text-xs font-semibold text-zinc-200">
                    {(commentsMap[currentShort.id]?.length ?? currentShort.commentsCount ?? 0).toLocaleString()}
                  </span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard?.writeText(`${window.location.origin}/shorts`);
                        showToast("Link copied to clipboard!");
                      }
                    }}
                    className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                  <span className="text-xs font-semibold text-zinc-200">Share</span>
                </div>

                {/* Settings / More Options */}
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    className={`rounded-full p-3 transition-colors cursor-pointer ${
                      isSettingsOpen ? "bg-white text-black" : "bg-zinc-900/90 hover:bg-zinc-800 text-white"
                    }`}
                    title="Settings"
                  >
                    <MoreVertical className="h-6 w-6" />
                  </button>

                  {isSettingsOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-full bottom-0 mr-3 w-56 rounded-2xl bg-[#141414] border border-white/[0.12] p-2.5 shadow-2xl z-40 animate-in fade-in slide-in-from-right-2 duration-150 text-xs"
                    >
                      {/* Playback speed */}
                      <div className="px-2 py-1.5 text-zinc-400 font-bold text-[11px] uppercase tracking-wider">
                        Playback Speed
                      </div>
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        {[0.5, 1, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => handleSpeedChange(spd)}
                            className={`py-1 rounded-lg font-bold text-center transition-colors cursor-pointer text-xs ${
                              playbackSpeed === spd
                                ? "bg-white text-black"
                                : "bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
                            }`}
                          >
                            {spd === 1 ? "1x" : `${spd}x`}
                          </button>
                        ))}
                      </div>

                      <div className="h-[1px] bg-white/[0.06] my-1" />

                      {/* Loop toggle */}
                      <button
                        type="button"
                        onClick={toggleLoop}
                        className="w-full flex items-center justify-between px-2 py-2 rounded-xl text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <RotateCw className="h-4 w-4 text-zinc-400" />
                          <span>Loop video</span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {isLooping ? "On" : "Off"}
                        </span>
                      </button>

                      {/* Quality */}
                      <div className="flex items-center justify-between px-2 py-2 rounded-xl text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
                          <span>Quality</span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-400">1080p (HD)</span>
                      </div>

                      {/* Report */}
                      <button
                        type="button"
                        onClick={() => {
                          showToast("Feedback sent. Thank you!");
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                      >
                        <Flag className="h-4 w-4" />
                        <span>Report</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Short Quick CTA */}
                <Link
                  href="/studio/upload?type=short"
                  className="rounded-full p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white hover:text-zinc-300 transition-colors border border-white/10"
                  title="Upload Short"
                >
                  <Upload className="h-5 w-5" />
                </Link>
              </div>

              {/* Up/Down Navigation Controls */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="rounded-full p-3 bg-zinc-800 text-white disabled:opacity-30 hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Previous Short (↑)"
                >
                  <ChevronUp className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === shortsList.length - 1}
                  className="rounded-full p-3 bg-zinc-800 text-white disabled:opacity-30 hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Next Short (↓)"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
