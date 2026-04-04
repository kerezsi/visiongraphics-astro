import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'client'),
  server: {
    port: 4323,
    watch: {
      usePolling: true,
      interval: 800,
    },
    proxy: {
      // timeout: 0 disables the proxy timeout — required for long-running operations
      // like rclone uploads and thumbnail generation that can take several minutes.
      '/api':    { target: `http://localhost:${process.env.EDITOR_SERVER_PORT ?? 4322}`, changeOrigin: true, timeout: 0 },
      '/ws':     { target: `ws://localhost:${process.env.EDITOR_SERVER_PORT ?? 4322}`, ws: true, changeOrigin: true },
      // Proxy image URLs to Express, which serves the project public/ directory
      '/images': { target: `http://localhost:${process.env.EDITOR_SERVER_PORT ?? 4322}`, changeOrigin: true },
      '/_img':   { target: `http://localhost:${process.env.EDITOR_SERVER_PORT ?? 4322}`, changeOrigin: true },
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
