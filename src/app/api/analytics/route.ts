import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const todayStart = startOfDay(new Date());

  const [totalTests, completedTests, passedTests, aiSessionsToday, totalAiSessions, recentSessions, trainingSessions, allTests] = await Promise.all([
    prisma.practiceTest.count({ where: { studentId: userId } }),
    prisma.practiceTest.count({ where: { studentId: userId, status: "COMPLETED" } }),
    prisma.practiceTest.count({ where: { studentId: userId, status: "COMPLETED", score: { gte: 70 } } }),
    prisma.aISession.count({ where: { studentId: userId, createdAt: { gte: todayStart } } }),
    prisma.aISession.count({ where: { studentId: userId } }),
    prisma.aISession.findMany({ where: { studentId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.trainingSession.findMany({ where: { studentId: userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 5 }),
    prisma.practiceTest.findMany({ where: { studentId: userId, status: "COMPLETED", score: { not: null } } }),
  ]);

  const avgScore = allTests.length > 0
    ? Math.round(allTests.reduce((acc, t) => acc + (t.score || 0), 0) / allTests.length)
    : 0;

  // Category breakdown
  const categoryMap: Record<string, { total: number; sum: number }> = {};
  for (const t of allTests) {
    if (!categoryMap[t.category]) categoryMap[t.category] = { total: 0, sum: 0 };
    categoryMap[t.category].total++;
    categoryMap[t.category].sum += t.score || 0;
  }
  const categoryBreakdown = Object.entries(categoryMap).map(([category, { total, sum }]) => ({
    category,
    avg: Math.round(sum / total),
    count: total,
  }));

  // Score trend (last 7 days)
  const scoreTrend = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayTests = allTests.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= startOfDay(day) && d < startOfDay(subDays(day, -1));
    });
    scoreTrend.push({
      date: format(day, "MM/dd"),
      score: dayTests.length > 0 ? Math.round(dayTests.reduce((a, t) => a + (t.score || 0), 0) / dayTests.length) : 0,
      tests: dayTests.length,
    });
  }

  // Top categories by test count
  const topCategories = categoryBreakdown
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({ category: c.category, count: c.count }));

  return NextResponse.json({
    success: true,
    data: {
      totalTests, completedTests, passedTests, avgScore,
      aiSessionsToday, totalAiSessions,
      totalTrainingSessions: trainingSessions.length,
      recentAiSessions: recentSessions,
      recentTrainingSessions: trainingSessions,
      topCategories, scoreTrend, categoryBreakdown,
    },
  });
}
