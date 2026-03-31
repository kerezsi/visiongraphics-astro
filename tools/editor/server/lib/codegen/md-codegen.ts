import matter from 'gray-matter';
import type { BlockData, DocumentState } from '../../types/blocks.js';

// ---------------------------------------------------------------------------
// Strip `id` fields and unwrap `props` back to flat disk format before saving.
// Canvas blocks are { id, type, props: { ... } }.
// On-disk blocks are flat: { type, image, label, ... }.
// Container slot arrays (children, main, sidebar, left, right) are recursed.
// ---------------------------------------------------------------------------
function stripIds(block: any): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, type, props = {}, ...rest } = block;
  const slots = ['children', 'main', 'sidebar', 'left', 'right'];
  const flatProps: Record<string, any> = {};
  for (const [k, v] of Object.entries(props as Record<string, any>)) {
    if (slots.includes(k) && Array.isArray(v)) {
      flatProps[k] = (v as any[]).map(stripIds);
    } else {
      flatProps[k] = v;
    }
  }
  return { type, ...flatProps, ...rest };
}

// ---------------------------------------------------------------------------
// Strip HTML tags from a string
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

// ---------------------------------------------------------------------------
// Block → Markdown string
// Returns null if the block should be skipped
// ---------------------------------------------------------------------------

function blockToMd(block: BlockData): string | null {
  const p = block.props as any;

  switch (block.type) {
    case 'heading':
      if (p.level === 'h2') return `## ${p.text ?? ''}`;
      if (p.level === 'h3') return `### ${p.text ?? ''}`;
      return `#### ${p.text ?? ''}`;

    case 'body-lead':
      return p.text ?? '';

    case 'body-text':
      return p.text ?? '';

    case 'section-label':
      return `> **${p.text ?? ''}**`;

    case 'results-list': {
      const items = (p.items ?? []) as string[];
      return items.map((item: string) => `- ${item}`).join('\n');
    }

    case 'single-image':
      return `![${p.alt ?? ''}](${p.src ?? ''})`;

    case 'film-embed':
      return `https://vimeo.com/${p.vimeoId ?? ''}`;

    case 'youtube-embed':
      return p.url ?? '';

    case 'rich-text':
      return stripHtml(p.html ?? '');

    case 'SectionBanner': {
      const heading = `## ${p.label ? p.label + ': ' : ''}${p.title ?? ''}`;
      // Preserve the background image so the editor can round-trip it and the
      // remark-section-banner plugin can render it on the live site.
      return p.image ? `![section-banner](${p.image})\n\n${heading}` : heading;
    }

    case 'diff-block':
      return `> **${p.label ?? ''}**\n>\n> ${p.text ?? ''}`;

    case 'cta-section':
      return `## ${p.heading ?? ''}\n\n${p.subtext ?? ''}\n\n[${p.buttonLabel ?? ''}](${p.buttonHref ?? '#'})`;

    case 'button-group': {
      const buttons = (p.buttons ?? []) as Array<{ label: string; href: string }>;
      return buttons.map((b) => `[${b.label}](${b.href})`).join('  \n');
    }

    // Layout/container blocks — recurse into children where possible
    case 'section-container': {
      const children = (p.children ?? []) as BlockData[];
      const inner = children.map(blockToMd).filter(Boolean).join('\n\n');
      return inner || null;
    }

    case 'two-col': {
      const left = ((p.left ?? []) as BlockData[]).map(blockToMd).filter(Boolean).join('\n\n');
      const right = ((p.right ?? []) as BlockData[]).map(blockToMd).filter(Boolean).join('\n\n');
      return [left, right].filter(Boolean).join('\n\n') || null;
    }

    case 'service-body-grid': {
      const main = ((p.main ?? []) as BlockData[]).map(blockToMd).filter(Boolean).join('\n\n');
      const sidebar = ((p.sidebar ?? []) as BlockData[]).map(blockToMd).filter(Boolean).join('\n\n');
      return [main, sidebar].filter(Boolean).join('\n\n') || null;
    }

    // Media embeds that don't map cleanly
    case 'tour-360':
      return p.url ? `[360 Tour: ${p.title ?? ''}](${p.url})` : null;

    case 'image-gallery': {
      const images = (p.images ?? []) as Array<{ src: string; alt: string }>;
      if (images.length === 0) return null;
      return images.map((img) => `![${img.alt}](${img.src})`).join('\n');
    }

    case 'image-compare': {
      const before = p.before ?? { src: '', alt: '' };
      const after = p.after ?? { src: '', alt: '' };
      return `![Before: ${before.alt}](${before.src})\n![After: ${after.alt}](${after.src})`;
    }

    case 'deliverable-grid': {
      const items = (p.items ?? []) as Array<{ title: string; desc: string }>;
      return items.map((item) => `### ${item.title}\n\n${item.desc}`).join('\n\n');
    }

    case 'timeline-table': {
      const rows = (p.rows ?? []) as Array<{ scope: string; deliverables: string }>;
      if (rows.length === 0) return null;
      const header = `| Scope | Deliverables |\n| --- | --- |`;
      const body = rows.map((r) => `| ${r.scope} | ${r.deliverables} |`).join('\n');
      return `${header}\n${body}`;
    }

    case 'notable-grid': {
      const items = (p.items ?? []) as Array<{ name: string; year: string }>;
      return items.map((item) => `- **${item.name}** (${item.year})`).join('\n');
    }

    case 'sidebar-block':
      return `> **${p.label ?? ''}**\n>\n> ${p.content ?? ''}`;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Build YAML frontmatter string from meta object
// ---------------------------------------------------------------------------

// ISO date / datetime strings sent over JSON (Date objects serialise to these)
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;

function toYaml(meta: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue;

    if (value instanceof Date) {
      // Native Date → bare YAML date (z.date() expects this)
      lines.push(`${key}: ${value.toISOString().slice(0, 10)}`);
    } else if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
      // ISO date string that came over JSON (Date serialised to string)
      // Output as bare YAML date so js-yaml parses it back to a Date object
      lines.push(`${key}: ${value.slice(0, 10)}`);
    } else if (typeof value === 'string') {
      // Quote strings that contain YAML-special characters
      const needsQuote = /[:#\[\]{},|>&*!'"?@`]/.test(value) || value.includes('\n');
      lines.push(`${key}: ${needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        if (typeof item === 'string') {
          lines.push(`  - ${item}`);
        } else {
          lines.push(`  - ${JSON.stringify(item)}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function documentToMarkdown(doc: DocumentState): string {
  const meta = doc.meta as Record<string, unknown>;

  // Projects and services store blocks in frontmatter, not in the markdown body.
  if (doc.pageType === 'project' || doc.pageType === 'service') {
    const stripped = doc.blocks.map(stripIds);
    const data: Record<string, unknown> = stripped.length > 0
      ? { ...meta, blocks: stripped }
      : { ...meta };
    // matter.stringify uses js-yaml for proper YAML serialization of nested objects
    return matter.stringify('', data as any);
  }

  // Articles: blocks → markdown body, meta → frontmatter
  const yamlStr = toYaml(meta);
  const bodyLines: string[] = [];
  for (const block of doc.blocks) {
    const md = blockToMd(block);
    if (md) bodyLines.push(md);
  }
  const body = bodyLines.join('\n\n');
  return `---\n${yamlStr}\n---\n\n${body}\n`;
}
