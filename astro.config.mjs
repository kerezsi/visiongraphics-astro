import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { tokenEditor } from './src/integrations/token-editor/index.ts';

export default defineConfig({
  site: 'https://visiongraphics.eu',
  vite: {
    server: {
      watch: {
        // Ignore large dirs — prevents FSWatcher crashes on Windows with many files
        // NOTE: do NOT ignore public/** — Vite needs it to serve static files correctly
        ignored: ['**/node_modules/**', '**/src/content/projects/**', '**/public/portfolio/**'],
        usePolling: false,
        stabilityThreshold: 500,
      },
    },
  },
  integrations: [
    tokenEditor(),
    react(),
    tailwind({
      applyBaseStyles: false, // we apply our own base in global.css
    }),
  ],
  image: {
    // Cloudflare Pages supports sharp
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  output: 'static',
  build: {
    // Clean asset filenames for better caching
    assets: '_assets',
  },
});
