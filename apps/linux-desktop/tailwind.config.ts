import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Clinical lab palette — deep slate surfaces + cyan/teal accent
        bg: {
          DEFAULT: '#0b1220',
          raised: '#101a2c',
          panel: '#0f1828',
          inset: '#0a111e',
        },
        border: {
          DEFAULT: '#1e2c44',
          subtle: '#172238',
        },
        ink: {
          DEFAULT: '#e6edf7',
          muted: '#9fb0c8',
          faint: '#5f708a',
        },
        accent: {
          DEFAULT: '#2dd4bf',
          soft: '#0d3b39',
          deep: '#0f766e',
        },
        sev: {
          minor: '#34d399',
          moderate: '#fbbf24',
          major: '#fb923c',
          contra: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config;
