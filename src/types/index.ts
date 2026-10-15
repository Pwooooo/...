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
  category?: string;
  tags?: string[];
}

export interface NewsPost {
  id: string;
  channelHandle: string;
  channelName: string;
  channelAvatar?: string;
  content: string;
  imageUrl?: string;
  pollOptions?: CommunityPollOption[];
  pollVotedId?: string;
  publishedAt: string;
  likes: number;
  dislikes?: number;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  tag?: string;
  isPinned?: boolean;
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
}

export interface CommunityPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityPost {
  id: string;
  channelHandle: string;
  channelName: string;
  channelAvatar?: string;
  content: string;
  imageUrl?: string;
  pollOptions?: CommunityPollOption[];
  pollVotedId?: string;
  publishedAt: string;
  likes: number;
  dislikes: number;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  comments: CommunityComment[];
}

