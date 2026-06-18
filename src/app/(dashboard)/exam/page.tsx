"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ClipboardList, Play, CheckCircle, XCircle, Loader2, RotateCcw, Brain,
  BookOpen, Target, Zap, ChevronRight, Sparkles, Bot, Send, RefreshCw,
  AlertCircle, Trophy, Trash2, Plus, PlusCircle
} from "lucide-react";

const EXAM_TOPICS = [
  { id: "LICENSE_LAW",  label: "License Law",          icon: "⚖️",  desc: "GREC requirements, license types, renewal, disciplinary actions" },
  { id: "CONTRACTS",   label: "Contracts & GAR Forms", icon: "📄",  desc: "Purchase & Sale Agreement, listing agreements, contingencies" },
  { id: "AGENCY",      label: "Agency & Disclosure",   icon: "🤝",  desc: "BRRETA, fiduciary duties, LODCAR, dual and designated agency" },
  { id: "FINANCE",     label: "Real Estate Finance",   icon: "💰",  desc: "Loan types, mortgage math, RESPA, TILA, LTV, DTI" },
  { id: "FAIR_HOUSING",label: "Fair Housing",           icon: "🏠",  desc: "Protected classes, prohibited conduct, steering, redlining" },
  { id: "VALUATION",   label: "Property Valuation",    icon: "📊",  desc: "3 approaches to value, CMA, cap rate, depreciation" },
  { id: "MATH",        label: "RE Math",               icon: "🔢",  desc: "Commission, prorations, area calculations, mortgage payments" },
  { id: "CLOSING",     label: "Closing & Title",       icon: "🔑",  desc: "Georgia closing process, title insurance, attorney requirements" },
  { id: "ALL",         label: "Full Exam Mix",          icon: "🍑",  desc: "All topics — simulates the actual GA RE licensing exam" },
];

interface AIQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

interface LessonData {
  overview: string;
  keyPoints: string[];
  lesson: string;
  examTips: string[];
  mnemonic: string | null;
  practiceQuestion: { question: string; options: string[]; correct: number; explanation: string };
}

