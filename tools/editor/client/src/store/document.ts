import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { BlockData, BlockType } from '../types/blocks.ts';
import type { DocumentState, PageMeta, PageType } from '../types/document.ts';
import * as api from '../lib/api-client.ts';
import { blockRegistry } from '../lib/block-registry.ts';
import { nanoid } from '../lib/dnd-utils.ts';

// ---------------------------------------------------------------------------
// Helper: build a fresh block from the registry
// ---------------------------------------------------------------------------

export function createDefaultBlock(type: BlockType): BlockData {
  const entry = blockRegistry.get(type);
  if (!entry) throw new Error(`Unknown block type: ${type}`);
  return {
    id: nanoid(),
    type,
    props: JSON.parse(JSON.stringify(entry.defaultProps)),
  } as BlockData;
}

// ---------------------------------------------------------------------------
// Default meta per page type
// ---------------------------------------------------------------------------

function defaultMeta(pageType: PageType): PageMeta {
  switch (pageType) {
    case 'article':
      return {
        title: 'New Article',
        date: new Date().toISOString().slice(0, 10),
        excerpt: '',
        tags: [],
        coverImage: '',
        published: false,
      };
    case 'project':
      return {
        title: 'New Project',
        year: new Date().getFullYear(),
        description: '',
        categories: [],
        features: [],
        tags: [],
        coverImage: '',
        published: false,
        featured: false,
      };
    case 'service':
      return {
        title: 'New Service',
        description: '',
        published: false,
      };
    case 'vision-tech':
      return {
        title: 'New Technique',
        description: '',
        image: '',
        cost: '€',
        complexity: '1 - Basic',
        reality: 'Pure Vision',
        model3d: 'Output from 3D Model',
        purpose: [],
        gallery: [],
        relatedCategories: [],
        relatedFeatures: [],
      };
    case 'page':
      return { title: '' };
    default:
      return {
        title: 'New Page',
        description: '',
      };
  }
}

// ---------------------------------------------------------------------------
// Walk a block tree and update a block by id
// ---------------------------------------------------------------------------

function updateBlockInTree(
  blocks: BlockData[],
  id: string,
  props: Record<string, unknown>
): BlockData[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return { ...block, props: { ...block.props, ...props } } as BlockData;
    }
      return block;
  });
}

function removeBlockFromTree(blocks: BlockData[], id: string): BlockData[] {
  return blocks.filter((b) => b.id !== id);
}

// ---------------------------------------------------------------------------
// Find block by id (flat list — no nesting in MDX blocks)
// ---------------------------------------------------------------------------

