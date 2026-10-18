"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { VideoItem, CommentItem, CommentReply } from "@/types";
import { getAllCombinedVideos, fetchServerVideos } from "@/lib/video-storage";
import { formatTimeAgo } from "@/lib/utils";
import {
  MessageSquare,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Pin,
  Reply,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Send,
  Sparkles,
} from "lucide-react";

interface CommentEntry {
  videoId: string;
  videoTitle: string;
  videoThumb: string;
  comment: CommentItem;
}

export default function StudioCommentsPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [commentsList, setCommentsList] = useState<CommentEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"published" | "review">("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFilter, setFilterFilter] = useState<"all" | "unreplied" | "hearted">("all");

  // Inline Reply state
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllComments = (currentVideos: VideoItem[]) => {
    const collected: CommentEntry[] = [];

    currentVideos.forEach((v) => {
      try {
        const raw = localStorage.getItem(`entropy_comments_${v.id}`);
        if (raw) {
          const parsed: CommentItem[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              collected.push({
                videoId: v.id,
                videoTitle: v.title,
                videoThumb: v.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg",
                comment: c,
              });
            });
          }
        }
      } catch {}
    });

    // Provide default initial comments if empty
    if (collected.length === 0 && currentVideos.length > 0) {
      const firstVid = currentVideos[0];
      collected.push(
        {
          videoId: firstVid.id,
          videoTitle: firstVid.title,
          videoThumb: firstVid.thumbnailUrl || "",
          comment: {
            id: "studio-c1",
            user: "Sarah Chen",
            userHandle: "sarah_c",
            avatar: "/default-avatar.png",
            content: "The custom in-app floating mini player and theater mode are super responsive! Best video release so far.",
            createdAt: Date.now() - 3600000 * 3,
            timeAgo: "3 hours ago",
            likes: 18,
            dislikes: 0,
            isHearted: true,
            replies: [
              {
                id: "r-demo-1",
                user: user?.name || "Entropy Team",
                userHandle: user?.handle || "entropy",
                avatar: user?.avatarUrl || "/entropy-icon.png",
                content: "Thank you Sarah! Theater mode and persistent background playback took a lot of care to tune.",
                createdAt: Date.now() - 3600000 * 2,
                timeAgo: "2 hours ago",
                likes: 5,
                dislikes: 0,
              },
            ],
          },
        },
        {
          videoId: firstVid.id,
          videoTitle: firstVid.title,
          videoThumb: firstVid.thumbnailUrl || "",
          comment: {
            id: "studio-c2",
            user: "Marcus Brody",
            userHandle: "m_brody",
            avatar: "/default-avatar.png",
            content: "Love that test videos run locally without consuming full cloud storage. Excited for more studio features!",
            createdAt: Date.now() - 3600000 * 7,
            timeAgo: "7 hours ago",
            likes: 9,
            dislikes: 0,
          },
        },
        {
          videoId: firstVid.id,
          videoTitle: firstVid.title,
          videoThumb: firstVid.thumbnailUrl || "",
          comment: {
            id: "studio-c3",
            user: "Elena Rostova",
            userHandle: "elena_code",
            avatar: "/default-avatar.png",
            content: "Can you add an option for default video quality in studio settings next?",
            createdAt: Date.now() - 3600000 * 18,
            timeAgo: "18 hours ago",
            likes: 4,
            dislikes: 0,
          },
        }
      );
    }

    setCommentsList(collected);
  };

  useEffect(() => {
    const current = getAllCombinedVideos();
    setVideos(current);
    loadAllComments(current);

    fetchServerVideos().then(() => {
      const updated = getAllCombinedVideos();
      setVideos(updated);
      loadAllComments(updated);
    });
  }, []);

  // Save changes back to localStorage for that video
  const persistVideoComments = (videoId: string, updatedComment: CommentItem | null, removeId?: string) => {
    try {
      const raw = localStorage.getItem(`entropy_comments_${videoId}`);
      let list: CommentItem[] = raw ? JSON.parse(raw) : [];

      if (removeId) {
        list = list.filter((c) => c.id !== removeId);
      } else if (updatedComment) {
        const idx = list.findIndex((c) => c.id === updatedComment.id);
        if (idx >= 0) {
          list[idx] = updatedComment;
        } else {
          list.unshift(updatedComment);
        }
      }

      localStorage.setItem(`entropy_comments_${videoId}`, JSON.stringify(list));
    } catch {}
  };

  const handleToggleHeart = (videoId: string, commentId: string) => {
    setCommentsList((prev) =>
      prev.map((item) => {
        if (item.comment.id === commentId) {
          const nextState = !item.comment.isHearted;
          const updated: CommentItem = { ...item.comment, isHearted: nextState };
          persistVideoComments(videoId, updated);
          showToast(nextState ? "Hearted comment" : "Unhearted comment");
          return { ...item, comment: updated };
        }
        return item;
      })
    );
  };

  const handleTogglePin = (videoId: string, commentId: string) => {
    setCommentsList((prev) =>
      prev.map((item) => {
        if (item.comment.id === commentId) {
          const nextState = !item.comment.isPinned;
          const updated: CommentItem = { ...item.comment, isPinned: nextState };
          persistVideoComments(videoId, updated);
          showToast(nextState ? "Pinned comment to top" : "Unpinned comment");
          return { ...item, comment: updated };
        }
        return item;
      })
    );
  };

  const handleDeleteComment = (videoId: string, commentId: string) => {
    if (confirm("Delete this comment permanently?")) {
      persistVideoComments(videoId, null, commentId);
      setCommentsList((prev) => prev.filter((item) => item.comment.id !== commentId));
      showToast("Comment deleted");
    }
  };

  const handleSubmitReply = (videoId: string, commentId: string) => {
    if (!replyText.trim()) return;

    const newReply: CommentReply = {
      id: `r-${Date.now()}`,
      user: user?.name || "Entropy Team",
      userHandle: user?.handle ? user.handle.replace(/^@/, "") : "creator",
      avatar: user?.avatarUrl || "/default-avatar.png",
      content: replyText.trim(),
      createdAt: Date.now(),
      timeAgo: "Just now",
      likes: 0,
      dislikes: 0,
    };

    setCommentsList((prev) =>
      prev.map((item) => {
        if (item.comment.id === commentId) {
          const replies = [...(item.comment.replies || []), newReply];
          const updated: CommentItem = { ...item.comment, replies };
          persistVideoComments(videoId, updated);
          return { ...item, comment: updated };
        }
        return item;
      })
    );

    setReplyingToCommentId(null);
    setReplyText("");
    showToast("Reply published");
  };

  // Filtered comments
  const filteredComments = commentsList.filter((item) => {
    if (activeTab === "review") return false; // In YouTube studio, review is for flagged comments

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = item.comment.content?.toLowerCase().includes(q);
      const matchUser = item.comment.user?.toLowerCase().includes(q);
      const matchVideo = item.videoTitle?.toLowerCase().includes(q);
      if (!matchText && !matchUser && !matchVideo) return false;
    }

    if (filterFilter === "hearted" && !item.comment.isHearted) {
      return false;
    }

    if (filterFilter === "unreplied" && item.comment.replies && item.comment.replies.length > 0) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-white text-black font-semibold text-xs px-4 py-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Channel comments</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Read, reply, heart, and moderate comments across all your published videos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">
            Total comments: <span className="font-bold text-white">{commentsList.length}</span>
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs: Published vs Held for Review */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("published")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "published"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>Published</span>
            <span className="ml-1.5 opacity-70">({commentsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "review"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>Held for review</span>
            <span className="ml-1.5 opacity-70">(0)</span>
          </button>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={filterFilter}
            onChange={(e) => setFilterFilter(e.target.value as any)}
            className="bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900 text-white">All comments</option>
            <option value="unreplied" className="bg-zinc-900 text-white">I haven't replied</option>
            <option value="hearted" className="bg-zinc-900 text-white">Hearted by me</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-2xl divide-y divide-white/[0.06]">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
            <p className="font-semibold text-sm text-zinc-400">No comments found</p>
            <p className="text-xs text-zinc-500">
              Try adjusting your search query or filter selection.
            </p>
          </div>
        ) : (
          filteredComments.map((entry) => {
            const { comment, videoId, videoTitle, videoThumb } = entry;
            const isReplying = replyingToCommentId === comment.id;

            return (
              <div key={comment.id} className="p-5 hover:bg-white/[0.02] transition-colors space-y-3">
                {/* Top Row: User details & Video context badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
                      <img
                        src={comment.avatar || "/default-avatar.png"}
                        alt={comment.user}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{comment.user}</span>
                        {comment.userHandle && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            @{comment.userHandle.replace(/^@/, "")}
                          </span>
                        )}
                        <span className="text-zinc-600">•</span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {comment.timeAgo || "Recently"}
                        </span>
                        {comment.isPinned && (
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Thumbnail Link */}
                  <Link
                    href={`/watch?v=${videoId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors group flex-shrink-0 self-start sm:self-auto"
                    title={`View ${videoTitle}`}
                  >
                    <div className="relative aspect-video w-12 rounded overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
                      <img
                        src={videoThumb}
                        alt={videoTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate max-w-[180px]">
                      {videoTitle}
                    </span>
                    <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300" />
                  </Link>
                </div>

                {/* Comment Content */}
                <div className="pl-12">
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Creator Action Bar */}
                  <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-zinc-400">
                    {/* Heart button */}
                    <button
                      type="button"
                      onClick={() => handleToggleHeart(videoId, comment.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                        comment.isHearted
                          ? "bg-white/10 text-white font-semibold border border-white/20"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                      title={comment.isHearted ? "Unheart" : "Creator heart"}
                    >
                      <Heart className={`h-3.5 w-3.5 ${comment.isHearted ? "fill-white text-white" : ""}`} />
                      <span>{comment.isHearted ? "Hearted" : "Heart"}</span>
                    </button>

                    {/* Likes badge */}
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="font-mono">{comment.likes || 0}</span>
                    </div>

                    {/* Reply button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToCommentId(isReplying ? null : comment.id);
                        setReplyText("");
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>Reply</span>
                    </button>

                    {/* Pin to top */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(videoId, comment.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                      title={comment.isPinned ? "Unpin" : "Pin to top"}
                    >
                      <Pin className={`h-3.5 w-3.5 ${comment.isPinned ? "text-white fill-white" : ""}`} />
                    </button>

                    {/* Delete comment */}
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(videoId, comment.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer ml-auto"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Existing Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-2">
                      {comment.replies.map((r: CommentReply) => (
                        <div key={r.id} className="p-2.5 rounded-xl bg-white/[0.03] space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full overflow-hidden bg-zinc-800">
                              <img
                                src={r.avatar || "/default-avatar.png"}
                                alt={r.user}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-bold text-xs text-white">{r.user}</span>
                            <span className="text-[10px] text-zinc-300 bg-white/10 px-1 rounded font-bold">
                              Creator
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{r.timeAgo}</span>
                          </div>
                          <p className="text-xs text-zinc-300 pl-7">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <div className="mt-3 p-3 rounded-xl bg-[#1e1e1e] border border-white/10 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img
                            src={user?.avatarUrl || "/default-avatar.png"}
                            alt={user?.name || "Creator"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold text-white">Reply as {user?.name || "Creator"}</span>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Add a reply..."
                        rows={2}
                        className="w-full rounded-lg bg-zinc-900 border border-white/[0.08] p-2 text-xs text-white outline-none focus:border-white/30 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToCommentId(null)}
                          className="px-3 py-1.5 rounded-full hover:bg-white/10 text-xs text-zinc-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitReply(videoId, comment.id)}
                          disabled={!replyText.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow"
                        >
                          <Send className="h-3 w-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
