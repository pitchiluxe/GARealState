import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chat } from "@/lib/ai/client";
import { v4 as uuidv4 } from "uuid";

const VALID_CATEGORIES = ["LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH","OTHER"];
const VALID_DIFFICULTIES = ["BEGINNER","INTERMEDIATE","ADVANCED"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count = 10 } = await req.json().catch(() => ({}));
  const testCount = Math.min(Math.max(Number(count) || 10, 5), 20);

  const system = `You are a Georgia real estate exam coach. Generate practice test session records for a student studying for the Georgia PSI real estate licensing exam. Return only valid JSON arrays.`;

  const userMessage = `Generate ${testCount} practice test session records for a GA real estate student. Each record represents one focused practice test session covering a specific exam topic.

Return ONLY a JSON array:
[
  {
    "subject": "Specific topic title (e.g. 'GREC License Renewal Requirements')",
    "category": "LICENSE_LAW" | "CONTRACTS" | "AGENCY" | "FINANCE" | "PROPERTY" | "VALUATION" | "FAIR_HOUSING" | "CLOSING" | "MATH",
    "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    "description": "2-3 sentence description of what this practice test covers and why it matters for the GA exam",
    "notes": "One exam tip or key fact to remember for this topic"
  }
]

Requirements:
- Cover a wide variety of specific GA real estate topics — not generic titles
- Mix difficulty levels: about 30% beginner, 50% intermediate, 20% advanced
- Use real Georgia-specific content: BRRETA, GREC, GAR forms, PSI exam topics, O.C.G.A. references
- Each subject must be a distinct, specific subtopic (not just "License Law")
- Return exactly ${testCount} records`;

  const raw = await chat(system, userMessage, 3000);

  let records: { subject: string; category: string; difficulty: string; description: string; notes: string }[] = [];
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    records = parsed.filter((r: { subject: string; category: string; difficulty: string }) =>
      r.subject && VALID_CATEGORIES.includes(r.category) && VALID_DIFFICULTIES.includes(r.difficulty)
    );
  } catch {
    return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
  }

  const created = await Promise.all(
    records.map(r =>
      prisma.practiceTest.create({
        data: {
          testNumber: `AI-${Date.now()}-${uuidv4().slice(0, 5).toUpperCase()}`,
          studentId: session.user.id,
          status: "OPEN",
          priority: "MEDIUM",
          category: r.category,
          subject: r.subject,
          description: r.description || "",
          notes: r.notes || "",
          difficulty: r.difficulty,
          passingScore: 70,
        },
      })
    )
  );

  return NextResponse.json({ success: true, created: created.length, data: created });
}
