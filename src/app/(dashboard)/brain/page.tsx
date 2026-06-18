"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Brain, Search, X, Loader2, Edit2, Save, Sparkles, RefreshCw } from "lucide-react";
import * as d3 from "d3";
import { formatRelative } from "@/lib/utils/format";

interface Note {
  id: string; title: string; content: string; tags: string[];
  linkedNotes: string[]; createdAt: string; updatedAt: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string; title: string; group: number;
}
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode; target: string | GraphNode;
}

function GraphView({ nodes, links, onSelect }: { nodes: GraphNode[]; links: GraphLink[]; onSelect: (id: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 400;

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "rgba(232,130,90,0.3)").attr("stroke-width", 1.5);

    const node = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", 8).attr("fill", "#E8825A").attr("stroke", "rgba(255,255,255,0.2)").attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (_, d) => onSelect(d.id))
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as never
      );

    const label = svg.append("g").selectAll("text").data(nodes).join("text")
      .text(d => d.title).attr("font-size", 11).attr("fill", "#9ca3af").attr("dx", 12).attr("dy", 4);

    simulation.on("tick", () => {
      link.attr("x1", d => (d.source as GraphNode).x || 0).attr("y1", d => (d.source as GraphNode).y || 0)
          .attr("x2", d => (d.target as GraphNode).x || 0).attr("y2", d => (d.target as GraphNode).y || 0);
      node.attr("cx", d => d.x || 0).attr("cy", d => d.y || 0);
      label.attr("x", d => d.x || 0).attr("y", d => d.y || 0);
    });

    return () => { simulation.stop(); };
  }, [nodes, links, onSelect]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

export default function BrainPage() {
  const [view, setView] = useState<"list" | "graph">("list");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [search, setSearch] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [showAiGen, setShowAiGen] = useState(false);
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
      return json.data as { nodes: GraphNode[]; links: GraphLink[] };
    },
    enabled: view === "graph",
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obsidian-notes"] }); setShowCreate(false); setNewTitle(""); setNewContent(""); },
  });

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
      setAiTopic("");
      setShowAiGen(false);
    },
  });

  const notes = notesData || [];

  function startEdit(note: Note) {
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Knowledge Brain</h1>
            <p className="text-gray-500 text-sm">Personal study notes with linked concepts</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === "list" ? "bg-re-500/20 text-re-400" : "text-gray-500 hover:text-gray-300"}`}>List</button>
            <button onClick={() => setView("graph")} className={`px-3 py-1.5 text-xs font-medium transition-all ${view === "graph" ? "bg-re-500/20 text-re-400" : "text-gray-500 hover:text-gray-300"}`}>Graph</button>
          </div>
          <button onClick={() => aiGenMutation.mutate("")} disabled={aiGenMutation.isPending}
            className="text-xs py-1.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50">
            {aiGenMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiGenMutation.isPending ? "Generating..." : "AI Random Note"}
          </button>
          <button onClick={() => setShowAiGen(true)}
            className="text-xs py-1.5 px-3 rounded-xl border border-purple-500/20 bg-white/5 text-gray-400 hover:text-purple-300 transition-all flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Custom Topic
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Note</button>
        </div>
      </div>

      {view === "graph" ? (
        <div className="glass-card overflow-hidden" style={{ height: "60vh" }}>
          {graphData?.nodes?.length ? (
            <GraphView nodes={graphData.nodes} links={graphData.links} onSelect={id => { const note = notes.find(n => n.id === id); if (note) setSelectedNote(note); }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center"><Brain className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">Create notes to see the graph</p></div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
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
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <Brain className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No notes yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 btn-primary text-sm">Create first note</button>
            </div>
          )}
        </>
      )}

      {/* Note detail modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setSelectedNote(null); setIsEditing(false); } }}>
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              {isEditing ? (
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 bg-transparent text-white font-semibold text-lg focus:outline-none border-b border-re-500/50" />
              ) : (
                <h2 className="text-white font-semibold text-lg">{selectedNote.title}</h2>
              )}
              <div className="flex gap-2 ml-3">
                <button onClick={() => isEditing ? setIsEditing(false) : startEdit(selectedNote)} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white">
                  {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { setSelectedNote(null); setIsEditing(false); }} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isEditing ? (
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 resize-none" />
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
              )}
            </div>
            {selectedNote.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {selectedNote.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Custom Topic Modal */}
      {showAiGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-white font-semibold">AI Generate Note</h2>
              </div>
              <button onClick={() => setShowAiGen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-gray-500 text-sm">Enter a Georgia Real Estate topic and the AI will generate a comprehensive study note for your Knowledge Brain.</p>
              <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && aiTopic.trim()) { aiGenMutation.mutate(aiTopic); } }}
                placeholder="e.g. LODCAR fiduciary duties, cap rate calculations, BRRETA..."
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
              <div className="flex flex-wrap gap-1.5">
                {["BRRETA", "LODCAR duties", "GAR Purchase & Sale Agreement", "Fair Housing protected classes", "Cap rate formula", "License renewal"].map(t => (
                  <button key={t} onClick={() => setAiTopic(t)} className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20">{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/8">
              <button onClick={() => setShowAiGen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => aiTopic.trim() && aiGenMutation.mutate(aiTopic)} disabled={!aiTopic.trim() || aiGenMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {aiGenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create note modal */}
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
