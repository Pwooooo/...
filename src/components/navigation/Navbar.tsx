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
  PlaySquare,
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
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-zinc-950 px-4 text-white border-b border-zinc-800">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-full p-2 hover:bg-zinc-800 focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-zinc-200" />
        </button>

        <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
          <div className="flex h-7 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm">
            <PlaySquare className="h-5 w-5 fill-white stroke-none" />
          </div>
          <span className="font-semibold text-lg tracking-tight flex items-center">
            Entropy<span className="text-xs text-zinc-400 ml-1 font-mono">Tube</span>
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
              className="w-full rounded-l-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex h-[38px] w-16 items-center justify-center rounded-r-full border border-l-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className="ml-3 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
          title="Search with your voice"
        >
          <Mic className="h-4 w-4" />
        </button>
      </form>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/studio/upload"
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 border border-zinc-800"
        >
          <VideoIcon className="h-4 w-4 text-red-500" />
          <span className="hidden md:inline">Create</span>
        </Link>

        <button
          type="button"
          className="relative rounded-full p-2 hover:bg-zinc-800 text-zinc-200"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-red-600 text-xs font-bold text-white shadow-sm"
          title="Account"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
