"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle, Clock, Loader2, Tag, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { humanizeCategoryName, formatRelative } from "@/lib/utils/format";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [editScore, setEditScore] = useState<string>("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${id}`);
      const json = await res.json();
      return json.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case", id] }),
  });

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;
  if (!data) return <div className="p-6 text-gray-500">Test not found</div>;

  const test = data;
  const activities = test.activities || [];
  const tags = test.tags || [];

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-4xl">
      <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to tests
      </Link>

      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-gray-500">{test.testNumber}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">{humanizeCategoryName(test.category)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                test.status === "COMPLETED" ? "status-resolved" :
                test.status === "IN_PROGRESS" ? "status-progress" :
                test.status === "OPEN" ? "status-open" : "status-closed"
              }`}>{test.status.replace("_", " ")}</span>
            </div>
            <h1 className="text-white text-xl font-bold">{test.subject}</h1>
            <p className="text-gray-500 text-sm mt-1">{test.difficulty} · {formatRelative(test.createdAt)}</p>
          </div>
          {test.score !== null && (
            <div className={`text-3xl font-bold ${test.score >= test.passingScore ? "text-green-400" : "text-red-400"}`}>
              {test.score}%
              <div className="text-xs font-normal text-gray-500 text-right">Pass: {test.passingScore}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Update form */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-white font-semibold text-sm">Update Test</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Score (%)</label>
            <input type="number" min={0} max={100} value={editScore} onChange={e => setEditScore(e.target.value)} placeholder={String(test.score ?? "")} className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select value={editStatus || test.status} onChange={e => setEditStatus(e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => updateMutation.mutate({ score: editScore ? Number(editScore) : undefined, status: editStatus || undefined, notes: editNotes || undefined })}
              disabled={updateMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Save
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Study Notes</label>
          <textarea value={editNotes || test.notes || ""} onChange={e => setEditNotes(e.target.value)} rows={3} placeholder="Add study notes, reminders, or observations..." className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50 resize-none" />
        </div>
      </div>

      {/* Tags */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-re-400" /> Tags</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t: { id: string; tag: string }) => (
            <span key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 text-xs text-gray-300 border border-white/10">
              {t.tag}
              <button onClick={() => updateMutation.mutate({ removeTag: t.tag })} className="text-gray-600 hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMutation.mutate({ addTag: newTag }); setNewTag(""); } }} placeholder="Add a tag..." className="bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50 w-40" />
          <button onClick={() => { updateMutation.mutate({ addTag: newTag }); setNewTag(""); }} className="btn-secondary text-xs py-1.5 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>

      {/* Activity Log */}
      {activities.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-re-400" /> Activity</h3>
          <div className="space-y-2">
            {activities.map((a: { id: string; type: string; content: string; createdAt: string }) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-re-500 mt-2 flex-shrink-0" />
                <div>
                  <span className="text-gray-300 font-medium">{a.type.replace("_", " ")}</span>
                  {a.content && <span className="text-gray-500"> — {a.content}</span>}
                  <div className="text-xs text-gray-600">{formatRelative(a.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
