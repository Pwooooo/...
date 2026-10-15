"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
  MessageSquare,
  BarChart2,
  CheckCircle2,
  X,
  Plus,
  Sparkles,
  MoreVertical,
} from "lucide-react";
import { CommunityPost, CommunityComment, CommunityPollOption } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface CommunityTabProps {
  channel: {
    id?: string;
    handle: string;
    displayName: string;
    avatarUrl?: string;
  };
  isOwnProfile: boolean;
}

export default function CommunityTab({ channel, isOwnProfile }: CommunityTabProps) {
  const { user, openAuthModal } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postText, setPostText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanHandle = (channel?.handle || "").replace(/^@/, "");
  const displayName = channel?.displayName || cleanHandle || "Creator";
  const avatarUrl = channel?.avatarUrl || "";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPosts = () => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      let allPosts: CommunityPost[] = [];
      if (stored) {
        allPosts = JSON.parse(stored);
      }
      if (!Array.isArray(allPosts)) {
        allPosts = [];
      }

      const targetHandle = cleanHandle.toLowerCase();
      const filtered = allPosts.filter((p) => {
        const postHandle = (p.channelHandle || "").replace(/^@/, "").toLowerCase();
        return postHandle === targetHandle;
      });

      filtered.sort((a, b) => {
        const timeA = new Date(a.publishedAt).getTime();
        const timeB = new Date(b.publishedAt).getTime();
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      });

      setPosts(filtered);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();

    if (typeof window !== "undefined") {
      window.addEventListener("entropy_community_updated", loadPosts);
      window.addEventListener("storage", loadPosts);
      return () => {
        window.removeEventListener("entropy_community_updated", loadPosts);
        window.removeEventListener("storage", loadPosts);
      };
    }
  }, [cleanHandle]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setAttachedImage(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          setAttachedImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    let pollData: CommunityPollOption[] | undefined = undefined;
    if (showPollCreator) {
      const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (validOptions.length >= 2) {
        pollData = validOptions.map((opt, i) => ({
          id: `opt-${i}-${Date.now()}`,
          text: opt,
          votes: 0,
        }));
      }
    }

    const newPost: CommunityPost = {
      id: `cpost-${Date.now()}`,
      channelHandle: cleanHandle,
      channelName: displayName,
      channelAvatar: avatarUrl,
      content: postText.trim(),
      imageUrl: attachedImage || undefined,
      pollOptions: pollData,
      publishedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      hasLiked: false,
      hasDisliked: false,
      comments: [],
    };

    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];
      const updated = [newPost, ...allPosts];
      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }

      setPostText("");
      setAttachedImage(null);
      setShowPollCreator(false);
      setPollOptions(["", ""]);
      showToast("Post published to Community!");
    } catch {
      showToast("Failed to publish post");
    }
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId && post.pollOptions) {
          if (post.pollVotedId) return post;
          const options = post.pollOptions.map((opt) => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          });
          return { ...post, pollOptions: options, pollVotedId: optionId };
        }
        return post;
      });

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }
    } catch {
    }
  };

  const handleLikePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId) {
          const currentlyLiked = Boolean(post.hasLiked);
          const currentlyDisliked = Boolean(post.hasDisliked);
          return {
            ...post,
            hasLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
            hasDisliked: false,
            dislikes: currentlyDisliked ? Math.max(0, post.dislikes - 1) : post.dislikes,
          };
        }
        return post;
      });

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }
    } catch {
    }
  };

  const handleDislikePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((post) => {
        if (post.id === postId) {
          const currentlyDisliked = Boolean(post.hasDisliked);
          const currentlyLiked = Boolean(post.hasLiked);
          return {
            ...post,
            hasDisliked: !currentlyDisliked,
            dislikes: currentlyDisliked ? Math.max(0, post.dislikes - 1) : post.dislikes + 1,
            hasLiked: false,
            likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes,
          };
        }
        return post;
      });

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }
    } catch {
    }
  };

  const handleDeletePost = (postId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.filter((p) => p.id !== postId);
        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("entropy_community_updated"));
        }
        showToast("Post deleted");
      }
    } catch {
    }
  };

  const handleSharePost = (post: CommunityPost) => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/@${post.channelHandle}?tab=Community#${post.id}`;
      navigator.clipboard?.writeText(shareUrl);
      showToast("Link copied to clipboard!");
    }
  };

  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    if (!user) {
      openAuthModal();
      return;
    }

    const newComment: CommunityComment = {
      id: `comm-${Date.now()}`,
      authorHandle: user.handle,
      authorName: user.name || user.handle,
      authorAvatar: user.avatarUrl || user.avatar || "",
      content: text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    try {
      const stored = localStorage.getItem("entropy_community_posts");
      const allPosts: CommunityPost[] = stored ? JSON.parse(stored) : [];

      const updated = allPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [newComment, ...(p.comments || [])],
          };
        }
        return p;
      });

      localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("entropy_community_updated"));
      }

      setCommentInputs({ ...commentInputs, [postId]: "" });
      showToast("Comment added!");
    } catch {
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    try {
      const stored = localStorage.getItem("entropy_community_posts");
      if (stored) {
        const allPosts: CommunityPost[] = JSON.parse(stored);
        const updated = allPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: (p.comments || []).filter((c) => c.id !== commentId),
            };
          }
          return p;
        });

        localStorage.setItem("entropy_community_posts", JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("entropy_community_updated"));
        }
      }
    } catch {
    }
  };

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    if (dateStr.includes("ago") || dateStr.includes("Yesterday")) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isOwnProfile && (
        <form
          onSubmit={handleCreatePost}
          className="rounded-2xl bg-[#141414] border border-white/[0.08] p-4 sm:p-5 shadow-xl transition-all"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{(displayName || "C").slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                required
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Post an update to your fans..."
                className="w-full rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
              />

              {attachedImage && (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-72 group">
                  <img src={attachedImage} alt="Post attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showPollCreator && (
                <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-zinc-400" />
                      Poll Options
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPollCreator(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 rounded-lg bg-[#141414] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-white/20"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1 text-zinc-500 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 pt-1 font-medium cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add option</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-zinc-300 hover:text-white border border-white/[0.08] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                    title="Add image"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="hidden sm:inline">Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPollCreator(!showPollCreator)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                      showPollCreator
                        ? "bg-white text-black font-semibold border-white"
                        : "bg-[#181818] text-zinc-300 hover:text-white hover:bg-[#222222] border-white/[0.08]"
                    }`}
                    title="Add poll"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Poll</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!postText.trim()}
                  className="rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black px-5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#141414] border border-white/[0.08] p-8 flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
              <Sparkles className="h-6 w-6 text-zinc-300" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No community posts yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              {isOwnProfile
                ? "Give a shoutout, share sneak peeks, images, or start discussions with your fans above!"
                : "This channel hasn't posted any community updates yet."}
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const totalPollVotes = post.pollOptions?.reduce((acc, o) => acc + o.votes, 0) || 0;

            return (
              <article
                key={post.id}
                id={post.id}
                className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm text-white">
                      {post.channelAvatar ? (
                        <img src={post.channelAvatar} alt={post.channelName || "Channel"} className="h-full w-full object-cover" />
                      ) : (
                        <span>{(post.channelName || post.channelHandle || "C").slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{post.channelName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                        <span>@{post.channelHandle}</span>
                        <span>•</span>
                        <span>{formatPostTime(post.publishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-zinc-100 leading-relaxed whitespace-pre-line mb-3 font-normal">
                  {post.content}
                </div>

                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/[0.08] mb-4 max-h-[500px] bg-[#0a0a0a]">
                    <img
                      src={post.imageUrl}
                      alt="Post media"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {post.pollOptions && post.pollOptions.length > 0 && (
                  <div className="space-y-2 mb-4 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-3">
                    {post.pollOptions.map((opt) => {
                      const percent = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                      const hasVotedThis = post.pollVotedId === opt.id;
                      const hasVotedAny = Boolean(post.pollVotedId);

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={hasVotedAny}
                          onClick={() => handleVotePoll(post.id, opt.id)}
                          className={`relative w-full overflow-hidden rounded-lg p-2.5 text-xs font-semibold text-left transition-all flex items-center justify-between border ${
                            hasVotedThis
                              ? "border-white/30 text-white"
                              : "border-white/[0.08] text-zinc-300 hover:border-white/20"
                          } ${!hasVotedAny ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {hasVotedAny && (
                            <div
                              className={`absolute inset-0 transition-all duration-500 ${
                                hasVotedThis ? "bg-white/20" : "bg-white/[0.06]"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          )}

                          <span className="relative z-10 flex items-center gap-2">
                            {hasVotedThis && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                            <span>{opt.text}</span>
                          </span>

                          {hasVotedAny && (
                            <span className="relative z-10 font-bold text-zinc-300 ml-2">
                              {percent}%
                            </span>
                          )}
                        </button>
                      );
                    })}

                    <p className="text-[11px] text-zinc-500 pt-1">
                      {totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      post.hasLiked
                        ? "text-white bg-white/[0.12]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${post.hasLiked ? "fill-white" : ""}`} />
                    <span>{post.likes > 0 ? post.likes : ""}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDislikePost(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      post.hasDisliked
                        ? "text-white bg-white/[0.12]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className={`h-3.5 w-3.5 ${post.hasDisliked ? "fill-white" : ""}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSharePost(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-auto transition-colors cursor-pointer ${
                      isCommentsOpen
                        ? "text-white bg-white/[0.12]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Comments"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{(post.comments || []).length}</span>
                  </button>
                </div>

                {isCommentsOpen && (
                  <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-200">
                    <div className="flex gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{(user?.name || "U").slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Add a comment..."
                          className="flex-1 rounded-xl bg-[#0a0a0a] border border-white/[0.08] px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!(commentInputs[post.id] || "").trim()}
                          className="rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Comment
                        </button>
                      </div>
                    </div>

                    {(post.comments || []).length > 0 && (
                      <div className="space-y-3 pt-2">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="flex items-start justify-between gap-2.5 group">
                            <div className="flex gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-[#181818] border border-white/[0.08] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-[11px] text-white">
                                {comm.authorAvatar ? (
                                  <img src={comm.authorAvatar} alt={comm.authorName} className="h-full w-full object-cover" />
                                ) : (
                                  <span>{(comm.authorName || comm.authorHandle || "U").slice(0, 1).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="text-xs">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                  <span className="font-semibold text-white">@{comm.authorHandle}</span>
                                  <span>•</span>
                                  <span>{formatPostTime(comm.createdAt)}</span>
                                </div>
                                <p className="text-zinc-200 mt-0.5 leading-relaxed">{comm.content}</p>
                              </div>
                            </div>

                            {user && user.handle.toLowerCase() === comm.authorHandle.toLowerCase() && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(post.id, comm.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
