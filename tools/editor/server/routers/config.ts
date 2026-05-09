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
  const {
    ollamaBase,
    swarmBase,
    swarmBases,
    swarmModels,
    swarmStyles,
    swarmPrompts,
    ollamaSystemPrompts,
    activeSystemPromptName,
    ollamaTaskPrompts,
    translationEngine,
    translationOllamaModel,
    translationClaudeModel,
    translationPrompt,
  } = req.body as {
    ollamaBase?: string;
    swarmBase?: string;
    swarmBases?: string[];
    swarmModels?: string[];
    swarmStyles?: SwarmStyle[];
    swarmPrompts?: SwarmPromptItem[];
    ollamaSystemPrompts?: Array<{ name: string; text: string }>;
    activeSystemPromptName?: string;
    ollamaTaskPrompts?: Partial<Record<string, string>>;
    translationEngine?: 'ollama' | 'claude';
    translationOllamaModel?: string;
    translationClaudeModel?: string;
    translationPrompt?: string;
  };
  const updated = saveConfig({
    ...(ollamaBase !== undefined && { ollamaBase: String(ollamaBase).trim() }),
    ...(swarmBase !== undefined && { swarmBase: String(swarmBase).trim() }),
    ...(swarmBases !== undefined && { swarmBases }),
    ...(swarmModels !== undefined && { swarmModels }),
    ...(swarmStyles !== undefined && { swarmStyles }),
    ...(swarmPrompts !== undefined && { swarmPrompts }),
    ...(ollamaSystemPrompts !== undefined && { ollamaSystemPrompts }),
    ...(activeSystemPromptName !== undefined && { activeSystemPromptName }),
    ...(ollamaTaskPrompts !== undefined && { ollamaTaskPrompts }),
    ...(translationEngine !== undefined && { translationEngine }),
    ...(translationOllamaModel !== undefined && { translationOllamaModel }),
    ...(translationClaudeModel !== undefined && { translationClaudeModel }),
    ...(translationPrompt !== undefined && { translationPrompt }),
  });
  res.json(updated);
});

export default router;
