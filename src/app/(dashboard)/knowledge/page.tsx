"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, Eye, ThumbsUp, Tag, Filter, ChevronRight, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { formatRelative, humanizeCategoryName } from "@/lib/utils/format";
import { ExamCategory } from "@/types";

const CATEGORY_FILTERS: (ExamCategory | "ALL")[] = [
  "ALL","LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH"
];

interface Article {
  id: string; title: string; body: string; category: ExamCategory;
  views: number; helpfulVotes: number; tags: string[] | string; createdAt: string;
}

function parseTags(tags: string[] | string | undefined | null): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  const qc = useQueryClient();
  const [voted, setVoted] = useState(false);

  useMutation({
    mutationFn: () => fetch(`/api/knowledge/${article.id}/view`, { method: "POST" }),
  });

  const helpfulMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/knowledge/${article.id}/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful: true }),
      }),
    onSuccess: () => {
      setVoted(true);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400 mb-2 inline-block">{humanizeCategoryName(article.category)}</span>
            <h2 className="text-white text-lg font-semibold">{article.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-4 text-xl font-light">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{article.body}</p>
          </div>
          {parseTags(article.tags).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {parseTags(article.tags).map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8 text-xs text-gray-400">
                  <Tag className="w-2.5 h-2.5" />{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-white/8">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views} views</span>
            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{article.helpfulVotes} helpful</span>
          </div>
          <button
            onClick={() => !voted && helpfulMutation.mutate()}
            disabled={voted || helpfulMutation.isPending}
            className={`btn-secondary text-xs py-1.5 flex items-center gap-1.5 transition-all ${voted ? "border-green-500/40 text-green-400 bg-green-500/10" : ""}`}
          >
            {helpfulMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : voted ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5" />
            )}
            {voted ? "Marked helpful!" : "Mark helpful"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExamCategory | "ALL">("ALL");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [genCategory, setGenCategory] = useState<ExamCategory | "ALL">("ALL");
  const [genCount, setGenCount] = useState(10);
  const [genResult, setGenResult] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge", search, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "ALL") params.set("category", category);
      const res = await fetch(`/api/knowledge?${params}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: genCategory === "ALL" ? null : genCategory, count: genCount }),
      });
      return res.json();
    },
    onSuccess: (result) => {
      setGenResult(`✅ Generated ${result.created} new study articles!`);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
      setTimeout(() => setGenResult(null), 5000);
    },
    onError: () => setGenResult("❌ Generation failed. Please try again."),
  });

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Base</h1>
          <p className="text-gray-500 text-sm">GA Real Estate exam study materials</p>
        </div>
        <div className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          {data?.length ?? 0} articles
        </div>
      </div>

      {/* AI Generator Panel */}
      <div className="glass-card p-4 border border-re-500/20 bg-re-500/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-re-400" />
          <span className="text-sm font-semibold text-re-300">AI Study Material Generator</span>
          <span className="text-xs bg-re-500/20 text-re-400 px-2 py-0.5 rounded-full">Generate 10–20 articles</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Topic</label>
            <select
              value={genCategory}
              onChange={e => setGenCategory(e.target.value as ExamCategory | "ALL")}
              className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-re-500/50"
            >
              <option value="ALL">Random Topic</option>
              {CATEGORY_FILTERS.filter(c => c !== "ALL").map(c => (
                <option key={c} value={c}>{humanizeCategoryName(c)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Count</label>
            <select
              value={genCount}
              onChange={e => setGenCount(Number(e.target.value))}
              className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-re-500/50"
            >
              {[10, 15, 20].map(n => <option key={n} value={n}>{n} articles</option>)}
            </select>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary text-sm flex items-center gap-2 py-2 px-4 disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Study Materials</>
            )}
          </button>
          {genResult && (
            <span className={`text-sm font-medium ${genResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
              {genResult}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">AI generates real exam-focused content using Georgia RE laws, numbers, and PSI test tips — saved permanently to the knowledge base.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {CATEGORY_FILTERS.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
              {c === "ALL" ? "All" : humanizeCategoryName(c)}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-card p-5 h-40 animate-pulse"><div className="bg-white/5 rounded h-full" /></div>)}
        </div>
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((article: Article) => (
            <button key={article.id} onClick={() => setSelectedArticle(article)} className="glass-card p-5 text-left hover:border-re-500/30 hover:bg-re-500/5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">{humanizeCategoryName(article.category)}</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-gray-500 text-xs line-clamp-3 mb-3">{article.body}</p>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.helpfulVotes ?? 0}</span>
                <span className="ml-auto">{formatRelative(article.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No articles found</p>
          <p className="text-xs mt-1">Try generating some with the AI button above!</p>
        </div>
      )}

      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}
