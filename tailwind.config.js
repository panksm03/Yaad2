/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f7fdf7',
          100: '#e8f5e8',
          200: '#a8d5ba',
          300: '#7ec49a',
          400: '#5fb17a',
          500: '#4a7c59',
          600: '#3d6648',
          700: '#2d5738',
          800: '#1e3a24',
          900: '#0f1d12',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}