import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../lib/editor-config.js';
import { PROJECT_ROOT } from '../lib/fs-utils.js';

const router = express.Router();

const REQUEST_TIMEOUT = 10_000;
const GENERATE_TIMEOUT = 180_000; // 3 min

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tools', 'editor', '.swarmui-output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function swarmBase(): string {
  return getConfig().swarmBase;
}

async function getSession(): Promise<string> {
  const resp = await fetch(`${swarmBase()}/API/GetNewSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });
  if (!resp.ok) throw new Error('SwarmUI not available');
  const data = (await resp.json()) as { session_id: string };
  return data.session_id;
}

async function downloadImage(url: string): Promise<string> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`Failed to download: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `${ts}.png`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buf);
  return filename;
}

// ---------------------------------------------------------------------------
// GET /status
// ---------------------------------------------------------------------------
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${swarmBase()}/API/GetNewSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    res.json({ available: resp.ok });
  } catch {
    res.json({ available: false });
  }
});

// ---------------------------------------------------------------------------
// GET /models — fetch available models from SwarmUI
// ---------------------------------------------------------------------------
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const sessionId = await getSession();
    const resp = await fetch(`${swarmBase()}/API/ListModels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, path: '', depth: 2 }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!resp.ok) {
      res.json({ models: [] });
      return;
    }
    const data = (await resp.json()) as {
      files?: Array<string | { name: string; title?: string }>;
    };
    const models = (data.files ?? []).map((f) =>
      typeof f === 'string' ? f : (f.title ?? f.name)
    );
    res.json({ models });
  } catch {
    res.json({ models: [] });
  }
});

// ---------------------------------------------------------------------------
// GET /gallery — list saved output images, newest first
// ---------------------------------------------------------------------------
router.get('/gallery', (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter((f) => /\.(png|jpg|webp)$/i.test(f))
      .sort()
      .reverse()
      .slice(0, 50) // cap at 50
      .map((f) => ({ filename: f, url: `/api/swarmui/output/${f}` }));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// ---------------------------------------------------------------------------
// GET /output/:filename — serve a saved output image
// ---------------------------------------------------------------------------
router.get('/output/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  // Basic sanitisation — no path traversal
  if (!filename || filename.includes('..') || filename.includes('/')) {
    res.status(400).end();
    return;
  }
  const filePath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).end();
    return;
  }
  res.sendFile(filePath);
});

// ---------------------------------------------------------------------------
// POST /generate
// ---------------------------------------------------------------------------
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt, negativeprompt, model, width, height, steps, cfgscale, seed, pageType, slug } =
    req.body as {
      prompt: string;
      negativeprompt?: string;
      model?: string;
      width?: number;
      height?: number;
      steps?: number;
      cfgscale?: number;
      seed?: number;
      pageType?: string;
      slug?: string;
    };

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const sessionId = await getSession();

    const genResp = await fetch(`${swarmBase()}/API/GenerateText2Image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        images: 1,
        prompt,
        negativeprompt: negativeprompt ?? 'blurry, ugly, bad quality, low resolution',
        model: model ?? '',
        width: width ?? 1024,
        height: height ?? 768,
        steps: steps ?? 4,
        cfgscale: cfgscale ?? 1,
        seed: seed ?? -1,
      }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT),
    });

    if (!genResp.ok) {
      const text = await genResp.text();
      res.status(genResp.status).json({ error: `SwarmUI error: ${text}` });
      return;
    }

    const genData = (await genResp.json()) as {
      images?: Array<string | { image: string }>;
      error_id?: string;
      error?: string;
    };

    if (genData.error_id || genData.error) {
      res.status(400).json({ error: genData.error ?? genData.error_id });
      return;
    }

    // Resolve absolute URLs from SwarmUI
    const remoteUrls = (genData.images ?? []).map((img) => {
      const p = typeof img === 'string' ? img : img.image;
      return p.startsWith('http') ? p : `${swarmBase()}/${p}`;
    });

    // Download and save each image locally
    const savedImages: Array<{ filename: string; url: string }> = [];
    for (const url of remoteUrls) {
      try {
        const filename = await downloadImage(url);
        savedImages.push({ filename, url: `/api/swarmui/output/${filename}` });
      } catch {
        // If download fails, still return the remote URL
        savedImages.push({ filename: '', url });
      }
    }

    res.json({ status: 'complete', images: savedImages, pageType, slug });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'SwarmUI not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
