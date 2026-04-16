import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f5f1e8",
        ink: "#1d1c19",
        accent: "#c96c37",
        line: "#d8d0c1",
        panel: "#fffdf9"
      },
      boxShadow: {
        card: "0 24px 60px -32px rgba(65, 45, 22, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
