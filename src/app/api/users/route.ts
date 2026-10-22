import { NextRequest, NextResponse } from "next/server";
import { getKvUserByHandle, saveKvUser, getAllKvUsers, UserRecord } from "@/lib/kv-users";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (handle) {
      const user = await getKvUserByHandle(handle);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, user });
    }

    const users = await getAllKvUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching users";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, handle, email, bio, country, avatarUrl } = body;

    if (!handle) {
      return NextResponse.json({ success: false, error: "Handle is required" }, { status: 400 });
    }

    const cleanHandle = handle.replace(/^%40|^@/, "").trim().toLowerCase();
    const userToSave: UserRecord = {
      id: id || `u-${Date.now()}`,
      name: name || cleanHandle,
      email,
      handle: cleanHandle,
      bio,
      country,
      avatarUrl,
      joinedAt: body.joinedAt || "Joined recently",
    };

    await saveKvUser(userToSave);

    return NextResponse.json({ success: true, user: userToSave });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
