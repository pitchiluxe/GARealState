import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notes, links] = await Promise.all([
    prisma.obsidianNote.findMany({ select: { id: true, title: true, category: true, tags: true, wordCount: true } }),
    prisma.obsidianLink.findMany({ select: { sourceId: true, targetId: true } }),
  ]);

  // Build wiki-links from content patterns
  const allNotes = await prisma.obsidianNote.findMany({ select: { id: true, title: true, slug: true, content: true } });
  const noteByTitle = new Map(allNotes.map((n) => [n.title.toLowerCase(), n.id]));
  const extraLinks: { sourceId: string; targetId: string }[] = [];

  for (const note of allNotes) {
    const wikiLinkRe = /\[\[([^\]]+)\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = wikiLinkRe.exec(note.content)) !== null) {
      const targetTitle = match[1].toLowerCase();
      const targetId = noteByTitle.get(targetTitle);
      if (targetId && targetId !== note.id) {
        extraLinks.push({ sourceId: note.id, targetId });
      }
    }
  }

  return NextResponse.json({ success: true, data: { nodes: notes, links: [...links, ...extraLinks] } });
}
