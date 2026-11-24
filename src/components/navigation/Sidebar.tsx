"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
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
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import SnowOverlay from "@/components/ambient/SnowOverlay";

interface SidebarProps {
  collapsed?: boolean;
  drawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarContentProps extends SidebarProps {
  searchParams: ReturnType<typeof useSearchParams> | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string | number;
  hasExternal?: boolean;
}

interface NavSection {
  title?: string;
  href?: string;
  items: NavItem[];
}

function SantaHatBadge() {
  return (
    <svg
      viewBox="0 0 20 16"
      aria-hidden="true"
      className="pointer-events-none absolute -top-[6px] -left-[4px] h-[11px] w-[14px] -rotate-[14deg] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
    >
      {/* Red hat cone */}
      <path
        d="M17.2 11.2 C16.6 6.2 14.4 2.2 11.6 2.2 C8.6 2.2 5.8 3.4 4.0 5.2 C5.4 5.6 6.6 7.8 6.8 11.2 Z"
        fill="#dc2626"
      />
      {/* White brim */}
      <rect x="6" y="10.8" width="12" height="3.2" rx="1.6" fill="#f4f4f5" />
      {/* White pom-pom */}
      <circle cx="3.6" cy="5.4" r="2.1" fill="#ffffff" />
    </svg>
  );
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

  useEffect(() => {
    if (drawer) return;
    const width = isCollapsed ? "4rem" : "15rem";
    const expanded = isCollapsed ? "false" : "true";
    document.documentElement.style.setProperty("--sidebar-width", width);
    document.documentElement.dataset.sidebarExpanded = expanded;
    window.dispatchEvent(new Event("entropy_sidebar_layout"));
    return () => {
      document.documentElement.style.setProperty("--sidebar-width", "0px");
      document.documentElement.dataset.sidebarExpanded = "false";
      window.dispatchEvent(new Event("entropy_sidebar_layout"));
    };
  }, [isCollapsed, drawer]);

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

  // YouTube-style section groupings (with headers, NO horizontal line dividers)
  const navSections: NavSection[] = [
    {
      items: [
        { label: "Home", href: "/", icon: Home },
        { label: "Shorts", href: "/shorts", icon: Flame },
        { label: "Subscriptions", href: "/feed/subscriptions", icon: PlaySquare },
        {
          label: "Notifications",
          href: "/notifications",
          icon: Bell,
          badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
        },
      ],
    },
    {
      title: "You",
      href: "/profile",
      items: [
        { label: "Profile", href: "/profile", icon: User },
        { label: "History", href: "/feed/history", icon: History },
        { label: "Playlists", href: "/feed/playlists", icon: ListVideo },
        { label: "Your videos", href: "/studio/videos", icon: Video },
        { label: "Create", href: "/studio/upload", icon: Pencil },
        { label: "Watch Later", href: "/playlist?list=WL", icon: Clock },
        { label: "Liked videos", href: "/playlist?list=LL", icon: ThumbsUp },
      ],
    },
    {
      title: "Explore",
      items: [
        { label: "Trending", href: "/trending", icon: Compass },
        { label: "News", href: "/news", icon: Newspaper, hasExternal: true },
      ],
    },
    {
      title: localIsZero ? "Manage" : undefined,
      items: [
        ...(localIsZero
          ? [{ label: "Users Panel", href: "/news?tab=users", icon: Shield, badge: "Admin" }]
          : []),
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  // Render individual navigation item
  const getActiveIconClass = (label: string, isActive: boolean) => {
    if (!isActive) return "text-zinc-400 group-hover:text-white";
    switch (label) {
      case "Home":
        return "text-white fill-current [&>path:first-child]:stroke-[#181818] [&>path:first-child]:fill-[#181818]";
      case "Subscriptions":
        return "text-white fill-current [&>path]:fill-[#181818] [&>path]:stroke-[#181818]";
      case "Watch Later":
        return "text-white fill-current [&>polyline]:stroke-[#181818]";
      case "Trending":
        return "text-white fill-current [&>polygon]:fill-[#181818] [&>polygon]:stroke-[#181818]";
      case "Settings":
        return "text-white fill-current [&>circle]:fill-[#181818] [&>circle]:stroke-[#181818]";
      case "News":
        return "text-white fill-current [&>path:not(:first-child)]:stroke-[#181818] [&>rect]:fill-[#181818] [&>rect]:stroke-[#181818]";
      case "History":
      case "Playlists":
        return "text-white";
      default:
        return "text-white fill-current";
    }
  };

  const renderItem = (item: NavItem, isDrawerMode = false) => {
    const isActive = isItemActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={isDrawerMode ? onClose : undefined}
        className={cn(
          "group flex items-center justify-between px-3 py-[7px] rounded-md text-[13.5px] font-medium transition-all duration-150 select-none",
          isActive
            ? "bg-[#181818] text-white font-semibold shadow-sm"
            : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="relative inline-flex flex-shrink-0 items-center justify-center">
            <Icon
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                getActiveIconClass(item.label, isActive)
              )}
              strokeWidth={isActive ? 2.1 : 1.8}
            />
            <SantaHatBadge />
          </span>
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge !== undefined && (
          <span className="ml-auto flex-shrink-0 bg-[#e51d42] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center leading-tight shadow-sm">
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
  };

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
        <aside className="relative flex h-full w-60 flex-col bg-[#111111] text-zinc-200 border-r border-white/[0.08] z-50 overflow-y-auto px-3 py-3 shadow-2xl animate-in slide-in-from-left duration-250 select-none scrollbar-none font-sidebar">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_0%,rgba(255,255,255,0.025)_0%,transparent_55%,rgba(0,0,0,0.22)_100%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-matte-grain opacity-[0.028]"
          />
          <SnowOverlay className="pointer-events-none fixed left-0 top-0 h-screen w-60 z-10 select-none" />
          {/* Header: Collapse Icon */}
          <div className="flex items-center justify-end px-2 pt-1 pb-3 mb-1">
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

          {/* Navigation Sections (YouTube headers, NO line dividers) */}
          <div className="space-y-3">
            {navSections.map((section, sIndex) => {
              if (section.items.length === 0) return null;
              return (
                <div key={sIndex} className="space-y-0.5">
                  {section.title && (
                    <div className="px-3.5 pt-1 pb-1">
                      {section.href ? (
                        <Link
                          href={section.href}
                          onClick={onClose}
                          className="group inline-flex items-center gap-1.5 text-[14px] font-bold text-white hover:text-zinc-200 transition-colors select-none"
                        >
                          <span>{section.title}</span>
                          <ChevronRight
                            className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                            strokeWidth={2}
                          />
                        </Link>
                      ) : (
                        <span className="text-[13px] font-bold text-zinc-300 tracking-wide select-none">
                          {section.title}
                        </span>
                      )}
                    </div>
                  )}
                  {section.items.map((item) => renderItem(item, true))}
                </div>
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
      <>
        <div className="hidden md:block flex-shrink-0 w-16" aria-hidden="true" />
        <aside className="fixed left-0 top-0 bottom-0 z-50 hidden md:flex h-screen w-16 flex-col items-center py-3.5 bg-[#111111] text-zinc-300 border-r border-white/[0.08] select-none scrollbar-none overflow-y-auto font-sidebar">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 bottom-0 w-16 bg-[radial-gradient(ellipse_140%_70%_at_50%_0%,rgba(255,255,255,0.025)_0%,transparent_55%,rgba(0,0,0,0.22)_100%)]"
          />
          <SnowOverlay className="pointer-events-none fixed left-0 top-0 h-screen w-16 z-10 select-none" />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 bottom-0 w-16 bg-matte-grain opacity-[0.028]"
          />
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <img src="/christmas-entropy.png" alt="Expand sidebar" className="h-10 w-10 scale-125 object-contain" />
          </button>
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] mb-3 transition-colors cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>

          <div className="flex flex-col items-center gap-3 w-full px-2">
            {navSections.map((section, sIndex) => {
              if (section.items.length === 0) return null;
              return (
                <div key={sIndex} className="flex flex-col items-center gap-1 w-full">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center justify-center w-10 h-10 rounded-md transition-all duration-150",
                          isActive
                            ? "bg-[#181818] text-white shadow-sm"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                        )}
                        title={item.label}
                      >
                        <span className="relative inline-flex items-center justify-center">
                          <Icon
                            className={cn("h-[18px] w-[18px]", getActiveIconClass(item.label, isActive))}
                            strokeWidth={isActive ? 2.1 : 1.8}
                          />
                          <SantaHatBadge />
                        </span>
                        {item.badge !== undefined && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#e51d42] ring-2 ring-[#111111]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>
      </>
    );
  }

  // Full Expanded Sidebar
  return (
    <>
      <div className="hidden md:block flex-shrink-0 w-60" aria-hidden="true" />
      <aside className="fixed left-0 top-0 bottom-0 z-50 hidden md:flex h-screen w-60 flex-col overflow-y-auto px-3 py-3.5 bg-[#111111] text-zinc-200 border-r border-white/[0.08] select-none scrollbar-none font-sidebar">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 bottom-0 w-60 bg-[radial-gradient(ellipse_120%_70%_at_50%_0%,rgba(255,255,255,0.025)_0%,transparent_55%,rgba(0,0,0,0.22)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 bottom-0 w-60 bg-matte-grain opacity-[0.028]"
        />
        <SnowOverlay className="pointer-events-none fixed left-0 top-0 h-screen w-60 z-10 select-none" />
        {/* Top Header: Brand Logo + Collapse Button */}
        <div className="flex items-center justify-between pl-0 pr-3 pt-0.5 pb-4 mb-1">
          <Link href="/" className="-ml-1 flex items-center gap-0 group">
            <img
              src="/christmas-entropy.png"
              alt="Entropy"
              className="h-14 w-14 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="-ml-1.5 font-bold text-[18px] tracking-tight text-white">
              Entropy
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

      {/* Navigation Sections (YouTube headers, NO line dividers) */}
      <div className="space-y-3">
        {navSections.map((section, sIndex) => {
          if (section.items.length === 0) return null;
          return (
            <div key={sIndex} className="space-y-0.5">
              {section.title && (
                <div className="px-3.5 pt-1 pb-1">
                  {section.href ? (
                    <Link
                      href={section.href}
                      className="group inline-flex items-center gap-1.5 text-[14px] font-bold text-white hover:text-zinc-200 transition-colors select-none"
                    >
                      <span>{section.title}</span>
                      <ChevronRight
                        className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                        strokeWidth={2}
                      />
                    </Link>
                  ) : (
                    <span className="text-[13px] font-bold text-zinc-300 tracking-wide select-none">
                      {section.title}
                    </span>
                  )}
                </div>
              )}
              {section.items.map((item) => renderItem(item, false))}
            </div>
          );
        })}
      </div>
    </aside>
    </>
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
