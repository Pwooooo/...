import { NextRequest, NextResponse } from "next/server";
import { getTigrisClient } from "@/lib/tigris";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return new Response(null, { status: 400 });
  }

  const tigris = getTigrisClient();
  if (!tigris) {
    return new Response(null, { status: 503 });
  }

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
    });
    const headRes = await tigris.client.send(headCommand);

    return new Response(null, {
      status: 200,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": headRes.ContentLength?.toString() || "0",
        "Content-Type": headRes.ContentType || "video/mp4",
        "ETag": headRes.ETag || "",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return new Response("Missing 'key' parameter", { status: 400 });
  }

  const tigris = getTigrisClient();
  if (!tigris) {
    return new Response("Tigris storage is not configured", { status: 503 });
  }

  // If a public URL or CDN is configured, redirect directly
  if (tigris.publicUrl) {
    return NextResponse.redirect(`${tigris.publicUrl}/${key}`, 302);
  }

  try {
    const rangeHeader = req.headers.get("range");
    const command = new GetObjectCommand({
      Bucket: tigris.bucket,
      Key: key,
      Range: rangeHeader || undefined,
    });

    const response = await tigris.client.send(command);

    if (!response.Body) {
      return new Response("Object body is empty", { status: 404 });
    }

    const headers: Record<string, string> = {
      "Accept-Ranges": "bytes",
      "Content-Type": response.ContentType || "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    if (response.ContentLength) {
      headers["Content-Length"] = response.ContentLength.toString();
    }
    if (response.ContentRange) {
      headers["Content-Range"] = response.ContentRange;
    }
    if (response.ETag) {
      headers["ETag"] = response.ETag;
    }

    const webStream = response.Body.transformToWebStream();
    return new Response(webStream as unknown as BodyInit, {
      status: rangeHeader ? 206 : 200,
      headers,
    });
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404) {
      return new Response("Object not found in Tigris", { status: 404 });
    }
    return new Response("Error streaming from Tigris storage", { status: 500 });
  }
}
