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
  Check,
  Globe,
  Sliders,
  Shield,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import StudioDropdown from "@/components/ui/StudioDropdown";

function BoxToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border-2 flex-shrink-0 ${
        checked
          ? "border-white bg-black shadow-sm ring-1 ring-white/10"
          : "border-white/20 bg-[#181818] hover:border-white/40"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-xs bg-white transition-all duration-150 ${
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      />
    </button>
  );
}

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

  // Studio Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "channel" | "upload" | "community" | "agreements">("general");
  const [settingsCurrency, setSettingsCurrency] = useState("USD");
  const [settingsVisibility, setSettingsVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [settingsCategory, setSettingsCategory] = useState("Technology");
  const [settingsCountry, setSettingsCountry] = useState("United States");
  const [settingsHoldComments, setSettingsHoldComments] = useState(true);
  const [settingsBlockLinks, setSettingsBlockLinks] = useState(false);
  const [settingsBlockedWords, setSettingsBlockedWords] = useState("");
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

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
      <header className="sticky top-0 z-40 h-14 bg-[#121212]/95 backdrop-blur-md px-4 flex items-center justify-between select-none">
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
                <div className="p-2 mb-1">
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
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer ${
                !isSidebarOpen && "justify-center px-0"
              }`}
              title={!isSidebarOpen ? "Settings" : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && <span>Settings</span>}
            </button>
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

      {/* Studio Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-[#141414] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Settings className="h-5 w-5 text-white" />
                <h3 className="font-bold text-base text-white">Studio settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body with Left Tabs and Right Tab Panels */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[360px]">
              {/* Left Tab navigation */}
              <div className="w-full md:w-52 p-3 bg-[#111111] border-r border-white/[0.06] flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                {[
                  { id: "general", label: "General", icon: Sliders },
                  { id: "channel", label: "Channel", icon: Tv },
                  { id: "upload", label: "Upload defaults", icon: Upload },
                  { id: "community", label: "Community", icon: MessageSquare },
                  { id: "agreements", label: "Agreements", icon: Shield },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = settingsTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSettingsTab(t.id as any)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-white text-black shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {settingsTab === "general" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-bold text-sm text-white">Default units</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Choose the currency you prefer to see in your channel analytics and monetization estimates.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Currency
                      </label>
                      <StudioDropdown
                        value={settingsCurrency}
                        onChange={setSettingsCurrency}
                        options={[
                          { value: "USD", label: "USD - US Dollar ($)", icon: <DollarSign className="h-3.5 w-3.5 text-zinc-400" /> },
                          { value: "EUR", label: "EUR - Euro (€)", icon: <DollarSign className="h-3.5 w-3.5 text-zinc-400" /> },
                          { value: "GBP", label: "GBP - British Pound (£)", icon: <DollarSign className="h-3.5 w-3.5 text-zinc-400" /> },
                          { value: "CAD", label: "CAD - Canadian Dollar ($)", icon: <DollarSign className="h-3.5 w-3.5 text-zinc-400" /> },
                        ]}
                        className="w-full max-w-xs"
                      />
                    </div>

                    <div className="pt-3 border-t border-white/[0.06]">
                      <h5 className="font-semibold text-xs text-white">Account & System Settings</h5>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Need to change account passwords, sessions, or theme settings?
                      </p>
                      <Link
                        href="/settings"
                        onClick={() => setIsSettingsModalOpen(false)}
                        className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-zinc-200 hover:text-white underline"
                      >
                        <span>Open Account Settings</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {settingsTab === "channel" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-bold text-sm text-white">Basic info</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Set channel keywords and default location for discovery.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Country of residence
                        </label>
                        <StudioDropdown
                          value={settingsCountry}
                          onChange={setSettingsCountry}
                          options={[
                            "United States",
                            "United Kingdom",
                            "Canada",
                            "Germany",
                            "France",
                            "Japan",
                            "Australia",
                            "International",
                          ]}
                          className="w-full max-w-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Channel keywords
                        </label>
                        <input
                          type="text"
                          defaultValue="gaming, tech, coding, entropy"
                          className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none"
                          placeholder="comma separated keywords"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "upload" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-bold text-sm text-white">Upload defaults</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        These default settings will be pre-filled every time you upload a video.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Default visibility
                        </label>
                        <StudioDropdown
                          value={settingsVisibility}
                          onChange={(val) => setSettingsVisibility(val as any)}
                          options={[
                            { value: "public", label: "Public (Everyone can see)", icon: <Globe className="h-3.5 w-3.5 text-zinc-400" /> },
                            { value: "unlisted", label: "Unlisted (Anyone with link)", icon: <Globe className="h-3.5 w-3.5 text-zinc-400" /> },
                            { value: "private", label: "Private (Only you)", icon: <Shield className="h-3.5 w-3.5 text-zinc-400" /> },
                          ]}
                          className="w-full max-w-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Default Category
                        </label>
                        <StudioDropdown
                          value={settingsCategory}
                          onChange={setSettingsCategory}
                          options={[
                            "Technology",
                            "Gaming",
                            "Music",
                            "Education",
                            "Entertainment",
                            "Science",
                            "General",
                          ]}
                          className="w-full max-w-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "community" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-bold text-sm text-white">Community & Automated filters</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Control how comments and interactions are moderated on your channel.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div
                        onClick={() => setSettingsHoldComments((prev) => !prev)}
                        className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#181818] hover:bg-[#1e1e1e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none"
                      >
                        <BoxToggle
                          checked={settingsHoldComments}
                          onChange={() => setSettingsHoldComments((prev) => !prev)}
                          label="Hold potentially inappropriate comments for review"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">Hold potentially inappropriate comments for review</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Increases strictness of automatic filter before comments become public.</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setSettingsBlockLinks((prev) => !prev)}
                        className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#181818] hover:bg-[#1e1e1e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer select-none"
                      >
                        <BoxToggle
                          checked={settingsBlockLinks}
                          onChange={() => setSettingsBlockLinks((prev) => !prev)}
                          label="Block links in new comments"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">Block links in new comments</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">New comments containing URLs or domain names will be automatically held for review.</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Blocked words
                        </label>
                        <textarea
                          rows={2}
                          value={settingsBlockedWords}
                          onChange={(e) => setSettingsBlockedWords(e.target.value)}
                          placeholder="Words separated by commas will be automatically blocked..."
                          className="w-full rounded-xl bg-[#1e1e1e] border border-white/[0.08] focus:border-white/30 p-2.5 text-xs text-white outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "agreements" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Creator Agreements</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        All use of Entropy Studio is subject to the Entropy Terms of Service and Community Guidelines.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1e1e1e] border border-white/[0.08] space-y-2 text-xs text-zinc-300">
                      <p className="font-semibold text-white">Entropy Partner & Creator Terms</p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        By continuing to broadcast, publish videos, or manage studio metadata, you agree to respect copyrighted content, adhere to copyright strike guidelines, and ensure uploaded videos conform to fair use policies.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/[0.06] bg-[#111111]">
              <div className="text-xs text-zinc-400">
                {settingsToast && (
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    {settingsToast}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsToast("Studio settings saved!");
                    setTimeout(() => setSettingsToast(null), 3000);
                  }}
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all shadow cursor-pointer active:scale-95"
                >
                  Save settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
