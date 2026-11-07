import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10283C',
        paper: '#FFFFFF',
        canvas: '#EAF1F4',
        action: '#0A6B8F',
        ok: {
          DEFAULT: '#17703F',
          bg: '#E3F4EA',
        },
        warn: {
          DEFAULT: '#8A5200',
          bg: '#FFF1CF',
        },
        danger: {
          DEFAULT: '#B3261E',
          bg: '#FDE7E5',
        },
        mute: '#4A6074',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

