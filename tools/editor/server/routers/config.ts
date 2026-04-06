import express from 'express';
import type { Request, Response } from 'express';
import { getConfig, saveConfig } from '../lib/editor-config.js';
import type { SwarmStyle, SwarmPromptItem } from '../lib/editor-config.js';

const router = express.Router();

// GET /config — return current editor config
router.get('/', (_req: Request, res: Response) => {
  res.json(getConfig());
});

// POST /config — update editor config (partial update)
router.post('/', (req: Request, res: Response) => {
  const { ollamaBase, swarmBase, swarmModels, swarmStyles, swarmPrompts } = req.body as {
    ollamaBase?: string;
    swarmBase?: string;
    swarmModels?: string[];
    swarmStyles?: SwarmStyle[];
    swarmPrompts?: SwarmPromptItem[];
  };
  const updated = saveConfig({
    ...(ollamaBase !== undefined && { ollamaBase: String(ollamaBase).trim() }),
    ...(swarmBase !== undefined && { swarmBase: String(swarmBase).trim() }),
    ...(swarmModels !== undefined && { swarmModels }),
    ...(swarmStyles !== undefined && { swarmStyles }),
    ...(swarmPrompts !== undefined && { swarmPrompts }),
  });
  res.json(updated);
});

export default router;
