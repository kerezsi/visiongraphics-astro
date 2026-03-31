import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

const COMFYUI_BASE = 'http://localhost:8188';
const REQUEST_TIMEOUT = 10_000; // 10s for status checks
const GENERATE_TIMEOUT = 30_000; // 30s for submitting a job

// ---------------------------------------------------------------------------
// GET /status — check if ComfyUI is available
// ---------------------------------------------------------------------------
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${COMFYUI_BASE}/system_stats`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (resp.ok) {
      const data = await resp.json();
      res.json({ available: true, stats: data });
    } else {
      res.json({ available: false });
    }
  } catch {
    // Also try /queue as fallback
    try {
      const resp = await fetch(`${COMFYUI_BASE}/queue`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      res.json({ available: resp.ok });
    } catch {
      res.json({ available: false });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /generate — submit a workflow prompt to ComfyUI
// ---------------------------------------------------------------------------
router.post('/generate', async (req: Request, res: Response) => {
  const { workflow, pageType, slug } = req.body as {
    workflow: Record<string, unknown>;
    pageType?: string;
    slug?: string;
  };

  if (!workflow || typeof workflow !== 'object') {
    res.status(400).json({ error: 'Missing or invalid workflow object' });
    return;
  }

  try {
    const resp = await fetch(`${COMFYUI_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT),
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: `ComfyUI error: ${text}` });
      return;
    }

    const data = (await resp.json()) as { prompt_id?: string; error?: string };

    if (data.error) {
      res.status(400).json({ error: data.error });
      return;
    }

    res.json({ promptId: data.prompt_id ?? null, pageType, slug });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ComfyUI not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// GET /job/:promptId — poll job status from ComfyUI history
// ---------------------------------------------------------------------------
router.get('/job/:promptId', async (req: Request, res: Response) => {
  const { promptId } = req.params;

  if (!promptId) {
    res.status(400).json({ error: 'Missing promptId' });
    return;
  }

  try {
    const resp = await fetch(`${COMFYUI_BASE}/history/${promptId}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!resp.ok) {
      if (resp.status === 404) {
        // Not in history yet — still pending
        res.json({ status: 'pending' });
      } else {
        res.status(resp.status).json({ error: 'ComfyUI history error' });
      }
      return;
    }

    const history = (await resp.json()) as Record<string, any>;
    const entry = history[promptId];

    if (!entry) {
      // Prompt submitted but not yet processed
      res.json({ status: 'pending' });
      return;
    }

    // Check for errors in output nodes
    const outputs = entry.outputs ?? {};
    const status = entry.status ?? {};

    if (status.status_str === 'error' || (status.messages ?? []).some((m: any) => m[0] === 'execution_error')) {
      res.json({ status: 'error', detail: status });
      return;
    }

    // Extract output image filenames
    const outputFiles: string[] = [];
    for (const nodeId of Object.keys(outputs)) {
      const nodeOutput = outputs[nodeId];
      if (Array.isArray(nodeOutput.images)) {
        for (const img of nodeOutput.images) {
          // ComfyUI image reference: { filename, subfolder, type }
          const subfolder = img.subfolder ? `${img.subfolder}/` : '';
          outputFiles.push(`${COMFYUI_BASE}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder ?? '')}&type=${img.type ?? 'output'}`);
        }
      }
    }

    if (outputFiles.length > 0 || Object.keys(outputs).length > 0) {
      res.json({ status: 'complete', outputFiles });
    } else {
      // Outputs exist but no images extracted — still consider complete
      res.json({ status: 'complete', outputFiles: [] });
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ComfyUI not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
