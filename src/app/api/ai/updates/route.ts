import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/ai/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, count = 6 } = await req.json().catch(() => ({}));
  const genCount = Math.min(Math.max(Number(count) || 6, 3), 12);

  const topicFilter = topic && topic !== "ALL"
    ? `Focus on this topic area: ${topic}.`
    : "Cover a mix of: License Law, Contracts, Agency, Fair Housing, Finance, Property, Closing.";

  const system = `You are a Georgia real estate law expert generating study content about GA real estate regulatory updates for the PSI licensing exam. Return only valid JSON arrays.`;

  const userMessage = `Generate ${genCount} Georgia real estate law update cards for exam study. ${topicFilter}

These represent real-type regulatory changes, GREC bulletins, GAR form updates, or legal changes that GA real estate students need to know for their PSI exam.

Return ONLY a JSON array:
[
  {
    "title": "Specific update title",
    "summary": "2-3 sentence summary of what changed and why it matters",
    "details": "Full 4-6 sentence explanation with specific numbers, dates, requirements, and practical implications for licensees",
    "examTip": "One specific sentence about how this topic appears on the PSI exam or what to remember for the test",
    "category": "License Law" | "Contracts" | "Agency" | "Fair Housing" | "Finance" | "Property" | "Closing" | "Ethics",
    "impact": "HIGH" | "MEDIUM" | "LOW",
    "source": "GREC" | "Georgia Legislature" | "GAR" | "HUD" | "CFPB" | "Federal Law",
    "year": "2023" | "2024" | "2025"
  }
]

Requirements:
- Use real Georgia law references (O.C.G.A., GREC Rule numbers, GAR form numbers)
- Make examTip specific and actionable for the PSI exam
- Vary impact levels and years
- Each update must be about a distinct specific change`;

  const raw = await chat(system, userMessage, 3000);

  let updates: object[] = [];
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    updates = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return NextResponse.json({ error: "AI returned invalid data. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, updates });
}
