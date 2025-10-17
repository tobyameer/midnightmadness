import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        horror: {
          background: "#0D0B0C",
          surface: "#1A1314",
          accent: "#D23A1F",
          accentHover: "#FF4C24",
          bone: "#9B8876",
          burnt: "#B05D43",
          chain: "#3A2B28"
        },
        brand: {
          DEFAULT: "#D23A1F",
          foreground: "#0D0B0C"
        }
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(210, 58, 31, 0.35)",
        glow: "0 0 35px rgba(210, 58, 31, 0.4)"
      }
    }
  },
  plugins: []
} satisfies Config;
