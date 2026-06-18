"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell, Calendar, BookOpen, Sparkles, Loader2, Bookmark, BookmarkCheck,
  Search, ChevronDown, ChevronUp, Share2, Check, GraduationCap,
  ShieldAlert, AlertTriangle, Info, SlidersHorizontal, X, Zap
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface LawUpdate {
  id: string;
  date: string;
  title: string;
  summary: string;
  details: string;
  examTip: string;
  category: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  year: string;
  isAI?: boolean;
}

/* ─── Static seed data ───────────────────────────────────────────────── */
const SEED_UPDATES: LawUpdate[] = [
  {
    id: "s1",
    date: "2024-07-01",
    title: "GREC License Renewal Requirement Update",
    summary: "GREC updated continuing education requirements for license renewal. All licensees must complete 36 hours of CE per 4-year renewal cycle, including mandatory topics.",
    details: "As of the 2024 renewal cycle, Georgia real estate licensees are required to complete 36 hours of approved continuing education every 4 years. Mandatory topics include: Ethics (3 hrs), License Law (3 hrs), and Real Estate Consumer Protection (3 hrs). The remaining 27 hours may be completed in approved elective topics. Failure to complete CE by the renewal deadline results in automatic license lapse. Licensees receive a 30-day grace period after expiration during which they may complete CE and renew without penalty.",
    examTip: "PSI exams frequently test that CE is 36 hours per 4-year cycle — remember the 3+3+3 mandatory breakdown (Ethics, License Law, Consumer Protection).",
    category: "License Renewal",
    impact: "HIGH",
    source: "GREC Official Bulletin",
    year: "2024",
  },
  {
    id: "s2",
    date: "2024-03-15",
    title: "GAR Purchase and Sale Agreement Form Revisions",
    summary: "The Georgia Association of Realtors updated the standard PSA form with clarifications to inspection contingency timelines and digital signature provisions.",
    details: "The 2024 GAR Purchase and Sale Agreement now includes: (1) Clearer language around due diligence period timing — starting from binding agreement date rather than ratification date. (2) Explicit electronic signature acceptance per Georgia's Electronic Records Act (O.C.G.A. § 10-12-1). (3) Updated financing contingency language aligning with current FNMA/FHLMC guidelines. (4) New section clarifying repair request timelines. Agents must use the current form version; using outdated forms can expose both parties to contract disputes.",
    examTip: "Know that the binding agreement date — not the signing date — triggers contingency periods. The PSI exam tests this distinction on contract timing questions.",
    category: "Contracts",
    impact: "MEDIUM",
    source: "Georgia Association of Realtors",
    year: "2024",
  },
  {
    id: "s3",
    date: "2023-10-01",
    title: "Fair Housing Training Now Mandatory for License Renewal",
    summary: "GREC now requires all license renewal applicants to complete a 3-hour fair housing course as part of continuing education.",
    details: "Beginning October 1, 2023, all Georgia real estate licensees must include a minimum 3-hour GREC-approved fair housing course in their CE completion. The course must cover: the seven federally protected classes, state-level protected classes, steering, redlining, blockbusting, reasonable accommodations under the Fair Housing Amendments Act, and complaint filing procedures with HUD. This replaces a portion of the general ethics CE that was previously sufficient for many practitioners.",
    examTip: "Fair housing questions on the PSI exam often involve steering or protected classes — memorize the 7 federal classes (race, color, national origin, religion, sex, familial status, disability) plus Georgia additions.",
    category: "Fair Housing",
    impact: "HIGH",
    source: "GREC",
    year: "2023",
  },
  {
    id: "s4",
    date: "2023-06-20",
    title: "New Disclosure Requirements for Property Condition",
    summary: "Georgia updated seller disclosure requirements to include flood zone status, HVAC age, and presence of synthetic stucco (EIFS).",
    details: "Georgia's seller disclosure form was updated to include specific disclosures about: (1) Whether the property lies within a FEMA-designated flood zone; (2) Age and condition of HVAC systems; (3) Presence of Exterior Insulation Finish Systems (EIFS/synthetic stucco) which can trap moisture and cause structural damage. While Georgia is a 'buyer beware' (caveat emptor) state and disclosure is not always mandatory, agents should strongly advise sellers to complete updated disclosure forms to reduce liability under O.C.G.A. § 10-6A-5.",
    examTip: "Georgia is a caveat emptor state — sellers are NOT required to disclose all defects by default, but agents have a duty to disclose known material defects.",
    category: "Property",
    impact: "MEDIUM",
    source: "Georgia Legislature",
    year: "2023",
  },
  {
    id: "s5",
    date: "2023-01-01",
    title: "Broker License Experience Requirement Change",
    summary: "GREC increased the active experience requirement for broker license applicants from 1 year to 3 years of active salesperson experience.",
    details: "Effective January 1, 2023, applicants for a Georgia broker license must document 3 years (36 months) of active real estate experience as a licensed salesperson, up from the previous 1-year requirement. The experience must be: within the last 5 years, in good standing without disciplinary action, and accompanied by a letter from the sponsoring broker. Additionally, broker applicants must complete 60 hours of pre-license broker education from an approved provider before sitting for the state exam.",
    examTip: "Remember: Broker pre-license = 60 hours, salesperson pre-license = 75 hours. Broker applicants also need 3 years of active sales experience within the last 5 years.",
    category: "License Law",
    impact: "HIGH",
    source: "GREC",
    year: "2023",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
const IMPACT_CONFIG = {
  HIGH:   { color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/40",    Icon: ShieldAlert,   label: "High Impact" },
  MEDIUM: { color: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-amber-500/40",  Icon: AlertTriangle, label: "Medium Impact" },
  LOW:    { color: "text-sky-400",    bg: "bg-sky-500/15",    border: "border-sky-500/40",    Icon: Info,          label: "Low Impact" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "License Law": "⚖️", "License Renewal": "🔄", "Contracts": "📄",
  "Agency": "🤝", "Fair Housing": "🏠", "Finance": "💰",
  "Property": "🏡", "Closing": "🔑", "Ethics": "⭐",
};

const TOPICS = ["ALL", "License Law", "Contracts", "Agency", "Fair Housing", "Finance", "Property", "Closing", "Ethics"];

function isNew(dateStr: string) {
  const d = new Date(dateStr);
  return (Date.now() - d.getTime()) < 1000 * 60 * 60 * 24 * 90; // 90 days
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Card Component ─────────────────────────────────────────────────── */
function UpdateCard({ update, bookmarked, onBookmark }: {
  update: LawUpdate;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const impact = IMPACT_CONFIG[update.impact] ?? IMPACT_CONFIG.LOW;
  const ImpactIcon = impact.Icon;

  function handleShare() {
    navigator.clipboard.writeText(`${update.title}\n\n${update.summary}\n\nSource: ${update.source} (${update.year})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`glass-card overflow-hidden transition-all border-l-4 ${impact.border}`}>
      {/* Card Header */}
      <div className="p-5">
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Impact badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${impact.bg} ${impact.color}`}>
              <ImpactIcon className="w-3 h-3" />
              {impact.label}
            </span>
            {/* Category badge */}
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-re-500/15 text-re-400 border border-re-500/20">
              {CATEGORY_ICONS[update.category] ?? "📋"} {update.category}
            </span>
            {/* Year badge */}
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-white/8 text-gray-400">
              {update.year}
            </span>
            {/* NEW badge */}
            {isNew(update.date) && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                NEW
              </span>
            )}
            {/* AI badge */}
            {update.isAI && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleShare}
              title="Copy to clipboard"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onBookmark}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
              className={`p-1.5 rounded-lg transition-all ${bookmarked ? "text-amber-400 bg-amber-500/10" : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/8"}`}
            >
              {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Date + Source */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(update.date)}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{update.source}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-base leading-snug mb-2">{update.title}</h3>

        {/* Summary */}
        <p className="text-gray-400 text-sm leading-relaxed">{update.summary}</p>

        {/* Exam Tip pill */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <GraduationCap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Exam Tip</span>
            <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">{update.examTip}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-4 flex items-center gap-1.5 text-xs text-re-400 hover:text-re-300 font-medium transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Details</> : <><ChevronDown className="w-3.5 h-3.5" /> Read Full Details</>}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/8">
          <p className="text-gray-300 text-sm leading-relaxed mt-4">{update.details}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function UpdatesPage() {
  const [updates, setUpdates] = useState<LawUpdate[]>(SEED_UPDATES);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [impact, setImpact] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [sort, setSort] = useState<"newest" | "oldest" | "impact">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // AI generator state
  const [genTopic, setGenTopic] = useState("ALL");
  const [genCount, setGenCount] = useState(6);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  // Persist bookmarks
  useEffect(() => {
    const saved = localStorage.getItem("law-bookmarks");
    if (saved) setBookmarks(new Set(JSON.parse(saved)));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("law-bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // AI generate
  async function generateUpdates() {
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/ai/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: genTopic, count: genCount }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      const newUpdates: LawUpdate[] = (data.updates as LawUpdate[]).map((u, i) => ({
        ...u,
        id: `ai-${Date.now()}-${i}`,
        isAI: true,
        examTip: u.examTip || "Review this topic in your GA real estate exam prep materials.",
        year: u.year || "2024",
      }));
      setUpdates(prev => [...newUpdates, ...prev]);
      setGenResult(`✅ Added ${newUpdates.length} new law updates!`);
    } catch {
      setGenResult("❌ Generation failed — please try again.");
    } finally {
      setGenLoading(false);
      setTimeout(() => setGenResult(null), 6000);
    }
  }

  function clearAI() {
    setUpdates(SEED_UPDATES);
  }

  // Years available
  const years = useMemo(() => {
    const ys = Array.from(new Set(updates.map(u => u.year))).sort().reverse();
    return ["ALL", ...ys];
  }, [updates]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = updates.filter(u => {
      if (showBookmarksOnly && !bookmarks.has(u.id)) return false;
      if (category !== "ALL" && u.category !== category) return false;
      if (impact !== "ALL" && u.impact !== impact) return false;
      if (year !== "ALL" && u.year !== year) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.title.toLowerCase().includes(q) || u.summary.toLowerCase().includes(q) || u.category.toLowerCase().includes(q);
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "impact") {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.impact] - order[b.impact];
      }
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return list;
  }, [updates, search, category, impact, year, sort, showBookmarksOnly, bookmarks]);

  const aiCount = updates.filter(u => u.isAI).length;
  const bookmarkCount = bookmarks.size;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Law Updates</h1>
          <p className="text-gray-500 text-sm">
            {updates.length} updates · Georgia real estate law &amp; GREC regulatory changes for PSI exam prep
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bookmarkCount > 0 && (
            <button
              onClick={() => setShowBookmarksOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${showBookmarksOnly ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/5 text-gray-400 border-white/10 hover:border-amber-500/30 hover:text-amber-400"}`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" /> Saved ({bookmarkCount})
            </button>
          )}
          {aiCount > 0 && (
            <button onClick={clearAI} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:border-red-500/30 hover:text-red-400 transition-all">
              <X className="w-3.5 h-3.5" /> Clear AI ({aiCount})
            </button>
          )}
        </div>
      </div>

      {/* AI Generator */}
      <div className="glass-card p-5 border border-purple-500/25 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Law Update Generator</h3>
            <p className="text-gray-500 text-xs">Generate GA real estate law updates and GREC bulletins for exam study — with exam tips for each</p>
          </div>
        </div>

        {/* Topic chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => setGenTopic(t)}
              disabled={genLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                genTopic === t
                  ? "bg-purple-500/25 border-purple-500/50 text-purple-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-gray-200"
              }`}
            >
              {CATEGORY_ICONS[t] ?? "✦"} {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">Count:</label>
            {[3, 6, 9, 12].map(n => (
              <button
                key={n}
                onClick={() => setGenCount(n)}
                disabled={genLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                  genCount === n
                    ? "bg-purple-500/25 border-purple-500/50 text-purple-300"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-gray-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={generateUpdates}
            disabled={genLoading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {genLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {genCount} updates...</>
              : <><Zap className="w-4 h-4" /> Generate {genCount} Updates</>
            }
          </button>

          {genResult && (
            <span className={`text-sm font-medium ${genResult.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
              {genResult}
            </span>
          )}
        </div>

        {genLoading && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-purple-500/8 border border-purple-500/15">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400 flex-shrink-0" />
            <p className="text-purple-300 text-xs">
              AI is generating <strong>{genCount}</strong> {genTopic !== "ALL" ? genTopic : "mixed-topic"} law updates with GREC references, O.C.G.A. citations, and PSI exam tips...
            </p>
          </div>
        )}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search law updates..."
              className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${showFilters ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-white/5 text-gray-400 border-white/10 hover:border-white/25"}`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="glass-card p-4 space-y-3">
            {/* Category */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "License Law", "License Renewal", "Contracts", "Agency", "Fair Housing", "Finance", "Property", "Closing", "Ethics"].map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${category === c ? "bg-re-500/20 text-re-400 border-re-500/30" : "bg-white/5 text-gray-500 border-white/8 hover:text-gray-300 hover:border-white/20"}`}>
                    {CATEGORY_ICONS[c] ?? "✦"} {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              {/* Impact */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Impact</p>
                <div className="flex gap-1.5">
                  {["ALL", "HIGH", "MEDIUM", "LOW"].map(i => (
                    <button key={i} onClick={() => setImpact(i)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${impact === i ? "bg-re-500/20 text-re-400 border-re-500/30" : "bg-white/5 text-gray-500 border-white/8 hover:text-gray-300 hover:border-white/20"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Year</p>
                <div className="flex gap-1.5">
                  {years.map(y => (
                    <button key={y} onClick={() => setYear(y)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${year === y ? "bg-re-500/20 text-re-400 border-re-500/30" : "bg-white/5 text-gray-500 border-white/8 hover:text-gray-300 hover:border-white/20"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Sort</p>
                <div className="flex gap-1.5">
                  {(["newest", "oldest", "impact"] as const).map(s => (
                    <button key={s} onClick={() => setSort(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${sort === s ? "bg-re-500/20 text-re-400 border-re-500/30" : "bg-white/5 text-gray-500 border-white/8 hover:text-gray-300 hover:border-white/20"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {(search || category !== "ALL" || impact !== "ALL" || year !== "ALL" || showBookmarksOnly) && (
        <p className="text-xs text-gray-500">
          Showing <span className="text-white font-medium">{filtered.length}</span> of {updates.length} updates
          {showBookmarksOnly && " · Bookmarked only"}
        </p>
      )}

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(update => (
            <UpdateCard
              key={update.id}
              update={update}
              bookmarked={bookmarks.has(update.id)}
              onBookmark={() => toggleBookmark(update.id)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-gray-600">
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm text-gray-400 font-medium mb-1">No updates match your filters</p>
          <p className="text-xs text-gray-600">Try adjusting your search or filters, or generate more updates with AI</p>
          <button
            onClick={() => { setSearch(""); setCategory("ALL"); setImpact("ALL"); setYear("ALL"); setShowBookmarksOnly(false); }}
            className="mt-4 text-xs text-re-400 hover:text-re-300 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            These summaries are for exam study purposes. Always verify current requirements directly with GREC at grec.state.ga.us before advising clients or applying for licenses.
          </p>
        </div>
      </div>
    </div>
  );
}
