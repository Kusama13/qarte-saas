import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#654EDA",
          50: "#F0EEFB",
          100: "#E1DDF7",
          200: "#C3BBEF",
          300: "#A599E7",
          400: "#8777DF",
          500: "#654EDA",
          600: "#4831C4",
          700: "#382698",
          800: "#271B6B",
          900: "#17103F",
        },
        secondary: {
          DEFAULT: "#9D8FE8",
          50: "#F5F3FC",
          100: "#EBE8F9",
          200: "#D7D0F3",
          300: "#C3B9ED",
          400: "#AFA1E8",
          500: "#9D8FE8",
          600: "#7A67DE",
          700: "#5740D4",
          800: "#3E2AAF",
          900: "#2D1F7E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
