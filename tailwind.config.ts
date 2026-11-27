import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#151412", soft: "#26241F", muted: "#4A463F" },
        paper: { DEFAULT: "#F6F2EB", warm: "#EFE8DC", line: "#E2D9CA" },
        stone: { DEFAULT: "#7D766B", light: "#A9A193" },
        brass: { DEFAULT: "#B08447", dark: "#8E6833", light: "#D9B886" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: { label: "0.22em" },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
        zoomIn: { from: { opacity: "0", transform: "scale(.97)" }, to: { opacity: "1", transform: "none" } },
        kenburns: { from: { transform: "scale(1.08)" }, to: { transform: "scale(1)" } },
      },
      animation: {
        fadeIn: "fadeIn .4s ease both",
        fadeUp: "fadeUp .7s cubic-bezier(.2,.7,.2,1) both",
        zoomIn: "zoomIn .35s cubic-bezier(.2,.7,.2,1) both",
        kenburns: "kenburns 9s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
