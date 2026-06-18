"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Shield, Users, BookOpen, Brain, FileText, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { formatRelative } from "@/lib/utils/format";
import { redirect } from "next/navigation";

interface User {
  id: string; name: string; email: string; role: string;
  isActive: boolean; lastSeen: string | null; createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Unauthorized");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Unauthorized");
      const json = await res.json();
      return json.data as User[];
    },
  });

  const userRole = (session?.user as { role?: string })?.role;
  if (userRole && !["ADMIN", "INSTRUCTOR"].includes(userRole)) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-white font-semibold">Access Denied</h2>
        <p className="text-gray-500 text-sm mt-1">Admin or Instructor role required.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-re-500/15 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-re-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform overview and user management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-24 animate-pulse"><div className="bg-white/5 rounded h-full" /></div>)
        ) : (
          <>
            <div className="glass-card p-4">
              <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center mb-3"><Users className="w-4 h-4 text-blue-400" /></div>
              <div className="text-xl font-bold text-white">{stats?.totalUsers || 0}</div>
              <div className="text-xs text-gray-500">Total Users</div>
            </div>
            <div className="glass-card p-4">
              <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center mb-3"><Users className="w-4 h-4 text-green-400" /></div>
              <div className="text-xl font-bold text-white">{stats?.activeUsers || 0}</div>
              <div className="text-xs text-gray-500">Active Users</div>
            </div>
            <div className="glass-card p-4">
              <div className="w-8 h-8 bg-re-500/15 rounded-lg flex items-center justify-center mb-3"><FileText className="w-4 h-4 text-re-400" /></div>
              <div className="text-xl font-bold text-white">{stats?.totalTests || 0}</div>
              <div className="text-xs text-gray-500">Practice Tests</div>
            </div>
            <div className="glass-card p-4">
              <div className="w-8 h-8 bg-ai-500/15 rounded-lg flex items-center justify-center mb-3"><Brain className="w-4 h-4 text-ai-400" /></div>
              <div className="text-xl font-bold text-white">{stats?.totalSessions || 0}</div>
              <div className="text-xs text-gray-500">AI Sessions</div>
            </div>
          </>
        )}
      </div>

      {/* User Management */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/8">
          <h2 className="text-white font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-re-400" /> Users</h2>
        </div>
        {usersLoading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Joined</div>
            </div>
            {users?.map(user => (
              <div key={user.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/5 items-center hover:bg-white/3 transition-all">
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-re-500/20 flex items-center justify-center text-xs font-bold text-re-400 flex-shrink-0">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white truncate">{user.name || "—"}</span>
                </div>
                <div className="col-span-4 text-sm text-gray-400 truncate hidden sm:block">{user.email}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "ADMIN" ? "bg-red-500/15 text-red-400" :
                    user.role === "INSTRUCTOR" ? "bg-amber-500/15 text-amber-400" :
                    "bg-blue-500/15 text-blue-400"
                  }`}>{user.role}</span>
                </div>
                <div className="col-span-1 hidden sm:flex items-center">
                  {user.isActive ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <div className="col-span-2 text-right text-xs text-gray-600 hidden sm:block">{formatRelative(user.createdAt)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
