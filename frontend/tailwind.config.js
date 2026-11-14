/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF8F5',
          100: '#F5F0E6',  // Primary background
          200: '#EAE3D2',
          300: '#DDD3BC',
          surface: '#FAF7F2', // Secondary background
          card: '#FFFFFF',
          border: '#E5E0D8',
          borderMuted: '#D6D0C4',
        },
        ink: {
          950: '#171717',  // Primary near-black text
          900: '#262626',
          800: '#404040',
          700: '#525252',  // Supporting muted charcoal
          600: '#737373',
          500: '#A3A3A3',
          muted: '#737373',
        },
        brand: {
          orange: '#F28C28',        // Accent orange
          orangeHover: '#E07B18',
          orangeLight: '#FEF3E8',
          orangeBorder: '#FCD8B3',
        },
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
