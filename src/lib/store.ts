import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ExamCategory, GARELicenseType } from "@/types";

interface StudyStore {
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  focusMode: "standard" | "deep" | "quick";
  setFocusMode: (mode: "standard" | "deep" | "quick") => void;

  preferredCategory: ExamCategory;
  setPreferredCategory: (category: ExamCategory) => void;

  licenseType: GARELicenseType;
  setLicenseType: (type: GARELicenseType) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      selectedModel: "deepseek/deepseek-chat-v3-0324:free",
      setSelectedModel: (model) => set({ selectedModel: model }),

      focusMode: "standard",
      setFocusMode: (mode) => set({ focusMode: mode }),

      preferredCategory: "LICENSE_LAW",
      setPreferredCategory: (category) => set({ preferredCategory: category }),

      licenseType: "SALESPERSON",
      setLicenseType: (type) => set({ licenseType: type }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "ga-re-study-store",
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        focusMode: state.focusMode,
        preferredCategory: state.preferredCategory,
        licenseType: state.licenseType,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
