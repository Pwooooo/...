import { NextRequest, NextResponse } from "next/server";
import {
  isTigrisConfigured,
  createTigrisPresignedUploadUrl,
  getVerifiedTigrisClient,
} from "@/lib/tigris";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const verified = await getVerifiedTigrisClient();
  let testError: string | null = null;
  let objectsCount = 0;

  if (verified) {
    try {
      const list = await verified.client.send(
        new ListObjectsV2Command({
          Bucket: verified.bucket,
          MaxKeys: 10,
        })
      );
      objectsCount = list.KeyCount || 0;
    } catch (err: any) {
      testError = err?.message || String(err);
    }
  }

  return NextResponse.json({
    success: true,
    configured: isTigrisConfigured(),
    verified: Boolean(verified && !testError),
    bucket: verified ? verified.bucket : null,
    endpoint: verified ? verified.endpoint : null,
    objectsCount,
    testError,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!isTigrisConfigured()) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error:
            "Tigris storage is not configured. Missing TIGRIS_ACCESS_KEY_ID or TIGRIS_SECRET_ACCESS_KEY.",
        },
        { status: 400 }
      );
    }

    const verified = await getVerifiedTigrisClient();
    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: "Could not connect to Tigris storage. Check bucket access and credentials.",
        },
        { status: 500 }
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

    const rawExt =
      filename.split(".").pop()?.toLowerCase() || (type === "thumbnail" ? "jpg" : "mp4");
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, "") || "mp4";
    const baseId = videoId || `v-${Date.now()}`;
    const folder = type === "thumbnail" ? "thumbnails" : "videos";
    const key = `${folder}/${baseId}.${cleanExt}`;

    const presigned = await createTigrisPresignedUploadUrl(key, contentType, 3600);

    if (!presigned) {
      return NextResponse.json(
        { success: false, error: "Could not generate presigned Tigris upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: true,
      provider: "tigris",
      uploadUrl: presigned.uploadUrl,
      fileUrl: presigned.fileUrl,
      key: presigned.key,
      bucket: presigned.bucket,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating presigned URL";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
