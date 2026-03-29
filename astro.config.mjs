import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  site: 'https://visiongraphics.eu',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
    ...(!isProd ? [keystatic()] : []),
  ],
  // Dev: server mode — all routes SSR (Keystatic needs this for write API).
  //   Content pages look up by Astro.params.slug, getStaticPaths provides URL list only.
  // Prod: static output for Cloudflare Pages.
  output: isProd ? 'static' : 'server',
  adapter: !isProd ? node({ mode: 'standalone' }) : undefined,
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  build: {
    assets: '_assets',
  },
});
