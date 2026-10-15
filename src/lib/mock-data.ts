import { VideoItem, ChannelBasic, VideoChapter, VideoHighlight, NewsPost } from "@/types";

export interface ShortItem {
  id: string;
  title: string;
  videoUrl: string;
  likesCount: number;
  commentsCount: number;
  channel: ChannelBasic;
  songName: string;
}

export interface PlaylistItemData {
  id: string;
  title: string;
  videoCount: number;
  thumbnailUrl: string;
  updatedAt: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
}

export const MOCK_CHANNELS: Record<string, ChannelBasic & { bannerUrl?: string; description?: string }> = {
  systemcraft: {
    id: "ch-1",
    handle: "systemcraft",
    displayName: "SystemCraft Tech",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 245000,
    description: "Deep dive tutorials on distributed systems, streaming architectures, and high-performance backend engineering.",
    country: "United States",
    joinedAt: "Joined Jan 15, 2023",
  },
};

export const SAMPLE_CHAPTERS: VideoChapter[] = [
  { id: "ch-1", title: "Introduction & Architecture Overview", seconds: 0, thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80" },
  { id: "ch-2", title: "Direct Ingestion & S3 Setup", seconds: 200, thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80" },
  { id: "ch-3", title: "FFmpeg Multi-bitrate Command Formulation", seconds: 525, thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80" },
  { id: "ch-4", title: "HLS Master Playlist & Chunk Generation", seconds: 930, thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80" },
  { id: "ch-5", title: "Client-side Adaptive Bitrate Playback", seconds: 1320, thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80" },
];

export const SAMPLE_HIGHLIGHTS: VideoHighlight[] = [
  { id: "hl-1", title: "Architecture Flowchart Breakdown", startTime: 120, endTime: 195, tag: "Essential" },
  { id: "hl-2", title: "Live FFmpeg Command Demo", startTime: 525, endTime: 640, tag: "Code Demo" },
  { id: "hl-3", title: "Zero-Latency HLS Playback Test", startTime: 930, endTime: 1050, tag: "Benchmark" },
];

export const ALL_VIDEOS: (VideoItem & { category: string; tags: string[] })[] = [
  {
    id: "sample-1",
    title: "Building a Distributed Video Transcoder with Go, FFmpeg & S3",
    description: "Learn how modern video platforms transcode petabytes of video into multi-bitrate HLS streams asynchronously.",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 1420,
    viewCount: 142500,
    publishedAt: "2026-10-13T14:00:00.000Z",
    category: "Technology",
    tags: ["ffmpeg", "golang", "s3", "transcoding", "streaming"],
    channel: MOCK_CHANNELS.systemcraft,
    featured: true,
    chapters: SAMPLE_CHAPTERS,
    highlights: SAMPLE_HIGHLIGHTS,
  },
];

export const SHORTS_FEED: ShortItem[] = [
  {
    id: "short-1",
    title: "How Redis handles 100k requests/sec on a single thread ⚡",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    likesCount: 118400,
    commentsCount: 0,
    channel: MOCK_CHANNELS.systemcraft,
    songName: "Cyberpunk Pulse - Synth Lab",
  },
];

export const USER_PLAYLISTS: PlaylistItemData[] = [
  {
    id: "WL",
    title: "Watch Later",
    videoCount: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    updatedAt: "Updated recently",
    visibility: "PRIVATE",
  },
  {
    id: "LL",
    title: "Liked videos",
    videoCount: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    updatedAt: "Updated recently",
    visibility: "PRIVATE",
  },
];

export const SAMPLE_NEWS_POSTS: NewsPost[] = [];
