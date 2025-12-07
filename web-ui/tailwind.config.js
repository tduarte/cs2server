/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cs2: {
          orange: '#FF6B35',
          dark: '#1a1a1a',
          darker: '#0f0f0f',
        }
      }
    },
  },
  plugins: [],
}

