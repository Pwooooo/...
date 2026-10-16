import { get, list } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function resolveBlob(raw: string, rangeHeader?: string | null) {
  const candidates = getCandidates(raw);
  const extraHeaders: Record<string, string> = {};
  if (rangeHeader) {
    extraHeaders["range"] = rangeHeader;
  }

  // 1. Try candidates directly with private access
  for (const target of candidates) {
    try {
      const result = await get(target, {
        access: "private",
        useCache: false,
        headers: extraHeaders,
      });
      if (result) return result;
    } catch {}
  }

  // 2. Try candidates directly with public access
  for (const target of candidates) {
    try {
      const result = await get(target, {
        access: "public",
        useCache: false,
        headers: extraHeaders,
      });
      if (result) return result;
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
          useCache: false,
          headers: extraHeaders,
        });
        if (res) return res;
      } catch {}

      try {
        const res = await get(matched.url, {
          access: "public",
          useCache: false,
          headers: extraHeaders,
        });
        if (res) return res;
      } catch {}
    }
  } catch {}

  return null;
}

export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const raw =
    request.nextUrl.searchParams.get("pathname") ||
    request.nextUrl.searchParams.get("url");

  if (!raw) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const result = await resolveBlob(raw);

    if (result === null) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": result.blob.size ? result.blob.size.toString() : "0",
        "Content-Type": result.blob.contentType || "video/mp4",
        "Cache-Control": "public, max-age=3600",
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
    const rangeHeader = request.headers.get("range");
    const result = await resolveBlob(raw, rangeHeader);

    if (result === null) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304 });
    }

    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": result.blob.contentType || "video/mp4",
      "X-Content-Type-Options": "nosniff",
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
