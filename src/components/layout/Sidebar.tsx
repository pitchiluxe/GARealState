"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  BookOpenCheck,
  Trophy,
  Coffee,
  BrainCircuit,
  Newspaper,
  Calculator,
  Youtube,
  ClipboardList,
  Zap,
  Activity,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getXpProgress } from "@/lib/classroom";

const OWNER_EMAIL = "erickomari243@gmail.com";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",     description: "Study overview & metrics" },
  { href: "/copilot",    icon: Brain,            label: "Study Copilot", description: "AI exam topic assistant", highlight: true },
  { href: "/knowledge",  icon: BookOpen,         label: "Knowledge Base",description: "GA RE reference library" },
  { href: "/training",   icon: GraduationCap,    label: "Exam Practice", description: "AI examiner simulations" },
  { href: "/classroom",  icon: BookOpenCheck,    label: "Classroom",     description: "Courses, labs & certs", badge: "NEW" },
  { href: "/cases",      icon: ClipboardList,    label: "Practice Tests",description: "Test history & sessions" },
  { href: "/analytics",  icon: BarChart3,        label: "Analytics",     description: "Study performance" },
  { href: "/leaderboard",icon: Trophy,           label: "Leaderboard",   description: "Student XP rankings" },
  { href: "/exam",       icon: FileText,         label: "Mock Exam",     description: "Full exam simulation", badge: "NEW" },
  { href: "/updates",    icon: Newspaper,        label: "Law Updates",   description: "GA RE law changes" },
  { href: "/formulas",   icon: Calculator,       label: "Formulas",      description: "Key RE math formulas" },
  { href: "/youtube",    icon: Youtube,          label: "Study Videos",  description: "GA RE tutorial videos" },
  { href: "/breakroom",  icon: Coffee,           label: "Study Group",   description: "Chat & voice lounge", badge: "NEW" },
  { href: "/brain",      icon: BrainCircuit,     label: "Knowledge Brain",description: "Concept knowledge graph", highlight: true, badge: "HOT" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [totalXp, setTotalXp] = useState(0);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // XP fetch
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/classroom/progress")
      .then(r => r.json())
      .then(d => setTotalXp(d.totalXp || 0))
      .catch(() => {});
  }, [session?.user?.id]);

  // Presence heartbeat — fires on mount and every 2 min
  useEffect(() => {
    if (!session?.user?.id) return;
    const beat = () => fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    beat();
    const id = setInterval(beat, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  // Online count — polls every 60s
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetch_ = () =>
      fetch("/api/presence/online")
        .then(r => r.json())
        .then(d => setOnlineCount(d.count ?? null))
        .catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  const xpInfo = useMemo(() => getXpProgress(totalXp), [totalXp]);

  const activeHrefs = useMemo(
    () =>
      new Set(
        navItems
          .filter(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
          .map(item => item.href)
      ),
    [pathname]
  );

  const isOwner = session?.user?.email === OWNER_EMAIL;
  const isAdmin  = session?.user?.role === "ADMIN" || session?.user?.role === "INSTRUCTOR" || isOwner;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onMobileClose} />
      )}

      <aside className={cn(
        "w-64 bg-[#0d1526] border-r border-white/5 flex flex-col h-screen",
        "fixed top-0 left-0 z-50 transition-transform duration-300",
        "lg:relative lg:z-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-re-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-re-500/30 group-hover:shadow-re-500/50 transition-all group-hover:scale-105">
              <span className="text-lg">🍑</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-re-400/60 uppercase tracking-widest leading-none mb-0.5">
                Georgia
              </div>
              <div className="font-black text-xl leading-none bg-gradient-to-r from-white via-white to-re-300 bg-clip-text text-transparent">
                Real Estate
              </div>
              <div className="text-[9px] text-re-400/40 font-medium tracking-widest leading-none mt-0.5">
                by Erick OMARI
              </div>
            </div>
          </Link>
        </div>

        {/* AI + Online pill */}
        <div className="mx-4 mt-3 mb-1 space-y-1.5">
          <div className="flex items-center gap-2 bg-re-500/10 border border-re-500/20 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-re-400 rounded-full animate-pulse" />
            <span className="text-re-400 text-xs font-medium">AI Study Copilot Active</span>
          </div>
          {/* Online users — visible to everyone */}
          <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/15 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">
              {onlineCount === null ? "…" : onlineCount} student{onlineCount !== 1 ? "s" : ""} online now
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map(item => {
              const isActive = activeHrefs.has(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onMobileClose}>
                  <div className={cn("sidebar-item group", isActive && "active", item.highlight && !isActive && "border border-re-500/10 bg-re-500/5")}>
                    <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-re-400" : "text-gray-500 group-hover:text-gray-300")} />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium leading-none", isActive ? "text-re-300" : "")}>
                        {item.label}
                        {item.highlight && (
                          <span className="ml-1.5 text-xs bg-re-500/20 text-re-400 px-1.5 py-0.5 rounded-md font-semibold">AI</span>
                        )}
                        {"badge" in item && item.badge && (
                          item.badge === "HOT" ? (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-bold text-red-400 animate-pulse" style={{ textShadow: "0 0 8px rgba(248,113,113,0.8)" }}>
                              HOT
                            </span>
                          ) : (
                            <span className="ml-1.5 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-semibold">
                              {item.badge}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 truncate">{item.description}</div>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-re-500 flex-shrink-0" />}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="mt-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</span>
              </div>
              <Link href="/admin" onClick={onMobileClose}>
                <div className={cn("sidebar-item group", pathname === "/admin" && "active")}>
                  <Shield className={cn("w-4 h-4 flex-shrink-0", pathname === "/admin" ? "text-re-400" : "text-gray-500 group-hover:text-gray-300")} />
                  <div>
                    <div className="text-sm font-medium">Admin Panel</div>
                    <div className="text-xs text-gray-600">Manage platform</div>
                  </div>
                </div>
              </Link>

              {/* Owner-only: Agent Monitor */}
              {isOwner && (
                <Link href="/admin/monitor" onClick={onMobileClose}>
                  <div className={cn(
                    "sidebar-item group mt-0.5",
                    pathname.startsWith("/admin/monitor") && "active",
                    "border border-red-500/20 bg-red-500/5"
                  )}>
                    <Activity className={cn("w-4 h-4 flex-shrink-0", pathname.startsWith("/admin/monitor") ? "text-red-400" : "text-red-500/60 group-hover:text-red-400")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-red-300 flex items-center gap-1.5">
                        Agent Monitor
                        <span className="text-xs bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-bold">LIVE</span>
                      </div>
                      <div className="text-xs text-gray-600">Real-time user activity</div>
                    </div>
                    {onlineCount !== null && onlineCount > 0 && (
                      <span className="w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {onlineCount > 9 ? "9+" : onlineCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="glass-card p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-re-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {session?.user?.name
                    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    : "??"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {session?.user?.name || "Student"}
                  {isOwner && <span className="ml-1 text-xs text-red-400">👑</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-semibold truncate" style={{ color: xpInfo.level.color }}>
                    Lv.{xpInfo.level.level} {xpInfo.level.title}
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpInfo.percent}%`, background: xpInfo.level.color }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/settings" className="flex-1">
              <button className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 py-2">
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-danger text-xs flex items-center justify-center gap-1.5 py-2 px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
