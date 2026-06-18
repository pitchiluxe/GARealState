"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, FileText, ChevronRight, X, Loader2 } from "lucide-react";
import { formatRelative, humanizeCategoryName } from "@/lib/utils/format";
import { ExamCategory } from "@/types";
import Link from "next/link";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED"];
const CATEGORY_OPTIONS: (ExamCategory | "ALL")[] = ["ALL","LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH","OTHER"];

interface PracticeTest {
  id: string; testNumber: string; subject: string; status: string;
  category: ExamCategory; score: number | null; passingScore: number;
  difficulty: string; createdAt: string;
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ExamCategory>("LICENSE_LAW");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, difficulty }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cases"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-white font-semibold">New Practice Test</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Subject / Topic</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. License Law – Salesperson Requirements" className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as ExamCategory)} className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
              {CATEGORY_OPTIONS.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{humanizeCategoryName(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
              <option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/8">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!subject.trim() || createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState<ExamCategory | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, status, category, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (category !== "ALL") params.set("category", category);
      const res = await fetch(`/api/cases?${params}`);
      const json = await res.json();
      return json;
    },
  });

  const tests: PracticeTest[] = data?.data || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Practice Tests</h1>
          <p className="text-gray-500 text-sm">{total} tests in your history</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests..." className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${status === s ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : tests.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/8 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-2">Test #</div>
              <div className="col-span-4">Subject</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Date</div>
            </div>
            {tests.map(test => (
              <Link key={test.id} href={`/cases/${test.id}`}>
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-all items-center cursor-pointer">
                  <div className="col-span-2 text-xs font-mono text-gray-500">{test.testNumber}</div>
                  <div className="col-span-4">
                    <div className="text-sm text-white font-medium truncate">{test.subject}</div>
                    <div className="text-xs text-gray-600 sm:hidden">{humanizeCategoryName(test.category)} · {formatRelative(test.createdAt)}</div>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">{humanizeCategoryName(test.category)}</span>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    {test.score !== null ? (
                      <span className={`text-xs font-bold ${test.score >= test.passingScore ? "text-green-400" : "text-red-400"}`}>{test.score}%</span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      test.status === "COMPLETED" ? "status-resolved" :
                      test.status === "IN_PROGRESS" ? "status-progress" :
                      test.status === "OPEN" ? "status-open" : "status-closed"
                    }`}>{test.status.replace("_", " ")}</span>
                  </div>
                  <div className="col-span-2 text-right hidden sm:flex items-center justify-end gap-1 text-xs text-gray-500">
                    {formatRelative(test.createdAt)} <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No practice tests found</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 btn-primary text-sm">Create first test</button>
          </div>
        )}
      </div>

      {total > 15 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={tests.length < 15} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
