import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rawNotes, storedLinks] = await Promise.all([
    prisma.obsidianNote.findMany({
      select: { id: true, title: true, category: true, tags: true, wordCount: true, content: true, slug: true },
    }),
    prisma.obsidianLink.findMany({ select: { sourceId: true, targetId: true } }),
  ]);

  const edgeSet = new Set<string>();
  const addEdge = (a: string, b: string) => {
    if (a === b) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    edgeSet.add(key);
  };

  // 1. Stored explicit links
  for (const l of storedLinks) addEdge(l.sourceId, l.targetId);

  // 2. Wiki-link syntax [[Note Title]] in content
  const noteByTitle = new Map(rawNotes.map(n => [n.title.toLowerCase(), n.id]));
  for (const note of rawNotes) {
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(note.content)) !== null) {
      const tid = noteByTitle.get(m[1].toLowerCase());
      if (tid && tid !== note.id) addEdge(note.id, tid);
    }
  }

  // 3. Auto-connect notes that share ≥1 tag (category + tags array)
  const parseTags = (raw: string): string[] => {
    try { return JSON.parse(raw); } catch { return []; }
  };
  const noteTagSets = rawNotes.map(n => ({
    id: n.id,
    category: n.category,
    tags: new Set([n.category.toLowerCase(), ...parseTags(n.tags).map((t: string) => t.toLowerCase())]),
  }));
  for (let i = 0; i < noteTagSets.length; i++) {
    for (let j = i + 1; j < noteTagSets.length; j++) {
      const a = noteTagSets[i], b = noteTagSets[j];
      // Same category always connects; otherwise need ≥1 shared tag
      if (a.category === b.category) { addEdge(a.id, b.id); continue; }
      let shared = false;
      a.tags.forEach(t => { if (b.tags.has(t)) shared = true; });
      if (shared) addEdge(a.id, b.id);
    }
  }

  // Build final edge list and compute per-node link counts
  const edges = Array.from(edgeSet).map(key => {
    const [sourceId, targetId] = key.split("|");
    return { sourceId, targetId };
  });

  const linkCount = new Map<string, number>();
  const backlinkCount = new Map<string, number>();
  for (const { sourceId, targetId } of edges) {
    linkCount.set(sourceId, (linkCount.get(sourceId) ?? 0) + 1);
    backlinkCount.set(targetId, (backlinkCount.get(targetId) ?? 0) + 1);
  }

  const nodes = rawNotes.map(n => ({
    id: n.id,
    title: n.title,
    category: n.category,
    wordCount: n.wordCount,
    linkCount: linkCount.get(n.id) ?? 0,
    backlinkCount: backlinkCount.get(n.id) ?? 0,
  }));

  return NextResponse.json({ success: true, data: { nodes, links: edges } });
}
