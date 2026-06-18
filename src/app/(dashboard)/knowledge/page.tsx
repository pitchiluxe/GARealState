"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, Eye, ThumbsUp, Tag, Filter, ExternalLink, ChevronRight } from "lucide-react";
import { formatRelative, humanizeCategoryName } from "@/lib/utils/format";
import { ExamCategory } from "@/types";

const CATEGORY_FILTERS: (ExamCategory | "ALL")[] = [
  "ALL","LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH"
];

interface Article {
  id: string; title: string; body: string; category: ExamCategory;
  views: number; helpfulVotes: number; tags: string[] | string; createdAt: string;
  _count?: { views: number };
}

function parseTags(tags: string[] | string | undefined | null): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  const qc = useQueryClient();
  const viewMutation = useMutation({
    mutationFn: () => fetch(`/api/knowledge/${article.id}/view`, { method: "POST" }),
  });
  const helpfulMutation = useMutation({
    mutationFn: () => fetch(`/api/knowledge/${article.id}/helpful`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
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
          <button onClick={() => helpfulMutation.mutate()} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5" /> Mark helpful
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

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Knowledge Base</h1>
        <p className="text-gray-500 text-sm">GA Real Estate exam study materials</p>
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
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.helpfulVotes}</span>
                <span className="ml-auto">{formatRelative(article.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No articles found</p>
          <p className="text-xs mt-1">Try a different search term or category</p>
        </div>
      )}

      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}
