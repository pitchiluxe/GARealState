import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (category && category !== "ALL") where.category = category;

  let notes = await prisma.obsidianNote.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { outgoingLinks: { select: { targetId: true } } },
  });

  if (search) {
    const q = search.toLowerCase();
    notes = notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  const parsed = notes.map(n => ({
    ...n,
    tags: (() => { try { return JSON.parse(n.tags); } catch { return []; } })(),
    linkedNotes: n.outgoingLinks.map(l => l.targetId),
    outgoingLinks: undefined,
  }));

  return NextResponse.json({ success: true, data: parsed });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, folder, category, tags } = await req.json();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

  const note = await prisma.obsidianNote.create({
    data: {
      title, content, folder: folder || "GA Real Estate", category: category || "General",
      tags: tags ? JSON.stringify(tags) : "[]",
      wordCount: content.split(/\s+/).length,
      slug,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: note });
}
