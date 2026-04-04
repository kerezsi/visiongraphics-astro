import type { BlockData } from '../types/blocks.ts';
import type { DocumentState, PageMeta, PageType } from '../types/document.ts';
import type {
  PageListItem,
  ImageListItem,
  UploadImageResponse,
  OllamaModelsResponse,
  OllamaChatMessage,
  ComfyStatusResponse,
} from '../types/api.ts';

const BASE = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- File ops ----

export async function readFile(path: string): Promise<string> {
  const res = await fetch(`${BASE}/files/read?path=${encodeURIComponent(path)}`);
  const data = await json<{ content: string }>(res);
  return data.content;
}

export async function writeFile(path: string, content: string): Promise<void> {
  const res = await fetch(`${BASE}/files/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  await json<{ ok: boolean }>(res);
}

export async function listPages(): Promise<PageListItem[]> {
  const res = await fetch(`${BASE}/files/pages`);
  return json<PageListItem[]>(res);
}

// ---- Content collections ----

export async function listContent(collection: string): Promise<unknown[]> {
  const res = await fetch(`${BASE}/content/${encodeURIComponent(collection)}`);
  return json<unknown[]>(res);
}

export async function listReferenceCollection(name: string): Promise<Array<{ slug: string; title: string }>> {
  const res = await fetch(`${BASE}/content/collections/${encodeURIComponent(name)}`);
  return json<Array<{ slug: string; title: string }>>(res);
}

export async function createCollectionEntry(
  collection: string,
  slug: string,
  title: string
): Promise<{ slug: string; title: string; path: string }> {
  const res = await fetch(`${BASE}/content/collections/${encodeURIComponent(collection)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, title }),
  });
  return json<{ slug: string; title: string; path: string }>(res);
}

export async function renameCollectionEntry(
  collection: string,
  slug: string,
  title: string
): Promise<void> {
  const res = await fetch(
    `${BASE}/content/collections/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }
  );
  await json<{ slug: string; title: string }>(res);
}

export async function deleteCollectionEntry(
  collection: string,
  slug: string
): Promise<void> {
  const res = await fetch(
    `${BASE}/content/collections/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}`,
    { method: 'DELETE' }
  );
  await json<{ deleted: boolean }>(res);
}

// ---- Images ----

export async function uploadImage(
  file: File,
  pageType: string,
  slug: string
): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('pageType', pageType);
  form.append('slug', slug);
  const res = await fetch(`${BASE}/images/upload`, { method: 'POST', body: form });
  return json<UploadImageResponse>(res);
}

export async function listImages(
  pageType: string,
  slug: string
): Promise<ImageListItem[]> {
  const res = await fetch(
    `${BASE}/images/list?pageType=${encodeURIComponent(pageType)}&slug=${encodeURIComponent(slug)}`
  );
  return json<ImageListItem[]>(res);
}

// ---- Ollama ----

export async function getOllamaModels(): Promise<OllamaModelsResponse> {
  const res = await fetch(`${BASE}/ollama/models`);
  return json<OllamaModelsResponse>(res);
}

export async function chatWithOllama(
  model: string,
  messages: OllamaChatMessage[]
): Promise<string> {
  const res = await fetch(`${BASE}/ollama/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  const data = await json<{ response: string }>(res);
  return data.response;
}

export async function generateAltText(imageUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/ollama/alt-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  const data = await json<{ altText: string }>(res);
  return data.altText;
}

export async function generateExcerpt(title: string, body: string): Promise<string> {
  const res = await fetch(`${BASE}/ollama/excerpt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  const data = await json<{ excerpt: string }>(res);
  return data.excerpt;
}

export async function generateCaption(
  model: string,
  context: string
): Promise<{ label: string; title: string }> {
  const res = await fetch(`${BASE}/ollama/caption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, context }),
  });
  return json<{ label: string; title: string }>(res);
}

export async function generateParagraph(
  model: string,
  prompt: string,
  context?: string
): Promise<string> {
  const res = await fetch(`${BASE}/ollama/paragraph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, context }),
  });
  const data = await json<{ text: string }>(res);
  return data.text;
}

export async function generateSummary(
  model: string,
  field: string,
  title: string,
  body: string
): Promise<string> {
  const res = await fetch(`${BASE}/ollama/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, field, title, body }),
  });
  const data = await json<{ text: string }>(res);
  return data.text;
}

// ---- ComfyUI ----

export async function getComfyStatus(): Promise<ComfyStatusResponse> {
  const res = await fetch(`${BASE}/comfyui/status`);
  return json<ComfyStatusResponse>(res);
}

export async function startComfyGenerate(
  workflow: Record<string, unknown>,
  pageType: string,
  slug: string
): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/comfyui/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow, pageType, slug }),
  });
  return json<{ jobId: string }>(res);
}

// ---- Import ----

export async function importMarkdown(
  markdown: string,
  pageType: PageType,
  slug: string
): Promise<{ blocks: BlockData[]; frontmatter: PageMeta }> {
  const res = await fetch(`${BASE}/import/md`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, pageType, slug }),
  });
  return json<{ blocks: BlockData[]; frontmatter: PageMeta }>(res);
}

// ---- Commands ----

export async function pushAllToR2(): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const res = await fetch(`${BASE}/images/push-all-to-r2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return json<{ ok: boolean; stdout: string; stderr: string }>(res);
}

export async function generateThumbs(slug?: string, pageType?: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const res = await fetch(`${BASE}/commands/generate-thumbs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, pageType }),
  });
  return json<{ ok: boolean; stdout: string; stderr: string }>(res);
}

export async function gitPush(message?: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const res = await fetch(`${BASE}/commands/git-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return json<{ ok: boolean; stdout: string; stderr: string }>(res);
}

// ---- Content management ----

export async function patchFrontmatter(
  filePath: string,
  fields: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${BASE}/content/frontmatter`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, fields }),
  });
  await json<{ ok: boolean }>(res);
}

export interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

export async function getNavConfig(): Promise<NavItem[]> {
  const res = await fetch(`${BASE}/content/nav-config`);
  return json<NavItem[]>(res);
}

export async function putNavConfig(items: NavItem[]): Promise<void> {
  const res = await fetch(`${BASE}/content/nav-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  await json<{ ok: boolean }>(res);
}

// ---- Codegen ----

export async function previewCode(document: DocumentState): Promise<string> {
  const res = await fetch(`${BASE}/codegen/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageType: document.pageType,
      slug: document.slug,
      meta: document.meta,
      blocks: document.blocks,
    }),
  });
  const data = await json<{ code: string }>(res);
  return data.code;
}

export async function saveDocument(document: DocumentState): Promise<{ path: string }> {
  const res = await fetch(`${BASE}/codegen/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageType: document.pageType,
      slug: document.slug,
      filePath: document.filePath,
      meta: document.meta,
      blocks: document.blocks,
    }),
  });
  return json<{ path: string }>(res);
}
