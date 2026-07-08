/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        negroSuave: "#050816",
        blancoPuro: "#f9fafb",
        verdeEsmeralda: "#10b981",
      },
    },
  },
  plugins: [],
};
