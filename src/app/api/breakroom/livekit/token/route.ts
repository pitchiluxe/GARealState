import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room } = await req.json();
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit not configured" }, { status: 503 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: session.user.name || "Student",
  });
  at.addGrant({ roomJoin: true, room: room || "study-lounge", canPublish: true, canSubscribe: true });

  return NextResponse.json({ success: true, data: { token: await at.toJwt() } });
}
