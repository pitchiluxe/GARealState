import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, activeUsers, totalTests, totalSessions, totalKB] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.practiceTest.count(),
    prisma.aISession.count(),
    prisma.kBArticle.count({ where: { isPublished: true } }),
  ]);

  return NextResponse.json({ success: true, data: { totalUsers, activeUsers, totalTests, totalSessions, totalKB } });
}
