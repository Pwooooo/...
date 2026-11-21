import { get, list } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { ensureBlobToken } from "@/lib/blob-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CachedBlobResolution {
  target: string;
  access: "private" | "public";
  publicUrl?: string;
  contentType?: string | null;
  size?: number | null;
  cachedAt: number;
}

type BlobGetResult = NonNullable<Awaited<ReturnType<typeof get>>>;
type ResolvedBlob =
  | { redirectUrl: string; blob: { contentType: string | null; size: number | null } }
  | { result: BlobGetResult };

const BLOB_RESOLUTION_CACHE = new Map<string, CachedBlobResolution>();
const BLOB_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const IMMUTABLE_CACHE_HEADER = "public, max-age=31536000, s-maxage=31536000, immutable";

function getCandidates(raw: string): string[] {
  const listArr: string[] = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (!listArr.includes(decoded)) listArr.push(decoded);
    const noLeadingSlash = decoded.replace(/^\//, "");
    if (!listArr.includes(noLeadingSlash)) listArr.push(noLeadingSlash);
    const withLeadingSlash = `/${noLeadingSlash}`;
    if (!listArr.includes(withLeadingSlash)) listArr.push(withLeadingSlash);

    // Also strip or add 'videos/' prefix
    if (noLeadingSlash.startsWith("videos/")) {
      const stripped = noLeadingSlash.replace(/^videos\//, "");
      if (!listArr.includes(stripped)) listArr.push(stripped);
    } else {
      const withVideos = `videos/${noLeadingSlash}`;
      if (!listArr.includes(withVideos)) listArr.push(withVideos);
    }
  } catch {}
  return listArr;
}

async function resolveBlob(raw: string, rangeHeader?: string | null): Promise<ResolvedBlob | null> {
  ensureBlobToken();
  const extraHeaders: Record<string, string> = {};
  if (rangeHeader) {
    extraHeaders["range"] = rangeHeader;
  }

  // 0. Fast path: use cached target/access so repeated range chunks don't loop or list()
  const cached = BLOB_RESOLUTION_CACHE.get(raw);
  if (cached && Date.now() - cached.cachedAt < BLOB_CACHE_TTL_MS) {
    if (cached.access === "public" && cached.publicUrl) {
      return {
        redirectUrl: cached.publicUrl,
        blob: { contentType: cached.contentType || null, size: cached.size || 0 },
      };
    }
    try {
      const result = await get(cached.target, {
        access: cached.access,
        useCache: true,
        headers: extraHeaders,
      });
      if (result) return { result };
    } catch {
      BLOB_RESOLUTION_CACHE.delete(raw);
    }
  }

  const candidates = getCandidates(raw);

  // 1. Try candidates directly with private access
  for (const target of candidates) {
    try {
      const result = await get(target, {
        access: "private",
        useCache: true,
        headers: extraHeaders,
      });
      if (result) {
        BLOB_RESOLUTION_CACHE.set(raw, {
          target,
          access: "private",
          contentType: result.blob.contentType,
          size: result.blob.size,
          cachedAt: Date.now(),
        });
        return { result };
      }
    } catch {}
  }

  // 2. Try candidates directly with public access (redirect directly to Blob CDN!)
  for (const target of candidates) {
    try {
      const result = await get(target, {
        access: "public",
        useCache: true,
        headers: extraHeaders,
      });
      if (result) {
        BLOB_RESOLUTION_CACHE.set(raw, {
          target,
          access: "public",
          publicUrl: result.blob.url,
          contentType: result.blob.contentType,
          size: result.blob.size,
          cachedAt: Date.now(),
        });
        if (result.blob.url) {
          return { redirectUrl: result.blob.url, blob: result.blob };
        }
        return { result };
      }
    } catch {}
  }

  // 3. Fallback: Search all blobs in store to find matching pathname or basename
  try {
    const { blobs } = await list();
    const cleanRaw = decodeURIComponent(raw).replace(/^\//, "").toLowerCase();
    const targetBase = cleanRaw.split("/").pop() || cleanRaw;

    const matched = blobs.find((b) => {
      const p = b.pathname.toLowerCase();
      return (
        p === cleanRaw ||
        p.endsWith(`/${cleanRaw}`) ||
        p.endsWith(targetBase) ||
        b.url.toLowerCase().includes(cleanRaw)
      );
    });

    if (matched) {
      try {
        const res = await get(matched.url, {
          access: "private",
          useCache: true,
          headers: extraHeaders,
        });
        if (res) {
          BLOB_RESOLUTION_CACHE.set(raw, {
            target: matched.url,
            access: "private",
            contentType: res.blob.contentType,
            size: res.blob.size,
            cachedAt: Date.now(),
          });
          return { result: res };
        }
      } catch {}

      try {
        const res = await get(matched.url, {
          access: "public",
          useCache: true,
          headers: extraHeaders,
        });
        if (res) {
          BLOB_RESOLUTION_CACHE.set(raw, {
            target: matched.url,
            access: "public",
            publicUrl: res.blob.url || matched.url,
            contentType: res.blob.contentType,
            size: res.blob.size,
            cachedAt: Date.now(),
          });
          return { redirectUrl: res.blob.url || matched.url, blob: res.blob };
        }
      } catch {}
    }
  } catch {}

  return null;
}

function inferMimeType(pathname: string, detectedType?: string | null): string {
  if (detectedType && detectedType !== "application/octet-stream") {
    return detectedType;
  }
  const clean = pathname.split("?")[0].toLowerCase();
  const ext = clean.split(".").pop();
  switch (ext) {
    case "mov":
      return "video/quicktime";
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    case "avi":
      return "video/x-msvideo";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return detectedType || "video/mp4";
  }
}

export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const raw =
    request.nextUrl.searchParams.get("pathname") ||
    request.nextUrl.searchParams.get("url");

  if (!raw) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const resolved = await resolveBlob(raw);

    if (resolved === null) {
      return new NextResponse(null, { status: 404 });
    }

    if ("redirectUrl" in resolved) {
      return NextResponse.redirect(resolved.redirectUrl, 307);
    }

    const result = resolved.result;
    const mimeType = inferMimeType(raw, result.blob.contentType);

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": result.blob.size ? result.blob.size.toString() : "0",
        "Content-Type": mimeType,
        "Cache-Control": IMMUTABLE_CACHE_HEADER,
      },
    });
  } catch (error) {
    console.error("HEAD blob error:", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const raw =
    request.nextUrl.searchParams.get("pathname") ||
    request.nextUrl.searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }

  try {
    let rangeHeader = request.headers.get("range");
    const inferredMime = inferMimeType(raw);
    const MAX_CHUNK = 3 * 1024 * 1024; // 3 MB chunk to stay under Vercel 4.5 MB limit

    if (inferredMime.startsWith("video/")) {
      if (!rangeHeader) {
        rangeHeader = `bytes=0-${MAX_CHUNK - 1}`;
      } else {
        const m = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (m) {
          const start = parseInt(m[1], 10);
          const end = m[2] ? parseInt(m[2], 10) : NaN;
          if (!isNaN(start) && (isNaN(end) || end - start >= MAX_CHUNK)) {
            rangeHeader = `bytes=${start}-${start + MAX_CHUNK - 1}`;
          }
        }
      }
    }

    const resolved = await resolveBlob(raw, rangeHeader);

    if (resolved === null) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Bypass Vercel Fast Origin Transfer & Fluid CPU by redirecting public blobs straight to CDN
    if ("redirectUrl" in resolved) {
      return NextResponse.redirect(resolved.redirectUrl, 307);
    }

    const result = resolved.result;

    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304 });
    }

    const mimeType = inferMimeType(raw, result.blob.contentType);

    const headers: Record<string, string> = {
      "Cache-Control": IMMUTABLE_CACHE_HEADER,
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
    };

    const contentRange = result.headers?.get("content-range");
    if (contentRange) {
      headers["Content-Range"] = contentRange;
    }

    const contentLength = result.headers?.get("content-length") || (result.blob.size ? result.blob.size.toString() : "");
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    const status = rangeHeader && contentRange ? 206 : 200;

    return new NextResponse(result.stream as unknown as BodyInit, {
      status,
      headers,
    });
  } catch (error) {
    console.error("GET private blob error:", error);
    return new NextResponse("Error serving private blob", { status: 500 });
  }
}
