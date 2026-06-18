import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { studentId: session.user.id };
  if (status) where.status = status;
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.practiceTest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.practiceTest.count({ where }),
  ]);

  return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const test = await prisma.practiceTest.create({
      data: {
        testNumber: `PT-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`,
        studentId: session.user.id,
        status: "OPEN",
        priority: body.priority || "MEDIUM",
        category: body.category,
        subject: body.subject,
        description: body.description || "",
        difficulty: body.difficulty,
        examVersion: body.examVersion,
        passingScore: 70,
      },
    });
    return NextResponse.json({ success: true, data: test });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create practice test" }, { status: 500 });
  }
}
