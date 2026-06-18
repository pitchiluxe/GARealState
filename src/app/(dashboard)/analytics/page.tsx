"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Target, Brain, BookOpen, Star, Loader2 } from "lucide-react";
import { humanizeCategoryName } from "@/lib/utils/format";
import { chartColors } from "@/lib/design-tokens";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;

  const m = analytics || {};

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm">Your study performance and progress</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tests", value: m.totalTests || 0, icon: <BookOpen className="w-4 h-4" />, color: "re" },
          { label: "Pass Rate", value: m.completedTests > 0 ? `${Math.round((m.passedTests / m.completedTests) * 100)}%` : "—", icon: <Target className="w-4 h-4" />, color: "green" },
          { label: "Avg Score", value: m.avgScore ? `${m.avgScore}%` : "—", icon: <Star className="w-4 h-4" />, color: "blue" },
          { label: "AI Sessions", value: m.totalAiSessions || 0, icon: <Brain className="w-4 h-4" />, color: "ai" },
        ].map(c => (
          <div key={c.label} className="glass-card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.color === "re" ? "bg-re-500/15 text-re-400" : c.color === "green" ? "bg-green-500/15 text-green-400" : c.color === "blue" ? "bg-blue-500/15 text-blue-400" : "bg-ai-500/15 text-ai-400"}`}>
              {c.icon}
            </div>
            <div className="text-xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Score Trend */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-1">Score Trend</h3>
        <p className="text-gray-500 text-sm mb-4">Average score per day (last 7 days)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={m.scoreTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb" }} />
            <Line type="monotone" dataKey="score" stroke="#E8825A" strokeWidth={2.5} dot={{ fill: "#E8825A", r: 4 }} name="Avg Score" />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Test Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Tests by Category</h3>
          {m.topCategories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={m.topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={90} tickFormatter={humanizeCategoryName} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb", fontSize: 12 }} formatter={(v, n, p) => [v, humanizeCategoryName(p.payload.category)]} />
                <Bar dataKey="count" fill="#E8825A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No data yet</div>}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Category Distribution</h3>
          {m.topCategories?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={m.topCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="category">
                    {m.topCategories.map((_: unknown, i: number) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb", fontSize: 12 }} formatter={(v, n) => [v, humanizeCategoryName(String(n))]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {m.topCategories.map((item: { category: string; count: number }, i: number) => (
                  <div key={item.category} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chartColors[i % chartColors.length] }} />
                    <span className="text-gray-400 truncate">{humanizeCategoryName(item.category)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No data yet</div>}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Test Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Open", value: m.openTests || 0, color: "text-blue-400", bg: "bg-blue-500/15" },
            { label: "In Progress", value: m.inProgressTests || 0, color: "text-yellow-400", bg: "bg-yellow-500/15" },
            { label: "Completed", value: m.completedTests || 0, color: "text-green-400", bg: "bg-green-500/15" },
            { label: "Passed", value: m.passedTests || 0, color: "text-re-400", bg: "bg-re-500/15" },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-xl ${s.bg} text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
