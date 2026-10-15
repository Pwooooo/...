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
  reactmastery: {
    id: "ch-2",
    handle: "reactmastery",
    displayName: "React Mastery",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 112000,
    description: "Level up your modern frontend skills with React, Next.js, and TypeScript masterpieces.",
    country: "Germany",
    joinedAt: "Joined Jun 22, 2022",
  },
  csinsights: {
    id: "ch-3",
    handle: "csinsights",
    displayName: "CS Insights",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 580000,
    description: "Visual computer science breakdowns covering OS kernels, compiler optimization, and memory models.",
    country: "United Kingdom",
    joinedAt: "Joined Sep 10, 2021",
  },
  creativecode: {
    id: "ch-4",
    handle: "creativecode",
    displayName: "Creative Code Labs",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 49000,
    description: "Interactive 3D WebGL, GLSL shaders, canvas mechanics, and game development experiments.",
    country: "Canada",
    joinedAt: "Joined Apr 5, 2023",
  },
  musicpulse: {
    id: "ch-5",
    handle: "musicpulse",
    displayName: "Music Pulse Official",
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 890000,
    description: "The hottest daily electronic, lofi, and ambient soundscapes curated for coding and flow state.",
    country: "Japan",
    joinedAt: "Joined Nov 12, 2020",
  },
  gamingarena: {
    id: "ch-6",
    handle: "gamingarena",
    displayName: "Gaming Arena Pro",
    avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80",
    subscribersCount: 1250000,
    description: "High-octane esports highlights, speedruns, hardware reviews, and competitive gameplay.",
    country: "South Korea",
    joinedAt: "Joined Aug 19, 2019",
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
  {
    id: "sample-2",
    title: "Next.js 16 Full Stack Architecture Deep Dive",
    description: "In-depth exploration of server actions, streaming rendering, and cache lifecycles.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 890,
    viewCount: 88400,
    publishedAt: "2026-10-14T10:30:00.000Z",
    category: "Web Development",
    tags: ["nextjs", "react", "typescript", "turbopack"],
    channel: MOCK_CHANNELS.reactmastery,
    chapters: SAMPLE_CHAPTERS,
    highlights: SAMPLE_HIGHLIGHTS,
  },
  {
    id: "sample-3",
    title: "Why Modern Operating Systems Are So Complex",
    description: "Exploring memory paging, context switching, cache hierarchies, and kernel space architecture.",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 2310,
    viewCount: 420000,
    publishedAt: "2026-10-08T09:15:00.000Z",
    category: "Computer Science",
    tags: ["os", "linux", "kernel", "memory", "cpu"],
    channel: MOCK_CHANNELS.csinsights,
    chapters: SAMPLE_CHAPTERS,
    highlights: SAMPLE_HIGHLIGHTS,
  },
  {
    id: "sample-4",
    title: "Designing Interactive Visualizations with Shaders & WebGL",
    description: "Create mind-blowing graphical effects directly in the browser with fragment shaders and GLSL.",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 615,
    viewCount: 31200,
    publishedAt: "2026-10-12T16:45:00.000Z",
    category: "Design",
    tags: ["webgl", "threejs", "shaders", "creative coding"],
    channel: MOCK_CHANNELS.creativecode,
    chapters: SAMPLE_CHAPTERS,
    highlights: SAMPLE_HIGHLIGHTS,
  },
  {
    id: "sample-5",
    title: "Synthwave Coding Session - 24/7 Deep Focus Beats",
    description: "Immersive synthwave and retrowave mix designed for programming, concentration, and deep flow states.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 7200,
    viewCount: 915000,
    publishedAt: "2026-10-15T02:00:00.000Z",
    category: "Music",
    tags: ["music", "synthwave", "lofi", "coding"],
    channel: MOCK_CHANNELS.musicpulse,
  },
  {
    id: "sample-6",
    title: "Pro League Championship Finals - Game 5 Decider",
    description: "The most intense clutch plays, unbelievable defense, and final round highlights from the world championship.",
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    masterPlaylistUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    durationSeconds: 1840,
    viewCount: 1650000,
    publishedAt: "2026-10-11T20:10:00.000Z",
    category: "Gaming",
    tags: ["gaming", "esports", "finals", "highlights"],
    channel: MOCK_CHANNELS.gamingarena,
  },
];

export const SHORTS_FEED: ShortItem[] = [
  {
    id: "short-1",
    title: "The 1 CSS property that fixed my layout forever! 🤯 #shorts #css",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    likesCount: 54200,
    commentsCount: 890,
    channel: MOCK_CHANNELS.reactmastery,
    songName: "Original Sound - React Mastery",
  },
  {
    id: "short-2",
    title: "How Redis handles 100k requests/sec on a single thread ⚡",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    likesCount: 118400,
    commentsCount: 2130,
    channel: MOCK_CHANNELS.systemcraft,
    songName: "Cyberpunk Pulse - Synth Lab",
  },
  {
    id: "short-3",
    title: "Insane 3D shader running at 120 FPS in Chrome 🎮",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    likesCount: 92100,
    commentsCount: 1420,
    channel: MOCK_CHANNELS.creativecode,
    songName: "Neon Dreams - Creative Audio",
  },
];

export const USER_PLAYLISTS: PlaylistItemData[] = [
  {
    id: "WL",
    title: "Watch Later",
    videoCount: 4,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    updatedAt: "Updated yesterday",
    visibility: "PRIVATE",
  },
  {
    id: "LL",
    title: "Liked videos",
    videoCount: 18,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
    updatedAt: "Updated 2 days ago",
    visibility: "PRIVATE",
  },
  {
    id: "dev-mastery",
    title: "Systems & Backend Engineering",
    videoCount: 12,
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    updatedAt: "Updated last week",
    visibility: "PUBLIC",
  },
];

export const SAMPLE_NEWS_POSTS: NewsPost[] = [
  {
    id: "news-0",
    channelHandle: "0",
    channelName: "0",
    channelAvatar: "/entropy-icon.png",
    content: "Welcome to Entropy 2.0! The new theme engine is live with 1:1 Luduvo charcoal styling, accurate live channel stats, and our brand-new News feed. Post your updates, patch notes, and announcements directly to your audience.",
    publishedAt: "1 day ago",
    likes: 88,
    tag: "Announcement",
    isPinned: true,
  },
  {
    id: "news-1",
    channelHandle: "systemcraft",
    channelName: "SystemCraft Tech",
    channelAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    content: "We've open-sourced our Rust-based adaptive bitrate packaging service! Check out the GitHub repository and test the multi-ladder HLS pipeline with sample MP4 inputs. Next week we're covering low-latency chunk streaming.",
    publishedAt: "2 days ago",
    likes: 342,
    tag: "Update",
    isPinned: true,
  },
  {
    id: "news-2",
    channelHandle: "reactmastery",
    channelName: "React Mastery",
    channelAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    content: "Next.js 16 full architectural tutorial is now live! We dive deep into Turbopack internals, streaming SSR boundaries, and server actions caching lifecycles. Check out the project repo and let us know what you want covered next.",
    publishedAt: "3 days ago",
    likes: 219,
    tag: "Release",
  },
  {
    id: "news-3",
    channelHandle: "csinsights",
    channelName: "CS Insights",
    channelAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    content: "Working on a complete interactive breakdown of OS kernel memory allocators and garbage collector mechanics. Preview drops this Friday!",
    publishedAt: "4 days ago",
    likes: 180,
    tag: "Behind the Scenes",
  },
];
