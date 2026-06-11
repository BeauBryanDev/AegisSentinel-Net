/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        void: "#050507", // absolute background, near-black with cold tint
        panel: "#0C0D10",  // panel surface
        "panel-raised": "#121419", // hover / elevated surface

        // Silver identity scale (the brand)
        silver: {
          900: "#1A1C21",  // deepest structural lines
          700: "#2A2D34",  // inner borders
          500: "#3A3D45",   // default panel borders
          300: "#8A8F99",  // secondary text, labels
          100: "#C8CCD4",   // primary text
          50: "#E8ECF2",   // neon highlight, glow edges, headings
        },

        // Semantic
        threat: {
          DEFAULT: "#FF2B3A", // FIGHT boxes, HIGH threat, alerts
          dim: "#7A1620",   // threat backgrounds, dimmed states
        },
        online: "#4ADE80", // terminal green: ONLINE, system feed
        warn: "#FFB020",  // medium threat, degraded states
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        // Silver neon glow for panel borders
        "hud": "0 0 0 1px #3A3D45, 0 0 12px rgba(129, 169, 209, 0.06)",
        "hud-bright": "0 0 0 1px #8A8F99, 0 0 16px rgba(232, 236, 242, 0.15)",
        // Red threat glow
        "threat": "0 0 0 1px #FF2B3A, 0 0 14px rgba(255, 43, 58, 0.35)",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "threat-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 1px #FF2B3A, 0 0 10px rgba(255, 43, 58, 0.25)" },
          "50%": { boxShadow: "0 0 0 1px #FF2B3A, 0 0 22px rgba(255, 43, 58, 0.55)" },
        },
      },
      animation: {
        "pulse-live": "pulse-live 1.2s ease-in-out infinite",
        "scanline": "scanline 6s linear infinite",
        "threat-pulse": "threat-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};