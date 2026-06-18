"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, TrendingUp, Loader2, Crown } from "lucide-react";
import { getXpProgress } from "@/lib/classroom";
import { useSession } from "next-auth/react";

interface LeaderboardEntry {
  id: string; name: string; email: string;
  _sum: { xp: number | null };
  _count: { id: number };
}

export default function LeaderboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 30000,
  });

  const entries: LeaderboardEntry[] = data || [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-500 text-sm">Top students by XP earned</p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 0, 2].map((idx, pos) => {
            const entry = entries[idx];
            if (!entry) return null;
            const xp = entry._sum?.xp || 0;
            const progress = getXpProgress(xp);
            const isMe = entry.id === session?.user?.id;
            const heights = ["h-28", "h-36", "h-24"];
            const medals = ["🥈", "🥇", "🥉"];
            const colors = [
              "border-gray-500/40 bg-gray-500/5",
              "border-yellow-500/40 bg-yellow-500/8",
              "border-amber-700/40 bg-amber-700/5",
            ];
            return (
              <div key={entry.id} className={`glass-card p-4 border flex flex-col items-center justify-end ${heights[pos]} ${colors[pos]} ${isMe ? "ring-2 ring-re-500/50" : ""}`}>
                <div className="text-2xl mb-1">{medals[pos]}</div>
                <div className="text-xs font-bold text-white text-center truncate w-full">{entry.name || entry.email.split("@")[0]}</div>
                <div className="text-xs text-gray-400">{progress.level.title}</div>
                <div className="text-sm font-bold text-re-400">{xp.toLocaleString()} XP</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : entries.length > 0 ? (
          <div>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/8 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Student</div>
              <div className="col-span-3">Level</div>
              <div className="col-span-2 text-right">XP</div>
              <div className="col-span-1 text-right">Tests</div>
            </div>
            {entries.map((entry, i) => {
              const xp = entry._sum?.xp || 0;
              const progress = getXpProgress(xp);
              const isMe = entry.id === session?.user?.id;
              const isTop3 = i < 3;
              return (
                <div key={entry.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/5 items-center ${isMe ? "bg-re-500/8 border-re-500/20" : "hover:bg-white/3"} transition-all`}>
                  <div className="col-span-1">
                    {isTop3 ? (
                      <span className="text-base">{["🥇", "🥈", "🥉"][i]}</span>
                    ) : (
                      <span className="text-sm text-gray-500 font-medium">{i + 1}</span>
                    )}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-re-500/20 flex items-center justify-center text-sm font-bold text-re-400 flex-shrink-0">
                      {(entry.name || entry.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isMe ? "text-re-300" : "text-white"}`}>
                        {entry.name || entry.email.split("@")[0]}
                        {isMe && <span className="ml-1.5 text-xs text-re-500">(you)</span>}
                      </div>
                      <div className="text-xs text-gray-600 truncate max-w-[120px]">{entry.email}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-xs text-gray-300">{progress.level.title}</div>
                    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-re-500 rounded-full" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-re-400">{xp.toLocaleString()}</span>
                    <span className="text-xs text-gray-600 block">XP</span>
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-400">{entry._count?.id || 0}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Trophy className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No students yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
