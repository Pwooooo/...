import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { VideoItem } from "@/types";
import { isShortVideo } from "@/lib/video-storage";
import { MoreVertical } from "lucide-react";

interface VideoCardProps {
  video: VideoItem;
}

export default function VideoCard({ video }: VideoCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>("Recently");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (video?.publishedAt) {
          const publishedDate = new Date(video.publishedAt);
          if (!isNaN(publishedDate.getTime())) {
            setTimeAgo(formatDistanceToNow(publishedDate, { addSuffix: true }));
            return;
          }
        }
        setTimeAgo("Recently");
      } catch {
        setTimeAgo("Recently");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [video?.publishedAt]);

  if (!video) return null;

  const channel = video.channel || {
    id: "creator",
    handle: "creator",
    displayName: "Creator",
    avatarUrl: "",
    subscribersCount: 0,
  };

  const rawHandle = channel.handle || channel.displayName || "creator";
  const cleanHandle = rawHandle.replace(/^@/, "");
  const displayName = channel.displayName || channel.handle || "Creator";
  const initial = (displayName.charAt(0) || "C").toUpperCase();
  const duration = Number(video.durationSeconds) || 0;
  const views = Number(video.viewCount) || 0;
  const isShort = isShortVideo(video);
  const targetUrl = isShort ? `/shorts?id=${video.id}` : `/watch?v=${video.id}`;

  return (
    <div className="group flex flex-col gap-3">
      {/* Thumbnail Container */}
      <Link
        href={targetUrl}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#111111] transition-all"
      >
        <img
          src={video.thumbnailUrl || "/placeholder-thumb.jpg"}
          alt={video.title || "Video thumbnail"}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-thumb.jpg";
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white tracking-wide">
            {formatDuration(duration)}
          </span>
        )}
      </Link>

      {/* Video Details */}
      <div className="flex gap-3 px-1">
        {/* Channel Avatar */}
        <Link
          href={`/@${cleanHandle}`}
          className="flex-shrink-0"
          title={displayName}
        >
          <div className="h-9 w-9 overflow-hidden rounded-full bg-[#181818]">
            <img
              src={channel.avatarUrl || "/default-avatar.png"}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
              }}
            />
          </div>
        </Link>

        {/* Title, Channel, Stats */}
        <div className="flex flex-1 flex-col">
          <Link
            href={targetUrl}
            className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors"
          >
            {video.title || "Untitled Video"}
          </Link>

          <Link
            href={`/@${cleanHandle}`}
            className="mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{displayName}</span>
          </Link>

          <div className="flex items-center text-xs text-zinc-400 gap-1.5 mt-0.5">
            <span>{formatViews(views)}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Action Menu */}
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded-full text-zinc-400 self-start transition-opacity"
          aria-label="Options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
