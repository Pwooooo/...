export interface ChannelBasic {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  subscribersCount?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  masterPlaylistUrl?: string | null;
  rawVideoUrl?: string | null;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string | Date;
  channel: ChannelBasic;
}
