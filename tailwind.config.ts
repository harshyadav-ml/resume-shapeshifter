import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        /* ── Extended palette ───────────────────────────────── */
        obsidian: {
          50:  "#edf1fa",
          100: "#d0d8ef",
          200: "#a3b0d9",
          300: "#7588bf",
          400: "#4d63a8",
          500: "#2e4490",
          600: "#1e3070",
          700: "#121e4a",
          800: "#0d1733",
          900: "#090d16",
          950: "#050810",
        },
        indigo: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        /* Elevation system */
        "surface-1": "0 1px 3px hsl(0 0% 0% / 0.4), 0 1px 2px hsl(0 0% 0% / 0.6)",
        "surface-2": "0 4px 12px hsl(0 0% 0% / 0.5), 0 2px 4px hsl(0 0% 0% / 0.4)",
        "surface-3": "0 8px 32px hsl(0 0% 0% / 0.5), 0 4px 16px hsl(0 0% 0% / 0.4)",
        "surface-4": "0 24px 64px hsl(0 0% 0% / 0.6), 0 8px 32px hsl(0 0% 0% / 0.5)",
        /* Glow effects */
        "glow-primary": "0 0 24px hsl(226 100% 66% / 0.2), 0 0 8px hsl(226 100% 66% / 0.12)",
        "glow-emerald": "0 0 24px hsl(155 80% 52% / 0.2), 0 0 8px hsl(155 80% 52% / 0.12)",
        "glow-amber":   "0 0 24px hsl(38 100% 62% / 0.2), 0 0 8px hsl(38 100% 62% / 0.12)",
        "glow-sm-primary": "0 0 12px hsl(226 100% 66% / 0.15)",
        /* Inner highlight */
        "inner-highlight": "inset 0 1px 0 hsl(220 100% 100% / 0.08)",
        "inner-highlight-sm": "inset 0 1px 0 hsl(220 100% 100% / 0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        /* Mesh gradients */
        "mesh-primary": `
          radial-gradient(ellipse 80% 50% at 20% 20%, hsl(226 100% 66% / 0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, hsl(155 80% 52% / 0.05) 0%, transparent 60%)
        `,
        "mesh-subtle": `
          radial-gradient(ellipse 100% 60% at 50% 0%, hsl(226 100% 66% / 0.06) 0%, transparent 70%)
        `,
        /* Shimmer */
        "shimmer-white": "linear-gradient(90deg, transparent 0%, hsl(220 100% 100% / 0.06) 50%, transparent 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "score-count": {
          from: { opacity: "0", transform: "translateY(4px) scale(0.9)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in-up":      "fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in":        "scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-right":  "slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-glow":      "pulse-glow 2s ease-in-out infinite",
        "shimmer":         "shimmer 2s ease-in-out infinite",
        "score-count":     "score-count 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "float":           "float 4s ease-in-out infinite",
        "spin-slow":       "spin 8s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
