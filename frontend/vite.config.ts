import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '127.0.0.1',
        proxy: {
          // Proxy API requests to backend to avoid CORS issues
          '/run_sse': {
            target: 'http://127.0.0.1:9000',
            changeOrigin: true,
            secure: false,
          },
          '/apps': {
            target: 'http://127.0.0.1:9000',
            changeOrigin: true,
            secure: false,
          },
          // Add more proxies as needed for other endpoints
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
