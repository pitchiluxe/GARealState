import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat, extractJson } from "@/lib/ai/client";

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "all major topics (License Law, Contracts, Agency Law, Finance, Fair Housing, Property Valuation, Real Estate Math)",
  LICENSE_LAW: "Georgia license law, GREC requirements, license types, renewal, disciplinary actions",
  CONTRACTS: "Georgia real estate contracts, Purchase and Sale Agreement, GAR forms, contingencies",
  AGENCY: "Georgia agency law, BRRETA, fiduciary duties (LODCAR), dual agency, designated agency",
  FINANCE: "real estate finance, mortgage types, LTV, DTI, RESPA, TILA, amortization math",
  FAIR_HOUSING: "fair housing laws, protected classes, prohibited conduct, steering, redlining",
  VALUATION: "property appraisal, three approaches to value, CMA, depreciation, cap rate",
  MATH: "real estate math: commission, prorations, area calculations, mortgage payments, tax rates",
  CLOSING: "Georgia real estate closing process, title, attorney requirements, prorations, HUD-1",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category = "ALL", count = 10, difficulty = "INTERMEDIATE" } = await req.json();
    const topicDesc = CATEGORY_LABELS[category] || CATEGORY_LABELS.ALL;

    const prompt = `Generate ${count} Georgia Real Estate licensing exam multiple-choice questions.

Topic area: ${topicDesc}
Difficulty: ${difficulty}
Style: Official state exam style — realistic, unambiguous, one clearly correct answer per question.
Georgia-specific: Include GREC rules, Georgia law specifics, and GAR form details where applicable.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Complete question text ending with a question mark",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correct": 0,
      "explanation": "Clear explanation: why this answer is correct and key rule/fact to remember",
      "category": "${category === "ALL" ? "varies" : category}",
      "difficulty": "${difficulty}"
    }
  ]
}`;

    const system = "You are a certified Georgia Real Estate exam question writer for GA Real Estate Academy. Never mention 'Aceable' or any competitor platform. Return valid JSON only.";
    const raw = await chat(system, prompt, 2400);
    const data = JSON.parse(extractJson(raw));

    if (!data.questions?.length) throw new Error("No questions returned");

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[exam-generate]", err);
    return NextResponse.json({ error: "Question generation failed" }, { status: 500 });
  }
}
