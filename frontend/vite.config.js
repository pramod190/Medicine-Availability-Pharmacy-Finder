import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Use VITE_BACKEND_PROXY_URL for the dev-server proxy target.
  // Falls back to localhost:5000 if not set (standard local dev).
  const backendTarget = env.VITE_BACKEND_PROXY_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          // ngrok / hosted URLs need this header stripped to avoid 403
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
