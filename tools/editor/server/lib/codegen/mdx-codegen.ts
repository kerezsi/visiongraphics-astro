import matter from 'gray-matter';
import type { BlockData, DocumentState } from '../../types/blocks.js';

// ---------------------------------------------------------------------------
// YAML frontmatter serialization
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;

/**
 * Serialize a string value as YAML.
 *
 * - Multi-line strings  → block scalar `|` with body indented under the key.
 * - Single-line strings → quoted form if they contain YAML-special chars,
 *   otherwise bare.  We do NOT switch to block scalar based on length —
 *   doing so was the source of two production-breaking bugs:
 *
 *   1. `description.en: |\n<body>` emitted inside a nested object had the
 *      body indented at the wrong column (matching the key, not deeper),
 *      producing invalid YAML that Astro refused to parse.
 *   2. After the failed parse, gray-matter returned empty frontmatter and
 *      the editor's importer pushed the still-unparsed YAML into the body
 *      as a rich-text block — causing the page meta to render as visible
 *      markdown the next time the file was saved.
 *
 *   Always quoting long single-line strings avoids both failure modes.
 *
 * @param parentIndent - the indent string preceding the KEY this value
 *   belongs to.  For top-level keys: "".  For nested object members: "  ".
 *   Used only for block-scalar continuation lines so they sit deeper than
 *   the line containing the `|` indicator.
 */
function yamlScalar(value: string, parentIndent: string = ''): string {
  if (value.includes('\n')) {
    // Block scalar body must be indented deeper than the line containing `|`.
    // YAML's rule: body indent > parent block indent. Conventional +2.
    const bodyIndent = parentIndent + '  ';
    const indented = value.split('\n').map((l) => `${bodyIndent}${l}`).join('\n');
    return `|\n${indented}`;
  }
  // Quote if contains YAML-special chars OR is awkwardly bordered with spaces
  if (/[:#\[\]{},|>&*!'"?@`\\]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

function toYaml(meta: Record<string, unknown>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue;

    if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString().slice(0, 10)}`);
    } else if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
      lines.push(`${key}: ${value.slice(0, 10)}`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${yamlScalar(value)}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else if (value.every((v) => typeof v === 'string')) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${yamlScalar(item as string)}`);
        }
      } else {
        // Array of objects (tour360, films, etc.) — use gray-matter for reliable YAML
        // Fall through to gray-matter for complex nested objects
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    } else if (typeof value === 'object') {
      // Localized fields (`{ en: "...", hu: "..." }`) and other small objects
      // serialize to block-style YAML for readability:
      //   title:
      //     en: Hotel Lycium
      //     hu: Lycium Hotel
      // Falls back to flow-style JSON for objects with non-string values.
      const entries = Object.entries(value as Record<string, unknown>);
      const allScalar = entries.every(([, v]) =>
        v === null ||
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      );
      if (allScalar && entries.length > 0) {
        lines.push(`${key}:`);
        for (const [k, v] of entries) {
          if (v === null || v === undefined) continue;
          if (typeof v === 'string') {
            // Nested member key sits at column 2 — block-scalar continuation
            // lines (if any) must be indented at column 4.
            lines.push(`  ${k}: ${yamlScalar(v, '  ')}`);
          } else {
            lines.push(`  ${k}: ${v}`);
          }
        }
      } else {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSX prop serialization
// ---------------------------------------------------------------------------

function jsxPropValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `{${value}}`;
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return `{${JSON.stringify(value)}}`;
  }
  return `"${String(value)}"`;
}

