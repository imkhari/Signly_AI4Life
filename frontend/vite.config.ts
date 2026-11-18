import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const backendOrigin = process.env.SIGNLY_BACKEND_ORIGIN || 'http://localhost:8000';
  const isHttps = process.env.VITE_HTTPS === 'true' || process.env.HTTPS === 'true';

  return {
    plugins: [
      react(),
      isHttps ? basicSsl() : undefined,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/ws': {
          target: backendOrigin.replace(/^http/, 'ws'),
          ws: true,
        },
      },
    },
    test: {
      globals: true,
      include: ['tests/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
    },
  };
});

