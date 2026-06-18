import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COURSES } from "@/lib/classroom";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, moduleId } = await req.json();
  if (!courseId || !moduleId) {
    return NextResponse.json({ error: "courseId and moduleId required" }, { status: 400 });
  }

  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const module = course.modules.find((m) => m.id === moduleId);
  const xpEarned = module ? Math.round(module.estimatedMinutes * 1.5) : 50;

  const cp = await prisma.classroomProgress.upsert({
    where: { userId_courseId_moduleId: { userId: session.user.id, courseId, moduleId } },
    update: { completed: true, xpEarned, completedAt: new Date() },
    create: {
      user: { connect: { id: session.user.id } },
      courseId,
      moduleId,
      completed: true,
      xpEarned,
      completedAt: new Date(),
    },
  });

  // Award XP token
  await prisma.tokenTransaction.create({
    data: {
      userId: session.user.id,
      amount: xpEarned,
      type: "EARN",
      description: `Completed module: ${module?.title || moduleId}`,
    },
  });

  // Check if entire course completed
  const completedCount = await prisma.classroomProgress.count({
    where: { userId: session.user.id, courseId, completed: true },
  });

  let cert = null;
  if (completedCount >= course.modules.length && course.certifiable) {
    cert = await prisma.classroomCertificate.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: {},
      create: {
        user: { connect: { id: session.user.id } },
        courseId,
        courseName: course.title,
      },
    });

    if (course.badgeId) {
      await prisma.classroomBadge.upsert({
        where: { userId_badgeId: { userId: session.user.id, badgeId: course.badgeId } },
        update: {},
        create: {
          user: { connect: { id: session.user.id } },
          badgeId: course.badgeId,
        },
      });
    }
  }

  return NextResponse.json({ success: true, data: { progress: cp, cert, xpEarned } });
}
