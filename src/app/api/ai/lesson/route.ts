import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat, extractJson } from "@/lib/ai/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { moduleId, moduleName, courseTitle, category } = await req.json();
    if (!moduleName) return NextResponse.json({ error: "moduleName required" }, { status: 400 });

    const prompt = `You are a Georgia Real Estate exam instructor. Create a focused study lesson.

Topic: "${moduleName}"
Course: "${courseTitle}"
Category: ${category}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "overview": "2-3 sentence intro explaining why this topic is critical for the GA RE exam",
  "keyPoints": ["key fact 1", "key fact 2", "key fact 3", "key fact 4", "key fact 5"],
  "lesson": "Comprehensive lesson content (400-600 words). Include specific Georgia laws, GREC rules, numbers, timelines, and exam-tested details. Use clear paragraph breaks.",
  "examTips": ["Specific exam tip 1", "Specific exam tip 2", "Specific exam tip 3"],
  "mnemonic": "A helpful mnemonic or memory device, or null if none applies",
  "practiceQuestion": {
    "question": "A realistic GA RE exam-style question about this topic",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": "Why this answer is correct and why each wrong answer is wrong"
  }
}`;

    const system = "You are a Georgia Real Estate licensing exam instructor for GA Real Estate Academy. Never mention 'Aceable' or any competitor platform. Return valid JSON only — no markdown, no commentary.";
    const raw = await chat(system, prompt, 1400);
    const data = JSON.parse(extractJson(raw));

    return NextResponse.json({ success: true, data: { moduleId, ...data } });
  } catch (err) {
    console.error("[lesson]", err);
    return NextResponse.json({ error: "Lesson generation failed" }, { status: 500 });
  }
}
