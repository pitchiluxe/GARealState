import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to GA Real Estate Academy to access your AI-powered Georgia Real Estate exam prep tools.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A0F1E] via-[#0F1629] to-[#1a1008] relative overflow-hidden">
        {/* Peach glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-re-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-re-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-re-500/30">
              <span className="text-white text-2xl font-black">🍑</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-re-400/80 uppercase tracking-widest">Georgia</div>
              <div className="font-black text-3xl bg-gradient-to-r from-white to-re-300 bg-clip-text text-transparent leading-none">
                Real Estate
              </div>
              <div className="text-xs font-semibold text-re-400/50 mt-0.5 tracking-wider">by Erick OMARI</div>
              <div className="text-sm font-semibold text-re-400/70 mt-0.5">Certification Simulator</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Pass Your GA Real Estate Exam<br />
            <span className="gradient-text">with Confidence</span>
          </h1>

          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            AI-powered exam prep platform with practice tests, interactive study sessions, structured courses, and real-time coaching.
          </p>

          <div className="space-y-4">
            {[
              { icon: "🎯", text: "AI Study Copilot for instant answers on any exam topic" },
              { icon: "📚", text: "Structured courses covering all GA exam categories" },
              { icon: "✍️", text: "Practice tests with Georgia-specific scenarios" },
              { icon: "🏆", text: "Track progress with XP, badges, and leaderboards" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-300 text-sm leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-xs text-gray-600">
              Not affiliated with PSI, GREC, or the Georgia Real Estate Commission. For educational and exam preparation purposes only. by Erick OMARI
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
