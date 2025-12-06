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
        primary: "#F75270",
        secondary: "#DC143C",
        dark: "#000000",
        light: "#ffffff",
      },
      fontFamily: {
        japanese: ["var(--font-zen-maru)", "sans-serif"],
        title: ["var(--font-dm-serif)", "serif"],
        handwriting: ["var(--font-parisienne)", "cursive"],
      },
      borderRadius: {
        large: "100px",
        medium: "20px",
        small: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
