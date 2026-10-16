"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  Settings,
  Trash2,
  Video,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  X,
  ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";

function formatFullTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "uploads" | "comments" | "system">("all");

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "unread") return !item.read;
    if (activeFilter === "uploads") return item.type === "upload";
    if (activeFilter === "comments") return item.type === "comment";
    if (activeFilter === "system") return item.type === "system";
    return true;
  });

  const handleItemClick = (item: NotificationItem, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".action-btn")) {
      return;
    }

    markAsRead(item.id);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "upload":
        return <Video className="h-3 w-3 text-white" />;
      case "comment":
        return <MessageSquare className="h-3 w-3 text-white" />;
      case "like":
        return <ThumbsUp className="h-3 w-3 text-white" />;
      case "system":
      default:
        return <Sparkles className="h-3 w-3 text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-x-hidden px-4 sm:px-8 py-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden"
                title="Back to feed"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-white text-black px-2 py-0.5 text-xs font-bold shadow-sm">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Stay updated on new uploads, community interactions, and system events.
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1.5 rounded-xl bg-[#181818] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/20 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              )}

              <Link
                href="/settings?tab=notifications"
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#181818] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                title="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread", count: unreadCount },
              { id: "uploads", label: "Uploads" },
              { id: "comments", label: "Comments" },
              { id: "system", label: "System" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-white text-black shadow-md"
                    : "bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#222222] border border-white/[0.06]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeFilter === tab.id ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-2xl divide-y divide-white/[0.04]">
            {filteredNotifications.length === 0 ? (
              <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-4">
                  <BellOff className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No notifications found</h3>
                <p className="text-xs text-zinc-500 max-w-sm">
                  {activeFilter === "unread"
                    ? "You are all caught up! There are no unread notifications right now."
                    : "When new videos, mentions, or announcements occur, they'll appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => handleItemClick(item, e)}
                  className={`group relative flex items-center gap-4 p-4 sm:p-5 transition-all cursor-pointer ${
                    item.read
                      ? "hover:bg-[#1a1a1a] opacity-85 hover:opacity-100"
                      : "bg-[#181818]/70 hover:bg-[#1f1f1f]"
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {!item.read && (
                    <div
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-[#00a8ff] shadow-[0_0_8px_rgba(0,168,255,0.8)]"
                      title="Unread"
                    />
                  )}

                  {/* Actor Avatar with Icon Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-zinc-800 border border-white/[0.08]">
                      <img
                        src={item.actorAvatar || "/default-avatar.png"}
                        alt={item.actorName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow-md">
                      {getTypeIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-zinc-200 leading-snug line-clamp-2">
                      <span className="font-bold text-white mr-1.5">
                        {item.actorName}
                      </span>
                      {item.message.replace(new RegExp(`^${item.actorName}\\s*(uploaded:?|replied:?|:?)?\\s*`, "i"), "")}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-zinc-500 font-medium">
                        {formatFullTime(item.createdAt)}
                      </span>
                      {!item.read && (
                        <span className="text-xs text-[#00a8ff] font-semibold flex items-center gap-1">
                          • New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Thumbnail if present */}
                  {item.thumbnailUrl && (
                    <div className="relative h-14 w-24 sm:h-16 sm:w-28 flex-shrink-0 rounded-xl overflow-hidden bg-black border border-white/[0.08] shadow-sm">
                      <img
                        src={item.thumbnailUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Quick Dismiss Action */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="action-btn opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/[0.08] transition-opacity cursor-pointer"
                      title="Remove notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
