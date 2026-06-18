"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Brain, Search, X, Loader2, Edit2, Save, Sparkles, Zap } from "lucide-react";
import { KnowledgeBrainGraph, BrainNode, BrainEdge } from "@/components/brain/KnowledgeBrainGraph";
import { formatRelative } from "@/lib/utils/format";

interface Note {
  id: string; title: string; content: string; tags: string[];
  category: string; linkedNotes: string[]; createdAt: string; updatedAt: string;
}

const CATEGORIES = ["ALL", "License Law", "Contracts", "Agency", "Fair Housing", "Finance", "Property", "Valuation", "Math", "Closing"];

export default function BrainPage() {
  const [view, setView]                 = useState<"list" | "graph">("list");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [editTitle, setEditTitle]       = useState("");
  const [editContent, setEditContent]   = useState("");
  const [showCreate, setShowCreate]     = useState(false);
  const [newTitle, setNewTitle]         = useState("");
  const [newContent, setNewContent]     = useState("");
  const [search, setSearch]             = useState("");
  const [aiTopic, setAiTopic]           = useState("");
  const [showAiGen, setShowAiGen]       = useState(false);

  // Bulk generator state
  const [genCategory, setGenCategory] = useState("ALL");
  const [genCount, setGenCount]       = useState(10);
  const [genResult, setGenResult]     = useState<string | null>(null);

  const qc = useQueryClient();

  const { data: notesData, isLoading } = useQuery({
    queryKey: ["obsidian-notes", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/obsidian/notes?${params}`);
      const json = await res.json();
      return json.data as Note[];
    },
  });

  const { data: graphData } = useQuery({
    queryKey: ["obsidian-graph"],
    queryFn: async () => {
      const res = await fetch("/api/obsidian/graph");
      const json = await res.json();
      const raw = json.data as { nodes: BrainNode[]; links: BrainEdge[] };
      return { nodes: raw.nodes, edges: raw.links };
    },
    enabled: view === "graph",
  });

  // ── Bulk AI generator ──────────────────────────────────────────────────
  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: genCount,
          category: genCategory !== "ALL" ? genCategory : undefined,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["obsidian-notes"] });
      qc.invalidateQueries({ queryKey: ["obsidian-graph"] });
      setGenResult(`✅ Created ${data.created} notes!`);
      setTimeout(() => setGenResult(null), 6000);
    },
    onError: () => setGenResult("❌ Generation failed — please try again."),
  });

  // ── Single / custom topic ──────────────────────────────────────────────
  const aiGenMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await fetch("/api/ai/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || undefined, random: !topic }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["obsidian-notes"] });
      qc.invalidateQueries({ queryKey: ["obsidian-graph"] });
      if (data.data) setSelectedNote(data.data);
      setAiTopic(""); setShowAiGen(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/obsidian/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obsidian-notes"] });
      qc.invalidateQueries({ queryKey: ["obsidian-graph"] });
      setShowCreate(false); setNewTitle(""); setNewContent("");
    },
  });

  const notes = notesData || [];

  function openNote(id: string) {
    const note = notes.find(n => n.id === id);
    if (note) setSelectedNote(note);
  }

  function startEdit(note: Note) {
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  const anyLoading = bulkMutation.isPending || aiGenMutation.isPending;

  return (
    <div className={`${view === "graph" ? "h-screen flex flex-col" : "p-3 sm:p-6 space-y-4"}`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between flex-wrap gap-2 ${view === "graph" ? "p-3 sm:p-4 border-b border-white/8 flex-shrink-0" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Knowledge Brain</h1>
            <p className="text-gray-500 text-sm">
              {notes.length > 0 ? `${notes.length} notes · ` : ""}Personal study notes with linked concepts
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === "list" ? "bg-re-500/20 text-re-400" : "text-gray-500 hover:text-gray-300"}`}>List</button>
            <button onClick={() => setView("graph")} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === "graph" ? "bg-re-500/20 text-re-400" : "text-gray-500 hover:text-gray-300"}`}>Graph</button>
          </div>
          {view === "list" && (
            <>
              <button onClick={() => setShowAiGen(true)} className="text-xs py-1.5 px-3 rounded-xl border border-purple-500/20 bg-white/5 text-gray-400 hover:text-purple-300 transition-all flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Custom Topic
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Note
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Graph view ────────────────────────────────────────────────────── */}
      {view === "graph" ? (
        <div className="flex-1 relative">
          {graphData?.nodes?.length ? (
            <KnowledgeBrainGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              onSelectNote={(id) => { openNote(id); setView("list"); }}
              onBack={() => setView("list")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#060b16]">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-600" />
                <p className="text-sm text-gray-500">Create notes to see the knowledge graph</p>
                <button onClick={() => setView("list")} className="mt-3 text-xs text-re-400 hover:text-re-300 underline">Back to notes</button>
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ── List view ──────────────────────────────────────────────────── */
        <>
          {/* AI Bulk Generator Panel */}
          <div className="glass-card p-5 border border-purple-500/25 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Study Notes Generator</h3>
                <p className="text-gray-500 text-xs">Generate 10–20 interconnected GA real estate study notes at once — each cross-linked in the Knowledge Brain graph</p>
              </div>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setGenCategory(cat)}
                  disabled={anyLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                    genCategory === cat
                      ? "bg-purple-500/25 border-purple-500/50 text-purple-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Count + generate button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 whitespace-nowrap">Generate:</label>
                {[10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setGenCount(n)}
                    disabled={anyLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                      genCount === n
                        ? "bg-purple-500/25 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-gray-200"
                    }`}
                  >
                    {n} notes
                  </button>
                ))}
              </div>

              <button
                onClick={() => bulkMutation.mutate()}
                disabled={anyLoading}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
              >
                {bulkMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {genCount} notes...</>
                  : <><Zap className="w-4 h-4" /> Generate {genCount} Notes</>
                }
              </button>

              {genResult && (
                <span className={`text-sm font-medium ${genResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                  {genResult}
                </span>
              )}
            </div>

            {/* Progress bar while loading */}
            {bulkMutation.isPending && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-purple-500/8 border border-purple-500/15">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400 flex-shrink-0" />
                <p className="text-purple-300 text-xs">
                  AI is writing <strong>{genCount}</strong> {genCategory !== "ALL" ? genCategory : "mixed-topic"} study notes with cross-links, GREC references, and exam tips — this takes 15–30 seconds...
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50"
            />
          </div>

          {/* Notes grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {notes.map(note => (
                <button key={note.id} onClick={() => setSelectedNote(note)} className="glass-card p-4 text-left hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
                  <h3 className="text-white font-semibold text-sm mb-2 truncate">{note.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-3 mb-3">{note.content}</p>
                  {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{t}</span>)}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-2">{formatRelative(note.updatedAt)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Brain className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm text-gray-400 font-medium mb-1">No notes yet</p>
              <p className="text-xs text-gray-600 mb-4 text-center max-w-xs">Use the AI generator above to create your first batch of study notes</p>
              <button
                onClick={() => bulkMutation.mutate()}
                disabled={bulkMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> Generate {genCount} Notes Now
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Note detail modal ─────────────────────────────────────────────── */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setSelectedNote(null); setIsEditing(false); } }}>
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              {isEditing
                ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 bg-transparent text-white font-semibold text-lg focus:outline-none border-b border-re-500/50" />
                : <h2 className="text-white font-semibold text-lg">{selectedNote.title}</h2>
              }
              <div className="flex gap-2 ml-3">
                <button onClick={() => isEditing ? setIsEditing(false) : startEdit(selectedNote)} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white">
                  {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { setSelectedNote(null); setIsEditing(false); }} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isEditing
                ? <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 resize-none" />
                : <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
              }
            </div>
            {selectedNote.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {selectedNote.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{t}</span>)}
              </div>
            )}
            {isEditing && (
              <div className="flex gap-3 p-4 border-t border-white/8">
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
                <button className="btn-primary flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Custom Topic Modal ────────────────────────────────────────────── */}
      {showAiGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /><h2 className="text-white font-semibold">Custom Topic Note</h2></div>
              <button onClick={() => setShowAiGen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-gray-500 text-sm">Enter any GA Real Estate topic and AI will generate one detailed study note with cross-links.</p>
              <input
                value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && aiTopic.trim()) aiGenMutation.mutate(aiTopic); }}
                placeholder="e.g. LODCAR fiduciary duties, cap rate, BRRETA..."
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
              />
              <div className="flex flex-wrap gap-1.5">
                {["BRRETA", "LODCAR duties", "GAR Form F20", "Fair Housing classes", "Cap rate formula", "License renewal CE"].map(t => (
                  <button key={t} onClick={() => setAiTopic(t)} className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20">{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/8">
              <button onClick={() => setShowAiGen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => aiTopic.trim() && aiGenMutation.mutate(aiTopic)} disabled={!aiTopic.trim() || aiGenMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {aiGenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Note Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <h2 className="text-white font-semibold">New Note</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title..." className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={8} placeholder="Write your note... Use [[Note Title]] to link to other notes." className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none" />
              <p className="text-xs text-gray-600">Tip: Use [[Note Title]] syntax to create links between notes</p>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/8">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={!newTitle.trim() || createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
