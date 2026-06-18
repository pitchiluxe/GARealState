import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const difficulty = searchParams.get("difficulty");

  const where: Record<string, unknown> = { isPublished: true };
  if (category && category !== "ALL") where.category = category;
  if (difficulty) where.difficulty = difficulty;

  let articles = await prisma.kBArticle.findMany({
    where,
    orderBy: { views: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize * 2,
  });

  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.toLowerCase().includes(q)
    );
  }

  const paged = articles.slice(0, pageSize).map(a => ({
    ...a,
    tags: typeof a.tags === "string" ? (() => { try { return JSON.parse(a.tags); } catch { return []; } })() : a.tags,
    body: a.content,
    helpfulVotes: a.helpful,
  }));
  const total = await prisma.kBArticle.count({ where });

  return NextResponse.json({ success: true, data: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
