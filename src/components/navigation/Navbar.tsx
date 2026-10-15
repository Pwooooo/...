"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Mic,
  Video as VideoIcon,
  Bell,
  User,
  Play,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-black/95 backdrop-blur-md px-4 text-white border-b border-zinc-900">
      {/* Left: Hamburger + Brand Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-full p-2 hover:bg-zinc-900 focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-zinc-300" />
        </button>

        <Link href="/" className="flex items-center gap-2 focus:outline-none group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black shadow-sm group-hover:scale-105 transition-transform">
            <Play className="h-3.5 w-3.5 fill-black stroke-none translate-x-0.5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Entropy
          </span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearch} className="flex max-w-[640px] flex-1 items-center justify-center px-4">
        <div className="flex w-full max-w-[540px] items-center">
          <div className="relative flex w-full items-center">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-l-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="flex h-[38px] w-16 items-center justify-center rounded-r-full border border-l-0 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-colors"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className="ml-3 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors"
          title="Search with your voice"
        >
          <Mic className="h-4 w-4" />
        </button>
      </form>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/studio/upload"
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white border border-zinc-800 transition-colors"
        >
          <VideoIcon className="h-4 w-4 text-white" />
          <span className="hidden md:inline">Create</span>
        </Link>

        <button
          type="button"
          className="relative rounded-full p-2 hover:bg-zinc-900 text-zinc-300 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
            3
          </span>
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-white shadow-sm hover:border-white transition-all"
          title="Account"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
