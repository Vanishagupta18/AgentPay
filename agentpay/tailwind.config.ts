import type { Config } from 'tailwindcss';

// Deliberately restrained palette — this is meant to read as a fintech
// operations console, not an "AI demo" template. One accent color, a lot
// of neutral grey, no gradients/glassmorphism.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eef4ff',
          600: '#2952cc',
          700: '#1f3fa3',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          border: '#e4e4e7',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
