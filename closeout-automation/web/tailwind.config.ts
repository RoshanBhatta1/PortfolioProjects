import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7f5",
          100: "#dfece5",
          500: "#2f6f52",
          600: "#245a41",
          700: "#1c4633",
        },
      },
    },
  },
  plugins: [],
};

export default config;
