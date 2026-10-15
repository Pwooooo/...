"use client";

import React, { useState, useEffect, useRef } from "react";
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
  UploadCloud,
  Radio,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const { user, openAuthModal, logout } = useAuth();
  const router = useRouter();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(target)) {
        setIsCreateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
    } else {
      setIsCreateMenuOpen((prev) => !prev);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMenuOpen((prev) => !prev);
  };

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
          className="rounded-full p-2 hover:bg-white/[0.08] focus:outline-none transition-colors"
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
        {/* Create Button with Menu */}
        <div className="relative" ref={createMenuRef}>
          <button
            type="button"
            onClick={handleCreateClick}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <VideoIcon className="h-4 w-4 text-white" />
            <span className="hidden md:inline">Create</span>
          </button>

          {user && isCreateMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#141414] border border-white/[0.08] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 select-none text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href="/studio/upload"
                onClick={() => setIsCreateMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
              >
                <UploadCloud className="h-4 w-4 text-zinc-400" />
                <span>Upload video</span>
              </Link>
              <Link
                href="/studio/upload?mode=live"
                onClick={() => setIsCreateMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
              >
                <Radio className="h-4 w-4 text-zinc-400" />
                <span>Go live</span>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="relative rounded-full p-2 hover:bg-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
            3
          </span>
        </button>

        {user ? (
          /* Logged In Account Button & Dropdown */
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={handleUserClick}
              onMouseDown={(e) => e.stopPropagation()}
              className={`flex items-center justify-center p-1 rounded-full transition-all duration-200 cursor-pointer border-none outline-none group ${
                isUserMenuOpen
                  ? "bg-white/[0.12] ring-2 ring-white/20"
                  : "hover:bg-white/[0.08] hover:ring-2 hover:ring-white/10"
              }`}
              title={user.name}
              aria-label="Account menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white text-black flex items-center justify-center text-xs font-bold">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#141414] p-2 shadow-2xl z-50 select-none text-white border border-white/[0.08]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Profile header link (matches user screenshot) */}
                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 pb-3 border-b border-white/[0.08] hover:bg-[#222222] rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-[#181818] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">@{user.handle}</p>
                    <p className="text-[11px] text-white font-medium hover:underline mt-0.5">
                      View your channel
                    </p>
                  </div>
                </Link>

                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    <span>Your channel</span>
                  </Link>

                  <Link
                    href="/studio/videos"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                  >
                    <Tv className="h-4 w-4 text-zinc-400" />
                    <span>Entropy Studio</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#222222] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-zinc-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-[#222222] transition-colors text-left cursor-pointer"
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
