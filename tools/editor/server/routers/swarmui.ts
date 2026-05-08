import express from 'express';
import type { Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getConfig, getSwarmBases } from '../lib/editor-config.js';
import { PROJECT_ROOT } from '../lib/fs-utils.js';

const router = express.Router();

const REQUEST_TIMEOUT = 10_000;
const GENERATE_TIMEOUT = 180_000; // 3 min

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tools', 'editor', '.swarmui-output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/** Primary backend — used for single-backend ops (gallery is local anyway). */
function primarySwarmBase(): string {
  const list = getSwarmBases();
  return list[0] ?? getConfig().swarmBase ?? 'http://localhost:7801';
}

/**
 * Open a SwarmUI session against a specific backend URL. Returns the session_id.
 * Throws if the backend is not reachable.
 */
async function getSessionFor(base: string): Promise<string> {
  const resp = await fetch(`${base}/API/GetNewSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });
  if (!resp.ok) throw new Error(`SwarmUI not available: ${base}`);
  const data = (await resp.json()) as { session_id: string };
  return data.session_id;
}

async function downloadImage(url: string): Promise<string> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`Failed to download: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 23);
  const filename = `${ts}.jpg`;
  // Convert to JPEG, quality 92. Sharp strips all EXIF/ICC/IPTC by default (no withMetadata call).
  const jpg = await sharp(buf)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), jpg);
  return filename;
}

// ---------------------------------------------------------------------------
// GET /status
// Pings every configured backend in parallel. `available` is true if at least
// one responds; `backends` reports the per-backend up/down state.
// ---------------------------------------------------------------------------
router.get('/status', async (_req: Request, res: Response) => {
  const bases = getSwarmBases();
  if (bases.length === 0) {
    res.json({ available: false, backends: [] });
    return;
  }

  const results = await Promise.all(
    bases.map(async (base) => {
      try {
        const resp = await fetch(`${base}/API/GetNewSession`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        });
        return { base, available: resp.ok };
      } catch {
        return { base, available: false };
      }
    })
  );

  const available = results.some((r) => r.available);
  res.json({ available, backends: results });
});

// ---------------------------------------------------------------------------
// GET /models — fetch available models from SwarmUI
// Queries the first reachable backend (assumes all backends share the model set).
// ---------------------------------------------------------------------------
router.get('/models', async (_req: Request, res: Response) => {
  const bases = getSwarmBases();
  for (const base of bases) {
    try {
      const sessionId = await getSessionFor(base);
      const resp = await fetch(`${base}/API/ListModels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, path: '', depth: 2 }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      if (!resp.ok) continue;
      const data = (await resp.json()) as {
        files?: Array<string | { name: string; title?: string }>;
      };
      const models = (data.files ?? []).map((f) =>
        typeof f === 'string' ? f : f.name
      );
      res.json({ models });
      return;
    } catch {
      // try next backend
    }
  }
  res.json({ models: [] });
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
  const { prompt, negativeprompt, model, width, height, steps, cfgscale, sampler, scheduler, seed, images: imageCount, pageType, slug } =
    req.body as {
      prompt: string;
      negativeprompt?: string;
      model?: string;
      width?: number;
      height?: number;
      steps?: number;
      cfgscale?: number;
      sampler?: string;
      scheduler?: string;
      seed?: number;
      images?: number;
      pageType?: string;
      slug?: string;
    };

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const bases = getSwarmBases();
    if (bases.length === 0) {
      res.status(503).json({ error: 'No SwarmUI backends configured', available: false });
      return;
    }

    const count = Math.max(1, Math.min(imageCount ?? 1, 8));

    // Distribute the N images across the K backends round-robin so a
    // multi-image request runs in parallel on multiple GPUs.
    // Each task: { backend, seed }
    const tasks = Array.from({ length: count }, (_, i) => ({
      base: bases[i % bases.length],
      seed: seed ?? Math.floor(Math.random() * 2_147_483_647),
    }));

    const baseParams = {
      images: 1,
      prompt,
      negativeprompt: negativeprompt ?? 'blurry, ugly, bad quality, low resolution',
      model: model ?? '',
      width: width ?? 1024,
      height: height ?? 768,
      steps: steps ?? 4,
      cfgscale: cfgscale ?? 1,
      sampler: sampler ?? 'euler',
      scheduler: scheduler ?? 'simple',
    };

    // For each task: open a session against its assigned backend, then
    // generate. Sessions can't be shared across backends.
    const genResults = await Promise.all(
      tasks.map(async ({ base, seed: taskSeed }) => {
        try {
          const sessionId = await getSessionFor(base);
          const genResp = await fetch(`${base}/API/GenerateText2Image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...baseParams,
              session_id: sessionId,
              seed: taskSeed,
            }),
            signal: AbortSignal.timeout(GENERATE_TIMEOUT),
          });
          return { base, ok: genResp.ok, status: genResp.status, body: genResp.ok ? await genResp.json() : await genResp.text() };
        } catch (err: any) {
          return { base, ok: false, status: 0, body: `Connection failed: ${err.message ?? err}` };
        }
      })
    );

    // Collect all image URLs across backends; tolerate partial failure but
    // surface any errors that happened.
    const remoteUrls: string[] = [];
    const errors: string[] = [];

    for (const r of genResults) {
      if (!r.ok) {
        errors.push(`[${r.base}] ${r.status}: ${typeof r.body === 'string' ? r.body : JSON.stringify(r.body)}`);
        continue;
      }
      const genData = r.body as {
        images?: Array<string | { image: string }>;
        error_id?: string;
        error?: string;
      };
      if (genData.error_id || genData.error) {
        errors.push(`[${r.base}] ${genData.error ?? genData.error_id}`);
        continue;
      }
      for (const img of genData.images ?? []) {
        const p = typeof img === 'string' ? img : img.image;
        remoteUrls.push(p.startsWith('http') ? p : `${r.base}/${p}`);
      }
    }

    // If every backend failed, return error. If at least one image came back,
    // continue and surface partial errors as a warning field.
    if (remoteUrls.length === 0) {
      res.status(500).json({ error: errors.join('\n') || 'No images returned' });
      return;
    }

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

    res.json({
      status: 'complete',
      images: savedImages,
      pageType,
      slug,
      ...(errors.length ? { warnings: errors } : {}),
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'SwarmUI not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /open-output — open the output folder in the OS file explorer
// ---------------------------------------------------------------------------
router.post('/open-output', (_req: Request, res: Response) => {
  const cmd = process.platform === 'win32'
    ? `explorer "${OUTPUT_DIR}"`
    : process.platform === 'darwin'
    ? `open "${OUTPUT_DIR}"`
    : `xdg-open "${OUTPUT_DIR}"`;
  exec(cmd, (err) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ ok: true });
  });
});

export default router;
