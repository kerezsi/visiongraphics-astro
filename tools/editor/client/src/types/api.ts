import type { BlockData, PageType } from './blocks.ts';
import type { PageMeta } from './document.ts';

// ---- Files ----

export interface ReadFileResponse {
  content: string;
}

export interface WriteFileRequest {
  path: string;
  content: string;
}

export interface WriteFileResponse {
  ok: boolean;
}

export interface PageListItem {
  path: string;
  name: string;
}

export interface ContentListItem {
  path: string;
  slug: string;
  title?: string;
  [key: string]: unknown;
}

// ---- Images ----

export interface UploadImageResponse {
  url: string;
  width: number;
  height: number;
  filename: string;
}

export interface ImageListItem {
  url: string;
  filename: string;
}

// ---- Ollama ----

export interface OllamaModelsResponse {
  available: boolean;
  models: string[];
}

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
}

export interface OllamaChatResponse {
  response: string;
}

export interface GenerateAltTextRequest {
  imageUrl: string;
}

export interface GenerateAltTextResponse {
  altText: string;
}

export interface GenerateExcerptRequest {
  title: string;
  body: string;
}

export interface GenerateExcerptResponse {
  excerpt: string;
}

// ---- ComfyUI ----

export interface ComfyStatusResponse {
  available: boolean;
}

export interface ComfyGenerateRequest {
  workflow: Record<string, unknown>;
  pageType: string;
  slug: string;
}

export interface ComfyGenerateResponse {
  jobId: string;
}

export interface ComfyProgressEvent {
  type: 'progress' | 'complete' | 'error';
  jobId: string;
  progress?: number;
  outputUrl?: string;
  error?: string;
}

// ---- Import ----

export interface ImportMarkdownRequest {
  markdown: string;
  pageType: PageType;
  slug: string;
}

export interface ImportMarkdownResponse {
  blocks: BlockData[];
  frontmatter: PageMeta;
}

// ---- Codegen ----

export interface PreviewCodeRequest {
  pageType: PageType;
  slug: string;
  meta: PageMeta;
  blocks: BlockData[];
}

export interface PreviewCodeResponse {
  code: string;
}

export interface SaveDocumentRequest {
  pageType: PageType;
  slug: string;
  filePath: string;
  meta: PageMeta;
  blocks: BlockData[];
}

export interface SaveDocumentResponse {
  path: string;
}
