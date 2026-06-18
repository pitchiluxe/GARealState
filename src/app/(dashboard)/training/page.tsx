"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GraduationCap, Play, Loader2, CheckCircle, XCircle, RefreshCcw, Star, Send, Sparkles, Trash2 } from "lucide-react";
import { humanizeCategoryName } from "@/lib/utils/format";
import { ExamCategory } from "@/types";

const EXAM_TOPICS = [
  { id: "ALL",          label: "All Topics",       icon: "🍑" },
  { id: "LICENSE_LAW",  label: "License Law",       icon: "⚖️" },
  { id: "CONTRACTS",    label: "Contracts",         icon: "📄" },
  { id: "AGENCY",       label: "Agency",            icon: "🤝" },
  { id: "FINANCE",      label: "Finance",           icon: "💰" },
  { id: "FAIR_HOUSING", label: "Fair Housing",      icon: "🏠" },
  { id: "VALUATION",    label: "Valuation",         icon: "📊" },
  { id: "MATH",         label: "RE Math",           icon: "🔢" },
  { id: "CLOSING",      label: "Closing & Title",   icon: "🔑" },
  { id: "PROPERTY",     label: "Property Rights",   icon: "🏘️" },
];

const BASE_SCENARIOS = [
  { id: "salesperson_law",   name: "License Law Basics",         category: "LICENSE_LAW"  as ExamCategory, difficulty: "BEGINNER",     desc: "Cover requirements to obtain a GA salesperson license" },
  { id: "contracts_psa",     name: "Purchase & Sale Agreement",  category: "CONTRACTS"    as ExamCategory, difficulty: "INTERMEDIATE", desc: "Navigate a standard GA PSA transaction" },
  { id: "agency_duties",     name: "Agency Duties & Disclosure", category: "AGENCY"       as ExamCategory, difficulty: "INTERMEDIATE", desc: "Handle client representation and disclosure requirements" },
  { id: "finance_mortgage",  name: "Mortgage Qualification",     category: "FINANCE"      as ExamCategory, difficulty: "ADVANCED",     desc: "Walk through conventional mortgage math and qualification" },
  { id: "fair_housing_case", name: "Fair Housing Scenario",      category: "FAIR_HOUSING" as ExamCategory, difficulty: "BEGINNER",     desc: "Respond to a potential fair housing violation scenario" },
  { id: "valuation_cma",     name: "CMA & Pricing Strategy",     category: "VALUATION"    as ExamCategory, difficulty: "ADVANCED",     desc: "Complete a competitive market analysis and price opinion" },
];

type Scenario = typeof BASE_SCENARIOS[0];

interface TrainingState {
  sessionId: string;
  scenarioId: string;
  messages: { role: "user" | "assistant"; content: string }[];
  score: number | null;
  isComplete: boolean;
  scoreBreakdown: Record<string, number> | null;
}

