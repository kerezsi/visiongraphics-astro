import { randomUUID } from 'crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { BlockData } from '../../types/blocks.js';

// ---------------------------------------------------------------------------
// Segment types — MDX body is split into alternating prose/component chunks
// ---------------------------------------------------------------------------

interface ProseSegment   { kind: 'prose';     text: string }
interface ComponentSegment { kind: 'component'; name: string; rawProps: string }
type Segment = ProseSegment | ComponentSegment;

// Known MDX component names (used as blocks in this editor)
const MDX_COMPONENTS = new Set([
  'SectionBanner', 'ImageGallery', 'ImageCompare',
  'DeliverableGrid', 'TimelineTable', 'NotableGrid',
  'Tour360', 'YoutubeEmbed', 'FilmEmbed',
]);

// ---------------------------------------------------------------------------
// Split MDX body into prose and component segments
// Handles multiline JSX props including nested {} and []
// ---------------------------------------------------------------------------

function splitMdxBody(body: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let proseStart = 0;

  while (i < body.length) {
    // Look for JSX component opening: <UppercaseName
    if (body[i] === '<' && i + 1 < body.length && /[A-Z]/.test(body[i + 1])) {
      // Read component name
      let nameEnd = i + 1;
      while (nameEnd < body.length && /[A-Za-z0-9]/.test(body[nameEnd])) nameEnd++;
      const name = body.slice(i + 1, nameEnd);

      // Only handle known components
      if (!MDX_COMPONENTS.has(name)) {
        i++;
        continue;
      }

      // Flush accumulated prose
      const prose = body.slice(proseStart, i).trim();
      if (prose) segments.push({ kind: 'prose', text: prose });

      // Scan forward to find end of tag (/>  or  ></Name>)
      let j = nameEnd;
      let depth = 0;
      let inStr: '"' | "'" | null = null;
      let tagEnd = -1;

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
            // Self-closing tag
            tagEnd = j + 2;
            j = tagEnd;
            break;
          } else if (depth === 0 && ch === '>') {
            // Opening tag without self-close — find </Name>
            j++;
            const closeTag = `</${name}>`;
            const closeIdx = body.indexOf(closeTag, j);
            if (closeIdx !== -1) {
              tagEnd = closeIdx + closeTag.length;
            } else {
              tagEnd = j;
            }
            j = tagEnd;
            break;
          }
        }
        j++;
      }

      if (tagEnd === -1) {
        // Malformed tag — treat opening as prose
        i++;
        proseStart = i;
        continue;
      }

      const rawProps = body.slice(nameEnd, j - (body[j - 2] === '/' ? 2 : tagEnd - j + 1 > 0 ? 1 : 0)).trim();
      // rawProps is the string between component name and the closing /> or >
      // Re-extract: everything between nameEnd and the start of /> or >
      const rawTag = body.slice(nameEnd, tagEnd);
      // Find where props end (before /> or >)
      const selfCloseIdx = rawTag.lastIndexOf('/>');
      const openCloseIdx = rawTag.indexOf(`</${name}>`);
      let propsStr: string;
      if (selfCloseIdx !== -1) {
        propsStr = rawTag.slice(0, selfCloseIdx).trim();
      } else if (openCloseIdx !== -1) {
        propsStr = rawTag.slice(0, rawTag.indexOf('>')).trim();
      } else {
        propsStr = rawTag.trim();
      }

      segments.push({ kind: 'component', name, rawProps: propsStr });
      i = tagEnd;
      proseStart = i;
      continue;
    }

    i++;
  }

  // Flush remaining prose
  const prose = body.slice(proseStart).trim();
  if (prose) segments.push({ kind: 'prose', text: prose });

  return segments;
}

// ---------------------------------------------------------------------------
// Parse JSX props string → Record<string, unknown>
// Handles:  name="string"  |  name={expression}  |  bare (boolean true)
// ---------------------------------------------------------------------------

