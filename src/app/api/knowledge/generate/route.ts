import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat } from "@/lib/ai/client";

const CATEGORIES = [
  "LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY",
  "VALUATION","FAIR_HOUSING","CLOSING","MATH",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, count = 10 } = await req.json().catch(() => ({}));
  const targetCategory = CATEGORIES.includes(category) ? category : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const articleCount = Math.min(Math.max(Number(count) || 10, 5), 20);

  const categoryLabels: Record<string, string> = {
    LICENSE_LAW: "Georgia Real Estate License Law & GREC Regulations",
    CONTRACTS: "Real Estate Contracts & Agreements",
    AGENCY: "Agency Relationships & Brokerage",
    FINANCE: "Real Estate Finance & Mortgages",
    PROPERTY: "Property Ownership, Rights & Land",
    VALUATION: "Property Valuation & Appraisal",
    FAIR_HOUSING: "Fair Housing Laws & Protected Classes",
    CLOSING: "Closing Process & Settlement",
    MATH: "Real Estate Mathematics & Calculations",
  };

  const system = `You are a Georgia real estate exam study material expert. Generate detailed, exam-focused study articles for students preparing for the Georgia PSI real estate exam. Always return valid JSON arrays only — no markdown, no explanation outside the JSON.`;

  const userMessage = `Generate ${articleCount} detailed study articles about "${categoryLabels[targetCategory]}".

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Article title",
    "summary": "One sentence describing what this article covers",
    "content": "Full multi-paragraph study content with headers, bullet points, key numbers, and exam tips. At least 300 words.",
    "tags": ["tag1", "tag2", "tag3"],
    "difficulty": "BEGINNER" or "INTERMEDIATE" or "ADVANCED"
  }
]

Requirements:
- Each article covers a distinct subtopic within ${categoryLabels[targetCategory]}
- Include actual Georgia-specific laws, codes, time limits, dollar amounts
- Add "Exam Tip:" sections with common PSI question patterns
- Use headers and bullet points for easy studying`;

  const raw = await chat(system, userMessage, 4096);

  let articles: { title: string; summary: string; content: string; tags: string[]; difficulty: string }[] = [];
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    articles = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
  }

  const created: string[] = [];
  for (const art of articles) {
    if (!art.title || !art.content) continue;
    const slug = `ai-${targetCategory.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      await prisma.kBArticle.create({
        data: {
          slug,
          title: art.title,
          summary: art.summary || art.title,
          content: art.content,
          category: targetCategory,
          tags: JSON.stringify(Array.isArray(art.tags) ? art.tags : []),
          difficulty: ["BEGINNER","INTERMEDIATE","ADVANCED"].includes(art.difficulty) ? art.difficulty : "INTERMEDIATE",
          product: "ALL",
          isPublished: true,
          authorId: session.user.id,
        },
      });
      created.push(art.title);
    } catch { /* skip duplicates */ }
  }

  return NextResponse.json({ success: true, created: created.length, titles: created });
}
