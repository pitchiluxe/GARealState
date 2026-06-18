"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { useStudyStore } from "@/lib/store";
import { Settings, User, Brain, Save, Loader2, Check } from "lucide-react";
import { ExamCategory, GARELicenseType } from "@/types";
import { humanizeCategoryName } from "@/lib/utils/format";

const MODELS = [
  { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3 (Free)" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)" },
  { id: "qwen/qwen3-235b-a22b:free", name: "Qwen3 235B (Free)" },
  { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 Maverick (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)" },
];

const CATEGORIES: ExamCategory[] = ["LICENSE_LAW","CONTRACTS","AGENCY","FINANCE","PROPERTY","VALUATION","FAIR_HOUSING","CLOSING","MATH","OTHER"];
const LICENSE_TYPES: GARELicenseType[] = ["SALESPERSON","ASSOCIATE_BROKER","BROKER","CAM","ALL"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { selectedModel, setSelectedModel, focusMode, setFocusMode, preferredCategory, setPreferredCategory, licenseType, setLicenseType } = useStudyStore();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Customize your study experience</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-re-400" /> Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-re-500/20 flex items-center justify-center text-lg font-bold text-re-400">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-white font-medium">{session?.user?.name || "Student"}</div>
            <div className="text-gray-500 text-sm">{session?.user?.email}</div>
            <div className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400 inline-block mt-1">{(session?.user as { role?: string })?.role || "STUDENT"}</div>
          </div>
        </div>
      </div>

      {/* AI Preferences */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-ai-400" /> AI Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">AI Model</label>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <p className="text-xs text-gray-600 mt-1">Select the AI model for Study Copilot responses</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Focus Mode</label>
            <div className="flex gap-2 flex-wrap">
              {(["standard", "deep", "quick"] as const).map(mode => (
                <button key={mode} onClick={() => setFocusMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${focusMode === mode ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1">Standard: balanced · Deep: detailed explanations · Quick: concise answers</p>
          </div>
        </div>
      </div>

      {/* Study Preferences */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-re-400" /> Study Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">License Type I&apos;m Preparing For</label>
            <div className="flex gap-2 flex-wrap">
              {LICENSE_TYPES.map(lt => (
                <button key={lt} onClick={() => setLicenseType(lt)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${licenseType === lt ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
                  {lt.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Preferred Study Category</label>
            <select value={preferredCategory} onChange={e => setPreferredCategory(e.target.value as ExamCategory)} className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
              {CATEGORIES.map(c => <option key={c} value={c}>{humanizeCategoryName(c)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary flex items-center gap-2">
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
      </button>
    </div>
  );
}
