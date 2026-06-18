"use client";

import { useState, useCallback } from "react";
import { Youtube, Search, Play, RefreshCw, Shuffle } from "lucide-react";

const VIDEO_POOL = [
  // Full Exam Reviews
  { id: "YFo_2B3Io1g", category: "Full Exam", title: "PASS the 2026 Georgia Real Estate Exam: ULTIMATE 144-Question Final Review", channel: "Real Estate Exam Prep", tags: ["full review", "2026", "GREC"] },
  { id: "K6dq-SKuAuQ", category: "Full Exam", title: "Georgia Real Estate Practice Exam 2026: 100 Sample Questions with Explanations", channel: "Real Estate Exam Prep", tags: ["practice exam", "100 questions", "2026"] },
  { id: "W7WNMm5y_84", category: "Full Exam", title: "Georgia Real Estate Exam 2026: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["100 questions", "2026", "explained"] },
  { id: "voQmlv02Xls", category: "Full Exam", title: "Pass The 2026 Georgia Real Estate Exam on Your First Try — Free Test Prep", channel: "Real Estate Exam Prep", tags: ["first try", "free prep", "2026"] },
  { id: "8xM184dIc0A", category: "Full Exam", title: "Pass Your Georgia Real Estate Exam — 100-Question Review", channel: "Real Estate Exam Prep", tags: ["100 questions", "review", "GA exam"] },
  { id: "ty_2UkJgCMg", category: "Full Exam", title: "25 Questions You Will See on the Georgia Real Estate Exam", channel: "Real Estate Exam Prep", tags: ["25 questions", "top questions", "GREC"] },
  { id: "b5W78snMdr8", category: "Full Exam", title: "Georgia Real Estate Exam 2024: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["2024", "100 questions", "explained"] },
  { id: "p_GlwgDKFmE", category: "Full Exam", title: "Georgia Real Estate Exam Prep: Passing the Georgia Real Estate Exam", channel: "Real Estate Exam Prep", tags: ["exam prep", "passing", "GA license"] },
  // Georgia-Specific
  { id: "9Jt_cPLZFlM", category: "Georgia Law", title: "Georgia Real Estate Exam 2 2025: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["2025", "state law", "GREC"] },
  { id: "czTjnurZPkQ", category: "Georgia Law", title: "Georgia Real Estate Exam 3 2025: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["2025", "contracts", "agency"] },
  { id: "75C4v8ZXWvs", category: "Georgia Law", title: "Georgia Real Estate Exam 2 2024: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["2024", "state portion", "BRRETA"] },
  { id: "efwEiDhC-ZQ", category: "Georgia Law", title: "Georgia Real Estate Exam 3 2024: 100 Questions with Explained Answers", channel: "Real Estate Exam Prep", tags: ["2024", "agency", "fair housing"] },
  { id: "odYmN9n7U6Y", category: "Contracts", title: "BRRETA Pop Quiz: Georgia Real Estate Contracts 102", channel: "Georgia Real Estate CE", tags: ["BRRETA", "agency", "brokerage relationships"] },
  // Math
  { id: "FTYRvx8_o0M", category: "Math", title: "Real Estate Exam Math: The Secret Formula in Seconds (DLS Method)", channel: "PrepAgent", tags: ["math", "DLS method", "formula"] },
  { id: "RHJdrXGKVYs", category: "Math", title: "Stop Memorizing Real Estate Math Formulas: T-Chart Method (25 Questions)", channel: "PrepAgent", tags: ["T-chart", "math", "25 questions"] },
  { id: "VXKR9_Im-7Y", category: "Math", title: "MATH on the Real Estate Exam — PrepAgent Full Webinar", channel: "PrepAgent", tags: ["math webinar", "all formulas", "exam prep"] },
  { id: "fVGGRCZsiLc", category: "Math", title: "Real Estate Exam Math Problems and How to Solve Them — PrepAgent Webinar", channel: "PrepAgent", tags: ["math problems", "solving", "webinar"] },
  { id: "LIXlHPX3AjQ", category: "Math", title: "The 10 Most Common Real Estate Math Formulas You Need to Know", channel: "Just Call Maggie", tags: ["10 formulas", "common math", "exam"] },
  { id: "Xy0eiUOH6OI", category: "Math", title: "Real Estate Math: 35 Math Questions on the Real Estate Exam (Compilation)", channel: "Real Estate Exam Prep", tags: ["35 questions", "all math", "compilation"] },
  { id: "eh8buAEPH78", category: "Math", title: "Real Estate Exam Math: Area Calculations Explained", channel: "Real Estate Exam Prep", tags: ["area", "sq ft", "lot size"] },
];

const CATEGORIES = ["All", ...Array.from(new Set(VIDEO_POOL.map(v => v.category)))];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function YoutubePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [playing, setPlaying] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);

  const refresh = useCallback(() => {
    setSeed(s => s + 1);
    setPlaying(null);
  }, []);

  const filtered = VIDEO_POOL.filter(v => {
    const matchCat = category === "All" || v.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || v.title.toLowerCase().includes(q) || v.tags.some(t => t.includes(q)) || v.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // When no search/filter, shuffle display order on each refresh
  const displayed = search || category !== "All" ? filtered : shuffleArray(filtered).slice(0, 12);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center">
            <Youtube className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Study Videos</h1>
            <p className="text-gray-500 text-sm">Curated GA Real Estate exam prep videos — shuffled fresh each visit</p>
          </div>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-all">
          <Shuffle className="w-4 h-4" /> Shuffle
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos, topics, or tags..."
            className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {playing && (
        <div className="glass-card p-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-black mb-3">
            <iframe src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen className="w-full h-full" />
          </div>
          <button onClick={() => setPlaying(null)} className="btn-secondary text-xs py-1.5">Close Player</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map(video => (
          <div key={video.id} className="glass-card overflow-hidden hover:border-white/20 transition-all group">
            <div className="relative cursor-pointer aspect-video bg-black" onClick={() => setPlaying(video.id)}>
              <img src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} alt={video.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full bg-black/70 text-gray-300 font-medium">{video.category}</div>
            </div>
            <div className="p-3">
              <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1 leading-snug">{video.title}</h3>
              <p className="text-gray-500 text-xs mb-2">{video.channel}</p>
              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-gray-600">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-10 text-gray-600">
          <Youtube className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No videos match your search. Try a different keyword.</p>
        </div>
      )}

      <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
        <RefreshCw className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">Videos shuffle on every visit and refresh. Click <strong>Shuffle</strong> to see a new mix from our curated pool of {VIDEO_POOL.length} Georgia Real Estate exam prep videos (2024–2026).</p>
      </div>
    </div>
  );
}
