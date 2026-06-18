import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Georgia Peach brand ─────────────────────────────────────────────
        re: {
          50:  "#fff7f5",
          100: "#ffeae3",
          200: "#ffd0c0",
          300: "#ffad92",
          400: "#f09070",
          500: "#E8825A",   // Georgia Peach — main brand
          600: "#d06840",
          700: "#b05530",
          800: "#8f4228",
          900: "#6e3020",
          950: "#3d1508",
        },

        // ── Primary action — blue ───────────────────────────────────────────
        primary: {
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
          950: "#172554",
        },

        // ── AI accent — violet ──────────────────────────────────────────────
        ai: {
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
          950: "#2e1065",
        },

        // ── Dark surface stack ──────────────────────────────────────────────
        surface: {
          base:    "#0A0F1E",
          raised:  "#0F1629",
          overlay: "#111827",
          border:  "#1f2937",
          muted:   "#374151",
          DEFAULT: "#0A0F1E",
        },

        // ── Semantic status colors ──────────────────────────────────────────
        success: {
          DEFAULT: "#10b981",
          subtle:  "rgba(16,185,129,0.10)",
          border:  "rgba(16,185,129,0.20)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          subtle:  "rgba(245,158,11,0.10)",
          border:  "rgba(245,158,11,0.20)",
        },
        danger: {
          DEFAULT: "#ef4444",
          subtle:  "rgba(239,68,68,0.10)",
          border:  "rgba(239,68,68,0.20)",
        },
        info: {
          DEFAULT: "#3b82f6",
          subtle:  "rgba(59,130,246,0.10)",
          border:  "rgba(59,130,246,0.20)",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },

      borderRadius: {
        "4xl": "2rem",
      },

      boxShadow: {
        glass:         "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        panel:         "0 4px 24px 0 rgba(0, 0, 0, 0.40)",
        "panel-lg":    "0 8px 48px 0 rgba(0, 0, 0, 0.60)",
        "glow-peach":  "0 0 20px rgba(232, 130, 90, 0.30)",
        "glow-blue":   "0 0 20px rgba(59, 130, 246, 0.30)",
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.30)",
        "glow-amber":  "0 0 20px rgba(245, 158, 11, 0.25)",
      },

      animation: {
        "pulse-slow":     "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":        "fadeIn 0.2s ease-out",
        "slide-up":       "slideUp 0.25s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "slide-out-right":"slideOutRight 0.2s ease-in",
        shimmer:          "shimmer 2s linear infinite",
        "spin-slow":      "spin 3s linear infinite",
        "bounce-dot":     "bounceDot 0.9s ease-in-out infinite",
      },

      keyframes: {
        fadeIn:        { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:       { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInRight:  { "0%": { transform: "translateX(20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideOutRight: { "0%": { transform: "translateX(0)", opacity: "1" }, "100%": { transform: "translateX(20px)", opacity: "0" } },
        shimmer:       { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        bounceDot: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "1" },
          "30%":           { transform: "translateY(-6px)", opacity: "0.6" },
        },
      },

      transitionDuration: { "50": "50ms", "250": "250ms", "400": "400ms" },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":  "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        shimmer:           "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
        "ai-gradient":     "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        "re-gradient":     "linear-gradient(135deg, #E8825A 0%, #f59e0b 100%)",
      },

      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};

export default config;
