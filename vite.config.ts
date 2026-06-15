import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Sin proxy - Vercel CLI maneja /api/* directamente
    },
  };
});
