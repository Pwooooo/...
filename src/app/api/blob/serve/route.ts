import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCandidates(raw: string): string[] {
  const list: string[] = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (!list.includes(decoded)) list.push(decoded);
    const noLeadingSlash = decoded.replace(/^\//, "");
    if (!list.includes(noLeadingSlash)) list.push(noLeadingSlash);
    const withLeadingSlash = `/${noLeadingSlash}`;
    if (!list.includes(withLeadingSlash)) list.push(withLeadingSlash);
  } catch {}
  return list;
}

async function resolveBlob(raw: string) {
  const candidates = getCandidates(raw);
  for (const target of candidates) {
    try {
      const result = await get(target, { access: "private" });
      if (result) return result;
    } catch {}
  }
  for (const target of candidates) {
    try {
      const result = await get(target, { access: "public" });
      if (result) return result;
    } catch {}
  }
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
    const result = await resolveBlob(raw);

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

    if (result.blob.size) {
      headers["Content-Length"] = result.blob.size.toString();
    }

    return new NextResponse(result.stream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET private blob error:", error);
    return new NextResponse("Error serving private blob", { status: 500 });
  }
}
