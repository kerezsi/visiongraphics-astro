import express from 'express';
import type { Request, Response } from 'express';
import { getConfig } from '../lib/editor-config.js';

const router = express.Router();

const DEFAULT_MODEL = 'llama3';

function ollamaBase(): string {
  return getConfig().ollamaBase;
}

// ---------------------------------------------------------------------------
// Helper — fetch from Ollama with error handling (graceful degradation)
// ---------------------------------------------------------------------------
async function ollamaFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${ollamaBase()}${path}`;
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(60_000), // 60s timeout
  });
  return response as unknown as Response;
}

// ---------------------------------------------------------------------------
// GET /models — list available models
// ---------------------------------------------------------------------------
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const resp = await fetch(`${ollamaBase()}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!resp.ok) {
      res.json({ available: false, models: [] });
      return;
    }
    const data = (await resp.json()) as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m) => m.name);
    res.json({ available: true, models });
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
    const resp = await fetch(`${ollamaBase()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ error: text });
      return;
    }

    if (stream) {
      // Pipe streaming NDJSON back to client
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
      const reader = resp.body?.getReader();
      if (!reader) {
        res.status(500).json({ error: 'No response body' });
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await resp.json();
      // Normalize response to match expected format: { response: string }
      res.json({ response: data.message?.content ?? '' });
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
      if (!reader) {
        res.status(500).json({ error: 'No response body' });
        return;
      }
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
// POST /alt-text — generate alt text for an image URL
// ---------------------------------------------------------------------------
router.post('/alt-text', async (req: Request, res: Response) => {
  const { imageUrl } = req.body as { imageUrl: string };

  if (!imageUrl) {
    res.status(400).json({ error: 'Missing imageUrl' });
    return;
  }

  // Determine the model to use
  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      // Prefer llava (vision model) for image tasks, fall back to llama3 or first available
      const llava = models.find((m) => m.name.includes('llava'));
      const llama3 = models.find((m) => m.name.includes('llama3'));
      model = llava?.name ?? llama3?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch {
    // Use default model
  }

  const prompt =
    `You are an accessibility expert writing alt text for web images. ` +
    `Write a concise, descriptive alt text (1-2 sentences, under 125 characters) ` +
    `for the image at this URL: ${imageUrl}. ` +
    `Respond with ONLY the alt text, no preamble, no quotes.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) {
      res.status(resp.status).json({ error: 'Ollama request failed' });
      return;
    }

    const data = (await resp.json()) as { response?: string };
    const altText = (data.response ?? '').trim();
    res.json({ altText });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Ollama not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /excerpt — generate a 1-2 sentence excerpt from title + body
