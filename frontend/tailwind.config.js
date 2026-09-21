/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pravaah: {
          navy: '#0F2942',
          blue: '#0284C7',
          cyan: '#06B6D4',
          bg: '#EFF3F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
          yellow: '#D97706',
          orange: '#EA580C',
          red: '#DC2626',
          green: '#16A34A',
        }
      }
    },
  },
  plugins: [],
};
