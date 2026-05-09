import express from 'express';
import type { Request, Response } from 'express';
import { getConfig } from '../lib/editor-config.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Locale labels — keep aligned with src/lib/i18n.ts (site) and
// tools/editor/client/src/lib/localized.ts (editor).
// ---------------------------------------------------------------------------
const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  hu: 'Hungarian',
  de: 'German',
};

const DEFAULT_TRANSLATION_PROMPT =
  'You are a professional translator for an architectural visualization studio (Vision Graphics Kft, Budapest). ' +
  'Translate the user-provided text from {{from}} to {{to}}. ' +
  'Preserve technical terminology, brand names, and proper nouns. ' +
  'Match the original tone and register. ' +
  'Respond with ONLY the translated text — no preamble, no quotes, no explanation, no language label.';

function buildSystemPrompt(from: string, to: string): string {
  const cfg = getConfig();
  const template = cfg.translationPrompt?.trim() || DEFAULT_TRANSLATION_PROMPT;
  const fromName = LOCALE_NAMES[from] ?? from;
  const toName   = LOCALE_NAMES[to]   ?? to;
  return template.replace(/\{\{from\}\}/g, fromName).replace(/\{\{to\}\}/g, toName);
}

function stripLLMNoise(text: string): string {
  let t = text.trim();
  // Strip leading "Translation:" or "Here is the translation:"-style prefixes
  t = t.replace(/^(translation|here is the translation|here's the translation)[:\s]*/i, '');
  // Strip surrounding quotes if the entire response is wrapped
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('“') && t.endsWith('”'))) {
    t = t.slice(1, -1);
  }
  return t.trim();
}

// ---------------------------------------------------------------------------
// Engine: Ollama
// ---------------------------------------------------------------------------
async function translateWithOllama(opts: { text: string; system: string; model?: string }): Promise<string> {
  const cfg = getConfig();
  const base = cfg.ollamaBase;

  // Resolve model: explicit override → config setting → first available llama3 → first model.
  let model = opts.model || cfg.translationOllamaModel || '';
  if (!model) {
    try {
      const tagsResp = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3_000) });
      if (tagsResp.ok) {
        const data = (await tagsResp.json()) as { models?: Array<{ name: string }> };
        const ms = data.models ?? [];
        model = ms.find((m) => m.name.includes('llama3'))?.name ?? ms[0]?.name ?? 'llama3';
      } else {
        model = 'llama3';
      }
    } catch {
      model = 'llama3';
    }
  }

  const resp = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: opts.text, system: opts.system, stream: false }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`Ollama error ${resp.status}: ${await resp.text()}`);

  const raw = await resp.text();
  const lines = raw.split('\n').filter((l) => l.trim());
  let full = '';
  for (const line of lines) {
    try {
      const chunk = JSON.parse(line) as { response?: string; done?: boolean };
      full += chunk.response ?? '';
      if (chunk.done) break;
    } catch { /* skip malformed */ }
  }
  return stripLLMNoise(full);
}

// ---------------------------------------------------------------------------
// Engine: Claude (Anthropic Messages API)
// ---------------------------------------------------------------------------
async function translateWithClaude(opts: { text: string; system: string; model?: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment. Add it to .env or shell env, then restart the editor server.');
  }

  const cfg = getConfig();
  const model = opts.model || cfg.translationClaudeModel || 'claude-sonnet-4-5';

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: opts.system,
      messages: [{ role: 'user', content: opts.text }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${errBody}`);
  }

  const data = (await resp.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (data.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');
  return stripLLMNoise(text);
}

// ---------------------------------------------------------------------------
// POST /api/translate
//
// Body: { text: string, from: 'en'|'hu'|..., to: 'en'|'hu'|..., engine?: 'ollama'|'claude', model?: string }
// Resp: { translation: string, engine: string, model?: string }
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  const { text, from, to, engine: requestedEngine, model } = (req.body ?? {}) as {
    text?: string;
    from?: string;
    to?: string;
    engine?: 'ollama' | 'claude';
    model?: string;
  };

  if (!text?.trim()) {
    res.status(400).json({ error: 'Missing text' });
    return;
  }
  if (!from || !to) {
    res.status(400).json({ error: 'Missing from/to locale' });
    return;
  }
  if (from === to) {
    res.json({ translation: text, engine: 'identity', model: null });
    return;
  }

  const cfg = getConfig();
  const engine = requestedEngine || cfg.translationEngine || 'ollama';
  const system = buildSystemPrompt(from, to);

  try {
    const translation = engine === 'claude'
      ? await translateWithClaude({ text, system, model })
      : await translateWithOllama({ text, system, model });
    res.json({ translation, engine, model: model ?? null });
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      res.status(504).json({ error: `${engine} translation timed out` });
    } else if (err?.code === 'ECONNREFUSED') {
      res.status(503).json({ error: `${engine} not available — is the service running?` });
    } else {
      res.status(500).json({ error: err?.message ?? 'Translation failed' });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /api/translate/batch
//
// Translates multiple texts in one round-trip. Useful for the "Translate all
// missing" toolbar action so the user pays one round-trip instead of N.
// ---------------------------------------------------------------------------
router.post('/batch', async (req: Request, res: Response) => {
  const { texts, from, to, engine: requestedEngine, model } = (req.body ?? {}) as {
    texts?: string[];
    from?: string;
    to?: string;
    engine?: 'ollama' | 'claude';
    model?: string;
  };

  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'Missing or empty texts array' });
    return;
  }
  if (!from || !to) {
    res.status(400).json({ error: 'Missing from/to locale' });
    return;
  }
  if (from === to) {
    res.json({ translations: texts, engine: 'identity' });
    return;
  }

  const cfg = getConfig();
  const engine = requestedEngine || cfg.translationEngine || 'ollama';
  const system = buildSystemPrompt(from, to);

  // We translate sequentially (not in parallel) to avoid overwhelming local
  // Ollama and to keep the Anthropic call rate sensible for a small batch.
  const out: string[] = [];
  try {
    for (const text of texts) {
      if (!text?.trim()) { out.push(''); continue; }
      const translation = engine === 'claude'
        ? await translateWithClaude({ text, system, model })
        : await translateWithOllama({ text, system, model });
      out.push(translation);
    }
    res.json({ translations: out, engine, model: model ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Batch translation failed', partial: out });
  }
});

export default router;
