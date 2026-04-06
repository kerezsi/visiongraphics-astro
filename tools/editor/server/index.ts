import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { IncomingMessage } from 'http';

import { PROJECT_ROOT } from './lib/fs-utils.js';
import { scanAstroRegistry } from './lib/astro-registry-scanner.js';
import filesRouter from './routers/files.js';
import imagesRouter from './routers/images.js';
import contentRouter from './routers/content.js';
import ollamaRouter from './routers/ollama.js';
import swarmuiRouter from './routers/swarmui.js';
import configRouter from './routers/config.js';
import importRouter from './routers/import-md.js';
import codegenRouter from './routers/codegen.js';
import commandsRouter from './routers/commands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.EDITOR_SERVER_PORT ? parseInt(process.env.EDITOR_SERVER_PORT) : 4322;

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------

const app = express();

// CORS — allow all localhost origins (dev tool, not production)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Serve staged images at their R2 URL paths
// e.g. GET /_img/portfolio/koki_foodcourt/01.jpg → tools/editor/.staging/koki_foodcourt/01.jpg
// This allows MDX image paths to be previewed in the editor before pushing to R2.
// ---------------------------------------------------------------------------

const stagingRoot = path.join(PROJECT_ROOT, 'tools', 'editor', '.staging');

const R2_PUBLIC_BASE = 'https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev';

app.use('/_img', (req, res, next) => {
  // URL: /_img/portfolio/slug/file.jpg → /_img/vision-tech/slug/file.jpg etc.
  // Check staging first (locally uploaded images); if not found, proxy-redirect to R2.
  const parts = req.path.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const slug = parts[parts.length - 2];
    const file = parts[parts.length - 1];
    const stagingFile = path.join(stagingRoot, slug, file);
    res.sendFile(stagingFile, (err) => {
      if (err) {
        // Not in staging — redirect to Cloudflare R2 public URL for preview
        const r2Url = `${R2_PUBLIC_BASE}${req.path}`;
        res.redirect(302, r2Url);
      }
    });
  } else {
    next();
  }
});

// Also serve the project public/ directory for existing R2-served images (via /_img/ etc.)
const projectPublicDir = path.join(PROJECT_ROOT, 'public');
app.use(express.static(projectPublicDir, { index: false }));
console.log(`[editor] Serving project public/ from ${projectPublicDir}`);
console.log(`[editor] Staging dir: ${stagingRoot}`);

// ---------------------------------------------------------------------------
// Static serve the built Vite client (when running without Vite dev server)
// ---------------------------------------------------------------------------

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  console.log(`[editor] Serving static client from ${distDir}`);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// ---------------------------------------------------------------------------
// Block registry — scanned live from Astro page templates.
// Returns { project: BlockType[], service: BlockType[], ... } so the editor
// client can filter the block palette to only show blocks available on the
// current page type. Re-scanned on every request so template changes are
// picked up without restarting the editor server.
// ---------------------------------------------------------------------------

app.get('/api/registry', (_req, res) => {
  try {
    const registry = scanAstroRegistry(PROJECT_ROOT);
    res.json(registry);
  } catch (err) {
    console.error('[editor] Failed to scan Astro registry:', err);
    res.status(500).json({ error: 'Registry scan failed' });
  }
});

// ---------------------------------------------------------------------------
// Mount routers
// ---------------------------------------------------------------------------

app.use('/api/files', filesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/content', contentRouter);
app.use('/api/ollama', ollamaRouter);
app.use('/api/swarmui', swarmuiRouter);
app.use('/api/config', configRouter);
app.use('/api/import', importRouter);
app.use('/api/codegen', codegenRouter);
app.use('/api/commands', commandsRouter);

// ---------------------------------------------------------------------------
// Catch-all: serve index.html for SPA routing (when Vite is not running)
// ---------------------------------------------------------------------------

const indexHtml = path.join(distDir, 'index.html');
app.get('*', (_req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).json({
      message: 'Vision Graphics Editor API',
      hint: 'Run `npm run editor:client` to start the Vite dev server on port 4323',
    });
  }
});

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(app);

// Reject any stray WS upgrade requests (no WS bridge needed for SwarmUI)
server.on('upgrade', (_request: IncomingMessage, socket) => {
  socket.destroy();
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

server.listen(PORT, () => {
  console.log('');
  console.log('  Vision Graphics Page Editor — Server');
  console.log('  ─────────────────────────────────────────');
  console.log(`  API:          http://localhost:${PORT}/api`);
  console.log(`  Health:       http://localhost:${PORT}/api/health`);
  console.log(`  Project root: ${PROJECT_ROOT}`);
  console.log('');
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[editor] Port ${PORT} is already in use. Is the server already running?`);
  } else {
    console.error('[editor] Server error:', err);
  }
  process.exit(1);
});

export default app;
