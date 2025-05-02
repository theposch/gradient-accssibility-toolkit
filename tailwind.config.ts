import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff6b6b',
          dark: '#c73838',
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config; 