import { getAllCombinedVideos } from "./video-storage";

export interface UserRecord {
  id: string;
  name: string;
  email?: string;
  handle: string;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  country?: string;
  joinedAt?: string;
}

const REGISTERED_USERS_KEY = "entropy_registered_users";

export const DEFAULT_PLATFORM_USERS: UserRecord[] = [];

export function getRegisteredUsers(): UserRecord[] {
  if (typeof window === "undefined") return DEFAULT_PLATFORM_USERS;
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    let list: UserRecord[] = Array.isArray(parsed) ? parsed : [];
    
    // Purge deleted placeholder user if present
    list = list.filter((u) => u.handle && u.handle.toLowerCase() !== "dj_skimmy_dew_kat");

    return list;
  } catch {}
  return DEFAULT_PLATFORM_USERS;
}

export function saveRegisteredUser(user: UserRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRegisteredUsers();
    const cleanHandle = user.handle.replace(/^@/, "").toLowerCase();
    const normalizedUser = { ...user, handle: cleanHandle };

    const idx = existing.findIndex(
      (u) => u.id === user.id || (u.handle && u.handle.toLowerCase() === cleanHandle)
    );
    let updated: UserRecord[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = { ...updated[idx], ...normalizedUser };
    } else {
      updated = [...existing, normalizedUser];
    }
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));

    // Asynchronously save to server Key-Value store
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedUser),
    }).catch(() => {});
  } catch {}
}

export async function fetchRemoteUserByHandle(rawHandle: string): Promise<UserRecord | null> {
  const clean = decodeURIComponent(rawHandle).replace(/^%40|^@/, "").trim().toLowerCase();
  if (!clean) return null;

  try {
    const res = await fetch(`/api/users?handle=${encodeURIComponent(clean)}`);
    const data = await res.json();
    if (data.success && data.user) {
      // Save locally for fast subsequent loads
      saveRegisteredUser(data.user);
      return data.user;
    }
  } catch {}

  return null;
}

export function findUserByHandle(rawHandle: string): UserRecord | null {
  const clean = decodeURIComponent(rawHandle).replace(/^%40|^@/, "").trim().toLowerCase();
  if (!clean) return null;

  // 1. Check registered users (including seed users)
  const registered = getRegisteredUsers();
  const match = registered.find((u) => u.handle && u.handle.toLowerCase() === clean);
  if (match) return match;

  // 2. Check current logged-in user in localStorage
  if (typeof window !== "undefined") {
    try {
      const currentRaw = localStorage.getItem("entropy_user");
      if (currentRaw) {
        const cur = JSON.parse(currentRaw);
        if (cur && (cur.handle?.toLowerCase() === clean || cur.name?.toLowerCase() === clean)) {
          return cur;
        }
      }
    } catch {}
  }

  // 3. Check channels in videos
  try {
    const videos = getAllCombinedVideos();
    const videoWithChannel = videos.find((v) => {
      const vHandle = (v.channel?.handle || "").replace(/^@/, "").toLowerCase();
      const vName = (v.channel?.displayName || "").toLowerCase();
      return vHandle === clean || vName === clean;
    });
    if (videoWithChannel?.channel) {
      const ch = videoWithChannel.channel;
      return {
        id: ch.id || `ch-${clean}`,
        name: ch.displayName || clean,
        handle: clean,
        avatarUrl: ch.avatarUrl || undefined,
        bio: `Official channel for @${clean}.`,
        joinedAt: "Joined recently",
      };
    }
  } catch {}

  return null;
}

export function isHandleTaken(rawHandle: string, currentUserId?: string): boolean {
  const clean = rawHandle.replace(/^@/, "").trim().toLowerCase();
  if (!clean) return false;

  // Check registered users
  const registered = getRegisteredUsers();
  for (const u of registered) {
    if (currentUserId && u.id === currentUserId) continue;
    const uHandle = (u.handle || "").replace(/^@/, "").toLowerCase();
    if (uHandle === clean) return true;
  }

  // Check currently stored user (if not same id)
  if (typeof window !== "undefined") {
    try {
      const currentRaw = localStorage.getItem("entropy_user");
      if (currentRaw) {
        const cur = JSON.parse(currentRaw);
        if (cur && cur.id !== currentUserId) {
          const curHandle = (cur.handle || "").replace(/^@/, "").toLowerCase();
          if (curHandle === clean) return true;
        }
      }
    } catch {}
  }

  // Reserved system routes
  const reserved = [
    "watch",
    "shorts",
    "studio",
    "feed",
    "profile",
    "settings",
    "trending",
    "news",
    "notifications",
    "playlist",
    "users",
    "api",
    "admin",
  ];
  if (reserved.includes(clean)) return true;

  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  cleanHandle?: string;
}

/**
 * Validates display name (3-20 letters/characters)
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Name is required (3–20 characters)." };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: "Name must be at least 3 characters." };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: "Name cannot exceed 20 characters." };
  }
  return { valid: true };
}

/**
 * Validates handle for sign up & updates:
 * Length: 3–30 characters.
 * Allowed: letters, numbers, and supported language characters (\p{L}\p{N}).
 * Special characters allowed: _ - . ·
 * Restrictions: Special separators cannot be at the beginning or end.
 * Handles must also be unique.
 */
