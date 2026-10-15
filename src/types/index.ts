export interface ChannelBasic {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  subscribersCount?: number;
  country?: string;
  joinedAt?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  seconds: number;
  thumbnailUrl?: string;
}

export interface VideoHighlight {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  tag: string;
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
  featured?: boolean;
  chapters?: VideoChapter[];
  highlights?: VideoHighlight[];
}
