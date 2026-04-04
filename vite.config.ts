import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
    },
    define: {
      // Exponer GEMINI_API_KEY al frontend
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'import.meta.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || 'gemini-2.5-flash'),
    },
  };
});
