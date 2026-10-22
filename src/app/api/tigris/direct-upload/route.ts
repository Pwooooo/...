import { NextRequest, NextResponse } from "next/server";
import { isTigrisConfigured, uploadBufferToTigris, getVerifiedTigrisClient } from "@/lib/tigris";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isTigrisConfigured()) {
      return NextResponse.json(
        { success: false, error: "Tigris storage is not configured" },
        { status: 400 }
      );
    }

    const verified = await getVerifiedTigrisClient();
    if (!verified) {
      return NextResponse.json(
        { success: false, error: "Could not connect to Tigris storage bucket" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "video";
    const videoId = (formData.get("videoId") as string) || `v-${Date.now()}`;

    if (!file) {
      return NextResponse.json({ success: false, error: "File required" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || (type === "thumbnail" ? "jpg" : "mp4");
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, "") || "mp4";
    const folder = type === "thumbnail" ? "thumbnails" : "videos";
    const key = `${folder}/${videoId}.${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadBufferToTigris(
      buffer,
      key,
      file.type || (type === "thumbnail" ? "image/jpeg" : "video/mp4")
    );

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "Failed to upload buffer to Tigris" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      key,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error uploading file";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
