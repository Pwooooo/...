import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDuration, formatViews } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { VideoItem } from "@/types";
import { MoreVertical, CheckCircle2 } from "lucide-react";

interface VideoCardProps {
  video: VideoItem;
}

export default function VideoCard({ video }: VideoCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>("Recently");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const publishedDate = new Date(video.publishedAt);
        setTimeAgo(formatDistanceToNow(publishedDate, { addSuffix: true }));
      } catch {
        setTimeAgo("Recently");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [video.publishedAt]);

  return (
    <div className="group flex flex-col gap-3">
      {/* Thumbnail Container */}
      <Link
        href={`/watch?v=${video.id}`}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 transition-all"
      >
        <img
          src={video.thumbnailUrl || "/placeholder-thumb.jpg"}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {video.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white tracking-wide">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
      </Link>

      {/* Video Details */}
      <div className="flex gap-3 px-1">
        {/* Channel Avatar */}
        <Link
          href={`/@${video.channel.handle}`}
          className="flex-shrink-0"
          title={video.channel.displayName}
        >
          <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800">
            {video.channel.avatarUrl ? (
              <img
                src={video.channel.avatarUrl}
                alt={video.channel.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-xs text-zinc-300 bg-zinc-700">
                {video.channel.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Title, Channel, Stats */}
        <div className="flex flex-1 flex-col">
          <Link
            href={`/watch?v=${video.id}`}
            className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors"
          >
            {video.title}
          </Link>

          <Link
            href={`/@${video.channel.handle}`}
            className="mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{video.channel.displayName}</span>
            <CheckCircle2 className="h-3 w-3 text-zinc-400" />
          </Link>

          <div className="flex items-center text-xs text-zinc-400 gap-1.5 mt-0.5">
            <span>{formatViews(video.viewCount)}</span>
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
