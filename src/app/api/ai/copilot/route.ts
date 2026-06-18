import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCopilotResponse } from "@/lib/ai/client";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`copilot:${session.user.id}`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  try {
    const body = await req.json();
    const { modelOverride, ...input } = body;

    const start = Date.now();
    const response = await getCopilotResponse(input, modelOverride);
    const latencyMs = Date.now() - start;

    await prisma.aISession.create({
      data: {
        studentId: session.user.id,
        sessionType: "COPILOT",
        issueInput: JSON.stringify(input),
        aiResponse: JSON.stringify(response),
        latencyMs,
        modelVersion: modelOverride || process.env.ANTHROPIC_MODEL || "deepseek/deepseek-v4-flash:free",
      },
    });

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
