"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Home,
  Flame,
  PlaySquare,
  Bell,
  History,
  ListVideo,
  User,
  Video,
  Clock,
  ThumbsUp,
  Compass,
  Newspaper,
  Pencil,
  Settings,
  Shield,
  PanelLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

interface SidebarProps {
  collapsed?: boolean;
  drawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarContentProps extends SidebarProps {
  searchParams: ReturnType<typeof useSearchParams> | null;
}

function SidebarContent({
  collapsed = false,
  drawer = false,
  isOpen = false,
  onClose,
  searchParams,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const handleToggleCollapse = () => {
    if (drawer) {
      onClose?.();
      return;
    }
    setIsCollapsed((prev) => !prev);
    window.dispatchEvent(new Event("entropy_toggle_sidebar"));
  };

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

  const [localIsZero, setLocalIsZero] = useState(false);

  useEffect(() => {
    const checkUserZero = () => {
      try {
        const check = (u: any) => {
          if (!u) return false;
          const h = String(u.handle || "").replace(/^@/, "").trim().toLowerCase();
          const n = String(u.name || "").trim().toLowerCase();
          const dn = String(u.displayName || "").trim().toLowerCase();
          const id = String(u.id || "").trim().toLowerCase();
          const em = String(u.email || "").trim().toLowerCase();
          return h === "0" || n === "0" || dn === "0" || id === "u-1792083556851" || em.startsWith("0@");
        };

        if (check(user)) {
          setLocalIsZero(true);
          return;
        }

        const raw = localStorage.getItem("entropy_user");
        if (raw && check(JSON.parse(raw))) {
          setLocalIsZero(true);
          return;
        }
        setLocalIsZero(false);
      } catch {
        setLocalIsZero(false);
      }
    };

    checkUserZero();
    window.addEventListener("entropy_user_updated", checkUserZero);
    window.addEventListener("storage", checkUserZero);
    return () => {
      window.removeEventListener("entropy_user_updated", checkUserZero);
      window.removeEventListener("storage", checkUserZero);
    };
  }, [user]);

  const navItems = [
    { label: "Search", href: "/results", icon: Search },
    { label: "Home", href: "/", icon: Home },
    { label: "Shorts", href: "/shorts", icon: Flame },
    { label: "Subscriptions", href: "/feed/subscriptions", icon: PlaySquare },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
    },
    { label: "History", href: "/feed/history", icon: History },
    { label: "Playlists", href: "/feed/playlists", icon: ListVideo },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Your videos", href: "/studio/videos", icon: Video },
    { label: "Create", href: "/studio/upload", icon: Pencil },
    { label: "Watch Later", href: "/playlist?list=WL", icon: Clock },
    { label: "Liked videos", href: "/playlist?list=LL", icon: ThumbsUp },
    { label: "Trending", href: "/trending", icon: Compass },
    { label: "News", href: "/news", icon: Newspaper, hasExternal: true },
    ...(localIsZero
      ? [{ label: "Users Panel", href: "/news?tab=users", icon: Shield, badge: "Admin" }]
      : []),
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  // Drawer (Mobile / Overlay)
  if (drawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
          onClick={onClose}
        />

        {/* Slide-over Drawer */}
        <aside className="relative flex h-full w-60 flex-col bg-[#0c0c0e] text-zinc-200 border-r border-white/[0.08] z-50 overflow-y-auto px-3 py-3 shadow-2xl animate-in slide-in-from-left duration-250 select-none scrollbar-none font-sidebar">
          {/* Header: Logo + Collapse Icon */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 mb-1">
            <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
              <img
                src="/entropy-icon.png"
                alt="Entropy logo"
                className="h-6 w-6 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-extrabold text-[17px] tracking-wider text-white uppercase font-sans">
                ENTROPY
              </span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Navigation List */}
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 select-none",
                    isActive
                      ? "bg-[#181818] text-white font-semibold shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-auto flex-shrink-0 bg-[#e51d42] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-tight shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.hasExternal && (
                    <ExternalLink
                      className="ml-auto h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0"
                      strokeWidth={1.8}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    );
  }

  // Collapsed Sidebar (Compact Strip)
  if (isCollapsed) {
    return (
      <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-16 flex-col items-center py-3 bg-[#0c0c0e] text-zinc-300 border-r border-white/[0.06] select-none scrollbar-none overflow-y-auto font-sidebar">
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] mb-3 transition-colors cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>

        <div className="flex flex-col items-center gap-1 w-full px-2">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150",
                  isActive
                    ? "bg-[#181818] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                )}
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {item.badge !== undefined && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#e51d42] ring-2 ring-[#0c0c0e]" />
                )}
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  // Full Expanded Sidebar
  return (
    <aside className="sticky top-14 hidden md:flex h-[calc(100vh-3.5rem)] w-60 flex-col overflow-y-auto px-3 py-3 bg-[#0c0c0e] text-zinc-200 border-r border-white/[0.06] select-none scrollbar-none font-sidebar">
      {/* Top Header: Logo + Collapse Button (matching LUDUVO style) */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 mb-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/entropy-icon.png"
            alt="Entropy logo"
            className="h-6 w-6 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-extrabold text-[17px] tracking-wider text-white uppercase font-sans">
            ENTROPY
          </span>
        </Link>
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* Navigation List */}
      <div className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 select-none",
                isActive
                  ? "bg-[#181818] text-white font-semibold shadow-sm"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                  )}
                  strokeWidth={1.8}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="ml-auto flex-shrink-0 bg-[#e51d42] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-tight shadow-sm">
                  {item.badge}
                </span>
              )}
              {item.hasExternal && (
                <ExternalLink
                  className="ml-auto h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0"
                  strokeWidth={1.8}
                />
              )}
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
