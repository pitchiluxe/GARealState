import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/ai/client";

const CATEGORIES = ["LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH"];
const DIFFICULTIES = ["BEGINNER","INTERMEDIATE","ADVANCED"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, count = 10 } = await req.json().catch(() => ({}));
  const targetCategory = CATEGORIES.includes(category) ? category : null;
  const scenarioCount = Math.min(Math.max(Number(count) || 10, 5), 20);

  const categoryFilter = targetCategory
    ? `Focus on the topic: ${targetCategory.replace("_", " ")}.`
    : "Mix topics across: License Law, Contracts, Agency, Finance, Fair Housing, Valuation, Math, Closing.";

  const system = `You are a Georgia real estate exam trainer creating scenario-based practice simulations. Return only valid JSON arrays.`;

  const userMessage = `Generate ${scenarioCount} unique scenario cards for Georgia real estate exam practice. ${categoryFilter}

Each scenario is an interactive role-play simulation the student will work through with an AI examiner.

Return ONLY a JSON array:
[
  {
    "id": "unique_snake_case_id",
    "name": "Short scenario title (3-6 words)",
    "category": "LICENSE_LAW" | "CONTRACTS" | "AGENCY" | "FINANCE" | "PROPERTY" | "VALUATION" | "FAIR_HOUSING" | "CLOSING" | "MATH",
    "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    "desc": "One sentence describing what the student will practice in this scenario"
  }
]

Requirements:
- Each scenario must be distinct with a real-world GA real estate situation
- Vary difficulty levels across the set
- desc must describe an action the student will perform (e.g. "Navigate...", "Handle...", "Calculate...", "Explain...")
- id must be lowercase with underscores, unique`;

  const raw = await chat(system, userMessage, 2048);

  let scenarios: { id: string; name: string; category: string; difficulty: string; desc: string }[] = [];
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    scenarios = parsed.filter((s: { id: string; name: string; category: string; difficulty: string; desc: string }) =>
      s.id && s.name && CATEGORIES.includes(s.category) && DIFFICULTIES.includes(s.difficulty)
    );
  } catch {
    return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, scenarios });
}