function findBlockById(blocks: BlockData[], id: string): BlockData | undefined {
  return blocks.find((b) => b.id === id);
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface DocumentStore extends DocumentState {
  setBlocks: (blocks: BlockData[]) => void;
  addBlock: (block: BlockData, afterId?: string) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, props: Record<string, unknown>) => void;
  moveBlock: (activeId: string, overId: string) => void;
  duplicateBlock: (id: string) => void;

  setMeta: (patch: Partial<PageMeta>) => void;
  setPageType: (type: PageType) => void;
  setSlug: (slug: string) => void;
  setFilePath: (path: string) => void;
  setRawContent: (content: string) => void;

  newDocument: (pageType: PageType) => void;
  loadFile: (path: string) => Promise<void>;
  saveFile: () => Promise<{ path: string }>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  pageType: 'article',
  slug: 'new-page',
  filePath: '',
  isDirty: false,
  meta: defaultMeta('article'),
  blocks: [],
  rawContent: undefined,

  // ---- Block CRUD ----

  setBlocks: (blocks) => set({ blocks, isDirty: true }),

  addBlock: (block, afterId) => {
    const { blocks } = get();
    if (!afterId) {
      set({ blocks: [...blocks, block], isDirty: true });
      return;
    }
    const idx = blocks.findIndex((b) => b.id === afterId);
    if (idx === -1) {
      set({ blocks: [...blocks, block], isDirty: true });
    } else {
      const next = [...blocks];
      next.splice(idx + 1, 0, block);
      set({ blocks: next, isDirty: true });
    }
  },

  removeBlock: (id) => {
    set((s) => ({ blocks: removeBlockFromTree(s.blocks, id), isDirty: true }));
  },

  updateBlock: (id, props) => {
    set((s) => ({ blocks: updateBlockInTree(s.blocks, id, props), isDirty: true }));
  },

  moveBlock: (activeId, overId) => {
    const { blocks } = get();
    const oldIdx = blocks.findIndex((b) => b.id === activeId);
    const newIdx = blocks.findIndex((b) => b.id === overId);
    if (oldIdx === -1 || newIdx === -1) return;
    set({ blocks: arrayMove(blocks, oldIdx, newIdx), isDirty: true });
  },

  duplicateBlock: (id) => {
    const { blocks } = get();
    const block = findBlockById(blocks, id);
    if (!block) return;
    const copy = { ...block, id: nanoid(), props: JSON.parse(JSON.stringify(block.props)) } as BlockData;
    const idx = blocks.findIndex((b) => b.id === id);
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    set({ blocks: next, isDirty: true });
  },

  // ---- Meta ----

  setMeta: (patch) => {
    set((s) => ({ meta: { ...s.meta, ...patch }, isDirty: true }));
  },

  setPageType: (type) => {
    set({ pageType: type, isDirty: true });
  },

  setSlug: (slug) => {
    set({ slug, isDirty: true });
  },

  setFilePath: (filePath) => {
    set({ filePath });
  },

  setRawContent: (rawContent) => {
    set({ rawContent, isDirty: true });
  },

  // ---- File ops ----

  newDocument: (pageType) => {
    set({
      pageType,
      slug: 'new-page',
      filePath: '',
      isDirty: false,
      meta: defaultMeta(pageType),
      blocks: [],
      rawContent: undefined,
    });
  },

  loadFile: async (path) => {
    // Normalise to forward slashes for cross-platform path checks
    const normPath = path.replace(/\\/g, '/');

    // Detect page type from path
    let pageType: PageType = 'article';
    let slug = '';
    if (normPath.endsWith('.astro')) {
      pageType = 'page';
      // Use the directory name as slug (e.g. src/pages/about/index.astro → about)
      const parts = normPath.split('/');
      const filename = parts[parts.length - 1];
      slug = filename === 'index.astro'
        ? (parts[parts.length - 2] ?? 'page')
        : filename.replace(/\.astro$/, '');
    } else if (normPath.includes('/content/articles/')) {
      pageType = 'article';
      slug = normPath.split('/').pop()?.replace(/\.(md|mdx)$/, '') ?? '';
    } else if (normPath.includes('/content/projects/')) {
      pageType = 'project';
      slug = normPath.split('/').pop()?.replace(/\.(md|mdx)$/, '') ?? '';
    } else if (normPath.includes('/content/services/')) {
      pageType = 'service';
      slug = normPath.split('/').pop()?.replace(/\.(md|mdx)$/, '') ?? '';
    } else if (normPath.includes('/content/vision-tech/')) {
      pageType = 'vision-tech';
      slug = normPath.split('/').pop()?.replace(/\.(md|mdx)$/, '') ?? '';
    }

    try {
      const content = await api.readFile(path);

      // Clear any stale state (rawContent from a previously-loaded .astro page,
      // blocks from a previously-loaded MDX file) before the async import.
      set({ filePath: path, pageType, slug, rawContent: undefined, blocks: [], isDirty: false });

      const res = await api.importMarkdown(content, pageType, slug);
      set({
        blocks: res.blocks as BlockData[],
        meta: res.frontmatter as PageMeta,
        isDirty: false,
      });
    } catch (e) {
      console.error('Failed to load file:', e);
      throw e;
    }
  },

  saveFile: async () => {
    const state = get();
    // All page types (including .astro static pages) now go through saveDocument.
    // The codegen router dispatches to astroPageToContent for pageType === 'page'.
    const result = await api.saveDocument(state as DocumentState);
    set({ filePath: result.path, isDirty: false });
    return result;
  },
}));
