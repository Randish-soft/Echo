/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // App Router (Next.js 13+)
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Pages Router (if you still use /pages)
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    // Reusable components
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Fallback for other src folders
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // we default to dark via styles, but this enables toggling via `class`
  theme: {
    extend: {
      // Small niceties used in the design
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(2, 6, 23, 0.45)', // matches index.html aesthetic
      },
      colors: {
        // Optional aliases if you want semantic names in classes like bg-brand
        brand: {
          DEFAULT: '#3b82f6', // blue-500
          accent: '#a78bfa',  // violet-400/500
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b82f6, #a78bfa)',
      },
    },
  },
  plugins: [
    // Add official plugins if you want them
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/container-queries'),
  ],
};