type Tab = "course" | "practice" | "mock";
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export default function ExamPage() {
  const [tab, setTab] = useState<Tab>("course");

  // Course / Lesson state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");

  // Practice state
  const [practiceCategory, setPracticeCategory] = useState("LICENSE_LAW");
  const [practiceDifficulty, setPracticeDifficulty] = useState<Difficulty>("INTERMEDIATE");
  const [practiceCount, setPracticeCount] = useState(20);
  const [practiceQuestions, setPracticeQuestions] = useState<AIQuestion[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [appendLoading, setAppendLoading] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [practiceRevealed, setPracticeRevealed] = useState<Record<number, boolean>>({});

  // Mock exam state
  const [mockQuestions, setMockQuestions] = useState<AIQuestion[]>([]);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockAppendLoading, setMockAppendLoading] = useState(false);
  const [mockStarted, setMockStarted] = useState(false);
  const [mockAnswers, setMockAnswers] = useState<Record<number, number>>({});
  const [mockRevealed, setMockRevealed] = useState<Record<number, boolean>>({});
  const [mockCompleted, setMockCompleted] = useState(false);
  const [mockCurrent, setMockCurrent] = useState(0);

  // AI chat state (for lesson tab)
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{role: "user"|"assistant"; content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatLoading]);

  async function loadLesson(topicId: string) {
    const topic = EXAM_TOPICS.find(t => t.id === topicId);
    if (!topic || topic.id === "ALL") return;
    setSelectedTopic(topicId);
    setLesson(null);
    setLessonError("");
    setLessonLoading(true);
    setChatMsgs([]);
    try {
      const res = await fetch("/api/ai/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: topicId,
          moduleName: topic.label,
          courseTitle: "Georgia Real Estate Exam Prep",
          category: topicId,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLesson(json.data);
    } catch (e: unknown) {
      setLessonError(e instanceof Error ? e.message : "Lesson generation failed — try again");
    } finally {
      setLessonLoading(false);
    }
  }

  async function generatePractice(append = false) {
    if (append) setAppendLoading(true);
    else { setPracticeLoading(true); setPracticeQuestions([]); }
    setPracticeAnswers({});
    setPracticeRevealed({});
    try {
      const res = await fetch("/api/ai/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: practiceCategory, count: 20, difficulty: practiceDifficulty }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const newQs: AIQuestion[] = (json.data.questions || []).map((q: AIQuestion, i: number) => ({
        ...q,
        id: append ? Date.now() + i : i,
      }));
      if (append) setPracticeQuestions(prev => [...prev, ...newQs]);
      else setPracticeQuestions(newQs);
    } catch { /* ignore */ }
    finally {
      if (append) setAppendLoading(false);
      else setPracticeLoading(false);
    }
  }

  function goToPracticeForTopic(topicId: string) {
    setPracticeCategory(topicId);
    setPracticeCount(20);
    setTab("practice");
    // auto-generate after state flushes
    setTimeout(() => generatePractice(false), 50);
  }

  async function startMockExam(append = false) {
    if (append) setMockAppendLoading(true);
    else {
      setMockLoading(true);
      setMockStarted(false);
      setMockCompleted(false);
      setMockAnswers({});
      setMockRevealed({});
      setMockCurrent(0);
    }
    try {
      const res = await fetch("/api/ai/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "ALL", count: 20, difficulty: "INTERMEDIATE" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const newQs: AIQuestion[] = (json.data.questions || []).map((q: AIQuestion, i: number) => ({
        ...q,
        id: append ? Date.now() + i : i,
      }));
      if (append) {
        setMockQuestions(prev => [...prev, ...newQs]);
        setMockCompleted(false);
        setMockCurrent(mockQuestions.length);
      } else {
        setMockQuestions(newQs);
        setMockStarted(true);
      }
    } catch { /* ignore */ }
    finally {
      if (append) setMockAppendLoading(false);
      else setMockLoading(false);
    }
  }

  async function askTutor(text: string) {
    const q = text.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMsgs(prev => [...prev, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specificQuestion: q,
          topicDescription: selectedTopic ? EXAM_TOPICS.find(t => t.id === selectedTopic)?.label : "Georgia Real Estate",
          category: selectedTopic || "LICENSE_LAW",
          licenseType: "SALESPERSON",
          difficulty: "INTERMEDIATE",
        }),
      });
      const json = await res.json();
      const d = json.data;
      const answer = d?.studyTip || d?.conceptExplanation || "Please try asking again.";
      setChatMsgs(prev => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setChatMsgs(prev => [...prev, { role: "assistant", content: "Error — please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const mockScore = mockCompleted
    ? mockQuestions.filter(q => mockAnswers[q.id] === q.correct).length
    : 0;
  const mockPct = mockQuestions.length ? Math.round((mockScore / mockQuestions.length) * 100) : 0;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Exam Prep</h1>
          <p className="text-gray-500 text-sm">AI-powered courses, practice, and full mock exams for the GA RE state board</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/8">
        {[
          { id: "course" as Tab, icon: BookOpen, label: "Course Materials" },
          { id: "practice" as Tab, icon: Target, label: "Practice Quiz" },
          { id: "mock" as Tab, icon: ClipboardList, label: "Mock Exam" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-re-500/20 text-re-400 border border-re-500/30" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ─── COURSE MATERIALS TAB ─────────────────────────────────────────────── */}
      {tab === "course" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Topic Selector */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm px-1">Exam Topics</h3>
            {EXAM_TOPICS.filter(t => t.id !== "ALL").map(topic => (
              <button key={topic.id} onClick={() => loadLesson(topic.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTopic === topic.id ? "bg-re-500/15 border-re-500/40" : "bg-white/3 border-white/8 hover:border-re-500/25 hover:bg-re-500/5"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{topic.icon}</span>
                  <span className={`text-sm font-medium ${selectedTopic === topic.id ? "text-re-400" : "text-white"}`}>{topic.label}</span>
                </div>
                <p className="text-xs text-gray-600 leading-tight">{topic.desc}</p>
              </button>
            ))}
          </div>

          {/* Lesson Panel */}
          <div className="lg:col-span-2">
            {!selectedTopic && (
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-full min-h-64">
                <Brain className="w-12 h-12 text-re-400/40 mb-3" />
                <h3 className="text-white font-semibold mb-1">Select a Topic</h3>
                <p className="text-gray-500 text-sm max-w-xs">Choose any exam topic to get an AI-generated lesson tailored for the GA Real Estate state board exam.</p>
              </div>
            )}
            {lessonLoading && (
              <div className="glass-card p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-re-400" />
                <p className="text-gray-400 text-sm">AI instructor is preparing your lesson...</p>
              </div>
            )}
            {lessonError && (
              <div className="glass-card p-6 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-gray-400 text-sm">{lessonError}</p>
                <button onClick={() => selectedTopic && loadLesson(selectedTopic)} className="btn-primary text-sm flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}
            {lesson && !lessonLoading && (
              <div className="space-y-4">
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-base">{EXAM_TOPICS.find(t => t.id === selectedTopic)?.label}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => selectedTopic && goToPracticeForTopic(selectedTopic)}
                        className="btn-primary text-xs py-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3" /> 20 Practice Qs
                      </button>
                      <button onClick={() => selectedTopic && loadLesson(selectedTopic)} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-re-500/8 border border-re-500/20">
                    <p className="text-gray-300 text-sm leading-relaxed">{lesson.overview}</p>
                  </div>

                  <div>
                    <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-re-400" /> Key Points</h4>
                    <div className="space-y-1.5">
                      {lesson.keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-4 h-4 rounded-full bg-re-500/20 text-re-400 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                          <span className="text-gray-300">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line p-4 bg-white/3 rounded-xl border border-white/8">
                    {lesson.lesson}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lesson.examTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15 text-xs">
                        <span className="text-amber-400 flex-shrink-0">💡</span>
                        <span className="text-gray-300">{tip}</span>
                      </div>
                    ))}
                  </div>

                  {lesson.mnemonic && (
                    <div className="p-3 rounded-xl bg-purple-500/8 border border-purple-500/20 flex items-start gap-2 text-sm">
                      <span className="text-purple-400 flex-shrink-0">🧠</span>
                      <div>
                        <div className="text-purple-300 text-xs font-semibold mb-0.5">Memory Trick</div>
                        <p className="text-gray-300">{lesson.mnemonic}</p>
                      </div>
                    </div>
                  )}

                  {/* Practice question */}
                  <div className="border-t border-white/8 pt-4">
                    <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-re-400" /> Practice Question</h4>
                    <PracticeQuestionInline q={lesson.practiceQuestion} />
                  </div>

                  {/* Generate 20 practice questions for this topic */}
                  <div className="border-t border-white/8 pt-4 flex flex-wrap gap-2">
                    <button onClick={() => selectedTopic && goToPracticeForTopic(selectedTopic)}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4" /> Generate 20 Practice Questions for this Topic
                    </button>
                  </div>
                </div>

                {/* AI Tutor Chat for this topic */}
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white text-sm font-semibold flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-re-400" /> Ask AI Instructor</h4>
                    {chatMsgs.length > 0 && (
                      <button onClick={() => setChatMsgs([])}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {chatMsgs.length === 0 && (
                      <p className="text-gray-600 text-xs italic">Ask anything about {EXAM_TOPICS.find(t => t.id === selectedTopic)?.label}...</p>
                    )}
                    {chatMsgs.map((m, i) => (
                      <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && <Bot className="w-4 h-4 text-re-400 flex-shrink-0 mt-0.5" />}
                        <div className={`max-w-[85%] text-xs rounded-xl px-3 py-2 ${m.role === "user" ? "bg-re-500/20 text-white" : "bg-white/8 text-gray-300"}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && <div className="flex gap-2"><Bot className="w-4 h-4 text-re-400" /><Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 mt-0.5" /></div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") askTutor(chatInput); }}
                      placeholder="Ask about this topic..."
                      className="flex-1 bg-white/8 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
                    <button onClick={() => askTutor(chatInput)} disabled={!chatInput.trim() || chatLoading}
                      className="w-8 h-8 bg-re-500 hover:bg-re-500/80 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRACTICE QUIZ TAB ───────────────────────────────────────────────── */}
      {tab === "practice" && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-re-400" /> AI-Generated Practice Questions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Topic Category</label>
                <select value={practiceCategory} onChange={e => setPracticeCategory(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
                  {EXAM_TOPICS.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Difficulty</label>
                <select value={practiceDifficulty} onChange={e => setPracticeDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-re-500/50">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => generatePractice(false)} disabled={practiceLoading || appendLoading}
                className="btn-primary flex items-center gap-2 text-sm">
                {practiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {practiceLoading ? "Generating..." : "Generate 20 Questions"}
              </button>
              {practiceQuestions.length > 0 && (
                <button onClick={() => { setPracticeQuestions([]); setPracticeAnswers({}); setPracticeRevealed({}); }}
                  disabled={practiceLoading || appendLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-all disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          {practiceQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{practiceQuestions.length} Questions · {EXAM_TOPICS.find(t=>t.id===practiceCategory)?.label}</h3>
                <div className="text-sm text-gray-500">
                  {Object.keys(practiceRevealed).length}/{practiceQuestions.length} answered
                </div>
              </div>
              {practiceQuestions.map((q, qi) => (
                <div key={q.id ?? qi} className="glass-card p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-re-500/15 text-re-400 flex-shrink-0 mt-0.5">{qi+1}</span>
                    <p className="text-white text-sm font-medium">{q.question}</p>
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const sel = practiceAnswers[qi] === oi;
                      const rev = practiceRevealed[qi];
                      const correct = oi === q.correct;
                      let cls = "w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ";
                      if (rev) cls += correct ? "bg-green-500/15 border-green-500/40 text-green-300 font-medium" : sel ? "bg-red-500/15 border-red-500/40 text-red-300" : "bg-white/3 border-white/8 text-gray-500";
                      else cls += sel ? "bg-re-500/20 border-re-500/40 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:border-re-500/30";
                      return (
                        <button key={oi} onClick={() => !rev && setPracticeAnswers(p => ({...p, [qi]: oi}))} className={cls} disabled={rev}>
                          <span className="font-bold mr-2">{["A","B","C","D"][oi]}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                  {practiceRevealed[qi] && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-blue-300 text-xs">{q.explanation}</p>
                    </div>
                  )}
                  {practiceAnswers[qi] !== undefined && !practiceRevealed[qi] && (
                    <button onClick={() => setPracticeRevealed(p => ({...p, [qi]: true}))} className="btn-secondary text-xs py-1.5">
                      Check Answer
                    </button>
                  )}
                </div>
              ))}

              {/* Generate 20 More — appends to existing list */}
              <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3 border border-re-500/20 bg-re-500/5">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Want more practice?</p>
                  <p className="text-gray-500 text-xs">Generate 20 more questions and add them below — keep going until you're ready.</p>
                </div>
                <button onClick={() => generatePractice(true)} disabled={appendLoading || practiceLoading}
                  className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                  {appendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {appendLoading ? "Generating..." : "Generate 20 More"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MOCK EXAM TAB ───────────────────────────────────────────────────── */}
      {tab === "mock" && (
        <div className="space-y-4">
          {!mockStarted && !mockLoading && !mockCompleted && (
            <div className="glass-card p-8 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-re-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-re-400" />
              </div>
              <h2 className="text-white text-lg font-bold mb-2">GA Real Estate Mock Exam</h2>
              <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">20 AI-generated questions covering all major exam topics. New questions every time — just like the real state board exam.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-white font-bold">20</div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-white font-bold">All</div>
                  <div className="text-xs text-gray-500">Topics</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-white font-bold">70%</div>
                  <div className="text-xs text-gray-500">Pass Score</div>
                </div>
              </div>
              <button onClick={() => startMockExam(false)} className="btn-primary flex items-center gap-2 mx-auto">
                <Sparkles className="w-4 h-4" /> Generate & Start Exam
              </button>
            </div>
          )}

          {mockLoading && (
            <div className="glass-card p-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-re-400" />
              <p className="text-gray-400 text-sm">AI is generating your exam questions...</p>
            </div>
          )}

          {mockStarted && !mockCompleted && mockQuestions.length > 0 && (
            <div className="space-y-4">
              <MockExamView
                questions={mockQuestions}
                current={mockCurrent}
                setCurrent={setMockCurrent}
                answers={mockAnswers}
                setAnswers={setMockAnswers}
                revealed={mockRevealed}
                setRevealed={setMockRevealed}
                onComplete={() => setMockCompleted(true)}
              />
              {/* Generate 20 More mid-exam */}
              <div className="max-w-2xl mx-auto">
                <div className="glass-card p-4 flex flex-col sm:flex-row items-center gap-3 border border-amber-500/20 bg-amber-500/5">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Need more questions?</p>
                    <p className="text-gray-500 text-xs">Add 20 more AI-generated questions to this exam session.</p>
                  </div>
                  <button onClick={() => startMockExam(true)} disabled={mockAppendLoading}
                    className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap">
                    {mockAppendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    {mockAppendLoading ? "Generating..." : "Add 20 More Questions"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mockCompleted && (
            <div className="space-y-4">
              <div className={`glass-card p-6 text-center border ${mockPct >= 70 ? "border-green-500/30" : "border-red-500/30"}`}>
                {mockPct >= 70
                  ? <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  : <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />}
                <div className={`text-4xl font-bold mb-1 ${mockPct >= 70 ? "text-green-400" : "text-red-400"}`}>{mockPct}%</div>
                <div className="text-white font-semibold text-lg mb-1">{mockPct >= 70 ? "PASSED! 🍑" : "Keep Studying"}</div>
                <div className="text-gray-400 text-sm mb-5">{mockScore}/{mockQuestions.length} correct · Passing: 70%</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => { setMockStarted(false); setMockCompleted(false); startMockExam(false); }}
                    className="btn-primary flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> New 20-Question Exam
                  </button>
                  <button onClick={() => startMockExam(true)} disabled={mockAppendLoading}
                    className="btn-secondary flex items-center gap-2">
                    {mockAppendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    {mockAppendLoading ? "Generating..." : "Add 20 More Questions"}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {mockQuestions.map((q, i) => {
                  const chosen = mockAnswers[q.id];
                  const isOk = chosen === q.correct;
                  return (
                    <div key={q.id} className={`glass-card p-4 border ${isOk ? "border-green-500/20" : "border-red-500/20"}`}>
                      <div className="flex items-start gap-2 mb-2">
                        {isOk ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm text-white">{i+1}. {q.question}</p>
                      </div>
                      <div className="pl-6 space-y-0.5">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correct ? "text-green-400 font-medium" : oi === chosen && !isOk ? "text-red-400" : "text-gray-600"}`}>
                            {oi === q.correct ? "✓ " : oi === chosen && !isOk ? "✗ " : "  "}{opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 pl-6 italic">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PracticeQuestionInline({ q }: { q: { question: string; options: string[]; correct: number; explanation: string } }) {
  const [sel, setSel] = useState<number|null>(null);
  const [rev, setRev] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-sm text-white font-medium">{q.question}</p>
      <div className="space-y-1.5">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct;
          let cls = "w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ";
          if (rev) cls += isCorrect ? "bg-green-500/15 border-green-500/30 text-green-300 font-medium" : sel === oi ? "bg-red-500/15 border-red-500/30 text-red-300" : "bg-white/3 border-white/8 text-gray-600";
          else cls += sel === oi ? "bg-re-500/20 border-re-500/40 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-re-500/30";
          return <button key={oi} onClick={() => !rev && setSel(oi)} className={cls} disabled={rev}><span className="font-bold mr-1.5">{["A","B","C","D"][oi]}.</span>{opt}</button>;
        })}
      </div>
      {rev && <p className="text-xs text-blue-300 italic mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/15">{q.explanation}</p>}
      {sel !== null && !rev && <button onClick={() => setRev(true)} className="btn-secondary text-xs py-1.5 mt-1">Check Answer</button>}
    </div>
  );
}

function MockExamView({
  questions, current, setCurrent, answers, setAnswers, revealed, setRevealed, onComplete,
}: {
  questions: AIQuestion[]; current: number; setCurrent: (n: number) => void;
  answers: Record<number, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  revealed: Record<number, boolean>; setRevealed: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  onComplete: () => void;
}) {
  const q = questions[current];
  const answered = Object.keys(answers).length;
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Question {current + 1} of {questions.length}</span>
        <span>{answered}/{questions.length} answered</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full bg-re-500 rounded-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }} />
      </div>
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-re-500/15 text-re-400 flex-shrink-0 mt-0.5">{q.category?.replace("_"," ")}</span>
          <p className="text-white font-medium text-sm">{q.question}</p>
        </div>
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const sel = answers[q.id] === oi;
            const rev = revealed[q.id];
            const correct = oi === q.correct;
            let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
            if (rev) cls += correct ? "bg-green-500/15 border-green-500/40 text-green-300 font-medium" : sel ? "bg-red-500/15 border-red-500/40 text-red-300" : "bg-white/3 border-white/8 text-gray-500";
            else cls += sel ? "bg-re-500/20 border-re-500/40 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:border-re-500/30";
            return (
              <button key={oi} onClick={() => !rev && setAnswers(p => ({...p, [q.id]: oi}))} className={cls} disabled={rev}>
                <span className="font-bold mr-2">{["A","B","C","D"][oi]}.</span>{opt}
              </button>
            );
          })}
        </div>
        {revealed[q.id] && <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"><p className="text-xs text-blue-300">{q.explanation}</p></div>}
        <div className="flex gap-2">
          {answers[q.id] !== undefined && !revealed[q.id] && (
            <button onClick={() => setRevealed(p => ({...p, [q.id]: true}))} className="btn-secondary text-xs py-1.5 flex-1">Check Answer</button>
          )}
          {current > 0 && <button onClick={() => setCurrent(current - 1)} className="btn-secondary text-xs py-1.5">← Prev</button>}
          {current < questions.length - 1
            ? <button onClick={() => setCurrent(current + 1)} className="btn-primary text-xs py-1.5 flex-1">Next →</button>
            : <button onClick={onComplete} className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Submit Exam
              </button>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((mq, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === current ? "bg-re-500 text-white" : revealed[mq.id] ? (answers[mq.id] === mq.correct ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400") : answers[mq.id] !== undefined ? "bg-re-500/20 text-re-400" : "bg-white/8 text-gray-500"}`}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
