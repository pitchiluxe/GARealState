import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = await prisma.practiceTest.findFirst({
    where: { id: params.id, studentId: session.user.id },
    include: {
      activities: { orderBy: { createdAt: "asc" } },
      tags: true,
    },
  });

  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: test });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const test = await prisma.practiceTest.findFirst({ where: { id: params.id, studentId: session.user.id } });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.addTag) {
    await prisma.practiceTag.upsert({
      where: { testId_tag: { testId: params.id, tag: body.addTag.trim() } },
      create: { testId: params.id, tag: body.addTag.trim() },
      update: {},
    });
    const updated = await prisma.practiceTest.findFirst({ where: { id: params.id }, include: { tags: true, activities: true } });
    return NextResponse.json({ success: true, data: updated });
  }

  if (body.removeTag) {
    await prisma.practiceTag.deleteMany({ where: { testId: params.id, tag: body.removeTag } });
    const updated = await prisma.practiceTest.findFirst({ where: { id: params.id }, include: { tags: true, activities: true } });
    return NextResponse.json({ success: true, data: updated });
  }

  const updated = await prisma.practiceTest.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.score !== undefined && { score: Number(body.score) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.resolution !== undefined && { resolution: body.resolution }),
      updatedAt: new Date(),
    },
    include: { tags: true, activities: true },
  });

  if (body.status) {
    await prisma.practiceActivity.create({
      data: { testId: params.id, type: "STATUS_CHANGE", content: `Status updated to ${body.status}` },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}
