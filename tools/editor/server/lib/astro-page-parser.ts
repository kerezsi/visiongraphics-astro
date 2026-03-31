import { mapMdxToBlocks } from './mdx-import/block-mapper.js';
import type { BlockData } from '../types/blocks.js';

// Known MDX component names — same set as block-mapper
const MDX_COMPONENTS = new Set([
  'SectionBanner', 'ImageGallery', 'ImageCompare',
  'DeliverableGrid', 'TimelineTable', 'NotableGrid',
  'Tour360', 'YoutubeEmbed', 'FilmEmbed',
]);

export interface AstroParseResult {
  /** JS/TS content between the opening and closing --- delimiters */
  script: string;
  /** Template content before the first known MDX component */
  templateHeader: string;
  /** Template content after the last known MDX component */
  templateFooter: string;
  /** Parsed blocks (SectionBanner etc. + rich-text between them) */
  blocks: BlockData[];
}

// ---------------------------------------------------------------------------
// Find the end of a JSX/Astro tag, starting from the '<' character.
// Returns the index immediately AFTER the closing '/>' or '</Name>'.
// Returns -1 if the tag is malformed or unclosed.
// ---------------------------------------------------------------------------

function findTagEnd(body: string, tagStart: number, name: string): number {
  // Start scanning from right after the component name
  let j = tagStart + 1 + name.length; // skip '<' + name
  let depth = 0;
  let inStr: '"' | "'" | null = null;

  while (j < body.length) {
    const ch = body[j];

    if (inStr) {
      if (ch === inStr && body[j - 1] !== '\\') inStr = null;
    } else {
      if (ch === '"' || ch === "'") {
        inStr = ch;
      } else if (ch === '{' || ch === '[' || ch === '(') {
        depth++;
      } else if (ch === '}' || ch === ']' || ch === ')') {
        depth--;
      } else if (depth === 0 && ch === '/' && body[j + 1] === '>') {
        // Self-closing tag />
        return j + 2;
      } else if (depth === 0 && ch === '>') {
        // Opening tag without self-close — find </Name>
        j++;
        const closeTag = `</${name}>`;
        const closeIdx = body.indexOf(closeTag, j);
        return closeIdx !== -1 ? closeIdx + closeTag.length : j;
      }
    }

    j++;
  }

  return -1;
}

// ---------------------------------------------------------------------------
// Main export: parse a .astro page source into structured pieces
// ---------------------------------------------------------------------------

export function parseAstroPage(source: string, slug: string): AstroParseResult {
  // ── 1. Extract the ---script--- section ───────────────────────────────────
  // .astro frontmatter uses triple-dash fences; content is JS, not YAML.
  // gray-matter would mangle it, so we parse manually.

  const FENCE = '---';

  if (!source.startsWith(FENCE)) {
    // No frontmatter — treat entire file as template with no blocks
    return { script: '', templateHeader: source, templateFooter: '', blocks: [] };
  }

  const scriptStart = FENCE.length; // index right after opening ---
  const scriptEnd = source.indexOf('\n' + FENCE, scriptStart);

  if (scriptEnd === -1) {
    return { script: '', templateHeader: source, templateFooter: '', blocks: [] };
  }

  const script = source.slice(scriptStart, scriptEnd); // JS content (starts with \n)
  // templateBody = everything after the closing --- (including the newline after it)
  const templateBody = source.slice(scriptEnd + FENCE.length + 1); // +1 for the \n before ---

  // ── 2. Scan templateBody for first/last known MDX component positions ─────

  let firstStart = -1;
  let lastEnd = -1;

  let i = 0;
  while (i < templateBody.length) {
    if (templateBody[i] === '<' && i + 1 < templateBody.length && /[A-Z]/.test(templateBody[i + 1])) {
      // Read component name
      let nameEnd = i + 1;
      while (nameEnd < templateBody.length && /[A-Za-z0-9]/.test(templateBody[nameEnd])) nameEnd++;
      const name = templateBody.slice(i + 1, nameEnd);

      if (MDX_COMPONENTS.has(name)) {
        const tagEnd = findTagEnd(templateBody, i, name);
        if (tagEnd !== -1) {
          if (firstStart === -1) firstStart = i;
          lastEnd = tagEnd;
        }
      }
    }
    i++;
  }

  if (firstStart === -1) {
    // No known components found — entire template is the header, no blocks
    return { script, templateHeader: templateBody, templateFooter: '', blocks: [] };
  }

  const templateHeader = templateBody.slice(0, firstStart);
  const contentZone   = templateBody.slice(firstStart, lastEnd);
  const templateFooter = templateBody.slice(lastEnd);

  // ── 3. Parse content zone into blocks ─────────────────────────────────────
  // Pass 'page' as pageType so mapMdxToBlocks treats prose as rich-text blocks
  const blocks = mapMdxToBlocks(contentZone, 'page');

  return { script, templateHeader, templateFooter, blocks };
}