// ---------------------------------------------------------------------------
router.post('/excerpt', async (req: Request, res: Response) => {
  const { title, body } = req.body as { title: string; body: string };

  if (!title && !body) {
    res.status(400).json({ error: 'Missing title or body' });
    return;
  }

  // Determine available model
  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      const llama3 = models.find((m) => m.name.includes('llama3'));
      model = llama3?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch {
    // Use default
  }

  // Truncate body to avoid context overflow
  const truncatedBody = (body ?? '').slice(0, 2000);

  const prompt =
    `Write a 1-2 sentence excerpt (under 200 characters total) for an article or page ` +
    `with the following title and content.\n\n` +
    `Title: ${title ?? '(untitled)'}\n\n` +
    `Content: ${truncatedBody}\n\n` +
    `Respond with ONLY the excerpt text. No preamble, no quotes, no explanation.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) {
      res.status(resp.status).json({ error: 'Ollama request failed' });
      return;
    }

    const data = (await resp.json()) as { response?: string };
    const excerpt = (data.response ?? '').trim();
    res.json({ excerpt });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Ollama not available', available: false });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /caption — suggest a SectionBanner label + title
// ---------------------------------------------------------------------------
router.post('/caption', async (req: Request, res: Response) => {
  const { context, currentLabel, currentTitle } = req.body as {
    context: string;
    currentLabel?: string;
    currentTitle?: string;
  };

  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      model = models.find((m) => m.name.includes('llama3'))?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* use default */ }

  const existing = [currentLabel && `Current label: "${currentLabel}"`, currentTitle && `Current title: "${currentTitle}"`].filter(Boolean).join('. ');

  const prompt =
    `You are writing section headings for an architectural visualization studio website. ` +
    `Given the context below, suggest a short banner label (2-4 words, ALL CAPS style) and ` +
    `a section title (4-8 words, title case). ` +
    (existing ? `${existing}. ` : '') +
    `Context: ${context}\n\n` +
    `Respond in this exact format:\n` +
    `LABEL: <label text>\n` +
    `TITLE: <title text>\n` +
    `Nothing else.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) { res.status(resp.status).json({ error: 'Ollama request failed' }); return; }

    const data = (await resp.json()) as { response?: string };
    const text = (data.response ?? '').trim();
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
// POST /paragraph — write or rewrite a body text paragraph
// ---------------------------------------------------------------------------
router.post('/paragraph', async (req: Request, res: Response) => {
  const { prompt: userPrompt, context, existing } = req.body as {
    prompt?: string;
    context?: string;
    existing?: string;
  };

  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      model = models.find((m) => m.name.includes('llama3'))?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* use default */ }

  const instruction = existing
    ? `Rewrite the following paragraph${userPrompt ? ` to ${userPrompt}` : ' to improve clarity and flow'}:\n\n"${existing}"`
    : `Write a paragraph${userPrompt ? ` about ${userPrompt}` : ''}.`;

  const systemContext = context
    ? `\n\nPage context: ${context}`
    : '';

  const llmPrompt =
    `You are a professional copywriter for an architectural visualization studio (Vision Graphics Kft, Budapest). ` +
    `Write in a clear, confident, professional tone. No fluff. No clichés.` +
    `${systemContext}\n\n${instruction}\n\n` +
    `Respond with ONLY the paragraph text. No preamble, no quotes, no explanation.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: llmPrompt, stream: false }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!resp.ok) { res.status(resp.status).json({ error: 'Ollama request failed' }); return; }

    const data = (await resp.json()) as { response?: string };
    res.json({ text: (data.response ?? '').trim() });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /summary — write/rewrite description, story, or tasks fields
// ---------------------------------------------------------------------------
router.post('/summary', async (req: Request, res: Response) => {
  const { field, title, existing, context } = req.body as {
    field: 'description' | 'story' | 'tasks' | 'excerpt';
    title?: string;
    existing?: string;
    context?: string;
  };

  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      model = models.find((m) => m.name.includes('llama3'))?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* use default */ }

  const fieldInstructions: Record<string, string> = {
    description: 'Write a 1-2 sentence project description (under 200 characters) suitable for card listings and meta tags.',
    story: 'Write a 2-3 paragraph project background story describing the client\'s situation, goals, and challenges.',
    tasks: 'Write 2-3 paragraphs describing what Vision Graphics specifically did on this project (techniques used, process, deliverables).',
    excerpt: 'Write a 1-2 sentence article excerpt (under 200 characters) that summarizes the key point.',
  };

  const instruction = existing
    ? `Rewrite the following ${field}:\n\n"${existing}"`
    : (fieldInstructions[field] ?? `Write a ${field}.`);

  const llmPrompt =
    `You are a professional copywriter for Vision Graphics Kft, a Budapest-based architectural visualization studio. ` +
    `Write in a clear, professional, direct tone.` +
    (title ? `\n\nProject/page title: ${title}` : '') +
    (context ? `\n\nAdditional context: ${context}` : '') +
    `\n\n${instruction}\n\n` +
    `Respond with ONLY the ${field} text. No preamble, no labels, no quotes.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: llmPrompt, stream: false }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!resp.ok) { res.status(resp.status).json({ error: 'Ollama request failed' }); return; }

    const data = (await resp.json()) as { response?: string };
    res.json({ text: (data.response ?? '').trim() });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /banner-subject — derive a cinematic visual subject from page/section content
// ---------------------------------------------------------------------------
router.post('/banner-subject', async (req: Request, res: Response) => {
  const { title, description, tags, sectionLabel, sectionTitle, bodyText } = req.body as {
    title?: string;
    description?: string;
    tags?: string[];
    sectionLabel?: string;
    sectionTitle?: string;
    bodyText?: string;
  };

  let model = DEFAULT_MODEL;
  try {
    const tagsResp = await fetch(`${ollamaBase()}/api/tags`, { signal: AbortSignal.timeout(3_000) });
    if (tagsResp.ok) {
      const tagsData = (await tagsResp.json()) as { models?: Array<{ name: string }> };
      const models = tagsData.models ?? [];
      model = models.find((m) => m.name.includes('llama3'))?.name ?? models[0]?.name ?? DEFAULT_MODEL;
    }
  } catch { /* use default */ }

  const isSection = sectionLabel || sectionTitle;
  const context = [
    isSection
      ? `Section: "${sectionLabel ?? ''}" — "${sectionTitle ?? ''}" (page: "${title ?? ''}")`
      : title && `Page title: "${title}"`,
    !isSection && description && `Description: "${description}"`,
    !isSection && tags?.length && `Tags: ${tags.join(', ')}`,
    bodyText && `Content:\n${bodyText.slice(0, 1500)}`,
  ].filter(Boolean).join('\n');

  const llmPrompt =
    `You are an art director for a luxury architectural visualization studio. ` +
    `Given the content below, write a concise cinematic visual subject for a banner image (5–10 words). ` +
    `It should be evocative and atmosphere-driven, not literal. ` +
    `Example outputs: "lone figure crossing a vast concrete lobby", "suspension bridge emerging from morning fog", "empty staircase lit by a single shaft of light". ` +
    `\n\nContent:\n${context}\n\n` +
    `Respond with ONLY the subject. No preamble, no quotes, no explanation.`;

  try {
    const resp = await fetch(`${ollamaBase()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: llmPrompt, stream: false }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!resp.ok) { res.status(resp.status).json({ error: 'Ollama request failed' }); return; }
    const raw = await resp.text();
    // Ollama may return NDJSON (streaming lines) even with stream:false — take last non-empty line
    const lines = raw.split('\n').filter((l) => l.trim());
    const lastLine = lines[lines.length - 1] ?? '{}';
    const data = JSON.parse(lastLine) as { response?: string };
    res.json({ subject: (data.response ?? '').trim() });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') res.status(503).json({ error: 'Ollama not available' });
    else res.status(500).json({ error: err.message });
  }
});

export default router;
