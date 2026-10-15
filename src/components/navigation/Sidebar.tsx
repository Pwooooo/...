"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  Flame,
  Music2,
  Gamepad2,
  Newspaper,
  Trophy,
  History,
  Video,
  ListVideo,
  Menu,
  Play,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  drawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  collapsed = false,
  drawer = false,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const mainLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shorts", href: "/shorts", icon: Flame },
    { label: "Subscriptions", href: "/feed/subscriptions", icon: PlaySquare },
  ];

  const libraryLinks = [
    { label: "Your profile", href: "/profile", icon: User },
    { label: "History", href: "/feed/history", icon: History },
    { label: "Playlists", href: "/feed/playlists", icon: ListVideo },
    { label: "Your videos", href: "/studio/videos", icon: Video },
    { label: "Watch Later", href: "/playlist?list=WL", icon: Clock },
    { label: "Liked videos", href: "/playlist?list=LL", icon: ThumbsUp },
  ];

  const exploreLinks = [
    { label: "Trending", href: "/trending", icon: Compass },
    { label: "Music", href: "/channel/music", icon: Music2 },
    { label: "Gaming", href: "/channel/gaming", icon: Gamepad2 },
    { label: "News", href: "/channel/news", icon: Newspaper },
    { label: "Sports", href: "/channel/sports", icon: Trophy },
  ];

  if (drawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
          onClick={onClose}
        />

        {/* Slide-over Drawer Panel */}
        <aside className="relative flex h-full w-64 flex-col bg-black text-zinc-200 border-r border-zinc-900 z-50 overflow-y-auto px-3 py-2 shadow-2xl animate-in slide-in-from-left duration-250 select-none">
          {/* Drawer Top Header (Menu + Logo) */}
          <div className="flex items-center gap-4 px-1 h-12 mb-2 border-b border-zinc-900/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-zinc-900 focus:outline-none transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <Menu className="h-5 w-5 text-zinc-300" />
            </button>
            <Link href="/" onClick={onClose} className="flex items-center gap-2.5 focus:outline-none group">
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

          {/* Primary Section */}
          <div className="space-y-1 pb-3 border-b border-zinc-900">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                    isActive
                      ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Library Section */}
          <div className="space-y-1 py-3 border-b border-zinc-900">
            <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              You
            </h3>
            {libraryLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                    isActive
                      ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Explore Section */}
          <div className="space-y-1 py-3">
            <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Explore
            </h3>
            {exploreLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                    isActive
                      ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="space-y-1 py-3 border-t border-zinc-900 mt-2">
            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                pathname === "/settings"
                  ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  if (collapsed) {
    return (
      <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-18 flex-col items-center py-2 bg-black text-zinc-300 border-r border-zinc-900">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 py-3 rounded-2xl text-[10px] gap-1.5 transition-all duration-200 ease-out",
                isActive
                  ? "bg-white/[0.08] text-white font-bold shadow-sm scale-95"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="sticky top-14 hidden md:flex h-[calc(100vh-3.5rem)] w-60 flex-col overflow-y-auto px-3 py-3 bg-black text-zinc-200 border-r border-zinc-900 scrollbar-none">
      {/* Primary Section */}
      <div className="space-y-1 pb-3 border-b border-zinc-900">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                isActive
                  ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Library Section */}
      <div className="space-y-1 py-3 border-b border-zinc-900">
        <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          You
        </h3>
        {libraryLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                isActive
                  ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Explore Section */}
      <div className="space-y-1 py-3">
        <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Explore
        </h3>
        {exploreLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                isActive
                  ? "bg-white/[0.08] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Settings Section */}
      <div className="space-y-1 py-3 border-t border-zinc-900 mt-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
            pathname === "/settings"
              ? "bg-white/[0.08] text-white font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
