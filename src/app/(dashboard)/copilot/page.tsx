"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Brain, Loader2, RefreshCcw, Lightbulb, BookOpen, AlertCircle, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useStudyStore } from "@/lib/store";
import { ExamCategory, GARELicenseType, type CopilotResponse } from "@/types";
import { humanizeCategoryName } from "@/lib/utils/format";

const CATEGORY_OPTIONS: ExamCategory[] = [
  "LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH","OTHER"
];
const LICENSE_OPTIONS: GARELicenseType[] = ["SALESPERSON","ASSOCIATE_BROKER","BROKER","CAM","ALL"];
const DIFFICULTY_OPTIONS = ["BEGINNER","INTERMEDIATE","ADVANCED"] as const;

interface Message {
  role: "user" | "assistant";
  content: string;
  response?: CopilotResponse;
  timestamp: Date;
}

function ResponseCard({ r }: { r: CopilotResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Study Tip */}
      {r.studyTip && (
        <div className="flex gap-2 p-3 rounded-lg bg-re-500/10 border border-re-500/20">
          <Lightbulb className="w-4 h-4 text-re-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-re-300">{r.studyTip}</p>
        </div>
      )}

      {/* Concept Explanation */}
      {r.conceptExplanation && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Explanation</h4>
          <p className="text-sm text-gray-200 leading-relaxed">{r.conceptExplanation}</p>
        </div>
      )}

      {/* Georgia Specific */}
      {r.georgiaSpecific && (
        <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-base">🍑</span>
          <div>
            <div className="text-xs font-semibold text-amber-400 mb-0.5">Georgia-Specific</div>
            <p className="text-sm text-amber-200">{r.georgiaSpecific}</p>
          </div>
        </div>
      )}

      {/* Key Facts */}
      {r.keyFacts?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Key Facts</h4>
          <ul className="space-y-1">
            {r.keyFacts.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-re-400 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exam Points */}
      {r.examPoints?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Exam Focus Points</h4>
          <ul className="space-y-1">
            {r.examPoints.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Question */}
      {r.practiceQuestion && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="text-xs font-semibold text-blue-400 uppercase mb-1.5">Practice Question</h4>
          <p className="text-sm text-gray-200 mb-2">{r.practiceQuestion}</p>
          {r.practiceAnswer && (
            <details className="cursor-pointer">
              <summary className="text-xs text-blue-400 hover:text-blue-300">Show answer</summary>
              <p className="text-sm text-gray-300 mt-1 pt-1 border-t border-blue-500/20">{r.practiceAnswer}</p>
            </details>
          )}
        </div>
      )}

      {/* Expandable section */}
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-400">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Show less" : "More details"}
      </button>

      {expanded && (
        <div className="space-y-3">
          {r.memoryTrick && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-xs font-semibold text-purple-400 uppercase mb-1.5">Memory Trick</h4>
              <p className="text-sm text-purple-200">{r.memoryTrick}</p>
            </div>
          )}

          {r.commonMistakes?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Common Mistakes</h4>
              <ul className="space-y-1">
                {r.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {r.relatedTopics?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Related Topics</h4>
              <div className="flex flex-wrap gap-1.5">
                {r.relatedTopics.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/8 text-xs text-gray-400">{t}</span>
                ))}
              </div>
            </div>
          )}

          {r.lawReference && (
            <div className="flex gap-2 text-xs text-gray-500">
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Law ref: {r.lawReference}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-white/5 text-center">
              <div className="text-gray-500">Difficulty</div>
              <div className="text-gray-300 font-medium">{r.difficultyRating || "—"}</div>
            </div>
            <div className="p-2 rounded bg-white/5 text-center">
              <div className="text-gray-500">Priority</div>
              <div className="text-gray-300 font-medium">{r.studyPriority || "—"}</div>
            </div>
            <div className="p-2 rounded bg-white/5 text-center">
              <div className="text-gray-500">Est. Time</div>
              <div className="text-gray-300 font-medium">{r.estimatedStudyTime || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<ExamCategory>("LICENSE_LAW");
  const [licenseType, setLicenseType] = useState<GARELicenseType>("SALESPERSON");
  const [difficulty, setDifficulty] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedModel } = useStudyStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copilotMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicDescription: question, category, licenseType, difficulty, specificQuestion: question }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const json = await res.json();
      return json.data as CopilotResponse;
    },
    onSuccess: (data, variables) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.conceptExplanation || "Here is what I found.", response: data, timestamp: new Date() }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble processing that. Please try again.", timestamp: new Date() }]);
    },
  });

  function handleSend() {
    const q = input.trim();
    if (!q || copilotMutation.isPending) return;
    setMessages(prev => [...prev, { role: "user", content: q, timestamp: new Date() }]);
    setInput("");
    copilotMutation.mutate(q);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ai-500/15 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-ai-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold">Study Copilot</h1>
            <p className="text-gray-500 text-xs">AI-powered GA Real Estate exam coach</p>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
          <RefreshCcw className="w-3.5 h-3.5" /> New session
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-white/5 flex gap-3 flex-shrink-0 overflow-x-auto">
        <select value={category} onChange={e => setCategory(e.target.value as ExamCategory)} className="text-xs bg-white/8 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-re-500/50">
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{humanizeCategoryName(c)}</option>)}
        </select>
        <select value={licenseType} onChange={e => setLicenseType(e.target.value as GARELicenseType)} className="text-xs bg-white/8 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-re-500/50">
          {LICENSE_OPTIONS.map(l => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
        </select>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)} className="text-xs bg-white/8 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-re-500/50">
          {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-ai-500/15 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-ai-400" />
            </div>
            <h2 className="text-white font-semibold mb-2">Ask anything about GA Real Estate</h2>
            <p className="text-gray-500 text-sm max-w-sm">Ask about license law, contracts, agency relationships, financing, fair housing, property valuation, and more.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
              {[
                "What are the requirements for a Georgia salesperson license?",
                "Explain the difference between agent and broker duties",
                "How does a purchase and sale agreement work in GA?",
                "What is the rule of thumb for mortgage qualification?",
              ].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-re-500/30 hover:bg-re-500/5 transition-all text-sm text-gray-400 hover:text-gray-200">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-ai-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-ai-400" />
              </div>
            )}
            <div className={`max-w-2xl rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-re-500/20 border border-re-500/30 text-white" : "bg-white/5 border border-white/10"}`}>
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <ResponseCard r={msg.response!} />
              )}
              <div className="text-xs text-gray-600 mt-1">{msg.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}

        {copilotMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-ai-500/15 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-ai-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="typing-dot" style={{ animationDelay: "0ms" }} />
              <div className="typing-dot" style={{ animationDelay: "150ms" }} />
              <div className="typing-dot" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/8">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about GA Real Estate exam topics..."
            rows={2}
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50 resize-none"
          />
          <button onClick={handleSend} disabled={!input.trim() || copilotMutation.isPending} className="w-10 h-10 bg-re-500 hover:bg-re-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            {copilotMutation.isPending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 text-center">AI can make mistakes. Always verify with official GREC materials.</p>
      </div>
    </div>
  );
}
