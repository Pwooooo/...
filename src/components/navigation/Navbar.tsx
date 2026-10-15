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
  LogOut,
  Tv,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, openAuthModal, logout } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-black/95 backdrop-blur-md px-4 text-white">
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

        <Link href="/" className="flex items-center gap-2.5 focus:outline-none group">
          <img
            src="/entropy-icon.png"
            alt="Entropy logo"
            className="h-8 w-8 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight text-white">
            Entropy
          </span>
        </Link>
      </div>

      {/* Center: Search Bar (Subtle Outline) */}
      <form onSubmit={handleSearch} className="flex max-w-[640px] flex-1 items-center justify-center px-4">
        <div className="flex w-full max-w-[540px] items-center rounded-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.14] focus-within:border-white/20 transition-all overflow-hidden">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none border-none focus:ring-0"
          />
          <button
            type="submit"
            className="flex h-[38px] w-14 items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border-l border-white/[0.08] transition-colors cursor-pointer"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className="ml-3 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
          title="Search with your voice"
        >
          <Mic className="h-4 w-4" />
        </button>
      </form>

      {/* Right: Actions & User Login / Account */}
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
          className="relative rounded-full p-2 hover:bg-zinc-900 text-zinc-300 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
            3
          </span>
        </button>

        {user ? (
          /* Logged In Account Button & Dropdown */
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-white/20 hover:border-white transition-all cursor-pointer"
              title={user.name}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white text-black flex items-center justify-center text-xs font-bold">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-zinc-950 border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 select-none text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Profile header */}
                <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-zinc-800">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-white text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">@{user.handle}</p>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={`/@${user.handle}`}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    <span>Your channel</span>
                  </Link>

                  <Link
                    href="/studio/videos"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <Tv className="h-4 w-4 text-zinc-400" />
                    <span>Entropy Studio</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In Pill */
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer hover:border-white/40"
          >
            <User className="h-4 w-4" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
