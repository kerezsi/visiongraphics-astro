import express from 'express';
import type { Request, Response } from 'express';
import { getConfig } from '../lib/editor-config.js';

const router = express.Router();

const DEFAULT_MODEL = 'llama3';

function ollamaBase(): string {
  return getConfig().ollamaBase;
}

function getActiveSystemPrompt(): string | undefined {
  const cfg = getConfig();
  const name = cfg.activeSystemPromptName;
  if (!name) return undefined;
  return (cfg.ollamaSystemPrompts ?? []).find((p) => p.name === name)?.text;
}

/** Returns the user-saved task prompt for `key`, or `defaultText` if not set. */
function getTaskPrompt(key: string, defaultText: string): string {
  return getConfig().ollamaTaskPrompts?.[key] || defaultText;
}

// Default task prompts — these match the built-in behaviour and can be overridden in config
const DEFAULTS = {
  chat:
    'You are a professional copywriter for an architectural visualization studio. Be concise and direct.',
  excerpt:
    'Write a 1-2 sentence excerpt (under 200 characters total) for an article or page. ' +
    'Respond with ONLY the excerpt text. No preamble, no quotes, no explanation.',
  caption:
    'You are writing section headings for an architectural visualization studio website. ' +
    'Given the context, suggest a short banner label (2-4 words, ALL CAPS style) and a ' +
    'section title (4-8 words, title case). ' +
    'Respond in this exact format:\nLABEL: <label text>\nTITLE: <title text>\nNothing else.',
  paragraph:
    'You are a professional copywriter for an architectural visualization studio ' +
    '(Vision Graphics Kft, Budapest). ' +
    'Write in a clear, confident, professional tone. No fluff. No clichés. ' +
    'Respond with ONLY the paragraph text. No preamble, no quotes, no explanation.',
  summaryDescription:
    'Write a 1-2 sentence project description (under 200 characters) suitable for card ' +
    'listings and meta tags. Respond with ONLY the text.',
  summaryStory:
    "Write a 2-3 paragraph project background story describing the client's situation, " +
    'goals, and challenges. Respond with ONLY the text.',
  summaryTasks:
    'Write 2-3 paragraphs describing what Vision Graphics specifically did on this project ' +
    '(techniques used, process, deliverables). Respond with ONLY the text.',
  summaryExcerpt:
    'Write a 1-2 sentence article excerpt (under 200 characters) that summarizes the key ' +
    'point. Respond with ONLY the text.',
  bannerSubject:
    'Extract the essence of the following text, and synthetize it as an image. ' +
    'Describe the subject of this image in 3-4 sentences. ' +
    'Only write about the subject, and nothing about the style and the composition.',
};

