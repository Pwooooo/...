"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type NotificationType = "upload" | "comment" | "system" | "like" | "mention";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actorName: string;
  actorAvatar?: string | null;
  thumbnailUrl?: string | null;
  linkUrl: string;
  createdAt: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
}

const STORAGE_KEY = "entropy_notifications_v2";

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-seed-1",
    type: "upload",
    title: "New Video Upload",
    message: "SystemCraft Tech uploaded: Building a Distributed Video Transcoder with Go, FFmpeg & S3",
    actorName: "SystemCraft Tech",
    actorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    linkUrl: "/watch?v=sample-1",
    createdAt: Date.now() - 1000 * 60 * 18, // 18m ago
    read: false,
  },
  {
    id: "notif-seed-2",
    type: "system",
    title: "Storage Engine Online",
    message: "Entropy multi-bitrate HLS streaming and proxy ingestion are now connected and active.",
    actorName: "Entropy Cloud",
    actorAvatar: "/default-avatar.png",
    linkUrl: "/studio/upload",
    createdAt: Date.now() - 1000 * 60 * 75, // 1h 15m ago
    read: false,
  },
  {
    id: "notif-seed-3",
    type: "upload",
    title: "New Video Upload",
    message: "CS Insights uploaded: Why Modern Operating Systems Are So Complex",
    actorName: "CS Insights",
    actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80",
    linkUrl: "/watch?v=sample-3",
    createdAt: Date.now() - 1000 * 60 * 180, // 3h ago
    read: false,
  },
  {
    id: "notif-seed-4",
    type: "comment",
    title: "New Comment",
    message: "Devon Vance replied: 'The adaptive bitrate playback and latency test runs smoothly!'",
    actorName: "Devon Vance",
    actorAvatar: "/default-avatar.png",
    linkUrl: "/watch?v=sample-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1d ago
    read: true,
  },
  {
    id: "notif-seed-5",
    type: "system",
    title: "Welcome to Entropy",
    message: "Welcome! Explore high-fidelity video streams or publish your first broadcast.",
    actorName: "Entropy Team",
    actorAvatar: "/default-avatar.png",
    linkUrl: "/",
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2d ago
    read: true,
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load notifications from localStorage:", e);
    }

    // Default to seeds
    setNotifications(SEED_NOTIFICATIONS);
    setIsLoaded(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
    } catch {}
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Failed to save notifications to localStorage:", e);
    }
  }, [notifications, isLoaded]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
      const newItem: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newItem, ...prev]);
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
