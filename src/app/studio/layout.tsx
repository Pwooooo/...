"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Video,
  BarChart3,
  MessageSquare,
  Wand2,
  Settings,
  ArrowLeft,
  Plus,
  Search,
  Menu,
  X,
  Upload,
  Film,
  ExternalLink,
  ChevronDown,
  User,
  Tv,
} from "lucide-react";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const createRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setIsCreateOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      href: "/studio",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Content",
      href: "/studio/videos",
      icon: Video,
      exact: false,
    },
    {
      label: "Analytics",
      href: "/studio/analytics",
      icon: BarChart3,
      exact: false,
    },
    {
      label: "Comments",
      href: "/studio/comments",
      icon: MessageSquare,
      exact: false,
    },
    {
      label: "Customization",
      href: "/studio/customization",
      icon: Wand2,
      exact: false,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/studio/videos?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const channelName = user?.name || "Creator";
  const channelHandle = user?.handle ? `@${user.handle.replace(/^@/, "")}` : "@creator";
  const channelAvatar = user?.avatarUrl || "/default-avatar.png";

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-sans selection:bg-white/20">
      {/* 1. Studio Top Navbar */}
      <header className="sticky top-0 z-40 h-14 bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.08] px-4 flex items-center justify-between select-none">
        {/* Left: Hamburger + Studio Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/studio" className="flex items-center gap-2.5 group">
            <img
              src="/entropy-icon.png"
              alt="Entropy logo"
              className="h-7 w-7 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">Entropy</span>
              <span className="text-xs font-semibold text-white tracking-normal">
                Studio
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search in channel */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              type="text"
              placeholder="Search across your channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          </form>
        </div>

        {/* Right: + Create CTA & Channel Menu */}
        <div className="flex items-center gap-3">
          {/* Create Button & Dropdown */}
          <div className="relative" ref={createRef}>
            <button
              type="button"
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-transform active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </button>

            {isCreateOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#1e1e1e] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href="/studio/upload"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Upload className="h-4 w-4 text-white" />
                  <span>Upload videos</span>
                </Link>
                <Link
                  href="/studio/upload?type=short"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Film className="h-4 w-4 text-white" />
                  <span>Create Short</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Menu / Avatar */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setIsUserMenuOpen((prev) => !prev);
                }
              }}
              className="h-8 w-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
            >
              <img
                src={channelAvatar}
                alt={channelName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
            </button>

            {isUserMenuOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#1e1e1e] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-white/[0.08] mb-1">
                  <p className="text-xs font-bold text-white truncate">{channelName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{channelHandle}</p>
                </div>
                <Link
                  href={`/profile/${channelHandle}`}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>Your channel</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                  <span>Exit Studio to Entropy</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Studio Body: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Studio Sidebar */}
        <aside
          className={`flex-shrink-0 bg-[#121212] border-r border-white/[0.08] flex flex-col transition-all duration-200 select-none ${
            isSidebarOpen ? "w-64" : "w-18"
          }`}
        >
          {/* Channel Header Profile in Sidebar */}
          {isSidebarOpen ? (
            <div className="p-5 border-b border-white/[0.06] flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 shadow-lg mb-3">
                <img
                  src={channelAvatar}
                  alt={channelName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
              <p className="text-xs text-zinc-400 font-medium">Your channel</p>
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] mt-0.5">
                {channelName}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{channelHandle}</p>
            </div>
          ) : (
            <div className="p-3 border-b border-white/[0.06] flex justify-center">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                <img
                  src={channelAvatar}
                  alt={channelName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  } ${!isSidebarOpen && "justify-center px-0"}`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Settings & Return to Entropy */}
          <div className="p-2 border-t border-white/[0.06] space-y-1">
            <Link
              href="/settings"
              className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all ${
                !isSidebarOpen && "justify-center px-0"
              }`}
              title={!isSidebarOpen ? "Settings" : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && <span>Settings</span>}
            </Link>
            <Link
              href="/"
              className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all ${
                !isSidebarOpen && "justify-center px-0"
              }`}
              title={!isSidebarOpen ? "Exit to Entropy" : undefined}
            >
              <ArrowLeft className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && <span>Exit to Entropy</span>}
            </Link>
          </div>
        </aside>

        {/* Studio Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">{children}</main>
      </div>
    </div>
  );
}
