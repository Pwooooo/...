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
export const ALL_VIDEOS: (VideoItem & { category: string; tags: string[] })[] = [];

// All filler shorts removed
export const SHORTS_FEED: ShortItem[] = [];

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
