// ─── Design Tokens — GA Real Estate Playground ───────────────────────────────
// Georgia Peach theme. Keep in sync with tailwind.config.ts and globals.css.

export const surface = {
  base:    "#0A0F1E",
  raised:  "#0F1629",
  overlay: "#111827",
  border:  "#1f2937",
  muted:   "#374151",
} as const;

export const brand = {
  re:      "#E8825A",   // Georgia Peach
  primary: "#3b82f6",   // Blue — primary action
  ai:      "#8b5cf6",   // Violet — AI features
} as const;

export const re = {
  50:  "#fff7f5",
  100: "#ffeae3",
  200: "#ffd0c0",
  300: "#ffad92",
  400: "#f09070",
  500: "#E8825A",
  600: "#d06840",
  700: "#b05530",
  800: "#8f4228",
  900: "#6e3020",
} as const;

export const primary = {
  50:  "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
} as const;

export const ai = {
  50:  "#f5f3ff",
  100: "#ede9fe",
  200: "#ddd6fe",
  300: "#c4b5fd",
  400: "#a78bfa",
  500: "#8b5cf6",
  600: "#7c3aed",
  700: "#6d28d9",
  800: "#5b21b6",
  900: "#4c1d95",
} as const;

export const status = {
  success: { DEFAULT: "#10b981", subtle: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.20)"  },
  warning: { DEFAULT: "#f59e0b", subtle: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.20)"  },
  danger:  { DEFAULT: "#ef4444", subtle: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.20)"   },
  info:    { DEFAULT: "#3b82f6", subtle: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.20)"  },
} as const;

export const typography = {
  fontSans: "Inter, system-ui, sans-serif",
  fontMono: "JetBrains Mono, Fira Code, monospace",
  scale: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
  weight: { normal: "400", medium: "500", semibold: "600", bold: "700" },
  lineHeight: { tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625" },
} as const;

export const shadows = {
  glass:      "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  panel:      "0 4px 24px 0 rgba(0, 0, 0, 0.40)",
  panelLg:    "0 8px 48px 0 rgba(0, 0, 0, 0.60)",
  glowPeach:  "0 0 20px rgba(232, 130, 90, 0.30)",
  glowBlue:   "0 0 20px rgba(59, 130, 246, 0.30)",
  glowViolet: "0 0 20px rgba(139, 92, 246, 0.30)",
  glowAmber:  "0 0 20px rgba(245, 158, 11, 0.25)",
} as const;

export const gradients = {
  re:      "linear-gradient(135deg, #E8825A 0%, #f59e0b 100%)",
  ai:      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  success: "linear-gradient(135deg, #10b981 0%, #4ade80 100%)",
} as const;

export const chartColors = [
  "#E8825A",  // peach
  "#10b981",  // emerald
  "#f59e0b",  // amber
  "#8b5cf6",  // violet
  "#3b82f6",  // blue
  "#06b6d4",  // cyan
  "#ec4899",  // pink
  "#84cc16",  // lime
] as const;

export const zIndex = {
  base: 0, raised: 10, dropdown: 20, sticky: 30, overlay: 40, modal: 50, toast: 60,
} as const;
