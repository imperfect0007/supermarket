/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        market: {
          cream: "#f5f1ea",
          sand: "#e8e0d4",
          paper: "#fdfcfa",
          ink: "#1c1917",
          muted: "#57534e",
          warm: "#292524",
          card: "#fffefb",
          terra: "#c24133",
          terradark: "#9f2f24",
          terralight: "#fde8e4",
          sage: "#3f5d4a",
          sagemuted: "#c5d4c8",
          citrus: "#d97706",
          leaf: "#4d7c5c",
        },
        brand: {
          50: "#fef7f4",
          100: "#fde8e4",
          500: "#c24133",
          600: "#9f2f24",
          900: "#431c18",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(28, 25, 23, 0.08), 0 12px 32px -8px rgba(28, 25, 23, 0.06)",
        lift: "0 20px 40px -12px rgba(28, 25, 23, 0.12), 0 8px 16px -8px rgba(194, 65, 51, 0.08)",
        innerGlow: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 120% 80% at 100% -20%, rgba(194, 65, 51, 0.12), transparent 50%), radial-gradient(ellipse 80% 60% at -10% 60%, rgba(77, 124, 92, 0.1), transparent 45%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(217, 119, 6, 0.08), transparent 40%)",
        "grain-light":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
