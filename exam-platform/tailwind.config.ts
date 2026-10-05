import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // "trắng sữa" background instead of pure #FFFFFF, "off-black" instead of pure #000000
        paper: "#FAF8F3",
        "paper-dark": "#F0ECE2",
        ink: "#1C1B19",
        "ink-soft": "#4A4744",
        border: "#E4DFD3",
      },
fontFamily: {
  sans: ["var(--font-charter)", "Charter", "Georgia", "serif"],
  exam: ["var(--font-montserrat)", "system-ui", "sans-serif"],
},
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