export function validateHandle(rawHandle: string, currentUserId?: string): ValidationResult {
  let handle = rawHandle.trim();
  if (handle.startsWith("@")) {
    handle = handle.slice(1);
  }

  if (!handle) {
    return { valid: false, error: "Handle is required (3–30 characters)." };
  }

  if (handle.length < 3) {
    return { valid: false, error: "Handle must be at least 3 characters long." };
  }

  if (handle.length > 30) {
    return { valid: false, error: "Handle cannot exceed 30 characters." };
  }

  // Check special separators at beginning
  const separators = ["_", "-", ".", "·"];
  if (separators.some((s) => handle.startsWith(s))) {
    return { valid: false, error: "Special separators (_ - . ·) cannot be at the beginning." };
  }

  // Check special separators at end
  if (separators.some((s) => handle.endsWith(s))) {
    return { valid: false, error: "Special separators (_ - . ·) cannot be at the end." };
  }

  // Allowed: letters, numbers, supported language characters, and _ - . ·
  const allowedPattern = /^[\p{L}\p{N}_\-.·]+$/u;
  if (!allowedPattern.test(handle)) {
    return {
      valid: false,
      error: "Only letters, numbers, and special characters (_ - . ·) are allowed.",
    };
  }

  // Check uniqueness
  if (isHandleTaken(handle, currentUserId)) {
    return {
      valid: false,
      error: `Handle @${handle} is already taken. Please choose another.`,
    };
  }

  return { valid: true, cleanHandle: handle };
}

/**
 * Helper to auto-generate a valid suggested handle from a display name
 */
export function suggestHandleFromName(name: string): string {
  let cleaned = name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_\-.·]/gu, "")
    .slice(0, 30);

  // Strip leading separators
  cleaned = cleaned.replace(/^[_\-.·]+/, "");
  // Strip trailing separators
  cleaned = cleaned.replace(/[_\-.·]+$/, "");

  if (cleaned.length < 3) {
    cleaned = cleaned ? `${cleaned}${Math.floor(100 + Math.random() * 900)}` : "user123";
  }

  return cleaned.slice(0, 30);
}

/**
 * Resolves the latest avatar for a channel or video dynamically,
 * checking currently logged-in user, registered users, and channel fallback.
 */
export function resolveChannelAvatar(
  channel?: { id?: string | null; handle?: string | null; displayName?: string | null; avatarUrl?: string | null } | null,
  videoOrId?: { id?: string | null } | string | null,
  currentUser?: { id?: string | null; handle?: string | null; name?: string | null; avatarUrl?: string | null; avatar?: string | null } | null
): string {
  const cleanHandle = (channel?.handle || "").replace(/^@/, "").trim().toLowerCase();
  const cleanName = (channel?.displayName || "").trim().toLowerCase();
  const channelId = (channel?.id || "").trim().toLowerCase();
  const vidId = typeof videoOrId === "string" ? videoOrId : videoOrId?.id || "";

  // 1. Current logged in user (passed in or from localStorage)
  let user = currentUser;
  if (!user && typeof window !== "undefined") {
    try {
      const rawUser = localStorage.getItem("entropy_user");
      if (rawUser) {
        user = JSON.parse(rawUser);
      }
    } catch {}
  }

  if (user) {
    const uHandle = (user.handle || "").replace(/^@/, "").trim().toLowerCase();
    const uName = (user.name || "").trim().toLowerCase();
    const uId = (user.id || "").trim().toLowerCase();

    const isOwn =
      (uId && channelId && uId === channelId) ||
      (cleanHandle && uHandle && cleanHandle === uHandle) ||
      (cleanName && uName && (cleanName === uName || cleanName === uHandle)) ||
      (cleanName && uHandle && cleanName === uHandle) ||
      (vidId && (vidId.startsWith("v-user-") || vidId.startsWith("v-custom-")));

    if (isOwn) {
      if (user.avatarUrl && user.avatarUrl !== "/default-avatar.png") return user.avatarUrl;
      if (user.avatar && user.avatar !== "/default-avatar.png") return user.avatar;
    }
  }

  // 2. Check registered users
  if (cleanHandle || cleanName || channelId) {
    const registered = getRegisteredUsers();
    const match = registered.find((u) => {
      const rHandle = (u.handle || "").replace(/^@/, "").trim().toLowerCase();
      const rName = (u.name || "").trim().toLowerCase();
      const rId = (u.id || "").trim().toLowerCase();
      return (
        (channelId && rId && channelId === rId) ||
        (cleanHandle && rHandle && cleanHandle === rHandle) ||
        (cleanName && rName && cleanName === rName) ||
        (cleanName && rHandle && cleanName === rHandle)
      );
    });
    if (match) {
      if (match.avatarUrl && match.avatarUrl !== "/default-avatar.png") return match.avatarUrl;
      if (match.avatar && match.avatar !== "/default-avatar.png") return match.avatar;
    }
  }

  // 3. Fallback to channel avatar
  if (channel?.avatarUrl && channel.avatarUrl !== "/default-avatar.png") {
    return channel.avatarUrl;
  }

  return channel?.avatarUrl || "/default-avatar.png";
}