// ---------------------------------------------------------------------------
// Helper — call Ollama /api/generate
// ---------------------------------------------------------------------------
async function ollamaGenerate(opts: {
  model: string;
  prompt: string;
  system?: string;
  timeoutMs?: number;
}): Promise<string> {
  const resp = await fetch(`${ollamaBase()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: opts.model, prompt: opts.prompt, system: opts.system, stream: false }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60_000),
  });
  if (!resp.ok) throw new Error(`Ollama error ${resp.status}`);
  const raw = await resp.text();
  const lines = raw.split('\n').filter((l) => l.trim());
  if (lines.length === 1) {
    // Normal non-streaming response
    const data = JSON.parse(lines[0]) as { response?: string };
    return (data.response ?? '').trim();
  }
  // Ollama returned NDJSON chunks despite stream:false — aggregate all tokens
  let full = '';
  for (const line of lines) {
    try {
      const chunk = JSON.parse(line) as { response?: string; done?: boolean };
      full += chunk.response ?? '';
      if (chunk.done) break;
    } catch { /* skip malformed lines */ }
  }
  return full.trim();
}

// ---------------------------------------------------------------------------
// Helper — resolve model from config or fall back to first available
// ---------------------------------------------------------------------------
async function resolveModel(): Promise<string> {
  try {
    const resp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (resp.ok) {
      const data = (await resp.json()) as { models?: Array<{ name: string }> };
      const models = data.models ?? [];
      const llama3 = models.find((m) => m.name.includes('llama3'));
      return llama3?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* fall through */ }
  return DEFAULT_MODEL;
}

// ---------------------------------------------------------------------------
// GET /models
// ---------------------------------------------------------------------------
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(5_000) });
    if (!resp.ok) { res.json({ available: false, models: [] }); return; }
    const data = (await resp.json()) as { models?: Array<{ name: string }> };
    res.json({ available: true, models: (data.models ?? []).map((m) => m.name) });
  } catch {
    res.json({ available: false, models: [] });
  }
});

// ---------------------------------------------------------------------------
// POST /chat — proxy to Ollama chat API
// ---------------------------------------------------------------------------
router.post('/chat', async (req: Request, res: Response) => {
  const { model, messages, stream = false } = req.body as {
    model: string;
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
  };

  if (!model || !messages) {
    res.status(400).json({ error: 'Missing model or messages' });
    return;
  }

  try {
    // Active system prompt takes priority; chat task prompt is the fallback.
    // When either is set, strip any hardcoded system messages from the client.
    const systemText = getActiveSystemPrompt() ?? (getTaskPrompt('chat', '') || undefined);
    const contentMessages = systemText ? messages.filter((m) => m.role !== 'system') : messages;
    const fullMessages = systemText
      ? [{ role: 'system', content: systemText }, ...contentMessages]
      : contentMessages;

    const resp = await fetch(`${ollamaBase()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: text });
      return;
    }

    if (stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
      const reader = resp.body?.getReader();
      if (!reader) { res.status(500).json({ error: 'No response body' }); return; }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await resp.json();
      res.json({ response: (data as any).message?.content ?? '' });
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Ollama not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /generate — proxy to Ollama generate API
// ---------------------------------------------------------------------------
router.post('/generate', async (req: Request, res: Response) => {
  const { model, prompt, stream = false } = req.body as {
    model: string;
    prompt: string;
    stream?: boolean;
  };

  if (!model || !prompt) {
    res.status(400).json({ error: 'Missing model or prompt' });
    return;
  }

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: text });
      return;
    }

    if (stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
      const reader = resp.body?.getReader();
      if (!reader) { res.status(500).json({ error: 'No response body' }); return; }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await resp.json();
      res.json(data);
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Ollama not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /alt-text
// ---------------------------------------------------------------------------
router.post('/alt-text', async (req: Request, res: Response) => {
  const { imageUrl } = req.body as { imageUrl: string };
  if (!imageUrl) { res.status(400).json({ error: 'Missing imageUrl' }); return; }

  let model = DEFAULT_MODEL;
  try {
    const r = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (r.ok) {
      const d = (await r.json()) as { models?: Array<{ name: string }> };
      const models = d.models ?? [];
      const llava = models.find((m) => m.name.includes('llava'));
      const llama3 = models.find((m) => m.name.includes('llama3'));
      model = llava?.name ?? llama3?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* use default */ }

  try {
    const text = await ollamaGenerate({
      model,
      system: 'You are an accessibility expert writing alt text for web images.',
      prompt: `Write a concise, descriptive alt text (1-2 sentences, under 125 characters) for the image at this URL: ${imageUrl}. Respond with ONLY the alt text, no preamble, no quotes.`,
      timeoutMs: 30_000,
    });
    res.json({ altText: text });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /excerpt
// ---------------------------------------------------------------------------
router.post('/excerpt', async (req: Request, res: Response) => {
  const { title, body } = req.body as { title: string; body: string };
  if (!title && !body) { res.status(400).json({ error: 'Missing title or body' }); return; }

  const model = await resolveModel();
  const truncatedBody = (body ?? '').slice(0, 2000);

  try {
    const text = await ollamaGenerate({
      model,
      system: getTaskPrompt('excerpt', DEFAULTS.excerpt),
      prompt: `Title: ${title ?? '(untitled)'}\n\nContent: ${truncatedBody}`,
      timeoutMs: 30_000,
    });
    res.json({ excerpt: text });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /caption
// ---------------------------------------------------------------------------
router.post('/caption', async (req: Request, res: Response) => {
  const { context, currentLabel, currentTitle } = req.body as {
    context: string;
    currentLabel?: string;
    currentTitle?: string;
  };

  const model = await resolveModel();
  const existing = [
    currentLabel && `Current label: "${currentLabel}"`,
    currentTitle && `Current title: "${currentTitle}"`,
  ].filter(Boolean).join('. ');

  try {
    const text = await ollamaGenerate({
      model,
      system: getTaskPrompt('caption', DEFAULTS.caption),
      prompt: existing ? `Context: ${context}\n${existing}` : `Context: ${context}`,
      timeoutMs: 30_000,
    });
    const labelMatch = text.match(/LABEL:\s*(.+)/i);
    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    res.json({
      label: labelMatch ? labelMatch[1].trim() : '',
      title: titleMatch ? titleMatch[1].trim() : '',
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /paragraph
// ---------------------------------------------------------------------------
router.post('/paragraph', async (req: Request, res: Response) => {
  const { prompt: userPrompt, context, existing } = req.body as {
    prompt?: string;
    context?: string;
    existing?: string;
  };

  const model = await resolveModel();
  const instruction = existing
    ? `Rewrite the following paragraph${userPrompt ? ` to ${userPrompt}` : ' to improve clarity and flow'}:\n\n"${existing}"`
    : `Write a paragraph${userPrompt ? ` about ${userPrompt}` : ''}.`;

  try {
    const text = await ollamaGenerate({
      model,
      system: getTaskPrompt('paragraph', DEFAULTS.paragraph),
      prompt: [context && `Page context: ${context}`, instruction].filter(Boolean).join('\n\n'),
      timeoutMs: 60_000,
    });
    res.json({ text });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /summary
// ---------------------------------------------------------------------------
router.post('/summary', async (req: Request, res: Response) => {
  const { field, title, existing, context } = req.body as {
    field: 'description' | 'story' | 'tasks' | 'excerpt';
    title?: string;
    existing?: string;
    context?: string;
  };

  const model = await resolveModel();
  const taskKey = `summary${field.charAt(0).toUpperCase()}${field.slice(1)}` as keyof typeof DEFAULTS;
  const defaultInstruction = DEFAULTS[taskKey] ?? `Write a ${field}. Respond with ONLY the text.`;

  const dataParts = [
    title && `Title: ${title}`,
    context && `Context: ${context}`,
    existing && `Rewrite this:\n"${existing}"`,
  ].filter(Boolean).join('\n\n');

  try {
    const text = await ollamaGenerate({
      model,
      system: getTaskPrompt(taskKey, defaultInstruction),
      prompt: dataParts || '(no additional context)',
      timeoutMs: 60_000,
    });
    res.json({ text });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /banner-subject
// ---------------------------------------------------------------------------
router.post('/banner-subject', async (req: Request, res: Response) => {
  const { title, description, tags, sectionLabel, sectionTitle, bodyText, model: requestedModel } = req.body as {
    title?: string;
    description?: string;
    tags?: string[];
    sectionLabel?: string;
    sectionTitle?: string;
    bodyText?: string;
    model?: string;
  };

  const model = requestedModel?.trim() || await resolveModel();

  const isSection = !!(sectionLabel || sectionTitle);
  const parts: string[] = [];
  if (isSection) {
    parts.push(`Section: "${sectionLabel ?? ''}" — "${sectionTitle ?? ''}"`);
    if (title) parts.push(`Page: "${title}"`);
  } else {
    if (title) parts.push(`Page title: "${title}"`);
    if (description) parts.push(`Description: "${description}"`);
    if (tags?.length) parts.push(`Tags: ${tags.join(', ')}`);
  }
  if (bodyText?.trim()) parts.push(`Content:\n${bodyText.trim().slice(0, 2000)}`);
  const context = parts.join('\n');

  // Active system prompt overrides the bannerSubject task prompt
  const systemText = getActiveSystemPrompt() ?? getTaskPrompt('bannerSubject', DEFAULTS.bannerSubject);

  try {
    const subject = await ollamaGenerate({
      model,
      system: systemText,
      prompt: context,
      timeoutMs: 60_000,
    });
    res.json({ subject });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

export default router;