function difficultyStyle(d: string) {
  if (d === "BEGINNER") return "bg-green-500/15 text-green-400";
  if (d === "INTERMEDIATE") return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

export default function TrainingPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [state, setState] = useState<TrainingState | null>(null);
  const [message, setMessage] = useState("");
  const [aiScenarios, setAiScenarios] = useState<Scenario[]>([]);
  const [genCategory, setGenCategory] = useState("ALL");
  const [genCount, setGenCount] = useState(10);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  const allScenarios = [...BASE_SCENARIOS, ...aiScenarios];

  const startMutation = useMutation({
    mutationFn: async (scenario: Scenario) => {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", scenarioId: scenario.id, scenarioName: scenario.name, category: scenario.category, difficulty: scenario.difficulty }),
      });
      return res.json();
    },
    onSuccess: (data, scenario) => {
      setActiveScenario(scenario);
      setState({
        sessionId: data.data.sessionId,
        scenarioId: scenario.id,
        messages: [{ role: "assistant", content: data.data.initialMessage }],
        score: null,
        isComplete: false,
        scoreBreakdown: null,
      });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", sessionId: state?.sessionId, message: msg }),
      });
      return res.json();
    },
    onSuccess: data => {
      setState(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: data.data.response }],
        isComplete: data.data.isComplete || false,
      } : null);
    },
  });

  const scoreMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "score", sessionId: state?.sessionId }),
      });
      return res.json();
    },
    onSuccess: data => {
      setState(prev => prev ? { ...prev, score: data.data.total, scoreBreakdown: data.data.breakdown, isComplete: true } : null);
    },
  });

  async function generateScenarios() {
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/ai/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: genCategory === "ALL" ? null : genCategory, count: genCount }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const newScenarios: Scenario[] = (json.scenarios || []).map((s: Scenario) => ({
        ...s,
        id: `ai_${s.id}_${Date.now()}`,
        category: s.category as ExamCategory,
      }));
      setAiScenarios(prev => [...prev, ...newScenarios]);
      setGenResult(`✅ Added ${newScenarios.length} new scenarios!`);
      setTimeout(() => setGenResult(null), 4000);
    } catch {
      setGenResult("❌ Generation failed. Try again.");
    } finally {
      setGenLoading(false);
    }
  }

  function handleSend() {
    const msg = message.trim();
    if (!msg || !state) return;
    setState(prev => prev ? { ...prev, messages: [...prev.messages, { role: "user", content: msg }] } : null);
    setMessage("");
    respondMutation.mutate(msg);
  }

  function handleEnd() {
    if (state && !state.score) scoreMutation.mutate();
  }

  function handleReset() {
    setState(null);
    setActiveScenario(null);
  }

  // ─── Scenario List View ───────────────────────────────────────────────────
  if (!state) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">Exam Practice</h1>
            <p className="text-gray-500 text-sm">AI-powered scenario-based training for the GA RE exam</p>
          </div>
          <span className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            {allScenarios.length} scenarios
          </span>
        </div>

        {/* AI Generator Panel */}
        <div className="glass-card p-5 border border-re-500/25 bg-re-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-re-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-re-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Scenario Generator</h3>
              <p className="text-gray-500 text-xs">Generate 10–20 new practice scenarios on any exam topic</p>
            </div>
          </div>

          {/* Topic chips */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Select Topic</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setGenCategory(t.id)}
                  disabled={genLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all disabled:opacity-50 ${
                    genCategory === t.id
                      ? "bg-re-500/25 border-re-500/50 text-re-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-re-500/30 hover:text-gray-200"
                  }`}
                >
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count + Generate row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">Count:</label>
              {[10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setGenCount(n)}
                  disabled={genLoading}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                    genCount === n
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={generateScenarios}
              disabled={genLoading}
              className="btn-primary flex items-center gap-2 text-sm ml-auto disabled:opacity-50"
            >
              {genLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating scenarios...</>
                : <><Sparkles className="w-4 h-4" /> Generate {genCount} Scenarios</>
              }
            </button>

            {aiScenarios.length > 0 && !genLoading && (
              <button
                onClick={() => setAiScenarios([])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear AI
              </button>
            )}

            {genResult && (
              <span className={`text-sm font-medium ${genResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                {genResult}
              </span>
            )}
          </div>

          {genLoading && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-re-500/8 border border-re-500/15">
              <Loader2 className="w-4 h-4 animate-spin text-re-400 flex-shrink-0" />
              <p className="text-re-300 text-xs">
                AI is generating <strong>{genCount}</strong> new {genCategory !== "ALL" ? <strong>{EXAM_TOPICS.find(t => t.id === genCategory)?.label}</strong> : "mixed-topic"} practice scenarios...
              </p>
            </div>
          )}
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allScenarios.map(scenario => (
            <div key={scenario.id} className={`glass-card p-5 flex flex-col gap-3 ${scenario.id.startsWith("ai_") ? "border-re-500/20" : ""}`}>
              <div className="flex items-start justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">
                  {humanizeCategoryName(scenario.category)}
                </span>
                <div className="flex items-center gap-1.5">
                  {scenario.id.startsWith("ai_") && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-re-500/20 text-re-400 font-medium">AI</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyStyle(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{scenario.name}</h3>
                <p className="text-gray-500 text-sm">{scenario.desc}</p>
              </div>
              <button
                onClick={() => startMutation.mutate(scenario)}
                disabled={startMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
              >
                {startMutation.isPending && startMutation.variables?.id === scenario.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Play className="w-4 h-4" />}
                Start Scenario
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Active Training Session View ─────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-re-500/15 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-re-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{activeScenario?.name}</h2>
            <p className="text-gray-500 text-xs">{humanizeCategoryName(activeScenario?.category || "")} · {activeScenario?.difficulty}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!state.score && (
            <button onClick={handleEnd} disabled={scoreMutation.isPending} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
              {scoreMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />} End & Score
            </button>
          )}
          <button onClick={handleReset} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <RefreshCcw className="w-3.5 h-3.5" /> New Scenario
          </button>
        </div>
      </div>

      {/* Score card */}
      {state.score !== null && (
        <div className="mx-4 mt-3 p-4 rounded-xl border border-white/15 bg-white/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {state.score >= 80 ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              <span className="text-white font-semibold">Session Score: {state.score}/100</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${state.score >= 80 ? "bg-green-500/15 text-green-400" : state.score >= 60 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
              {state.score >= 80 ? "Excellent" : state.score >= 60 ? "Good" : "Needs Work"}
            </span>
          </div>
          {state.scoreBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(state.scoreBreakdown).map(([k, v]) => (
                <div key={k} className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-sm font-bold text-white">{v}/20</div>
                  <div className="text-xs text-gray-500 capitalize">{k}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {state.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-re-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-re-400" />
              </div>
            )}
            <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-re-500/20 border border-re-500/30 text-white" : "bg-white/5 border border-white/10 text-gray-200"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {(respondMutation.isPending || scoreMutation.isPending) && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-re-500/15 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-re-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="typing-dot" /><div className="typing-dot" style={{ animationDelay: "150ms" }} /><div className="typing-dot" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!state.isComplete && (
        <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/8">
          <div className="flex gap-2 items-end">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your response..."
              rows={2}
              className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50 resize-none"
            />
            <button onClick={handleSend} disabled={!message.trim() || respondMutation.isPending} className="w-10 h-10 bg-re-500 hover:bg-re-600 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
      {state.isComplete && state.score !== null && (
        <div className="px-4 pb-4 flex-shrink-0 border-t border-white/8 pt-3">
          <button onClick={handleReset} className="btn-primary w-full">Start New Scenario</button>
        </div>
      )}
    </div>
  );
}
