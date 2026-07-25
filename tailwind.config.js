/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F7FB",
        surface: "#FFFFFF",
        ink: "#0C1222",
        muted: "#5B6578",
        line: "#E2E8F2",
        signal: {
          DEFAULT: "#0F766E",
          bright: "#14B8A6",
          fog: "#E8F5F3",
        },
        ok: "#15803D",
        warn: "#B45309",
        danger: "#DC2626",
      },
      fontFamily: {
        display: ["Sora", "Figtree", "sans-serif"],
        sans: ["Figtree", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 30px -18px rgba(12, 18, 34, 0.28)",
      },
    },
  },
  plugins: [],
};
