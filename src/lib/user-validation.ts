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

export function getRegisteredUsers(): UserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
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
  } catch {}
}

export function findUserByHandle(rawHandle: string): UserRecord | null {
  const clean = decodeURIComponent(rawHandle).replace(/^%40|^@/, "").trim().toLowerCase();
  if (!clean) return null;

  // 1. Check registered users
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
