// Shared block type definitions for server-side codegen and import pipeline.
// Mirror of the client-side block types — no React-specific imports.
// Keep this in sync with tools/editor/client/src/types/blocks.ts

export type PageType = 'article' | 'service' | 'project' | 'vision-tech' | 'page';

export type BlockData =
  | { id: string; type: 'SectionBanner';    props: { image: string; label: string; title: string; [key: string]: unknown } }
  | { id: string; type: 'image-gallery';    props: { images: Array<{ src: string; alt: string }> } }
  | { id: string; type: 'image-compare';    props: { before: string; after: string; beforeAlt?: string; afterAlt?: string; label?: string } }
  | { id: string; type: 'deliverable-grid'; props: { items: Array<{ title: string; desc: string }>; columns?: 2 | 3 } }
  | { id: string; type: 'timeline-table';   props: { rows: Array<{ scope: string; deliverables: string }> } }
  | { id: string; type: 'notable-grid';     props: { items: Array<{ name: string; year: string }> } }
  | { id: string; type: 'single-image';     props: { src: string; alt?: string; caption?: string } }
  | { id: string; type: 'tour-360';         props: { url: string; title: string; coverImage?: string } }
  | { id: string; type: 'youtube-embed';    props: { url: string; title?: string } }
  | { id: string; type: 'film-embed';       props: { vimeoId: string; title: string } }
  | { id: string; type: 'heading';          props: { text: string; level: 'h2' | 'h3' } }
  | { id: string; type: 'body-lead';        props: { text: string } }
  | { id: string; type: 'body-text';        props: { text: string } }
  | { id: string; type: 'results-list';     props: { items: string[] } }
  | { id: string; type: 'rich-text';        props: { html: string } };

export interface DocumentState {
  pageType: PageType;
  slug: string;
  filePath: string;
  meta: Record<string, unknown>;
  blocks: BlockData[];
  rawContent?: string;
}
