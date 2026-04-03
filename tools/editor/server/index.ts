import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

import { PROJECT_ROOT } from './lib/fs-utils.js';
import filesRouter from './routers/files.js';
import imagesRouter from './routers/images.js';
import contentRouter from './routers/content.js';
import ollamaRouter from './routers/ollama.js';
import comfyuiRouter from './routers/comfyui.js';
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
// Mount routers
// ---------------------------------------------------------------------------

app.use('/api/files', filesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/content', contentRouter);
app.use('/api/ollama', ollamaRouter);
app.use('/api/comfyui', comfyuiRouter);
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

// ---------------------------------------------------------------------------
// WebSocket server — bridge /ws/comfyui to ComfyUI ws://localhost:8188/ws
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request: IncomingMessage, socket, head) => {
  const url = request.url ?? '';

  if (url.startsWith('/ws/comfyui')) {
    wss.handleUpgrade(request, socket, head, (clientWs) => {
      wss.emit('connection', clientWs, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (clientWs: WebSocket, _request: IncomingMessage) => {
  let comfyWs: WebSocket | null = null;
  let isComfyConnected = false;

  // Attempt to connect to ComfyUI WebSocket
  const connectToComfy = () => {
    try {
      comfyWs = new WebSocket('ws://localhost:8188/ws');

      comfyWs.on('open', () => {
        isComfyConnected = true;
        console.log('[ws] ComfyUI bridge connected');
      });

      comfyWs.on('message', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      });

      comfyWs.on('close', (code, reason) => {
        isComfyConnected = false;
        console.log(`[ws] ComfyUI bridge closed: ${code} ${reason}`);
        // Notify client that ComfyUI disconnected
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({ type: 'comfyui_disconnected', code, reason: reason.toString() })
          );
        }
      });

      comfyWs.on('error', (err) => {
        // ComfyUI not running — send graceful notification
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({ type: 'comfyui_unavailable', message: 'ComfyUI is not running' })
          );
        }
        isComfyConnected = false;
      });
    } catch (err) {
      console.warn('[ws] Could not connect to ComfyUI:', (err as Error).message);
    }
  };

  connectToComfy();

  // Forward client messages to ComfyUI
  clientWs.on('message', (data) => {
    if (comfyWs && isComfyConnected && comfyWs.readyState === WebSocket.OPEN) {
      comfyWs.send(data);
    }
  });

  clientWs.on('close', () => {
    if (comfyWs) {
      comfyWs.close();
      comfyWs = null;
    }
  });

  clientWs.on('error', (err) => {
    console.error('[ws] Client WebSocket error:', err.message);
  });
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
  console.log(`  WS (ComfyUI): ws://localhost:${PORT}/ws/comfyui`);
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
