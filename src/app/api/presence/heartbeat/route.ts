import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.userPresence.upsert({
    where: { userId: session.user.id },
    update: { lastSeen: new Date(), status: "online" },
    create: { userId: session.user.id, status: "online" },
  });

  return NextResponse.json({ ok: true });
}
