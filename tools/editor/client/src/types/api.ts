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

// ---- SwarmUI ----

export interface SwarmStatusResponse {
  available: boolean;
}

export interface SwarmGenerateRequest {
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
}

export interface SwarmGenerateResponse {
  status: 'complete';
  images: Array<{ filename: string; url: string }>;
  pageType?: string;
  slug?: string;
}

export interface SwarmGalleryItem {
  filename: string;
  url: string;
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
