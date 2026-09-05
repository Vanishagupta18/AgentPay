import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14151A',
        paper: '#FAFAF9',
        line: '#E4E4E1',
        ledger: { DEFAULT: '#24346B', light: '#EEF0F8' },
        signal: {
          green: { DEFAULT: '#1F7A4D', bg: '#EAF6EF' },
          amber: { DEFAULT: '#B45309', bg: '#FDF3E7' },
          red: { DEFAULT: '#B42318', bg: '#FCEBEA' },
          grey: { DEFAULT: '#52525B', bg: '#F1F1F0' },
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
