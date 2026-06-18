import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await prisma.classroomProgress.groupBy({
    by: ["userId"],
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: "desc" } },
    take: 20,
  });

  const userIds = progress.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true, role: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const leaderboard = progress.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: userMap.get(p.userId)?.name || "Student",
    image: userMap.get(p.userId)?.image,
    totalXp: p._sum.xpEarned || 0,
    isCurrentUser: p.userId === session.user.id,
  }));

  return NextResponse.json({ success: true, data: leaderboard });
}
