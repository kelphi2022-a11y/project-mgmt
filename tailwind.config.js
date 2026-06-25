/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0e0f11",
        surface: "#16181d",
        border: "#1f2229",
        primary: "#e8eaf0",
        muted: "#6b7280",
        accent: "#5b6af5",
        "accent-hover": "#4757e8",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        escalated: "#f97316"
      },
      borderRadius: {
        DEFAULT: "8px",
        full: "9999px",
        md: "6px"
      }
    }
  },
  plugins: []
};
