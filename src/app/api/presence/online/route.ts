import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ count: 0 }, { status: 401 });

  const since = new Date(Date.now() - ONLINE_THRESHOLD_MS);
  const count = await prisma.userPresence.count({
    where: { lastSeen: { gte: since } },
  });

  return NextResponse.json({ count });
}
