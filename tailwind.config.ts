import type { Config } from "tailwindcss";

/**
 * ConduzX Design System
 * Cores definidas como variáveis CSS em src/app/globals.css (":root").
 * Aqui apenas as expomos ao Tailwind com suporte a opacidade (ex.: bg-brand/20).
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Superfícies (do mais escuro ao mais claro)
        night: {
          950: token("night-950"),
          900: token("night-900"),
          850: token("night-850"),
          800: token("night-800"),
          700: token("night-700"),
          600: token("night-600"),
          500: token("night-500"),
        },
        // Amarelo ConduzX
        brand: {
          DEFAULT: token("brand-400"),
          200: token("brand-200"),
          300: token("brand-300"),
          400: token("brand-400"),
          500: token("brand-500"),
          600: token("brand-600"),
          ink: token("brand-ink"),
        },
        // Texto
        ink: token("ink"),
        muted: token("muted"),
        subtle: token("subtle"),
        line: token("line"),
        // Estados
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        info: token("info"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.6)",
        raised:
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 14px -6px rgba(0,0,0,0.7)",
        pressed: "inset 0 2px 6px rgba(0,0,0,0.55)",
        shell: "0 30px 80px -20px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgb(var(--brand-400) / 0.4), 0 8px 24px -8px rgb(var(--brand-400) / 0.55)",
      },
      backgroundImage: {
        dots: "radial-gradient(rgb(var(--brand-400)) 1.5px, transparent 1.5px)",
        stripes:
          "repeating-linear-gradient(135deg, rgb(var(--brand-400)) 0 3px, transparent 3px 11px)",
      },
    },
  },
  plugins: [],
};

export default config;
