import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatWithHistory, scoreTrainingSession } from "@/lib/ai/client";
import { TRAINING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { prisma } from "@/lib/db";

const SCENARIO_PROMPTS: Record<string, { examinerPersona: string; initialMessage: string; objectives: string[] }> = {
  salesperson_law: {
    examinerPersona: "A GREC licensing examiner testing knowledge of Georgia salesperson requirements",
    initialMessage: "Hello, I'll be testing your knowledge of Georgia salesperson license requirements today. To start: What are the basic eligibility requirements to obtain a Georgia salesperson license?",
    objectives: ["State minimum age and education requirements", "Explain the 75-hour pre-license course requirement", "Describe the affiliate broker relationship", "Know the exam and application process"],
  },
  contracts_psa: {
    examinerPersona: "A real estate attorney reviewing your understanding of the GAR Purchase and Sale Agreement",
    initialMessage: "Today we're covering the Georgia Purchase and Sale Agreement. Walk me through what happens from the time a buyer makes an offer to when it becomes a binding agreement.",
    objectives: ["Explain offer and counteroffer process", "Define binding agreement date", "Describe due diligence period", "Cover financing contingency basics"],
  },
  agency_duties: {
    examinerPersona: "A GREC compliance officer testing agency disclosure knowledge",
    initialMessage: "Let's discuss agency relationships in Georgia. Under BRRETA, what is the default relationship between a broker and a customer who has not signed a brokerage engagement agreement?",
    objectives: ["Explain BRRETA default transaction brokerage", "Define client vs. customer distinction", "List fiduciary duties (LODCAR)", "Describe dual and designated agency"],
  },
  finance_mortgage: {
    examinerPersona: "A mortgage licensing examiner testing real estate finance knowledge",
    initialMessage: "We'll be covering real estate finance concepts today. A buyer wants to purchase a $300,000 home with 20% down. What is the loan amount and LTV ratio, and why does that LTV matter to lenders?",
    objectives: ["Calculate LTV ratio correctly", "Explain PMI and the 80% threshold", "Describe DTI ratio", "Differentiate conventional, FHA, and VA loan types"],
  },
  fair_housing_case: {
    examinerPersona: "A HUD compliance examiner presenting fair housing scenarios",
    initialMessage: "Here is a scenario: A buyer asks you to only show them homes in neighborhoods where people 'look like them.' How do you respond, and what laws apply to this situation?",
    objectives: ["Identify steering as a prohibited act", "Name the 7 protected classes under the Fair Housing Act", "Explain the correct agent response", "Know HUD complaint procedures"],
  },
  valuation_cma: {
    examinerPersona: "A supervising appraiser examining your valuation knowledge",
    initialMessage: "A seller asks you to provide a pricing opinion for their 3BR/2BA ranch home. Walk me through how you would approach a Comparative Market Analysis and what factors influence your final price recommendation.",
    objectives: ["Explain CMA vs. formal appraisal distinction", "Describe comparable selection criteria", "Discuss adjustments for differences", "Reconcile a price range into a listing recommendation"],
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { scenarioId, scenarioName, category, difficulty } = body;
      const scenarioConfig = SCENARIO_PROMPTS[scenarioId] || SCENARIO_PROMPTS.salesperson_law;

      const ts = await prisma.trainingSession.create({
        data: {
          studentId: session.user.id,
          scenarioId: scenarioId || "custom",
          scenarioName: scenarioName || "Custom Scenario",
          difficulty: difficulty || "INTERMEDIATE",
          status: "IN_PROGRESS",
          messages: JSON.stringify([]),
        },
      });

      return NextResponse.json({
        success: true,
        data: { sessionId: ts.id, initialMessage: scenarioConfig.initialMessage },
      });
    }

    if (action === "respond") {
      const { sessionId, message } = body;
      if (!sessionId || !message) return NextResponse.json({ error: "sessionId and message required" }, { status: 400 });

      const ts = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
      if (!ts) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const history: Array<{ role: "user" | "assistant"; content: string }> = JSON.parse(ts.messages || "[]");
      const scenarioConfig = SCENARIO_PROMPTS[ts.scenarioId] || SCENARIO_PROMPTS.salesperson_law;

      history.push({ role: "user", content: message });

      const system = [
        TRAINING_SYSTEM_PROMPT,
        `\nEXAMINER PERSONA: ${scenarioConfig.examinerPersona}`,
        `\nOPENING QUESTION (already asked): "${scenarioConfig.initialMessage}"`,
        "\nRespond in 1-3 sentences as the examiner. Ask a follow-up question to probe deeper.",
      ].join("");

      const aiResponse = await chatWithHistory(system, history, 300);
      history.push({ role: "assistant", content: aiResponse });

      const isComplete = history.filter(m => m.role === "user").length >= 5;

      await prisma.trainingSession.update({
        where: { id: sessionId },
        data: { messages: JSON.stringify(history), ...(isComplete ? { status: "COMPLETED" } : {}) },
      });

      return NextResponse.json({ success: true, data: { response: aiResponse, isComplete } });
    }

    if (action === "score") {
      const { sessionId } = body;
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

      const ts = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
      if (!ts) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const history = JSON.parse(ts.messages || "[]");
      const scenarioConfig = SCENARIO_PROMPTS[ts.scenarioId] || SCENARIO_PROMPTS.salesperson_law;

      const scoreResult = await scoreTrainingSession(history, {
        name: ts.scenarioName,
        objectives: scenarioConfig.objectives,
      });

      await prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          score: scoreResult.scores.total,
          scoreDetails: JSON.stringify(scoreResult.scores),
          feedback: scoreResult.overallFeedback,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: { total: scoreResult.scores.total, breakdown: scoreResult.scores, feedback: scoreResult.overallFeedback },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[training]", err);
    return NextResponse.json({ error: "Training service error" }, { status: 500 });
  }
}
