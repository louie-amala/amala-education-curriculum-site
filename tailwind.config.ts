import type { Config } from "tailwindcss";

// Brand palette — Build Specification §9.1 (hex is authoritative for digital).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#004976",
        "dark-navy": "#041E42",
        olive: "#8F993E",
        orange: "#EF9600",
        gold: "#F0B323",
        teal: "#4797A8",
        aqua: "#40C1AC",
        plum: "#893B67",
        "cool-grey": "#97999B",
        terracotta: "#BD472A",
        // Warm neutrals — a chosen, slightly warm paper/ink rather than stark white / cold grey.
        paper: "#F7F5F0",
        "paper-card": "#FFFFFF",
        ink: "#20293B",
        "ink-soft": "#5A6473",
        line: "#E7E3DA",
      },
      fontFamily: {
        // Self-hosted Roboto (headings) / Lato (body) to be wired in a later step;
        // fallback stacks per spec §9.2 for now.
        heading: ["Roboto", "Arial", "sans-serif"],
        body: ["Lato", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
