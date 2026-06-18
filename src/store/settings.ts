"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL } from "@/lib/ai/models";

interface SettingsState {
  selectedModel: string;
  focusMode: boolean;
  preferredCategory: string;
  licenseType: string;
  setModel: (model: string) => void;
  setFocusMode: (v: boolean) => void;
  setPreferredCategory: (cat: string) => void;
  setLicenseType: (lt: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedModel: DEFAULT_MODEL,
      focusMode: false,
      preferredCategory: "ALL",
      licenseType: "SALESPERSON",
      setModel: (selectedModel) => set({ selectedModel }),
      setFocusMode: (focusMode) => set({ focusMode }),
      setPreferredCategory: (preferredCategory) => set({ preferredCategory }),
      setLicenseType: (licenseType) => set({ licenseType }),
    }),
    { name: "ga-re-settings" }
  )
);
