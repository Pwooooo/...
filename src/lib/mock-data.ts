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

// All filler mock channels removed
export const MOCK_CHANNELS: Record<string, ChannelBasic & { bannerUrl?: string; description?: string }> = {};

// All filler chapters removed
export const SAMPLE_CHAPTERS: VideoChapter[] = [];

// All filler highlights removed
export const SAMPLE_HIGHLIGHTS: VideoHighlight[] = [];

// All filler YouTube sample videos removed
export const ALL_VIDEOS: (VideoItem & { category: string; tags: string[] })[] = [
  {
    id: "temp-video-1",
    title: "Entropy Showcase & Overview",
    description: "Welcome to Entropy! A showcase of the platform features, responsive design, and media player.",
    thumbnailUrl: "/thumbnails/temp-video-1.jpg",
    rawVideoUrl: "/videos/temp-video-1.mp4",
    masterPlaylistUrl: "/videos/temp-video-1.mp4",
    durationSeconds: 62,
    viewCount: 1240,
    likesCount: 88,
    dislikesCount: 2,
    comments: [],
    publishedAt: "2026-11-08T12:00:00.000Z",
    channel: {
      id: "u-entropy-official",
      handle: "entropy",
      displayName: "Entropy",
      avatarUrl: "/entropy-icon.png",
      subscribersCount: 105000,
      joinedAt: "Joined Nov 2026",
    },
    featured: true,
    category: "Technology",
    tags: ["entropy", "showcase", "testing", "tech"],
    isShort: false,
  },
  {
    id: "temp-short-1",
    title: "Entropy Gameplay Flow 🔥",
    description: "Testing out the vertical shorts player on Entropy! #shorts #gaming",
    thumbnailUrl: "/thumbnails/temp-short-1.jpg",
    rawVideoUrl: "/videos/temp-short-1.mp4",
    masterPlaylistUrl: "/videos/temp-short-1.mp4",
    durationSeconds: 10,
    viewCount: 4520,
    likesCount: 342,
    dislikesCount: 5,
    comments: [],
    publishedAt: "2026-11-09T08:00:00.000Z",
    channel: {
      id: "u-entropy-official",
      handle: "entropy",
      displayName: "Entropy",
      avatarUrl: "/entropy-icon.png",
      subscribersCount: 105000,
      joinedAt: "Joined Nov 2026",
    },
    category: "Shorts",
    tags: ["shorts", "entropy", "testing", "gaming"],
    isShort: true,
    songName: "Original Audio - Entropy",
  },
];

export const SHORTS_FEED: ShortItem[] = [
  {
    id: "temp-short-1",
    title: "Entropy Gameplay Flow 🔥",
    videoUrl: "/videos/temp-short-1.mp4",
    likesCount: 342,
    commentsCount: 0,
    channel: {
      id: "u-entropy-official",
      handle: "entropy",
      displayName: "Entropy",
      avatarUrl: "/entropy-icon.png",
      subscribersCount: 105000,
      joinedAt: "Joined Nov 2026",
    },
    songName: "Original Audio - Entropy",
  },
];

export const USER_PLAYLISTS: PlaylistItemData[] = [
  {
    id: "WL",
    title: "Watch Later",
    videoCount: 0,
    thumbnailUrl: "",
    updatedAt: "Updated recently",
    visibility: "PRIVATE",
  },
  {
    id: "LL",
    title: "Liked videos",
    videoCount: 0,
    thumbnailUrl: "",
    updatedAt: "Updated recently",
    visibility: "PRIVATE",
  },
];

export const SAMPLE_NEWS_POSTS: NewsPost[] = [];
