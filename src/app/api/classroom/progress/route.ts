import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COURSES } from "@/lib/classroom";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [progress, certs, badges] = await Promise.all([
    prisma.classroomProgress.findMany({ where: { userId: session.user.id } }),
    prisma.classroomCertificate.findMany({ where: { userId: session.user.id } }),
    prisma.classroomBadge.findMany({ where: { userId: session.user.id } }),
  ]);

  const totalXp = progress.reduce((acc, p) => acc + p.xpEarned, 0);
  const completedModules = progress.filter((p) => p.completed).length;
  const totalModules = COURSES.reduce((acc, c) => acc + c.totalModules, 0);

  return NextResponse.json({ success: true, data: { progress, certs, badges, totalXp, completedModules, totalModules } });
}
