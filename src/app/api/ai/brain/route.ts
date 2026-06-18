import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat, extractJson } from "@/lib/ai/client";
import { prisma } from "@/lib/db";

const CATEGORY_MAP: Record<string, string[]> = {
  "License Law":  ["GREC Authority and Disciplinary Powers", "Georgia Salesperson License Requirements", "Broker License Requirements in Georgia", "License Renewal and CE Requirements", "License Law Violations and Penalties"],
  "Contracts":    ["Georgia Purchase and Sale Agreement (GAR Form F20)", "Listing Agreement Types: Exclusive Right vs. Open", "Contract Contingencies and Due Diligence", "Option Contracts and Right of First Refusal", "Contract Rescission and Breach Remedies"],
  "Agency":       ["Brokerage Relationships in Real Estate Transactions Act (BRRETA)", "LODCAR Fiduciary Duties", "Dual Agency vs. Designated Agency in Georgia", "Buyer Brokerage Agreements", "Agency Disclosure Requirements in Georgia"],
  "Fair Housing": ["Fair Housing Act: 7 Protected Classes", "Steering, Blockbusting, and Redlining", "Americans with Disabilities Act in Real Estate", "Fair Housing Advertising Rules", "Reasonable Accommodations vs. Modifications"],
  "Finance":      ["Loan-to-Value Ratio and PMI", "FHA vs. VA vs. Conventional Loans", "RESPA and TILA Requirements", "Adjustable Rate vs. Fixed Rate Mortgages", "Mortgage Qualification: DTI and Credit"],
  "Property":     ["Easements and Encumbrances", "Zoning and Land Use Regulations", "Property Deeds: Warranty vs. Quitclaim", "Types of Property Ownership in Georgia", "Liens: Voluntary vs. Involuntary"],
  "Valuation":    ["Sales Comparison Approach to Value", "Cost Approach: Replacement vs. Reproduction", "Income Approach: Cap Rate and NOI", "Gross Rent Multiplier Calculations", "Appraisal vs. CMA vs. BPO"],
  "Math":         ["Real Estate Math: Commission Calculations", "Real Estate Math: Proration Calculations", "Real Estate Math: Loan Amortization", "Real Estate Math: Property Tax Calculations", "Real Estate Math: Area and Acreage"],
  "Closing":      ["Georgia Closing Attorney Requirements", "Title Insurance: Owner vs. Lender Policies", "Property Taxes in Georgia", "HUD-1 vs. Closing Disclosure", "Georgia Transfer Tax and Recording Fees"],
};

const ALL_TOPICS = Object.values(CATEGORY_MAP).flat();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // ── Bulk mode (count=10-20) ───────────────────────────────────────────
    const count = Number(body.count);
    if (count >= 2) {
      return await generateBulk(session.user.id, body.category || null, Math.min(Math.max(count, 2), 20));
    }

    // ── Single note (legacy / custom topic) ──────────────────────────────
    const { topic: reqTopic, category = "General", random = false } = body;
    const pool = body.category && CATEGORY_MAP[body.category] ? CATEGORY_MAP[body.category] : ALL_TOPICS;
    const topic = random
      ? pool[Math.floor(Math.random() * pool.length)]
      : reqTopic;
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

    const existingNotes = await prisma.obsidianNote.findMany({
      select: { title: true }, orderBy: { updatedAt: "desc" }, take: 50,
    });
    const titlesHint = existingNotes.length
      ? `\n\nExisting notes to [[wiki-link]] where relevant:\n${existingNotes.map(n => `- ${n.title}`).join("\n")}`
      : "";

    const prompt = `Create a GA Real Estate exam study note about: "${topic}"${titlesHint}

Return ONLY valid JSON:
{
  "title": "Specific note title",
  "content": "400-600 words. ## headings, - bullets, **bold** key terms. Include definition, key numbers, GA-specific rules, exam traps. Use [[Exact Title]] to cross-link 2-5 related notes from the list above.",
  "tags": ["tag1","tag2","tag3","tag4"],
  "summary": "One sentence summary"
}`;

    const raw = await chat("You are a Georgia Real Estate exam prep expert. Return valid JSON only.", prompt, 1400);
    const data = JSON.parse(extractJson(raw));
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    const note = await prisma.obsidianNote.create({
      data: {
        title: data.title, content: data.content,
        folder: "AI Generated", category,
        tags: JSON.stringify(data.tags || []),
        wordCount: data.content.split(/\s+/).length,
        slug, aiSummary: data.summary, authorId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: { ...note, tags: data.tags || [], linkedNotes: [] } });
  } catch (err) {
    console.error("[brain-generate]", err);
    return NextResponse.json({ error: "Note generation failed" }, { status: 500 });
  }
}

