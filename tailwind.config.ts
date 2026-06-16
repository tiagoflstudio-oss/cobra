import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#d5ff40", // Cor clássica verde-limão Confia
          foreground: "#000000",
        },
        background: "#070708", // Fundo super escuro retrô
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          border: "rgba(255, 255, 255, 0.08)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
