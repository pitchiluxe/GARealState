"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  BookOpen, CheckCircle, Lock, Play, Trophy, Star, Award, Zap,
  Loader2, X, ChevronRight, Brain, Lightbulb, Target, MessageSquare,
  Send, Bot, Sparkles, RotateCcw, Check, Trash2, Printer, Download,
  GraduationCap, BadgeCheck, Medal, AlertCircle, RefreshCw
} from "lucide-react";
import { COURSES, BADGES, XP_LEVELS, getXpProgress } from "@/lib/classroom";

type BadgeItem = typeof BADGES[number];
type Module   = typeof COURSES[0]["modules"][0];
type Course   = typeof COURSES[0];

interface LessonData {
  moduleId: string;
  overview: string;
  keyPoints: string[];
  lesson: string;
  examTips: string[];
  mnemonic: string | null;
  practiceQuestion: { question: string; options: string[]; correct: number; explanation: string };
}

interface CertRecord {
  id: string;
  courseId: string;
  courseName: string;
  certNumber: string;
  issuedAt: string;
}

// ─── Print certificate in a pop-up window ────────────────────────────────────
function printCertificate(userName: string, cert: CertRecord) {
  const date = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate – ${cert.courseName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Lato', sans-serif; }
    .cert {
      width: 860px; padding: 60px 70px; border: 12px solid #1a2744;
      outline: 4px solid #E8825A; outline-offset: -20px;
      text-align: center; position: relative; background: #fff;
    }
    .seal {
      width: 90px; height: 90px; border-radius: 50%;
      background: linear-gradient(135deg, #1a2744, #2d4080);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 36px;
    }
    .issuer { font-family: 'Lato', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 4px; color: #E8825A; text-transform: uppercase; margin-bottom: 6px; }
    .org { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a2744; margin-bottom: 24px; }
    .cert-of { font-family: 'Lato', sans-serif; font-size: 13px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 6px; }
    .cert-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #1a2744; margin-bottom: 30px; }
    .certify { color: #555; font-size: 15px; margin-bottom: 12px; }
    .name { font-family: 'Playfair Display', serif; font-size: 42px; color: #E8825A; border-bottom: 2px solid #E8825A; display: inline-block; padding-bottom: 6px; margin-bottom: 24px; min-width: 320px; }
    .completed { color: #555; font-size: 15px; margin-bottom: 8px; }
    .course { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a2744; margin-bottom: 36px; }
    .divider { border: none; border-top: 1px solid #ddd; margin: 24px auto; width: 60%; }
    .meta { display: flex; justify-content: space-between; font-size: 12px; color: #888; max-width: 500px; margin: 0 auto; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="cert">
    <div class="seal">🍑</div>
    <div class="issuer">Official Certification</div>
    <div class="org">GA Real Estate Academy</div>
    <div class="cert-of">Certificate of Completion</div>
    <div class="cert-title">This is to Certify That</div>
    <div class="certify">The following individual has successfully completed all required modules in</div>
    <div class="name">${userName || "Graduate"}</div>
    <div class="completed">has successfully completed</div>
    <div class="course">${cert.courseName}</div>
    <hr class="divider" />
    <div class="meta">
      <span>Issued: ${date}</span>
      <span>Cert #: ${cert.certNumber.slice(0, 20)}</span>
      <span>GA Real Estate Academy</span>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
  const w = window.open("", "_blank", "width=960,height=720");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────
function XpBar({ totalXp }: { totalXp: number }) {
  const progress = getXpProgress(totalXp);
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-re-500/20 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-re-400" />
          </div>
          <div>
            <div className="text-white font-bold">{progress.level.title}</div>
            <div className="text-gray-500 text-xs">Level {XP_LEVELS.indexOf(progress.level) + 1}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold gradient-text">{totalXp.toLocaleString()} XP</div>
          <div className="text-gray-500 text-xs">{progress.xpForNextLevel > 0 ? `${progress.xpIntoLevel}/${progress.xpForNextLevel} to next` : "Max level!"}</div>
        </div>
      </div>
      {progress.xpForNextLevel > 0 && (
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress.percent}%`, background: "linear-gradient(90deg,#E8825A,#f59e0b)" }} />
        </div>
      )}
    </div>
  );
}

// ─── Certificate Preview Card ─────────────────────────────────────────────────
function CertCard({ cert, userName }: { cert: CertRecord; userName: string }) {
  const date = new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return (
    <div className="relative rounded-2xl overflow-hidden border border-re-500/30 bg-gradient-to-br from-[#1a2744] to-[#0d1426] p-5"
      style={{ boxShadow: "0 0 30px rgba(232,130,90,0.15)" }}>
      {/* Decorative border inset */}
      <div className="absolute inset-2 rounded-xl border border-re-500/20 pointer-events-none" />
      <div className="relative z-10 text-center">
        <div className="text-3xl mb-2">🍑</div>
        <div className="text-xs font-bold tracking-widest text-re-400 uppercase mb-1">Certificate of Completion</div>
        <div className="text-white font-bold text-sm mb-3">GA Real Estate Academy</div>
        <div className="text-gray-400 text-xs mb-1">This certifies that</div>
        <div className="text-re-300 font-bold text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>{userName || "Graduate"}</div>
        <div className="text-gray-400 text-xs mb-1">has successfully completed</div>
        <div className="text-white text-sm font-semibold mb-3 px-4 leading-tight">{cert.courseName}</div>
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-4">
          <span>{date}</span>
          <span>·</span>
          <span>#{cert.certNumber.slice(0, 12)}</span>
        </div>
        <button onClick={() => printCertificate(userName, cert)}
          className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
          <Printer className="w-3.5 h-3.5" /> Print Certificate
        </button>
      </div>
    </div>
  );
}

// ─── Module Study Panel ───────────────────────────────────────────────────────
function ModuleStudyPanel({
  module, course, userName, onClose, onComplete,
}: {
  module: Module; course: Course; userName: string; onClose: () => void; onComplete: () => void;
}) {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [tab, setTab] = useState<"lesson" | "quiz" | "chat">("lesson");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatLoading]);

  // Auto-generate lesson on open
  const loadLesson = useCallback(async () => {
    setLoadingLesson(true);
    setLessonError("");
    try {
      const res = await fetch("/api/ai/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: module.id,
          moduleName: module.title,
          courseTitle: course.title,
          category: course.category,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Lesson generation failed");
      if (!json.data) throw new Error("Empty response from AI");
      setLesson(json.data);
    } catch (e: unknown) {
      setLessonError(e instanceof Error ? e.message : "Failed to generate lesson — please retry");
    } finally {
      setLoadingLesson(false);
    }
  }, [module.id, module.title, course.title, course.category]);

  useEffect(() => { loadLesson(); }, []);

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
          specificQuestion: `[Module: ${module.title}] ${q}`,
          topicDescription: module.title,
          category: course.category,
          licenseType: "SALESPERSON",
          difficulty: "INTERMEDIATE",
        }),
      });
      const json = await res.json();
      const d = json.data;
      const answer = d?.studyTip || d?.conceptExplanation || "Let me explain...";
      setChatMsgs(prev => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setChatMsgs(prev => [...prev, { role: "assistant", content: "Error — please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1426] border border-white/15 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl" style={{ maxHeight: "92vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-re-400 font-medium mb-0.5 truncate">{course.title}</div>
            <h2 className="text-white font-bold text-lg leading-tight">{module.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{module.description} · ~{module.estimatedMinutes} min</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/8 transition-all ml-3 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 flex-shrink-0 px-5">
          {[
            { id: "lesson", icon: BookOpen, label: "Study Lesson" },
            { id: "quiz",   icon: Target,   label: "Practice Quiz" },
            { id: "chat",   icon: MessageSquare, label: "Ask AI Tutor" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? "border-re-500 text-re-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── Lesson Tab ──────────────────────────────────────────────────── */}
          {tab === "lesson" && (
            <div className="p-5 space-y-4">
              {loadingLesson && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(232,130,90,0.15)" }}>
                      <Sparkles className="w-8 h-8 text-re-400" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-16 h-16 animate-spin text-re-400/30" style={{ strokeWidth: 1 }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">AI Instructor is preparing your lesson</p>
                    <p className="text-gray-500 text-sm mt-1">Generating content for <em>{module.title}</em>...</p>
                  </div>
                </div>
              )}

              {lessonError && !loadingLesson && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Lesson generation failed</p>
                    <p className="text-gray-500 text-xs max-w-xs">{lessonError}</p>
                  </div>
                  <button onClick={loadLesson} className="btn-primary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                </div>
              )}

              {lesson && !loadingLesson && (
                <div className="space-y-4">
                  {/* Overview */}
                  <div className="p-4 rounded-xl bg-re-500/8 border border-re-500/20">
                    <p className="text-gray-300 text-sm leading-relaxed">{lesson.overview}</p>
                  </div>

                  {/* Key Points */}
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-re-400" /> Key Points to Master
                    </h3>
                    <div className="space-y-1.5">
                      {(lesson.keyPoints || []).map((pt, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span className="w-5 h-5 rounded-full bg-re-500/20 text-re-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-gray-300">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-re-400" /> Full Lesson
                    </h3>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line p-4 bg-white/3 rounded-xl border border-white/8">
                      {lesson.lesson}
                    </div>
                  </div>

                  {/* Exam Tips */}
                  {(lesson.examTips || []).length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Exam Tips
                      </h3>
                      <div className="space-y-1.5">
                        {lesson.examTips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                            <span className="text-amber-400 flex-shrink-0">💡</span>
                            <span className="text-gray-300">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mnemonic */}
                  {lesson.mnemonic && (
                    <div className="p-3 rounded-xl bg-purple-500/8 border border-purple-500/20 flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0">🧠</span>
                      <div>
                        <div className="text-purple-300 text-xs font-semibold mb-0.5">Memory Trick</div>
                        <p className="text-gray-300 text-sm">{lesson.mnemonic}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={loadLesson} className="btn-secondary text-sm flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button onClick={() => setTab("quiz")} className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center">
                      <Target className="w-3.5 h-3.5" /> Take Practice Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Quiz Tab ──────────────────────────────────────────────────── */}
          {tab === "quiz" && (
            <div className="p-5">
              {!lesson ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-re-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Waiting for lesson to load...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                    <p className="text-blue-300 text-xs font-medium mb-0.5">Practice Question</p>
                    <p className="text-white text-sm font-medium">{lesson.practiceQuestion.question}</p>
                  </div>
                  <div className="space-y-2">
                    {lesson.practiceQuestion.options.map((opt, oi) => {
                      const isSelected = quizAnswer === oi;
                      const isCorrect  = oi === lesson.practiceQuestion.correct;
                      let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
                      if (quizRevealed) cls += isCorrect ? "bg-green-500/15 border-green-500/40 text-green-300" : isSelected ? "bg-red-500/15 border-red-500/40 text-red-300" : "bg-white/3 border-white/8 text-gray-500";
                      else cls += isSelected ? "bg-re-500/20 border-re-500/40 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:border-re-500/30";
                      return (
                        <button key={oi} onClick={() => !quizRevealed && setQuizAnswer(oi)} className={cls} disabled={quizRevealed}>
                          <span className="font-bold mr-2">{["A","B","C","D"][oi]}.</span>{opt}
                          {quizRevealed && isCorrect && <Check className="w-4 h-4 text-green-400 inline ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                  {quizRevealed && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-blue-300 text-xs italic">{lesson.practiceQuestion.explanation}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {quizAnswer !== null && !quizRevealed && (
                      <button onClick={() => setQuizRevealed(true)} className="btn-secondary text-sm flex-1">Check Answer</button>
                    )}
                    {quizRevealed && (
                      <button onClick={() => { setQuizAnswer(null); setQuizRevealed(false); }} className="btn-secondary text-sm flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Chat Tab ──────────────────────────────────────────────────── */}
          {tab === "chat" && (
            <div className="flex flex-col" style={{ minHeight: 400 }}>
              {chatMsgs.length > 0 && (
                <div className="flex justify-end px-4 pt-3 flex-shrink-0">
                  <button onClick={() => setChatMsgs([])}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3" /> Clear chat
                  </button>
                </div>
              )}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 340 }}>
                {chatMsgs.length === 0 && (
                  <div className="text-center py-6">
                    <Bot className="w-8 h-8 text-re-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Ask me anything about <strong className="text-gray-300">{module.title}</strong></p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {[
                        `What are the key rules for ${module.title}?`,
                        `Give me an example exam question`,
                        `What mistakes do students make on this topic?`,
                        `Explain the most important concept here`,
                      ].map(q => (
                        <button key={q} onClick={() => askTutor(q)}
                          className="text-xs px-2.5 py-1 rounded-full bg-re-500/10 text-re-400 border border-re-500/20 hover:bg-re-500/20">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 bg-re-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-re-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-re-500/20 text-white" : "bg-white/8 text-gray-300"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 bg-re-500/20 rounded-lg flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-re-400" /></div>
                    <div className="bg-white/8 rounded-xl px-3 py-2 flex gap-1">
                      {[0,1,2].map(n => <span key={n} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: `${n*0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/8 flex-shrink-0 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") askTutor(chatInput); }}
                  placeholder={`Ask about ${module.title}...`}
                  className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
                <button onClick={() => askTutor(chatInput)} disabled={!chatInput.trim() || chatLoading}
                  className="w-8 h-8 bg-re-500 hover:bg-re-500/80 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — Complete Button */}
        <div className="p-4 border-t border-white/8 flex-shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            <span className="text-re-400 font-medium">+{module.estimatedMinutes * 1.5 | 0} XP</span> earned when you mark this complete
          </div>
          <button onClick={onComplete} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
            <CheckCircle className="w-4 h-4" /> Mark Complete & Earn XP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Celebration ───────────────────────────────────────────────────
function CourseCelebration({ course, cert, userName, onClose }: {
  course: Course; cert: CertRecord | null; userName: string; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1426] border border-yellow-500/30 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(251,191,36,0.2)" }}>
        <div className="text-6xl mb-4">🎓</div>
        <div className="text-yellow-400 font-bold tracking-widest text-xs uppercase mb-2">Course Complete!</div>
        <h2 className="text-white text-2xl font-bold mb-1">{course.title}</h2>
        <p className="text-gray-400 text-sm mb-6">Congratulations, <span className="text-re-300 font-semibold">{userName || "Graduate"}</span>! You've mastered all {course.modules.length} modules.</p>
        {cert && (
          <div className="glass-card p-4 mb-5 text-left border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-semibold">Your Certificate is Ready</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">Official certificate issued for <strong className="text-gray-200">{cert.courseName}</strong></p>
            <button onClick={() => printCertificate(userName, cert)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
              <Printer className="w-4 h-4" /> Print My Certificate
            </button>
          </div>
        )}
        <button onClick={onClose} className="btn-secondary w-full">Continue Learning</button>
      </div>
    </div>
  );
}

// ─── Main Classroom Page ──────────────────────────────────────────────────────
export default function ClassroomPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Graduate";

  const [activeCourse, setActiveCourse] = useState(COURSES[0].id);
  const [studyModule, setStudyModule] = useState<{ module: Module; course: Course } | null>(null);
  const [celebration, setCelebration] = useState<{ course: Course; cert: CertRecord | null } | null>(null);
  const [view, setView] = useState<"courses" | "certs" | "badges">("courses");
  const qc = useQueryClient();

  const { data: progress } = useQuery({
    queryKey: ["classroom-progress"],
    queryFn: async () => {
      const res = await fetch("/api/classroom/progress");
      return (await res.json()).data as {
        progress: { moduleId: string; courseId: string; completed: boolean; xpEarned: number }[];
        certs: CertRecord[];
        badges: { badgeId: string; earnedAt: string }[];
        totalXp: number;
        completedModules: number;
        totalModules: number;
      };
    },
  });

  const labMutation = useMutation({
    mutationFn: async ({ courseId, moduleId }: { courseId: string; moduleId: string }) => {
      const res = await fetch("/api/classroom/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, moduleId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["classroom-progress"] });
      setStudyModule(null);
      // Check if course is now fully complete
      if (data.data?.cert) {
        const course = COURSES.find(c => c.id === vars.courseId);
        if (course) setCelebration({ course, cert: data.data.cert });
      }
    },
  });

  // Derive completed module IDs from progress array
  const completedModuleIds: string[] = (progress?.progress || [])
    .filter(p => p.completed)
    .map(p => p.moduleId);

  const earnedBadgeIds: string[] = (progress?.badges || []).map(b => b.badgeId);
  const earnedCerts: CertRecord[] = progress?.certs || [];

  const course = COURSES.find(c => c.id === activeCourse) || COURSES[0];
  const completedCount = course.modules.filter(m => completedModuleIds.includes(m.id)).length;
  const courseCompleted = completedCount === course.modules.length;

  const totalCompleted = completedModuleIds.length;
  const totalAll = COURSES.reduce((s, c) => s + c.modules.length, 0);

  return (
    <div className="p-3 sm:p-6 space-y-4">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Classroom</h1>
          <p className="text-gray-500 text-sm">Georgia Real Estate Pre-License — AI-Powered Certification Courses</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-white text-sm font-semibold">{userName}</div>
          <div className="text-gray-500 text-xs">{totalCompleted}/{totalAll} modules · {earnedCerts.length} certs</div>
        </div>
      </div>

      <XpBar totalXp={progress?.totalXp || 0} />

      {/* ── View Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/8">
        {([
          { id: "courses", icon: BookOpen,      label: "Courses" },
          { id: "certs",   icon: GraduationCap, label: `Certifications${earnedCerts.length ? ` (${earnedCerts.length})` : ""}` },
          { id: "badges",  icon: Medal,          label: "Badges" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === t.id ? "bg-re-500/20 text-re-400 border border-re-500/30" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── CERTIFICATIONS VIEW ───────────────────────────────────────── */}
      {view === "certs" && (
        <div className="space-y-4">
          {earnedCerts.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">No Certificates Yet</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Complete all modules in any course to earn your certificate. Start with <strong className="text-gray-300">Level 1: Real Estate Foundations</strong>.</p>
              <button onClick={() => setView("courses")} className="btn-primary mt-4 text-sm">Start Learning</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-white font-bold">{earnedCerts.length} Certificate{earnedCerts.length !== 1 ? "s" : ""} Earned</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {earnedCerts.map(cert => (
                  <CertCard key={cert.id} cert={cert} userName={userName} />
                ))}
              </div>

              {/* Print all */}
              {earnedCerts.length > 1 && (
                <p className="text-gray-600 text-xs text-center">Click <strong className="text-gray-400">Print Certificate</strong> on any card to open the print-ready version with your name.</p>
              )}
            </>
          )}

          {/* Locked courses */}
          {COURSES.filter(c => !earnedCerts.find(ec => ec.courseId === c.id)).length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-gray-500" /> Upcoming Certifications</h3>
              <div className="space-y-2">
                {COURSES.filter(c => !earnedCerts.find(ec => ec.courseId === c.id)).slice(0, 6).map(c => {
                  const done = c.modules.filter(m => completedModuleIds.includes(m.id)).length;
                  const pct  = Math.round((done / c.modules.length) * 100);
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{c.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 flex-1 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full bg-re-500/60 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-600 text-xs flex-shrink-0">{done}/{c.modules.length}</span>
                        </div>
                      </div>
                      <button onClick={() => { setActiveCourse(c.id); setView("courses"); }} className="text-xs text-re-400 hover:text-re-300 flex-shrink-0">
                        {pct === 0 ? "Start" : "Continue"} →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BADGES VIEW ───────────────────────────────────────────────── */}
      {view === "badges" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-re-400" />
            <h2 className="text-white font-bold">{earnedBadgeIds.length} / {BADGES.length} Badges Earned</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {BADGES.map((badge: BadgeItem) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              return (
                <div key={badge.id}
                  className={`p-4 rounded-2xl border text-center transition-all ${isEarned ? "bg-gradient-to-br from-yellow-500/15 to-amber-500/5 border-yellow-500/30 shadow-sm" : "bg-white/3 border-white/8 opacity-50 grayscale"}`}>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className={`text-sm font-bold mb-1 ${isEarned ? "text-yellow-300" : "text-gray-500"}`}>{badge.label}</div>
                  <div className="text-xs text-gray-500 leading-tight">{badge.description}</div>
                  {isEarned && <div className="mt-2"><BadgeCheck className="w-3.5 h-3.5 text-green-400 mx-auto" /></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COURSES VIEW ──────────────────────────────────────────────── */}
      {view === "courses" && (
        <div className="space-y-4">
          {/* Course tabs */}
          <div className="glass-card p-5">
            <div className="flex gap-2 flex-wrap mb-5 pb-4 border-b border-white/8">
              {COURSES.map(c => {
                const done = c.modules.filter(m => completedModuleIds.includes(m.id)).length;
                const isComplete = done === c.modules.length;
                const hasCert = earnedCerts.find(ec => ec.courseId === c.id);
                return (
                  <button key={c.id} onClick={() => setActiveCourse(c.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${activeCourse === c.id ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-400 hover:text-gray-200 border border-white/8 hover:border-white/20"}`}>
                    {hasCert && <GraduationCap className="w-3 h-3 text-yellow-400" />}
                    <span className="truncate max-w-[120px]">{c.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${isComplete ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-500"}`}>
                      {done}/{c.modules.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Course Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {courseCompleted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${course.difficulty === "BEGINNER" ? "bg-green-500/15 text-green-400" : course.difficulty === "INTERMEDIATE" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>
                    {course.difficulty}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-400">{course.category.replace("_", " ")}</span>
                </div>
                <h3 className="text-white font-bold text-lg">{course.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{course.description}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.modules.length} modules</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{course.estimatedHours}h</span>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" />{completedCount}/{course.modules.length} done</span>
                  {course.certifiable && (
                    <span className="flex items-center gap-1 text-yellow-500"><GraduationCap className="w-3 h-3" /> Certification</span>
                  )}
                </div>
              </div>
              {/* Progress ring */}
              <div className="w-16 h-16 flex-shrink-0 relative">
                <svg viewBox="0 0 48 48" className="w-16 h-16 -rotate-90">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="none"
                    stroke={courseCompleted ? "#4ade80" : "#E8825A"} strokeWidth="4"
                    strokeDasharray={`${(completedCount / course.modules.length) * 113} 113`}
                    strokeLinecap="round" className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {courseCompleted
                    ? <CheckCircle className="w-5 h-5 text-green-400" />
                    : <span className="text-xs font-bold text-white">{Math.round((completedCount / course.modules.length) * 100)}%</span>}
                </div>
              </div>
            </div>

            {/* If course complete, show print cert button */}
            {courseCompleted && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-yellow-300 text-sm font-semibold">Certificate Earned!</div>
                  <div className="text-gray-400 text-xs">You completed all modules in this course.</div>
                </div>
                {earnedCerts.find(ec => ec.courseId === course.id) && (
                  <button onClick={() => {
                    const c = earnedCerts.find(ec => ec.courseId === course.id)!;
                    printCertificate(userName, c);
                  }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg,#E8825A,#f59e0b)" }}>
                    <Printer className="w-3.5 h-3.5" /> Print Certificate
                  </button>
                )}
              </div>
            )}

            {/* Module List */}
            <div className="space-y-2">
              {course.modules.map((mod, mIdx) => {
                const isDone   = completedModuleIds.includes(mod.id);
                const isLocked = mIdx > 0 && !completedModuleIds.includes(course.modules[mIdx - 1].id);
                return (
                  <div key={mod.id}
                    onClick={() => !isLocked && !isDone && setStudyModule({ module: mod, course })}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isDone    ? "bg-green-500/6 border-green-500/20 cursor-default" :
                      isLocked  ? "opacity-40 bg-white/2 border-white/6 cursor-not-allowed" :
                                  "bg-white/3 border-white/8 hover:border-re-500/30 hover:bg-re-500/5 cursor-pointer"
                    }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-500/20" : isLocked ? "bg-white/5" : "bg-re-500/15"}`}>
                      {isDone ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                        isLocked ? <Lock className="w-4 h-4 text-gray-600" /> :
                        <span className="text-xs font-bold text-re-400">{mIdx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDone ? "text-green-300" : "text-white"}`}>{mod.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5 truncate">{mod.description} · ~{mod.estimatedMinutes} min</div>
                    </div>
                    {isDone ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs flex-shrink-0">
                        <Award className="w-3.5 h-3.5" /> Done
                      </div>
                    ) : !isLocked && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 text-re-400"
                        style={{ background: "rgba(232,130,90,0.12)", border: "1px solid rgba(232,130,90,0.25)" }}>
                        <Play className="w-3 h-3" /> Study <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Module Study Panel ─────────────────────────────────────── */}
      {studyModule && (
        <ModuleStudyPanel
          module={studyModule.module}
          course={studyModule.course}
          userName={userName}
          onClose={() => setStudyModule(null)}
          onComplete={() => labMutation.mutate({
            courseId: studyModule.course.id,
            moduleId: studyModule.module.id,
          })}
        />
      )}

      {/* ── Course Completion Celebration ──────────────────────────── */}
      {celebration && (
        <CourseCelebration
          course={celebration.course}
          cert={celebration.cert}
          userName={userName}
          onClose={() => { setCelebration(null); setView("certs"); }}
        />
      )}
    </div>
  );
}
