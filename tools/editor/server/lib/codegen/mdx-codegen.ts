import matter from 'gray-matter';
import type { BlockData, DocumentState } from '../../types/blocks.js';

// ---------------------------------------------------------------------------
// YAML frontmatter serialization
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;

function needsBlockScalar(value: string): boolean {
  return value.includes('\n') || value.length > 80;
}

function yamlScalar(value: string): string {
  if (needsBlockScalar(value)) {
    // Use literal block scalar |, indent each line by 2 spaces
    const indented = value.split('\n').map((l) => `  ${l}`).join('\n');
    return `|\n${indented}`;
  }
  // Quote if contains YAML-special chars
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
      lines.push(`${key}: ${JSON.stringify(value)}`);
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
      const imagesJson = JSON.stringify(images);
      return `<ImageGallery images={${imagesJson}} />`;
    }

    case 'image-compare': {
      const parts: string[] = [];
      if (p.before)    parts.push(`before="${p.before}"`);
      if (p.after)     parts.push(`after="${p.after}"`);
      if (p.beforeAlt) parts.push(`beforeAlt="${p.beforeAlt}"`);
      if (p.afterAlt)  parts.push(`afterAlt="${p.afterAlt}"`);
      if (p.label)     parts.push(`label="${p.label}"`);
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
