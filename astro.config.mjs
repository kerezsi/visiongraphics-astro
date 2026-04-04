import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

const isProd = process.env.NODE_ENV === 'production';

// ── R2 dev proxy ──────────────────────────────────────────────────────────────
// In production, Cloudflare Pages handles /_img/* and root image redirects to R2.
// Locally: check tools/editor/.staging first (for not-yet-uploaded images),
// then fall back to R2. Has zero effect on the build output.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R2_PUBLIC = 'https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev';
const STAGING_ROOT = path.join(__dirname, 'tools/editor/.staging');

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml',
};

const r2DevProxy = {
  name: 'r2-dev-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = (req.url ?? '').split('?')[0];
      let r2Path = null;

      if (url.startsWith('/_img/')) {
        // /_img/portfolio/slug/01.jpg → portfolio/slug/01.jpg
        r2Path = url.slice('/_img/'.length);
      } else if (/^\/([\w.-]+)\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(url)) {
        // Root-level images: /hero-bg.jpg → hero-bg.jpg
        r2Path = url.slice(1);
      }

      if (r2Path) {
        // 1. Check local staging first (tools/editor/.staging/<collection>/<slug>/file)
        const stagingFile = path.join(STAGING_ROOT, r2Path);
        try {
          const data = fs.readFileSync(stagingFile);
          const ext = path.extname(stagingFile).toLowerCase();
          res.setHeader('Content-Type', MIME[ext] || 'image/jpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.end(data);
          return;
        } catch {
          // not in staging — fall through to R2
        }

        // 2. Fetch from R2
        try {
          const r2Res = await fetch(`${R2_PUBLIC}/${r2Path}`);
          if (r2Res.ok) {
            res.setHeader('Content-Type', r2Res.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(Buffer.from(await r2Res.arrayBuffer()));
            return;
          }
        } catch {
          // R2 unavailable — fall through, image shows as broken (acceptable in dev)
        }
      }
      next();
    });
  },
};

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
  vite: {
    plugins: [...(!isProd ? [r2DevProxy] : [])],
  },
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
