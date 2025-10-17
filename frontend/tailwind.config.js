/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/index.html"
  ],
  theme: { extend: {} },
  plugins: []
  // If you want typography:
  // plugins: [require("@tailwindcss/typography")]
};
