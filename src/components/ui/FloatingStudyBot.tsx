"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot, Minimize2, Sparkles, Zap, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";

interface Msg { role: "user" | "assistant"; content: string }

const PAGE_HINTS: Record<string, string> = {
  "/dashboard": "Ask me anything! Try: *Quiz me on license law* or *What's BRRETA?*",
  "/classroom": "I can explain any module concept. Try: *Explain fiduciary duties* or *What is LODCAR?*",
  "/exam": "Need help with a question? Paste it and I'll explain the answer!",
  "/training": "I can help you practice. Try: *Quiz me on fair housing* or *Explain dual agency.*",
  "/formulas": "Ask me to walk through any formula: *Show me a commission calculation example.*",
  "/knowledge": "Ask me to explain any KB article topic in depth!",
  "/brain": "I can generate study notes. Ask: *Explain the income approach to value.*",
};

const QUICK = [
  { label: "Quick quiz", prompt: "Give me one GA real estate exam practice question right now" },
  { label: "Top tip", prompt: "What is the single most important thing to know for the Georgia real estate exam?" },
  { label: "Key numbers", prompt: "List the most important numbers and timelines I need to memorize for the Georgia RE exam" },
  { label: "Explain BRRETA", prompt: "Explain BRRETA — the Brokerage Relationships in Real Estate Transactions Act — in simple terms" },
];

export function FloatingStudyBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const hint = PAGE_HINTS[pathname] || PAGE_HINTS["/dashboard"];

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role: "assistant", content: `Hi! I'm your GA Real Estate AI Tutor. ${hint}` }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specificQuestion: q,
          topicDescription: "Georgia Real Estate licensing exam",
          category: "LICENSE_LAW",
          licenseType: "SALESPERSON",
          difficulty: "INTERMEDIATE",
        }),
      });
      const json = await res.json();
      const d = json.data;
      let answer = d?.studyTip || d?.conceptExplanation || d?.practiceQuestion || "I couldn't generate a response. Please try again.";
      if (d?.practiceQuestion && d?.practiceAnswer) {
        answer = `**Practice Question:** ${d.practiceQuestion}\n\n**Answer:** ${d.practiceAnswer}`;
      }
      if (d?.memoryTrick) answer += `\n\n💡 **Memory Trick:** ${d.memoryTrick}`;
      setMsgs(prev => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {open && (
        <div className="pointer-events-auto bg-[#0d1426] border border-white/15 rounded-2xl shadow-2xl w-[340px] sm:w-[380px] flex flex-col overflow-hidden" style={{ height: "500px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0" style={{ background: "linear-gradient(135deg,rgba(232,130,90,0.18),rgba(245,158,11,0.08))" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-bold">AI Study Tutor</div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  GA Real Estate Expert
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setMsgs([{ role: "assistant", content: `Hi! I'm your GA Real Estate AI Tutor. ${hint}` }]); }}
                title="Clear chat"
                className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setOpen(false); setMsgs([]); }} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/8">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(232,130,90,0.2)" }}>
                    <Bot className="w-3.5 h-3.5 text-re-400" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-re-500/25 text-white rounded-br-sm"
                    : "bg-white/8 text-gray-200 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,130,90,0.2)" }}>
                  <Bot className="w-3.5 h-3.5 text-re-400" />
                </div>
                <div className="bg-white/8 rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                  {[0,1,2].map(n => (
                    <span key={n} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          {msgs.length <= 1 && !loading && (
            <div className="px-3 pb-1 flex gap-1.5 flex-wrap flex-shrink-0">
              {QUICK.map(a => (
                <button key={a.label} onClick={() => send(a.prompt)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-all hover:bg-re-500/20"
                  style={{ background: "rgba(232,130,90,0.08)", borderColor: "rgba(232,130,90,0.25)", color: "#E8825A" }}>
                  <Zap className="w-2.5 h-2.5 inline mr-1" />{a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/8 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask anything about GA real estate..."
                className="flex-1 bg-white/8 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50 transition-colors"
              />
              <button onClick={() => send(input)} disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="pointer-events-auto w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative"
        style={{ background: open ? "#1e2a44" : "linear-gradient(135deg,#E8825A,#f59e0b)" }}
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <Sparkles className="w-6 h-6 text-white" />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0A0F1E] animate-pulse" />
        )}
      </button>
    </div>
  );
}
