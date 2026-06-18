"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  CheckCircle2, AlertTriangle, Zap, TrendingUp, Clock, Star,
  Brain, GraduationCap, Cpu, Timer, BookOpen, Target,
} from "lucide-react";
import Link from "next/link";
import { formatDuration, formatRelative, humanizeCategoryName } from "@/lib/utils/format";
import { chartColors } from "@/lib/design-tokens";

function MetricCard({ title, value, subtitle, icon, trend, color = "re" }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; trend?: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    re:     "bg-re-500/15 text-re-400",
    blue:   "bg-blue-500/15 text-blue-400",
    red:    "bg-red-500/15 text-red-400",
    yellow: "bg-yellow-500/15 text-yellow-400",
    purple: "bg-purple-500/15 text-purple-400",
    ai:     "bg-ai-500/15 text-ai-400",
    green:  "bg-green-500/15 text-green-400",
  };

  return (
    <div className="glass-card p-5 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.re}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm font-medium text-gray-300">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 30000,
  });

  const { data: casesData } = useQuery({
    queryKey: ["cases", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/cases?pageSize=5");
      const json = await res.json();
      return json.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-32 animate-pulse">
              <div className="bg-white/5 rounded-lg h-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const m = analytics || {};

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Disclaimer */}
      <div className="px-3 sm:px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/8 text-center">
        <p className="text-xs text-amber-300 font-medium">
          Not affiliated with PSI, GREC, or the State of Georgia. For educational and exam prep purposes only. by Erick OMARI
        </p>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-re-500/20 via-re-500/10 to-transparent border border-re-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-re-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🍑</span>
          </div>
          <div>
            <div className="text-white font-semibold">Ready to study?</div>
            <div className="text-gray-400 text-sm">Open the AI Study Copilot for instant help on any GA RE exam topic</div>
          </div>
        </div>
        <Link href="/copilot" className="self-end sm:self-auto">
          <button className="btn-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Open Copilot
          </button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Tests" value={m.totalTests || 0} subtitle="All time" icon={<BookOpen className="w-5 h-5" />} trend={12} color="re" />
        <MetricCard title="Passed" value={m.passedTests || 0} subtitle="Score ≥ 70%" icon={<CheckCircle2 className="w-5 h-5" />} trend={5} color="green" />
        <MetricCard title="Average Score" value={m.avgScore ? `${m.avgScore}%` : "—"} subtitle="All completed tests" icon={<Target className="w-5 h-5" />} color="blue" />
        <MetricCard title="AI Sessions" value={m.aiSessionsToday || 0} subtitle="Today" icon={<Zap className="w-5 h-5" />} color="ai" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Completed Tests" value={m.completedTests || 0} subtitle="Finished attempts" icon={<Star className="w-5 h-5" />} color="yellow" />
        <MetricCard title="Pass Rate" value={m.completedTests > 0 ? `${Math.round((m.passedTests / m.completedTests) * 100)}%` : "—"} subtitle="Of completed tests" icon={<TrendingUp className="w-5 h-5" />} color="re" />
        <MetricCard title="Training Sessions" value={m.totalTrainingSessions || 0} subtitle="Exam simulations" icon={<GraduationCap className="w-5 h-5" />} color="purple" />
        <MetricCard title="Total AI Sessions" value={m.totalAiSessions || 0} subtitle="All-time copilot use" icon={<Cpu className="w-5 h-5" />} color="ai" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Score Trend</h3>
              <p className="text-gray-500 text-sm">Last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-re-500" />
              <span className="text-gray-400">Avg Score</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={m.scoreTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb" }} />
              <Line type="monotone" dataKey="score" stroke="#E8825A" strokeWidth={2} dot={{ fill: "#E8825A", strokeWidth: 0, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h3 className="text-white font-semibold">Topics Studied</h3>
            <p className="text-gray-500 text-sm">By test count</p>
          </div>
          {m.topCategories?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={m.topCategories} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="category">
                    {m.topCategories.map((_: unknown, i: number) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f9fafb", fontSize: "12px" }}
                    formatter={(v, n) => [v, humanizeCategoryName(String(n))]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {m.topCategories.slice(0, 4).map((item: { category: string; count: number }, i: number) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                      <span className="text-gray-400 truncate">{humanizeCategoryName(item.category)}</span>
                    </div>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600">
              <BarChart className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Activity + Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-ai-400" />
              <div>
                <h3 className="text-white font-semibold text-sm">Recent AI Activity</h3>
                <p className="text-gray-500 text-xs">Your copilot session history</p>
              </div>
            </div>
            <Link href="/copilot"><button className="btn-secondary text-xs py-1.5">Use Copilot</button></Link>
          </div>
          {m.recentAiSessions?.length > 0 ? (
            <div className="space-y-2">
              {m.recentAiSessions.map((s: { id: string; sessionType: string; modelVersion: string | null; latencyMs: number | null; createdAt: string }) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <div className="w-7 h-7 bg-ai-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-3.5 h-3.5 text-ai-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium">{s.sessionType}</div>
                    <div className="text-xs text-gray-600 font-mono truncate">{s.modelVersion?.split("/").pop() || "AI"}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.latencyMs && <div className="flex items-center gap-1 text-xs text-gray-500"><Timer className="w-3 h-3" />{(s.latencyMs / 1000).toFixed(1)}s</div>}
                    <div className="text-xs text-gray-600">{formatRelative(s.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-gray-600">
              <Brain className="w-7 h-7 mb-2 opacity-40" />
              <p className="text-xs">No AI sessions yet</p>
              <Link href="/copilot"><button className="mt-2 btn-primary text-xs py-1.5">Start studying</button></Link>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-re-400" />
              <div>
                <h3 className="text-white font-semibold text-sm">Training Progress</h3>
                <p className="text-gray-500 text-xs">{m.totalTrainingSessions || 0} sessions completed</p>
              </div>
            </div>
            <Link href="/training"><button className="btn-secondary text-xs py-1.5">Practice</button></Link>
          </div>
          {m.recentTrainingSessions?.length > 0 ? (
            <div className="space-y-2">
              {m.recentTrainingSessions.map((t: { id: string; scenarioName: string; difficulty: string; score: number | null; completedAt: string | null }) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${(t.score || 0) >= 80 ? "bg-green-500/15" : (t.score || 0) >= 60 ? "bg-yellow-500/15" : "bg-red-500/15"}`}>
                    <Star className={`w-3.5 h-3.5 ${(t.score || 0) >= 80 ? "text-green-400" : (t.score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium truncate">{t.scenarioName}</div>
                    <div className="text-xs text-gray-600">{t.difficulty}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${(t.score || 0) >= 80 ? "text-green-400" : (t.score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>{t.score ?? "—"}</div>
                    {t.completedAt && <div className="text-xs text-gray-600">{formatRelative(t.completedAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-gray-600">
              <GraduationCap className="w-7 h-7 mb-2 opacity-40" />
              <p className="text-xs">No training yet</p>
              <Link href="/training"><button className="mt-2 btn-primary text-xs py-1.5">Start training</button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Practice Tests */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Recent Practice Tests</h3>
            <p className="text-gray-500 text-sm">Your latest test sessions</p>
          </div>
          <Link href="/cases"><button className="btn-secondary text-xs py-2">View all</button></Link>
        </div>
        {casesData?.length > 0 ? (
          <div className="space-y-2">
            {casesData.map((c: { id: string; testNumber: string; subject: string; status: string; score: number | null; category: string; createdAt: string }) => (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-gray-500 w-32 flex-shrink-0">{c.testNumber}</div>
                    <div>
                      <div className="text-sm text-white font-medium truncate max-w-xs">{c.subject}</div>
                      <div className="text-xs text-gray-500">{humanizeCategoryName(c.category)} · {formatRelative(c.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.score !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.score >= 70 ? "score-pass" : "score-fail"}`}>
                        {c.score}%
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === "COMPLETED" ? "status-resolved" :
                      c.status === "IN_PROGRESS" ? "status-progress" :
                      c.status === "OPEN" ? "status-open" : "status-closed"
                    }`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No practice tests yet</p>
            <Link href="/cases"><button className="mt-3 btn-primary text-xs py-2">Start a test</button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
