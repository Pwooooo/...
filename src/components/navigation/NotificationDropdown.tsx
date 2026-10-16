"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  Settings,
  Video,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  X,
  ExternalLink,
} from "lucide-react";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "uploads">("all");

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.read;
    if (activeTab === "uploads") return item.type === "upload";
    return true;
  });

  const handleItemClick = (item: NotificationItem, e: React.MouseEvent) => {
    // If clicking the dismiss button, don't navigate
    if ((e.target as HTMLElement).closest(".dismiss-btn")) {
      return;
    }

    markAsRead(item.id);
    onClose();
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "upload":
        return <Video className="h-2.5 w-2.5 text-white" />;
      case "comment":
        return <MessageSquare className="h-2.5 w-2.5 text-white" />;
      case "like":
        return <ThumbsUp className="h-2.5 w-2.5 text-white" />;
      case "system":
      default:
        return <Sparkles className="h-2.5 w-2.5 text-white" />;
    }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#141414] border border-white/[0.08] shadow-2xl z-50 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#161616]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-300" />
          <span className="text-sm font-bold tracking-tight text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-white text-black px-1.5 py-0.2 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}

          <Link
            href="/settings?tab=notifications"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#121212] text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-white text-black shadow-sm"
              : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1]"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            activeTab === "unread"
              ? "bg-white text-black shadow-sm"
              : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1]"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeTab === "unread" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("uploads")}
          className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            activeTab === "uploads"
              ? "bg-white text-black shadow-sm"
              : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1]"
          }`}
        >
          Uploads
        </button>
      </div>

      {/* Notification Items List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-500 mb-3">
              <BellOff className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">No notifications</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
              {activeTab === "unread"
                ? "You've read all your notifications!"
                : "Activity like new uploads and comments will show up here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(item, e)}
              className={`group relative flex items-start gap-3 p-3 transition-colors cursor-pointer ${
                item.read ? "hover:bg-[#1a1a1a] opacity-80 hover:opacity-100" : "bg-[#181818]/60 hover:bg-[#1f1f1f]"
              }`}
            >
              {/* Unread dot */}
              {!item.read && (
                <div
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#00a8ff] shadow-[0_0_8px_rgba(0,168,255,0.8)]"
                  title="Unread"
                />
              )}

              {/* Avatar with Type Badge */}
              <div className="relative flex-shrink-0 ml-1">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 border border-white/[0.08]">
                  <img
                    src={item.actorAvatar || "/default-avatar.png"}
                    alt={item.actorName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                    }}
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-zinc-200 line-clamp-2 leading-snug">
                  <span className="font-bold text-white hover:underline mr-1">
                    {item.actorName}
                  </span>
                  {item.message.replace(new RegExp(`^${item.actorName}\\s*(uploaded:?|replied:?|:?)?\\s*`, "i"), "")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                  {!item.read && (
                    <span className="text-[10px] text-[#00a8ff] font-semibold">New</span>
                  )}
                </div>
              </div>

              {/* Thumbnail preview if upload */}
              {item.thumbnailUrl && (
                <div className="relative h-11 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-black border border-white/[0.08]">
                  <img
                    src={item.thumbnailUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Quick Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(item.id);
                }}
                className="dismiss-btn opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/[0.1] transition-opacity cursor-pointer self-start"
                title="Remove notification"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.08] bg-[#161616] text-[11px]">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-zinc-400 hover:text-white font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View all notifications</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-zinc-500 hover:text-red-400 font-semibold transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
