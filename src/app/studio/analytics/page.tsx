"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { VideoItem } from "@/types";
import { getAllCombinedVideos, fetchServerVideos } from "@/lib/video-storage";
import { formatViews, formatDuration } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Eye,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Globe,
  Radio,
  ExternalLink,
} from "lucide-react";

export default function StudioAnalyticsPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "reach" | "engagement" | "audience">("overview");
  const [hoveredPoint, setHoveredPoint] = useState<{ day: number; views: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setVideos(getAllCombinedVideos());
    fetchServerVideos().then(() => {
      setVideos(getAllCombinedVideos());
    });
  }, []);

  const totalViews = videos.reduce((acc, v) => acc + (v.viewCount || 0), 0) || 14820;
  const subscriberCount = user?.subscribersCount || 1280;

  // 28-day synthetic realistic data points for SVG curve
  const dataPoints = [
    { day: 1, views: 240 },
    { day: 2, views: 310 },
    { day: 3, views: 280 },
    { day: 4, views: 420 },
    { day: 5, views: 560 },
    { day: 6, views: 510 },
    { day: 7, views: 640 },
    { day: 8, views: 590 },
    { day: 9, views: 680 },
    { day: 10, views: 720 },
    { day: 11, views: 650 },
    { day: 12, views: 810 },
    { day: 13, views: 890 },
    { day: 14, views: 920 },
    { day: 15, views: 840 },
    { day: 16, views: 980 },
    { day: 17, views: 1120 },
    { day: 18, views: 1040 },
    { day: 19, views: 1180 },
    { day: 20, views: 1250 },
    { day: 21, views: 1340 },
    { day: 22, views: 1290 },
    { day: 23, views: 1420 },
    { day: 24, views: 1380 },
    { day: 25, views: 1520 },
    { day: 26, views: 1610 },
    { day: 27, views: 1580 },
    { day: 28, views: 1740 },
  ];

  const maxViews = Math.max(...dataPoints.map((d) => d.views));
  const minViews = Math.min(...dataPoints.map((d) => d.views));

  // Compute SVG Path
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 20;
  const paddingY = 20;

  const points = dataPoints.map((d, index) => {
    const x = paddingX + (index / (dataPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((d.views - minViews) / (maxViews - minViews)) * (svgHeight - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  // Realtime 48h hourly bars
  const hourlyBars = [
    12, 18, 14, 22, 28, 35, 42, 38, 48, 55, 62, 70, 65, 80, 88, 92, 85, 95, 104,
    98, 110, 115, 122, 130, 125, 138, 145, 140, 155, 160, 150, 168, 172, 165,
    180, 185, 178, 190, 195, 210, 205, 215, 220, 210, 230, 240, 235, 250,
  ];
  const maxHourly = Math.max(...hourlyBars);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Channel analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track your views, reach, audience demographics, and real-time retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-zinc-300 font-medium">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <span>Last 28 days</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
        {(["overview", "reach", "engagement", "audience"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Charts + Right Realtime */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts & Metric Cards) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Banner */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white">
              Your channel got <span className="text-emerald-400 font-mono">{formatViews(totalViews)}</span> views in the last 28 days
            </h2>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-xs text-zinc-400">Views</span>
                <p className="text-xl font-bold text-white font-mono">{formatViews(totalViews)}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> +18%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-xs text-zinc-400">Watch time (hours)</span>
                <p className="text-xl font-bold text-white font-mono">382.4</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> +12%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-xs text-zinc-400">Subscribers</span>
                <p className="text-xl font-bold text-white font-mono">+{48}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> +25%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-xs text-zinc-400">Impressions</span>
                <p className="text-xl font-bold text-white font-mono">72.6K</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> +15%
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>Daily Views Trend</span>
                <span className="font-mono text-[11px]">Hover over graph for details</span>
              </div>

              <div className="relative w-full overflow-hidden rounded-xl bg-black/40 border border-white/[0.06] p-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-56 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0.25, 0.5, 0.75].map((pct, idx) => (
                    <line
                      key={idx}
                      x1={paddingX}
                      y1={svgHeight * pct}
                      x2={svgWidth - paddingX}
                      y2={svgHeight * pct}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Area fill */}
                  <path d={areaD} fill="url(#viewsGradient)" />

                  {/* Stroke curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive points */}
                  {points.map((p) => (
                    <circle
                      key={p.day}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-white stroke-red-500 stroke-2 cursor-pointer hover:r-6 transition-all"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>

                {/* Hover Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute pointer-events-none rounded-lg bg-zinc-950 border border-white/20 px-3 py-1.5 shadow-2xl text-xs z-20 -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                    }}
                  >
                    <p className="font-mono text-zinc-400 text-[10px]">Day {hoveredPoint.day}</p>
                    <p className="font-bold text-white font-mono">{hoveredPoint.views} views</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-2 px-2">
                <span>28 days ago</span>
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Top Content Ranked Table */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-red-500" />
                <h3 className="font-bold text-sm text-white">Top content in this period</h3>
              </div>
              <Link
                href="/studio/videos"
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                See all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-white/[0.06]">
              {videos.slice(0, 5).map((v, i) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-zinc-500 font-mono font-bold text-xs w-4">
                      {i + 1}
                    </span>
                    <div className="relative aspect-video w-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
                      <img
                        src={v.thumbnailUrl || "/videos/entropy-test-video-thumb.jpg"}
                        alt={v.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/watch?v=${v.id}`}
                        className="font-bold text-xs text-zinc-200 hover:text-white line-clamp-1 transition-colors"
                      >
                        {v.title}
                      </Link>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Duration: {formatDuration(v.durationSeconds || 15)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-xs font-mono text-zinc-300 flex-shrink-0">
                    <div>
                      <span className="block text-right font-bold text-white">
                        {formatViews(v.viewCount || 0)}
                      </span>
                      <span className="text-[10px] text-zinc-500">views</span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="block text-right font-bold text-emerald-400">68.4%</span>
                      <span className="text-[10px] text-zinc-500">avg retention</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Realtime Metrics & Traffic Sources) */}
        <div className="space-y-6">
          {/* 1. Realtime Card */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-sm text-white">Realtime</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-zinc-400">Updating live</span>
                </div>
              </div>
              <Radio className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <span className="text-xs text-zinc-400 font-medium">Subscribers</span>
              <p className="text-2xl font-black text-white font-mono mt-0.5">
                {subscriberCount.toLocaleString()}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Views • Last 48 hours</span>
                <span className="font-bold text-white font-mono">840</span>
              </div>

              {/* 48h mini histogram */}
              <div className="h-16 flex items-end gap-0.5 pt-2">
                {hourlyBars.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-red-500/70 hover:bg-red-400 rounded-t-sm transition-all"
                    style={{ height: `${(val / maxHourly) * 100}%` }}
                    title={`${val} views`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-zinc-400">Views • Last 60 minutes</span>
              <span className="font-bold text-white font-mono">24</span>
            </div>
          </div>

          {/* 2. Traffic Sources Breakdown */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl space-y-4">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm text-white">Traffic source types</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Where viewers find your content</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Browse features", pct: 42.4, color: "bg-red-500" },
                { label: "Suggested videos", pct: 31.8, color: "bg-purple-500" },
                { label: "YouTube/Entropy Search", pct: 15.2, color: "bg-sky-500" },
                { label: "Channel pages", pct: 6.8, color: "bg-emerald-500" },
                { label: "Direct or unknown", pct: 3.8, color: "bg-zinc-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{item.label}</span>
                    <span className="font-mono text-zinc-400">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Top Geographies */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 shadow-xl space-y-4">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm text-white">Top geographies</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Views by location (last 28 days)</p>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { country: "United States", share: "44.2%" },
                { country: "Germany", share: "18.5%" },
                { country: "United Kingdom", share: "12.3%" },
                { country: "Canada", share: "9.1%" },
                { country: "France", share: "5.4%" },
              ].map((geo) => (
                <div key={geo.country} className="flex items-center justify-between">
                  <span className="text-zinc-300">{geo.country}</span>
                  <span className="font-mono text-zinc-400 font-semibold">{geo.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
