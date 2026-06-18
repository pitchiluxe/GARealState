"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Shield, Users, Zap, GraduationCap, BookOpen, Activity,
  Loader2, Circle, Clock, Brain, ClipboardList, Search,
  BarChart3, UserCheck, UserX, TrendingUp, Award
} from "lucide-react";

const OWNER_EMAIL = "erickomari243@gmail.com";

interface MonitorUser {
  id: string; name: string | null; email: string; role: string;
  isActive: boolean; isOnline: boolean;
  lastSeen: string | null; createdAt: string;
  modules: number; xp: number; certs: number;
}

interface SessionEntry {
  studentId: string; createdAt: string; sessionType: string;
}

interface MonitorData {
  users: MonitorUser[];
  sessions: SessionEntry[];
  stats: {
    totalUsers: number; activeUsers: number; onlineNow: number;
    totalXp: number; totalModules: number; totalCerts: number; recentSessions: number;
  };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000)  return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-xs text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not owner
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email !== OWNER_EMAIL) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const { data, isLoading, dataUpdatedAt } = useQuery<{ success: boolean; data: MonitorData }>({
    queryKey: ["admin-monitor"],
    queryFn: async () => {
      const res = await fetch("/api/admin/monitor");
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    },
    refetchInterval: 30_000, // live refresh every 30s
    enabled: session?.user?.email === OWNER_EMAIL,
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-re-400" />
      </div>
    );
  }

  if (session?.user?.email !== OWNER_EMAIL) return null;

  const d = data?.data;
  if (!d) return null;

  const onlineUsers  = d.users.filter(u => u.isOnline);
  const offlineUsers = d.users.filter(u => !u.isOnline);
  const lastRefresh  = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="p-3 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Owner Access Only</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Agent Monitor</h1>
          <p className="text-gray-500 text-sm">Live platform dashboard — GA Real Estate Academy</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium justify-end">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {d.stats.onlineNow} online now
          </div>
          <div className="text-gray-600 text-xs mt-0.5">Last refresh: {lastRefresh}</div>
          <div className="text-gray-600 text-xs">Auto-refreshes every 30s</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Users}        label="Total Users"     value={d.stats.totalUsers}   sub={`${d.stats.activeUsers} active`}          color="#60a5fa" />
        <StatCard icon={Circle}       label="Online Now"      value={d.stats.onlineNow}    sub="last 5 minutes"                            color="#4ade80" />
        <StatCard icon={Zap}          label="Total XP"        value={d.stats.totalXp.toLocaleString()} sub="all users combined"           color="#E8825A" />
        <StatCard icon={BookOpen}     label="Modules Done"    value={d.stats.totalModules} sub="completed modules"                        color="#a78bfa" />
        <StatCard icon={GraduationCap}label="Certificates"    value={d.stats.totalCerts}   sub="issued total"                             color="#fbbf24" />
        <StatCard icon={Activity}     label="AI Sessions"     value={d.stats.recentSessions} sub="last 50 recorded"                       color="#f87171" />
      </div>

      {/* Online Users */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
          <h2 className="text-white font-bold">Online Now ({onlineUsers.length})</h2>
        </div>
        {onlineUsers.length === 0 ? (
          <p className="text-gray-600 text-sm italic">No users online in the last 5 minutes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {onlineUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-re-500 to-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(u.name || u.email).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d1426]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{u.name || "—"}</div>
                  <div className="text-gray-500 text-xs truncate">{u.email}</div>
                  <div className="text-green-400 text-xs">Active {timeAgo(u.lastSeen)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-re-400 font-semibold">{u.xp.toLocaleString()} XP</div>
                  <div className="text-xs text-gray-600">{u.modules} modules</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Users Table */}
      <div className="glass-card p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-re-400" /> All Users ({d.users.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Status","Name","Email","Role","XP","Modules","Certs","Last Seen","Joined"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider pb-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {d.users.map(u => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className={`w-2 h-2 rounded-full ${u.isOnline ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-white font-medium">{u.name || <span className="text-gray-600 italic">no name</span>}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs ${u.email === OWNER_EMAIL ? "text-red-400 font-semibold" : "text-gray-400"}`}>{u.email}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      u.role === "ADMIN" ? "bg-red-500/20 text-red-400" :
                      u.role === "INSTRUCTOR" ? "bg-purple-500/20 text-purple-400" :
                      "bg-white/8 text-gray-400"
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-re-400 font-medium">{u.xp.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{u.modules}</td>
                  <td className="py-2.5 pr-4">
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <GraduationCap className="w-3 h-3" />{u.certs}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500 text-xs whitespace-nowrap">{timeAgo(u.lastSeen)}</td>
                  <td className="py-2.5 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent AI Sessions */}
      <div className="glass-card p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-re-400" /> Recent AI Sessions (last 50)
        </h2>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {d.sessions.map((s, i) => {
            const user = d.users.find(u => u.id === s.studentId);
            return (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/4 last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  s.sessionType === "COPILOT" ? "bg-re-400" :
                  s.sessionType === "TRAINING" ? "bg-purple-400" : "bg-blue-400"
                }`} />
                <span className="text-gray-400 text-xs flex-1 truncate">
                  {user?.name || user?.email || s.studentId.slice(0, 12)}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/8 text-gray-500 flex-shrink-0">{s.sessionType}</span>
                <span className="text-gray-600 text-xs flex-shrink-0 whitespace-nowrap">{timeAgo(s.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard snapshot */}
      <div className="glass-card p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Top Performers by XP
        </h2>
        <div className="space-y-2">
          {[...d.users].sort((a, b) => b.xp - a.xp).slice(0, 10).map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/3 transition-colors">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                i === 1 ? "bg-gray-400/20 text-gray-300" :
                i === 2 ? "bg-amber-600/20 text-amber-500" : "bg-white/8 text-gray-500"
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm truncate block">{u.name || u.email}</span>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.isOnline ? "bg-green-400" : "bg-gray-700"}`} />
              <span className="text-re-400 text-sm font-bold flex-shrink-0">{u.xp.toLocaleString()} XP</span>
              <span className="text-gray-600 text-xs flex-shrink-0">{u.modules} modules</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
