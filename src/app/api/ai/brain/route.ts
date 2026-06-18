import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat, extractJson } from "@/lib/ai/client";
import { prisma } from "@/lib/db";

const GA_RE_TOPICS = [
  "GREC Authority and Disciplinary Powers",
  "Georgia Salesperson License Requirements",
  "Broker License Requirements in Georgia",
  "License Renewal and CE Requirements",
  "Brokerage Relationships in Real Estate Transactions Act (BRRETA)",
  "LODCAR Fiduciary Duties",
  "Dual Agency vs. Designated Agency in Georgia",
  "Georgia Purchase and Sale Agreement (GAR Form F20)",
  "Listing Agreement Types: Exclusive Right vs. Open",
  "Contract Contingencies and Due Diligence",
  "Fair Housing Act: 7 Protected Classes",
  "Steering, Blockbusting, and Redlining",
  "Loan-to-Value Ratio and PMI",
  "FHA vs. VA vs. Conventional Loans",
  "RESPA and TILA Requirements",
  "Sales Comparison Approach to Value",
  "Cost Approach: Replacement vs. Reproduction",
  "Income Approach: Cap Rate and NOI",
  "Real Estate Math: Commission Calculations",
  "Real Estate Math: Proration Calculations",
  "Georgia Closing Attorney Requirements",
  "Title Insurance: Owner vs. Lender Policies",
  "Property Taxes in Georgia",
  "Easements and Encumbrances",
  "Zoning and Land Use Regulations",
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic: reqTopic, category = "General", random = false } = await req.json();
    const topic = random ? GA_RE_TOPICS[Math.floor(Math.random() * GA_RE_TOPICS.length)] : reqTopic;
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

    // Fetch existing note titles so AI can cross-link with [[wiki-link]] syntax
    const existingNotes = await prisma.obsidianNote.findMany({
      select: { title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    const existingTitles = existingNotes.map(n => n.title);
    const titlesHint = existingTitles.length
      ? `\n\nExisting notes you MUST link to with [[Note Title]] syntax where relevant:\n${existingTitles.map(t => `- ${t}`).join("\n")}`
      : "";

    const prompt = `Create a comprehensive Georgia Real Estate exam study note about: "${topic}"

Write content that a student can use to master this topic for the GREC state licensing exam.${titlesHint}

Return ONLY valid JSON:
{
  "title": "Clear, specific note title",
  "content": "Study note content (400-600 words). Use ## for headings, - for bullets, **bold** for key terms. Include definition, key rules/numbers, Georgia-specific details, exam traps, examples. IMPORTANT: use [[Exact Note Title]] syntax to reference 2-5 related notes from the list above — embed them naturally in sentences (e.g. 'see also [[BRRETA]]).",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "summary": "One sentence: what this note teaches"
}`;

    const system = "You are a Georgia Real Estate exam prep expert. Return valid JSON only.";
    const raw = await chat(system, prompt, 1400);
    const data = JSON.parse(extractJson(raw));

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    const note = await prisma.obsidianNote.create({
      data: {
        title: data.title,
        content: data.content,
        folder: "AI Generated",
        category,
        tags: JSON.stringify(data.tags || []),
        wordCount: data.content.split(/\s+/).length,
        slug,
        aiSummary: data.summary,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...note, tags: data.tags || [], linkedNotes: [] },
    });
  } catch (err) {
    console.error("[brain-generate]", err);
    return NextResponse.json({ error: "Note generation failed" }, { status: 500 });
  }
}
