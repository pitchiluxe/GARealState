"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, FileText, ChevronRight, Loader2, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { formatRelative, humanizeCategoryName } from "@/lib/utils/format";
import { ExamCategory } from "@/types";
import Link from "next/link";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"];

interface PracticeTest {
  id: string; testNumber: string; subject: string; status: string;
  category: ExamCategory; score: number | null; passingScore: number;
  difficulty: string; createdAt: string; description: string;
}

function difficultyColor(d: string) {
  if (d === "BEGINNER")     return "text-green-400 bg-green-500/10 border-green-500/20";
  if (d === "INTERMEDIATE") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function statusColor(s: string) {
  if (s === "COMPLETED")   return "status-resolved";
  if (s === "IN_PROGRESS") return "status-progress";
  if (s === "OPEN")        return "status-open";
  return "status-closed";
}

export default function CasesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [genCount, setGenCount] = useState(10);
  const [genResult, setGenResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/cases?${params}`);
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: genCount }),
      });
      return res.json();
    },
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      setGenResult(`✅ Generated ${result.created} new practice tests!`);
      setTimeout(() => setGenResult(null), 5000);
    },
    onError: () => setGenResult("❌ Generation failed. Try again."),
  });

  const tests: PracticeTest[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Practice Tests</h1>
          <p className="text-gray-500 text-sm">{total} tests in your history</p>
        </div>
      </div>

      {/* AI Generator Panel */}
      <div className="glass-card p-5 border border-re-500/25 bg-re-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-re-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-re-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Practice Test Generator</h3>
            <p className="text-gray-500 text-xs">AI creates real GA real estate certification practice tests covering all PSI exam topics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Count selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">Generate:</label>
            {[10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setGenCount(n)}
                disabled={generateMutation.isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                  genCount === n
                    ? "bg-re-500/25 border-re-500/50 text-re-300"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-re-500/30 hover:text-gray-200"
                }`}
              >
                {n} tests
              </button>
            ))}
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm ml-auto disabled:opacity-50"
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {genCount} tests...</>
              : <><Sparkles className="w-4 h-4" /> Generate {genCount} Practice Tests</>
            }
          </button>

          {genResult && (
            <span className={`text-sm font-medium ${genResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
              {genResult}
            </span>
          )}
        </div>

        {generateMutation.isPending && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-re-500/8 border border-re-500/15">
            <Loader2 className="w-4 h-4 animate-spin text-re-400 flex-shrink-0" />
            <p className="text-re-300 text-xs">
              AI is generating <strong>{genCount}</strong> GA real estate practice tests covering GREC rules, contracts, agency, finance, fair housing, valuation, math, and closing...
            </p>
          </div>
        )}

        <p className="text-xs text-gray-600 mt-3">
          Each test covers a specific GA PSI exam subtopic with a description and exam tips. Tests are saved to your history — click any test to view details.
        </p>
      </div>

      {/* Search + Status filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search practice tests..."
            className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${status === s ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tests table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : tests.length > 0 ? (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/8 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">Test #</div>
              <div className="col-span-4">Subject</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right">Date</div>
            </div>

            {/* Rows */}
            {tests.map(test => (
              <Link key={test.id} href={`/cases/${test.id}`}>
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-all items-center cursor-pointer group">
                  <div className="col-span-1 text-xs font-mono text-gray-600 truncate">{test.testNumber?.replace("AI-","#").split("-").slice(0,2).join("-")}</div>
                  <div className="col-span-4 sm:col-span-4 col-span-10">
                    <div className="text-sm text-white font-medium line-clamp-1 group-hover:text-re-300 transition-colors">{test.subject}</div>
                    {test.description && <div className="text-xs text-gray-600 line-clamp-1 mt-0.5 hidden sm:block">{test.description}</div>}
                    <div className="text-xs text-gray-600 sm:hidden mt-0.5">{humanizeCategoryName(test.category)} · {formatRelative(test.createdAt)}</div>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">{humanizeCategoryName(test.category)}</span>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColor(test.difficulty)}`}>{test.difficulty}</span>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    {test.score !== null
                      ? <span className={`text-xs font-bold ${test.score >= test.passingScore ? "text-green-400" : "text-red-400"}`}>{test.score}%</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(test.status)}`}>{test.status.replace("_", " ")}</span>
                  </div>
                  <div className="col-span-1 text-right hidden sm:flex items-center justify-end gap-1 text-xs text-gray-500">
                    {formatRelative(test.createdAt)} <ChevronRight className="w-3 h-3 group-hover:text-re-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">No practice tests yet</p>
            <p className="text-xs text-gray-600 mb-4 text-center max-w-xs">
              Use the AI generator above to create your first batch of GA real estate practice tests
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Generate {genCount} Tests Now
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages} · {total} total tests</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
