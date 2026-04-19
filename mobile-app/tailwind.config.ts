import type { Config } from 'tailwindcss';

const nativewindPreset = require('nativewind/preset');

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