async function generateBulk(userId: string, category: string | null, count: number) {
  // Pick topics: category-specific pool or shuffle all topics
  const pool = category && CATEGORY_MAP[category] ? CATEGORY_MAP[category] : ALL_TOPICS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Pick `count` distinct topics, cycling if pool is smaller than count
  const topics: string[] = [];
  for (let i = 0; i < count; i++) topics.push(shuffled[i % shuffled.length]);

  // Fetch existing note titles for wiki-linking
  const existingNotes = await prisma.obsidianNote.findMany({
    select: { title: true }, orderBy: { updatedAt: "desc" }, take: 50,
  });
  const existingTitles = existingNotes.map(n => n.title);
  const titlesHint = existingTitles.length
    ? `\n\nExisting notes to [[wiki-link]] where relevant:\n${existingTitles.map(t => `- ${t}`).join("\n")}`
    : "";

  const categoryLabel = category || "GA Real Estate";

  const prompt = `Generate ${count} distinct Georgia Real Estate exam study notes about these topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}${titlesHint}

Return ONLY a valid JSON array of exactly ${count} objects:
[
  {
    "title": "Specific note title",
    "content": "300-500 words. ## headings, - bullets, **bold** key terms. GA-specific rules, key numbers, exam traps. Use [[Exact Title]] to cross-link 2-4 related notes from the existing notes list above.",
    "tags": ["tag1","tag2","tag3"],
    "category": "${categoryLabel}",
    "summary": "One sentence summary"
  }
]

Rules:
- Each note covers a DISTINCT topic from the list — no duplicates
- Include real O.C.G.A. references, GREC rule numbers, or GAR form numbers where applicable
- Cross-link notes to EACH OTHER using [[title]] when topics are related
- Return exactly ${count} objects, no more, no less`;

  const raw = await chat(
    "You are a Georgia Real Estate exam prep expert. Return valid JSON arrays only.",
    prompt,
    4000
  );

  let notes: { title: string; content: string; tags: string[]; category: string; summary: string }[] = [];
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const start = cleaned.indexOf("["), end = cleaned.lastIndexOf("]");
    notes = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(notes)) throw new Error("not array");
  } catch {
    return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
  }

  const now = Date.now();
  const created = await Promise.all(
    notes.slice(0, count).map((n, i) => {
      const resolvedCategory = category || (n.category && n.category !== "GA Real Estate" ? n.category : "General");
      const slug = (n.title || "note").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${now}-${i}`;
      return prisma.obsidianNote.create({
        data: {
          title:     n.title || `Study Note ${i + 1}`,
          content:   n.content || "",
          folder:    "AI Generated",
          category:  resolvedCategory,
          tags:      JSON.stringify(Array.isArray(n.tags) ? n.tags : []),
          wordCount: (n.content || "").split(/\s+/).length,
          slug,
          aiSummary: n.summary || "",
          authorId:  userId,
        },
      });
    })
  );

  return NextResponse.json({
    success: true,
    created: created.length,
    titles: created.map(n => n.title),
  });
}
