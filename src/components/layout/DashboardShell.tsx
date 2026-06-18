"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/settings";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AppClock } from "./AppClock";
import { FloatingStudyBot } from "@/components/ui/FloatingStudyBot";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { focusMode } = useSettingsStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0A0F1E] overflow-hidden">
      {!focusMode && (
        <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileSidebarOpen((v) => !v)} />
        <main className={cn("flex-1 min-h-0 flex flex-col overflow-hidden w-full", focusMode && "max-w-5xl mx-auto")}>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden page-enter" style={{ overscrollBehavior: "contain" }}>
            {children}
          </div>
        </main>
        <footer className="flex-shrink-0 flex items-center justify-end px-4 h-5 border-t border-white/5 bg-[#070c1a]">
          <AppClock />
        </footer>
      </div>
      <FloatingStudyBot />
    </div>
  );
}
