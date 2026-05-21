import type { BlockData } from '../types/blocks.ts';

export type BlockLang = 'en' | 'hu' | null;

const LANG_OPEN_RE = /^<Lang\s+code\s*=\s*["']([a-z]{2})["']\s*>/i;

/**
 * Detect the locale of a canvas block.
 *
 * Only `rich-text` blocks that are pure `<Lang code="…">…</Lang>` wrappers
 * — the form produced by the MDX importer for bilingual prose — count.
 * Everything else returns `null` (language-neutral).
 */
export function detectBlockLang(block: BlockData): BlockLang {
  if (block.type !== 'rich-text') return null;
  const html = (block.props as { html?: unknown }).html;
  if (typeof html !== 'string') return null;
  const m = html.trim().match(LANG_OPEN_RE);
  if (!m) return null;
  const code = m[1].toLowerCase();
  return code === 'en' || code === 'hu' ? code : null;
}

export interface PairItem {
  kind: 'pair';
  en: BlockData;
  hu: BlockData;
}
export interface SingleItem {
  kind: 'single';
  block: BlockData;
}
export type CanvasItem = PairItem | SingleItem;

/**
 * Group consecutive EN+HU (or HU+EN) Lang blocks into pairs. Non-Lang blocks
 * stay as singles. Used for the "side by side" canvas mode.
 */
export function groupForSideBySide(blocks: BlockData[]): CanvasItem[] {
  const out: CanvasItem[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const la = detectBlockLang(a);
    const b = i + 1 < blocks.length ? blocks[i + 1] : null;
    const lb = b ? detectBlockLang(b) : null;
    if (la && lb && la !== lb && b) {
      const en = la === 'en' ? a : b;
      const hu = la === 'hu' ? a : b;
      out.push({ kind: 'pair', en, hu });
      i++;
    } else {
      out.push({ kind: 'single', block: a });
    }
  }
  return out;
}

export function hasBilingualBlocks(blocks: BlockData[]): boolean {
  return blocks.some((b) => detectBlockLang(b) !== null);
}
