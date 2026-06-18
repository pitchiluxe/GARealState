"use client";

import { useSession } from "next-auth/react";
import { Bell, Menu, Search, X, BookOpen, GraduationCap, FileText, BarChart3, Trophy, BookOpenCheck, Calculator, Newspaper, Youtube, Coffee, Brain, BrainCircuit, LayoutDashboard, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard, desc: "Study overview & metrics" },
  { href: "/copilot",    label: "Study Copilot",   icon: Brain,           desc: "AI exam topic assistant" },
  { href: "/knowledge",  label: "Knowledge Base",  icon: BookOpen,        desc: "GA RE reference library" },
  { href: "/training",   label: "Exam Practice",   icon: GraduationCap,  desc: "AI examiner simulations" },
  { href: "/classroom",  label: "Classroom",       icon: BookOpenCheck,   desc: "Courses, labs & certs" },
  { href: "/exam",       label: "Mock Exam",        icon: FileText,        desc: "Full exam simulation" },
  { href: "/analytics",  label: "Analytics",       icon: BarChart3,       desc: "Study performance" },
  { href: "/leaderboard",label: "Leaderboard",     icon: Trophy,          desc: "Student XP rankings" },
  { href: "/formulas",   label: "Formulas",        icon: Calculator,      desc: "Key RE math formulas" },
  { href: "/updates",    label: "Law Updates",     icon: Newspaper,       desc: "GA RE law changes" },
  { href: "/youtube",    label: "Study Videos",    icon: Youtube,         desc: "GA RE tutorial videos" },
  { href: "/breakroom",  label: "Study Group",     icon: Coffee,          desc: "Chat & voice lounge" },
  { href: "/brain",      label: "Knowledge Brain", icon: BrainCircuit,    desc: "Concept knowledge graph" },
];

const EXAM_TOPICS = [
  { label: "License Law",       href: "/training", desc: "GREC requirements, license types, renewal" },
  { label: "Contracts",         href: "/training", desc: "Purchase & Sale Agreement, listing agreements" },
  { label: "Agency & Disclosure", href: "/training", desc: "BRRETA, fiduciary duties, LODCAR" },
  { label: "Real Estate Finance", href: "/training", desc: "Loan types, mortgage math, RESPA" },
  { label: "Fair Housing",      href: "/training", desc: "Protected classes, prohibited conduct" },
  { label: "Property Valuation",href: "/training", desc: "3 approaches to value, CMA, cap rate" },
  { label: "RE Math",           href: "/exam",     desc: "Commission, prorations, area calculations" },
  { label: "Closing & Title",   href: "/training", desc: "Georgia closing process, title insurance" },
];

interface KBArticle { id: string; title: string; body: string; category: string }

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kbResults, setKbResults] = useState<KBArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  // Ctrl+K opens search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setKbResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Live KB search with debounce
  useEffect(() => {
    if (!query.trim()) { setKbResults([]); return; }
    const timer = setTimeout(async () => {
      setKbLoading(true);
      try {
        const res = await fetch(`/api/knowledge?search=${encodeURIComponent(query)}&pageSize=5`);
        const json = await res.json();
        setKbResults(json.data || []);
      } catch { setKbResults([]); }
      finally { setKbLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Filtered nav + topic results
  const q = query.toLowerCase();
  const filteredNav = q
    ? NAV_ITEMS.filter(i => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    : NAV_ITEMS.slice(0, 6);
  const filteredTopics = q
    ? EXAM_TOPICS.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    : [];

  const allResults = [
    ...filteredNav.map(i => ({ type: "page" as const, label: i.label, desc: i.desc, href: i.href })),
    ...filteredTopics.map(t => ({ type: "topic" as const, label: t.label, desc: t.desc, href: t.href })),
    ...kbResults.map(a => ({ type: "article" as const, label: a.title, desc: a.category?.replace("_", " ") || "", href: "/knowledge" })),
  ];

  const navigate = useCallback((href: string) => {
    router.push(href);
    setSearchOpen(false);
  }, [router]);

  // Keyboard navigation inside modal
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allResults[selectedIndex]) navigate(allResults[selectedIndex].href);
  }

  return (
    <>
      <header className="h-14 bg-[#0d1526] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:border-re-500/30 hover:text-gray-400 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search topics...</span>
            <span className="hidden md:block ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">Ctrl K</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(v => !v)} className="relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-re-500 rounded-full" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#111827] border border-white/10 rounded-xl shadow-panel z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && <span className="text-xs bg-re-500/20 text-re-400 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
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
                {session?.user?.name ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "??"}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-white">{session?.user?.name || "Student"}</div>
              <div className="text-[10px] text-gray-500">{session?.user?.role || "STUDENT"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Search Modal ─────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl bg-[#0d1526] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search pages, topics, knowledge base..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-xs text-gray-600 border border-white/10 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {!query && (
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Quick Navigation</p>
                </div>
              )}

              {/* Nav + topic results */}
              {filteredNav.length > 0 && (
                <div>
                  {query && <div className="px-4 pt-3 pb-1"><p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Pages</p></div>}
                  {filteredNav.map((item, i) => {
                    const Icon = item.icon;
                    const idx = i;
                    return (
                      <button
                        key={item.href + item.label}
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedIndex === idx ? "bg-re-500/15" : "hover:bg-white/5"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredTopics.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1"><p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Exam Topics</p></div>
                  {filteredTopics.map((topic, i) => {
                    const idx = filteredNav.length + i;
                    return (
                      <button
                        key={topic.label}
                        onClick={() => navigate(topic.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedIndex === idx ? "bg-re-500/15" : "hover:bg-white/5"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">{topic.label}</div>
                          <div className="text-xs text-gray-500 truncate">{topic.desc}</div>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">Practice</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* KB article results */}
              {kbLoading && (
                <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                  <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Searching knowledge base...
                </div>
              )}
              {!kbLoading && kbResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1"><p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Knowledge Base</p></div>
                  {kbResults.map((article, i) => {
                    const idx = filteredNav.length + filteredTopics.length + i;
                    return (
                      <button
                        key={article.id}
                        onClick={() => navigate("/knowledge")}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedIndex === idx ? "bg-re-500/15" : "hover:bg-white/5"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{article.title}</div>
                          <div className="text-xs text-gray-500 truncate">{article.category?.replace(/_/g, " ")}</div>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">Article</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {query && !kbLoading && allResults.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No results for <span className="text-white">"{query}"</span></p>
                  <p className="text-xs text-gray-600 mt-1">Try searching for a topic, page name, or concept</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/8 flex items-center gap-4 text-xs text-gray-600">
              <span><kbd className="font-mono border border-white/10 rounded px-1">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono border border-white/10 rounded px-1">↵</kbd> open</span>
              <span><kbd className="font-mono border border-white/10 rounded px-1">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
