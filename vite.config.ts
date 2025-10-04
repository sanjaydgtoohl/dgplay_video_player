/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_PROXY_API_TARGET || 'https://livesync.dgtoohl.com';
  const wsTarget = env.VITE_PROXY_WS_TARGET || 'wss://livesync.dgtoohl.com/dgplay/ws';
  const rewriteApi = env.VITE_PROXY_API_REWRITE === '1';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          rewrite: rewriteApi ? (p: string) => p.replace(/^\/api/, '') : undefined,
        },
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});