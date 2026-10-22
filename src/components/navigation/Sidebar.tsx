"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  Flame,
  Newspaper,
  History,
  Video,
  ListVideo,
  Menu,
  User,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  collapsed?: boolean;
  drawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarContentProps extends SidebarProps {
  searchParams: ReturnType<typeof useSearchParams> | null;
}

function SidebarIcon({
  icon: Icon,
  isActive,
  label,
  className = "h-5 w-5",
}: {
  icon: React.ElementType;
  isActive: boolean;
  label: string;
  className?: string;
}) {
  if (!isActive) {
    return <Icon className={className} fill="none" />;
  }

  // Active filled icons with high-contrast inner glyphs for dark mode
  if (label === "Watch Later") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
        <path
          d="M12 6v6l4 2"
          stroke="black"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (label === "Liked videos") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M7 10v12" stroke="black" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  if (label === "Subscriptions") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none" />
        <path
          d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"
          fill="black"
          stroke="none"
        />
      </svg>
    );
  }

  if (label === "Home") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          fill="currentColor"
          stroke="none"
        />
        <polyline points="9 22 9 12 15 12 15 22" stroke="black" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  if (label === "Trending") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
        <path
          d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
          fill="black"
          stroke="none"
        />
      </svg>
    );
  }

  return <Icon className={className} fill="currentColor" />;
}

function SidebarContent({
  collapsed = false,
  drawer = false,
  isOpen = false,
  onClose,
  searchParams,
}: SidebarContentProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.includes("?")) {
      const [targetPath, queryStr] = href.split("?");
      if (pathname !== targetPath) return false;
      const targetList = new URLSearchParams(queryStr).get("list");
      const currentList =
        searchParams?.get("list") ??
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("list")
          : pathname === "/playlist"
          ? "WL"
          : null);
      if (targetList) {
        return Boolean(currentList === targetList);
      }
      const targetTab = new URLSearchParams(queryStr).get("tab");
      const currentTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
      return Boolean(targetTab && currentTab === targetTab);
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const { user } = useAuth();
  const isUserZero = (user?.handle || "").replace(/^@/, "").trim().toLowerCase() === "0";

  const mainLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shorts", href: "/shorts", icon: Flame },
    { label: "Subscriptions", href: "/feed/subscriptions", icon: PlaySquare },
  ];

  const libraryLinks = [
    { label: "Your profile", href: "/profile", icon: User },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "History", href: "/feed/history", icon: History },
    { label: "Playlists", href: "/feed/playlists", icon: ListVideo },
    { label: "Your videos", href: "/studio/videos", icon: Video },
    { label: "Watch Later", href: "/playlist?list=WL", icon: Clock },
    { label: "Liked videos", href: "/playlist?list=LL", icon: ThumbsUp },
  ];

  const exploreLinks = [
    { label: "Trending", href: "/trending", icon: Compass },
    { label: "News", href: "/news", icon: Newspaper },
    ...(isUserZero
      ? [{ label: "Users Panel", href: "/news?tab=users", icon: Shield }]
      : []),
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
        <aside className="relative flex h-full w-64 flex-col bg-black text-zinc-200 border-r border-white/[0.08] z-50 overflow-y-auto px-3 py-2 shadow-2xl animate-in slide-in-from-left duration-250 select-none">
          {/* Drawer Top Header (Menu + Logo) */}
          <div className="flex items-center gap-4 px-1 h-12 mb-2 border-b border-white/[0.08]">
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
          <div className="space-y-1 pb-3 border-b border-white/[0.08]">
            {mainLinks.map((item) => {
              const isActive = isItemActive(item.href);
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
                  <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Library Section */}
          <div className="space-y-1 py-3 border-b border-white/[0.08]">
            <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              You
            </h3>
            {libraryLinks.map((item) => {
              const isActive = isItemActive(item.href);
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
                  <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
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
              const isActive = isItemActive(item.href);
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
                  <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    );
  }

  if (collapsed) {
    return (
      <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-18 flex-col items-center py-2 bg-black text-zinc-300 border-r border-white/[0.08]">
        {mainLinks.map((item) => {
          const isActive = isItemActive(item.href);
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
              <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="sticky top-14 hidden md:flex h-[calc(100vh-3.5rem)] w-60 flex-col overflow-y-auto px-3 py-3 bg-black text-zinc-200 border-r border-white/[0.08] scrollbar-none">
      {/* Primary Section */}
      <div className="space-y-1 pb-3 border-b border-white/[0.08]">
        {mainLinks.map((item) => {
          const isActive = isItemActive(item.href);
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
              <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Library Section */}
      <div className="space-y-1 py-3 border-b border-white/[0.08]">
        <h3 className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          You
        </h3>
        {libraryLinks.map((item) => {
          const isActive = isItemActive(item.href);
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
              <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
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
          const isActive = isItemActive(item.href);
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
              <SidebarIcon icon={item.icon} isActive={isActive} label={item.label} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function SidebarWithParams(props: SidebarProps) {
  const searchParams = useSearchParams();
  return <SidebarContent {...props} searchParams={searchParams} />;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarContent {...props} searchParams={null} />}>
      <SidebarWithParams {...props} />
    </Suspense>
  );
}
