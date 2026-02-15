/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emeraldNight: "#061a14",
        emeraldDeep: "#0b2c21",
        emeraldSoft: "#145036",
        goldLight: "#d4af37",
        goldSoft: "#e8d08b",
        rubyDark: "#7c1f2a",
        rubySoft: "#a11f3d"
      },
      fontFamily: {
        arabic: ["'Amiri'", "'Cairo'", "serif"]
      },
      boxShadow: {
        luxury: "0 10px 35px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(212, 175, 55, 0.3), 0 0 35px rgba(212, 175, 55, 0.15)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(212, 175, 55, 0)" }
        }
      },
      animation: {
        floatIn: "floatIn 0.6s ease-out",
        pulseGold: "pulseGold 1.2s ease-out"
      }
    }
  },
  plugins: []
};
