import { NextRequest, NextResponse } from "next/server";
import { isR2Configured, createR2PresignedUploadUrl, getR2Config } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getR2Config();
  return NextResponse.json({
    success: true,
    configured: Boolean(config),
    bucket: config ? config.bucket : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, configured: false, error: "Cloudflare R2 is not configured" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { filename, contentType, type, videoId } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { success: false, error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const rawExt = filename.split(".").pop()?.toLowerCase() || (type === "thumbnail" ? "jpg" : "mp4");
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, "") || "mp4";
    const baseId = videoId || `v-${Date.now()}`;
    const folder = type === "thumbnail" ? "thumbnails" : "videos";
    const key = `${folder}/${baseId}.${cleanExt}`;

    const presigned = await createR2PresignedUploadUrl(key, contentType, 3600);

    if (!presigned) {
      return NextResponse.json(
        { success: false, error: "Could not generate presigned upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: true,
      uploadUrl: presigned.uploadUrl,
      fileUrl: presigned.fileUrl,
      key: presigned.key,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating presigned URL";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