function jsxPropsString(props: Record<string, unknown>, excludeKeys: string[] = []): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (excludeKeys.includes(key)) continue;
    if (value === undefined || value === null) continue;
    parts.push(`${key}=${jsxPropValue(value)}`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Block → MDX JSX tag
// ---------------------------------------------------------------------------

function blockToMdx(block: BlockData): string | null {
  const p = block.props as any;

  switch (block.type) {
    case 'SectionBanner': {
      // Emit ALL stored props so that .astro-page extras (headingLevel, size, etc.)
      // survive the round-trip.  Standard MDX blocks only have image/label/title.
      const parts: string[] = [];
      for (const [key, value] of Object.entries(p)) {
        if (value === undefined || value === null || value === '') continue;
        if (typeof value === 'string') {
          parts.push(`${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
        } else if (typeof value === 'boolean') {
          if (value) parts.push(key); // bare prop (e.g. fullBleed)
        } else {
          parts.push(`${key}={${JSON.stringify(value)}}`);
        }
      }
      return `<SectionBanner\n  ${parts.join('\n  ')}\n/>`;
    }

    case 'single-image': {
      if (!p.src) return null;
      const parts: string[] = [`src="${p.src}"`];
      if (p.alt)     parts.push(`alt="${p.alt}"`);
      if (p.caption) parts.push(`caption="${p.caption}"`);
      return `<SingleImage ${parts.join(' ')} />`;
    }

    case 'image-gallery': {
      const images = (p.images ?? []) as Array<{ src: string; alt: string }>;
      if (images.length === 0) return null;
      const parts: string[] = [`images={${JSON.stringify(images)}}`];
      // Localized red label.  Skip when empty object or "" — same convention as other
      // localized fields elsewhere in the editor.
      const hasContent = (v: unknown): boolean => {
        if (v === undefined || v === null || v === '') return false;
        if (typeof v === 'string') return v.length > 0;
        if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some((x) => typeof x === 'string' && x.length > 0);
        return false;
      };
      if (hasContent(p.label))    parts.push(`label={${JSON.stringify(p.label)}}`);
      if (hasContent(p.subtitle)) parts.push(`subtitle={${JSON.stringify(p.subtitle)}}`);
      return `<ImageGallery ${parts.join(' ')} />`;
    }

    case 'image-compare': {
      const parts: string[] = [];
      if (p.before)    parts.push(`before="${p.before}"`);
      if (p.after)     parts.push(`after="${p.after}"`);
      if (p.beforeAlt) parts.push(`beforeAlt="${p.beforeAlt}"`);
      if (p.afterAlt)  parts.push(`afterAlt="${p.afterAlt}"`);
      // Localized fields — emit string literal or JSX object literal.
      const hasContent = (v: unknown): boolean => {
        if (v === undefined || v === null || v === '') return false;
        if (typeof v === 'string') return v.length > 0;
        if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some((x) => typeof x === 'string' && x.length > 0);
        return false;
      };
      const emitLocalized = (key: string, v: unknown) => {
        if (!hasContent(v)) return;
        if (typeof v === 'string') parts.push(`${key}="${v.replace(/"/g, '\\"')}"`);
        else parts.push(`${key}={${JSON.stringify(v)}}`);
      };
      emitLocalized('label',      p.label);
      emitLocalized('subtitle',   p.subtitle);
      emitLocalized('beforeText', p.beforeText);
      emitLocalized('afterText',  p.afterText);
      return `<ImageCompare ${parts.join(' ')} />`;
    }

    case 'deliverable-grid': {
      const items = (p.items ?? []) as Array<{ title: string; desc: string }>;
      const cols = p.columns ?? 3;
      const itemsJson = JSON.stringify(items);
      return `<DeliverableGrid columns={${cols}} items={${itemsJson}} />`;
    }

    case 'timeline-table': {
      const rows = (p.rows ?? []) as Array<{ scope: string; deliverables: string }>;
      if (rows.length === 0) return null;
      const rowsJson = JSON.stringify(rows);
      return `<TimelineTable rows={${rowsJson}} />`;
    }

    case 'notable-grid': {
      const items = (p.items ?? []) as Array<{ name: string; year: string }>;
      if (items.length === 0) return null;
      const itemsJson = JSON.stringify(items);
      return `<NotableGrid items={${itemsJson}} />`;
    }

    case 'tour-360': {
      const parts: string[] = [];
      if (p.url)        parts.push(`url="${p.url}"`);
      if (p.title)      parts.push(`title="${p.title}"`);
      if (p.coverImage) parts.push(`coverImage="${p.coverImage}"`);
      return `<Tour360 ${parts.join(' ')} />`;
    }

    case 'youtube-embed': {
      const parts: string[] = [];
      if (p.url)   parts.push(`url="${p.url}"`);
      if (p.title) parts.push(`title="${p.title}"`);
      return `<YoutubeEmbed ${parts.join(' ')} />`;
    }

    case 'film-embed': {
      const parts: string[] = [];
      if (p.vimeoId) parts.push(`vimeoId="${p.vimeoId}"`);
      if (p.title)   parts.push(`title="${p.title}"`);
      return `<FilmEmbed ${parts.join(' ')} />`;
    }

    // Prose blocks → plain markdown
    case 'heading':
      if (p.level === 'h2') return `## ${p.text ?? ''}`;
      return `### ${p.text ?? ''}`;

    case 'body-lead':
    case 'body-text':
      return p.text ?? '';

    case 'results-list': {
      const items = (p.items ?? []) as string[];
      return items.map((item: string) => `- ${item}`).join('\n');
    }

    case 'rich-text':
      return p.html ?? '';

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Astro page reconstruction: DocumentState → .astro file content
// Meta must contain astroScript, templateHeader, templateFooter (stored by parser)
// ---------------------------------------------------------------------------

export function astroPageToContent(doc: DocumentState): string {
  const meta = doc.meta as Record<string, unknown>;
  const script        = (meta.astroScript      as string) ?? '';
  const templateHeader = (meta.templateHeader  as string) ?? '';
  const templateFooter = (meta.templateFooter  as string) ?? '';

  const bodyLines: string[] = [];
  for (const block of doc.blocks) {
    if (block.type === 'rich-text') {
      // Emit raw HTML/Astro markup verbatim
      const html = (block.props as { html: string }).html;
      if (html) bodyLines.push(html);
    } else {
      const mdx = blockToMdx(block);
      if (mdx !== null) bodyLines.push(mdx);
    }
  }

  const body = bodyLines.join('\n\n');

  // Reconstruct: ---<script>---<templateHeader><blocks><templateFooter>
  return `---${script}\n---${templateHeader}${body}${templateFooter}`;
}

// ---------------------------------------------------------------------------
// Main export: DocumentState → MDX file content
// ---------------------------------------------------------------------------

export function documentToMdx(doc: DocumentState): string {
  const meta = { ...(doc.meta as Record<string, unknown>) };

  // Strip null/undefined values that shouldn't appear in YAML
  for (const key of Object.keys(meta)) {
    if (meta[key] === '' || meta[key] === null || meta[key] === undefined) {
      delete meta[key];
    }
  }

  const yamlStr = toYaml(meta);
  const frontmatter = `---\n${yamlStr}\n---`;

  if (doc.blocks.length === 0) {
    return `${frontmatter}\n`;
  }

  const bodyLines: string[] = [];
  for (const block of doc.blocks) {
    const mdx = blockToMdx(block);
    if (mdx) bodyLines.push(mdx);
  }

  const body = bodyLines.join('\n\n');
  return `${frontmatter}\n\n${body}\n`;
}
