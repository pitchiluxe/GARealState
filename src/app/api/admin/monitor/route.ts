import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const OWNER_EMAIL = "erickomari243@gmail.com";
const ONLINE_MS   = 5 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - ONLINE_MS);

  const [users, presences, progress, certs, sessions] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, lastSeen: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userPresence.findMany({
      select: { userId: true, lastSeen: true, status: true },
    }),
    prisma.classroomProgress.groupBy({
      by: ["userId"],
      _count: { id: true },
      _sum: { xpEarned: true },
      where: { completed: true },
    }),
    prisma.classroomCertificate.groupBy({
      by: ["userId"],
      _count: { id: true },
    }),
    prisma.aISession.findMany({
      select: { studentId: true, createdAt: true, sessionType: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const presenceMap = new Map(presences.map(p => [p.userId, p]));
  const progressMap = new Map(progress.map(p => [p.userId, { modules: p._count.id, xp: p._sum.xpEarned || 0 }]));
  const certMap     = new Map(certs.map(c => [c.userId, c._count.id]));

  const enriched = users.map(u => ({
    ...u,
    isOnline:  (presenceMap.get(u.id)?.lastSeen ?? new Date(0)) >= since,
    lastSeen:  presenceMap.get(u.id)?.lastSeen ?? u.lastSeen,
    modules:   progressMap.get(u.id)?.modules ?? 0,
    xp:        progressMap.get(u.id)?.xp ?? 0,
    certs:     certMap.get(u.id) ?? 0,
  }));

  const onlineCount  = enriched.filter(u => u.isOnline).length;
  const totalXp      = enriched.reduce((s, u) => s + u.xp, 0);
  const totalModules = enriched.reduce((s, u) => s + u.modules, 0);
  const totalCerts   = enriched.reduce((s, u) => s + u.certs, 0);

  return NextResponse.json({
    success: true,
    data: {
      users: enriched,
      sessions,
      stats: {
        totalUsers:   users.length,
        activeUsers:  users.filter(u => u.isActive).length,
        onlineNow:    onlineCount,
        totalXp,
        totalModules,
        totalCerts,
        recentSessions: sessions.length,
      },
    },
  });
}