function parseJsxProps(rawProps: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;

  while (i < rawProps.length) {
    // Skip whitespace + newlines
    while (i < rawProps.length && /[\s\n]/.test(rawProps[i])) i++;
    if (i >= rawProps.length) break;

    // Read prop name
    const nameStart = i;
    while (i < rawProps.length && /[A-Za-z0-9_-]/.test(rawProps[i])) i++;
    const name = rawProps.slice(nameStart, i);
    if (!name) { i++; continue; }

    // Skip whitespace
    while (i < rawProps.length && /\s/.test(rawProps[i])) i++;

    if (rawProps[i] !== '=') {
      // Boolean prop
      result[name] = true;
      continue;
    }
    i++; // skip =

    while (i < rawProps.length && /\s/.test(rawProps[i])) i++;

    if (rawProps[i] === '"') {
      // Quoted string value
      i++;
      let value = '';
      while (i < rawProps.length && rawProps[i] !== '"') {
        if (rawProps[i] === '\\') { i++; }
        value += rawProps[i];
        i++;
      }
      result[name] = value;
      i++; // skip closing "
    } else if (rawProps[i] === '{') {
      // Expression value — find matching closing }
      const exprStart = i + 1;
      let depth = 1;
      let inStr: '"' | "'" | null = null;
      i++;
      while (i < rawProps.length && depth > 0) {
        const ch = rawProps[i];
        if (inStr) {
          if (ch === inStr && rawProps[i - 1] !== '\\') inStr = null;
        } else {
          if (ch === '"' || ch === "'") inStr = ch;
          else if (ch === '{' || ch === '[') depth++;
          else if (ch === '}' || ch === ']') {
            depth--;
            if (depth === 0) break;
          }
        }
        i++;
      }
      const expr = rawProps.slice(exprStart, i).trim();
      i++; // skip closing }
      try {
        result[name] = JSON.parse(expr);
      } catch {
        // JSON.parse fails for JS-style object/array literals with unquoted keys
        // (e.g. rows={[{ scope: "...", deliverables: "..." }]}).
        // Evaluate safely as a JS expression — acceptable for a local dev tool
        // reading the user's own MDX files.
        if (expr === 'true') { result[name] = true; }
        else if (expr === 'false') { result[name] = false; }
        else if (!isNaN(Number(expr))) { result[name] = Number(expr); }
        else {
          try {
            // eslint-disable-next-line no-new-func
            result[name] = new Function(`return (${expr})`)();
          } catch {
            result[name] = expr; // last resort: store raw string
          }
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Map a component name + props to a BlockData
// ---------------------------------------------------------------------------

function componentToBlock(name: string, props: Record<string, unknown>): BlockData | null {
  switch (name) {
    case 'SectionBanner':
      return {
        id: randomUUID(),
        type: 'SectionBanner',
        props: {
          // Spread all parsed props first so extra .astro props (headingLevel, size, etc.)
          // are preserved, then explicitly ensure the three required fields are strings.
          ...props,
          image:  (props.image  as string) ?? '',
          label:  (props.label  as string) ?? '',
          title:  (props.title  as string) ?? '',
        },
      } as BlockData;

    case 'ImageGallery':
      return {
        id: randomUUID(),
        type: 'image-gallery',
        props: {
          images: Array.isArray(props.images) ? props.images as Array<{ src: string; alt: string }> : [],
        },
      };

    case 'ImageCompare':
      return {
        id: randomUUID(),
        type: 'image-compare',
        props: {
          before:    (props.before    as string) ?? '',
          after:     (props.after     as string) ?? '',
          beforeAlt: (props.beforeAlt as string) ?? '',
          afterAlt:  (props.afterAlt  as string) ?? '',
          label:     (props.label     as string) ?? '',
        },
      };

    case 'DeliverableGrid':
      return {
        id: randomUUID(),
        type: 'deliverable-grid',
        props: {
          columns: (props.columns as 2 | 3) ?? 3,
          items:   Array.isArray(props.items) ? props.items as Array<{ title: string; desc: string }> : [],
        },
      };

    case 'TimelineTable':
      return {
        id: randomUUID(),
        type: 'timeline-table',
        props: {
          rows: Array.isArray(props.rows) ? props.rows as Array<{ scope: string; deliverables: string }> : [],
        },
      };

    case 'NotableGrid':
      return {
        id: randomUUID(),
        type: 'notable-grid',
        props: {
          items: Array.isArray(props.items) ? props.items as Array<{ name: string; year: string }> : [],
        },
      };

    case 'Tour360':
      return {
        id: randomUUID(),
        type: 'tour-360',
        props: {
          url:        (props.url        as string) ?? '',
          title:      (props.title      as string) ?? '',
          coverImage: (props.coverImage as string) ?? '',
        },
      };

    case 'YoutubeEmbed':
      return {
        id: randomUUID(),
        type: 'youtube-embed',
        props: {
          url:   (props.url   as string) ?? '',
          title: (props.title as string) ?? '',
        },
      };

    case 'FilmEmbed':
      return {
        id: randomUUID(),
        type: 'film-embed',
        props: {
          vimeoId: (props.vimeoId as string) ?? '',
          title:   (props.title   as string) ?? '',
        },
      };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Map prose markdown to blocks (reuses remark)
// ---------------------------------------------------------------------------

function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  if (node.type === 'strong' || node.type === 'emphasis') {
    return (node.children ?? []).map(extractText).join('');
  }
  if (node.value !== undefined) return String(node.value);
  if (Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}

function proseToBlocks(text: string, isFirstBlock: { seen: boolean }): BlockData[] {
  if (!text.trim()) return [];

  // If the prose is raw HTML (vision-tech files), treat as rich-text
  const trimmed = text.trim();
  if (trimmed.startsWith('<') && !trimmed.startsWith('</') && trimmed.includes('</')) {
    return [{
      id: randomUUID(),
      type: 'rich-text',
      props: { html: trimmed },
    }];
  }

  const ast = unified().use(remarkParse).parse(trimmed);
  const blocks: BlockData[] = [];

  for (const node of (ast.children ?? []) as any[]) {
    if (node.type === 'heading') {
      const t = extractText(node);
      if (node.depth === 1) continue; // skip h1
      blocks.push({
        id: randomUUID(),
        type: 'heading',
        props: { text: t, level: node.depth <= 2 ? 'h2' : 'h3' },
      });
      continue;
    }

    if (node.type === 'paragraph') {
      const t = extractText(node);
      if (!t.trim()) continue;
      if (!isFirstBlock.seen) {
        isFirstBlock.seen = true;
        blocks.push({ id: randomUUID(), type: 'body-lead', props: { text: t } });
      } else {
        blocks.push({ id: randomUUID(), type: 'body-text', props: { text: t } });
      }
      continue;
    }

    if (node.type === 'list' && !node.ordered) {
      const items = (node.children ?? []).map((item: any) => extractText(item));
      blocks.push({ id: randomUUID(), type: 'results-list', props: { items } });
      continue;
    }

    if (node.type === 'blockquote') {
      const t = extractText(node);
      blocks.push({ id: randomUUID(), type: 'rich-text', props: { html: `<p>${t}</p>` } });
      continue;
    }

    if (node.type === 'html') {
      blocks.push({ id: randomUUID(), type: 'rich-text', props: { html: node.value ?? '' } });
      continue;
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Main export: map MDX body → BlockData[]
// ---------------------------------------------------------------------------

export function mapMdxToBlocks(body: string, pageType: string): BlockData[] {
  const blocks: BlockData[] = [];
  const isFirstBlock = { seen: false };

  // splitMdxBody handles all cases:
  // - Pure MDX components (projects, articles with SectionBanner etc.)
  // - Mixed raw HTML + MDX components (vision-tech pages)
  // - Pure prose markdown (plain articles)
  // proseToBlocks() handles raw HTML segments and converts them to rich-text blocks.
  const segments = splitMdxBody(body);

  for (const seg of segments) {
    if (seg.kind === 'component') {
      const props = parseJsxProps(seg.rawProps);
      const block = componentToBlock(seg.name, props);
      if (block) {
        blocks.push(block);
        isFirstBlock.seen = true; // components count as "first seen" for prose tracking
      }
    } else {
      // For .astro static pages, treat all prose/HTML between components as a
      // rich-text block verbatim — do not run remark over Astro/JSX markup.
      if (pageType === 'page') {
        if (seg.text.trim()) {
          blocks.push({ id: randomUUID(), type: 'rich-text', props: { html: seg.text } });
        }
      } else {
        const proseBlocks = proseToBlocks(seg.text, isFirstBlock);
        blocks.push(...proseBlocks);
      }
    }
  }

  return blocks;
}
