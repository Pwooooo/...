import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function HEAD(request: NextRequest): Promise<NextResponse> {
  const pathname =
    request.nextUrl.searchParams.get("pathname") ||
    request.nextUrl.searchParams.get("url");

  if (!pathname) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
    });

    if (result === null) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": result.blob.size ? result.blob.size.toString() : "0",
        "Content-Type": result.blob.contentType || "video/mp4",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("HEAD private blob error:", error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathname =
    request.nextUrl.searchParams.get("pathname") ||
    request.nextUrl.searchParams.get("url");

  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
    });

    if (result === null) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304 });
    }

    const headers: Record<string, string> = {
      "Cache-Control": "private, no-cache",
      "Content-Type": result.blob.contentType || "application/octet-stream",
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
