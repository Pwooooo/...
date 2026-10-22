import { Redis } from "@upstash/redis";

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

// Built-in seed users that are always available
export const SEED_USERS: UserRecord[] = [
  {
    id: "u-dj-skimmy-dew-kat",
    name: "DJ Skimmy Dew Kat",
    handle: "dj_skimmy_dew_kat",
    avatarUrl: "/default-avatar.png",
    bio: "Official channel for @dj_skimmy_dew_kat. Streaming, creating, and connecting.",
    joinedAt: "Joined recently",
  },
];

function getRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    "";

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (err) {
    console.warn("Could not initialize Upstash Redis client:", err);
    return null;
  }
}

// Local in-memory cache for development or when Redis is pending configuration
const memoryStore = new Map<string, UserRecord>();
SEED_USERS.forEach((u) => {
  memoryStore.set(u.handle.toLowerCase(), u);
});

export async function getKvUserByHandle(rawHandle: string): Promise<UserRecord | null> {
  const clean = decodeURIComponent(rawHandle).replace(/^%40|^@/, "").trim().toLowerCase();
  if (!clean) return null;

  // 1. Check Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<UserRecord>(`entropy:user:handle:${clean}`);
      if (data && data.handle) {
        return data;
      }
    } catch (err) {
      console.warn("Redis lookup failed for handle:", clean, err);
    }
  }

  // 2. Check in-memory store
  if (memoryStore.has(clean)) {
    return memoryStore.get(clean) || null;
  }

  // 3. Check seed users
  const seedMatch = SEED_USERS.find((u) => u.handle.toLowerCase() === clean);
  if (seedMatch) return seedMatch;

  return null;
}

export async function saveKvUser(user: UserRecord): Promise<boolean> {
  if (!user || !user.handle) return false;
  const cleanHandle = user.handle.replace(/^%40|^@/, "").trim().toLowerCase();
  const normalized: UserRecord = {
    ...user,
    handle: cleanHandle,
  };

  // Always store in memory store
  memoryStore.set(cleanHandle, normalized);

  // Store in Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`entropy:user:handle:${cleanHandle}`, normalized);
      await redis.sadd("entropy:users:all_handles", cleanHandle);
      return true;
    } catch (err) {
      console.warn("Redis save failed for user:", cleanHandle, err);
    }
  }

  return true;
}

export async function getAllKvUsers(): Promise<UserRecord[]> {
  const map = new Map<string, UserRecord>();

  // Add seeds
  SEED_USERS.forEach((u) => map.set(u.handle.toLowerCase(), u));

  // Add memory store
  memoryStore.forEach((u, h) => map.set(h, u));

  // Fetch from Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      const handles = await redis.smembers("entropy:users:all_handles");
      if (Array.isArray(handles) && handles.length > 0) {
        for (const h of handles) {
          if (typeof h === "string") {
            const u = await redis.get<UserRecord>(`entropy:user:handle:${h}`);
            if (u && u.handle) {
              map.set(u.handle.toLowerCase(), u);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Redis fetch all users failed:", err);
    }
  }

  return Array.from(map.values());
}
