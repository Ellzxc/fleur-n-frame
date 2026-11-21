/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fleur: {
          cream: "#FBF7F2",
          blush: "#F7E8EA",
          rose: "#D4A5A5",
          sage: "#B7C4B7",
          moss: "#8FA98F",
          beige: "#EDE3D5",
          ink: "#4A4443",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 8px 24px -6px rgba(120, 90, 100, 0.10)",
        softCard: "0 4px 16px -4px rgba(110, 90, 100, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      filter: {
        grayscale: "grayscale(100%)",
        sepia: "sepia(100%) saturate(1.2)",
      },
    },
  },
  plugins: [],
};
