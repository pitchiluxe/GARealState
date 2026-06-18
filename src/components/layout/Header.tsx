"use client";

import { useSession } from "next-auth/react";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?unread=true&limit=5");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.length || 0;

  return (
    <header className="h-14 bg-[#0d1526] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search hint */}
        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-500 cursor-pointer hover:border-re-500/30 hover:text-gray-400 transition-all">
          <Search className="w-3.5 h-3.5" />
          <span>Search topics...</span>
          <span className="hidden md:block ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">Ctrl K</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-re-500 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#111827] border border-white/10 rounded-xl shadow-panel z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-re-500/20 text-re-400 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              {notifData && notifData.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {notifData.slice(0, 5).map((n: { id: string; title: string; body: string }) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="text-xs font-medium text-white">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-600">No new notifications</div>
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-7 h-7 bg-gradient-to-br from-re-500 to-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {session?.user?.name
                ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "??"}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white">{session?.user?.name || "Student"}</div>
            <div className="text-[10px] text-gray-500">{session?.user?.role || "STUDENT"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
