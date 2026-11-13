/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#0c1a11',
          grass: '#142b1e',
          lines: 'rgba(255, 255, 255, 0.25)',
          halfspace: 'rgba(56, 189, 248, 0.08)',
          zone14: 'rgba(239, 68, 68, 0.12)',
        },
        tactical: {
          home: '#3b82f6',
          away: '#ef4444',
          ball: '#fbbf24',
          space: '#10b981',
          danger: '#f43f5e',
          pressing: '#f97316',
          counterfactual: '#8b5cf6',
          ghost: '#06b6d4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
