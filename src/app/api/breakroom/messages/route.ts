import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "general";
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await prisma.breakroomMessage.findMany({
    where: { channel },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ success: true, data: messages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, channel } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const msg = await prisma.breakroomMessage.create({
    data: { userId: session.user.id, content: content.trim(), channel: channel || "general", msgType: "TEXT" },
    include: { user: { select: { id: true, name: true, image: true } }, reactions: true },
  });

  return NextResponse.json({ success: true, data: msg });
}
