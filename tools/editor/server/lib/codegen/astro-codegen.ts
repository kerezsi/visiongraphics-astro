import type { BlockData, DocumentState } from '../../types/blocks.js';
import { resolveImports } from './imports-resolver.js';

// ---------------------------------------------------------------------------
// Block → Astro HTML string
// ---------------------------------------------------------------------------

function blockToAstro(block: BlockData, indent: string, slug: string, sectionCounter: { n: number }): string {
  const p = block.props as any;
  const i = indent;

  switch (block.type) {
    case 'SectionBanner':
      return `${i}<SectionBanner` +
        ` image="${p.image ?? ''}"` +
        ` label="${p.label ?? ''}"` +
        ` title="${p.title ?? ''}"` +
        (p.imageAlt ? ` imageAlt="${p.imageAlt}"` : '') +
        (p.align ? ` align="${p.align}"` : '') +
        ` size="${p.size ?? 'section'}"` +
        ` headingLevel="${p.headingLevel ?? 'h2'}"` +
        ` />`;

    case 'section-container': {
      const idx = sectionCounter.n++;
      const childBlocks: string = (p.children ?? [])
        .map((c: BlockData) => blockToAstro(c, i + '    ', slug, sectionCounter))
        .join('\n');
      return (
        `${i}<section class="${slug}-${idx}-section service-section">\n` +
        `${i}  <div class="container">\n` +
        childBlocks +
        `\n${i}  </div>\n` +
        `${i}</section>`
      );
    }

    case 'two-col': {
      const left = (p.left ?? [])
        .map((c: BlockData) => blockToAstro(c, i + '    ', slug, sectionCounter))
        .join('\n');
      const right = (p.right ?? [])
        .map((c: BlockData) => blockToAstro(c, i + '    ', slug, sectionCounter))
        .join('\n');
      return (
        `${i}<div class="two-col">\n` +
        `${i}  <div class="col-left">\n` +
        left +
        `\n${i}  </div>\n` +
        `${i}  <div class="col-right">\n` +
        right +
        `\n${i}  </div>\n` +
        `${i}</div>`
      );
    }

    case 'service-body-grid': {
      const main = (p.main ?? [])
        .map((c: BlockData) => blockToAstro(c, i + '    ', slug, sectionCounter))
        .join('\n');
      const sidebar = (p.sidebar ?? [])
        .map((c: BlockData) => blockToAstro(c, i + '    ', slug, sectionCounter))
        .join('\n');
      return (
        `${i}<div class="service-body-grid">\n` +
        `${i}  <div class="service-main">\n` +
        main +
        `\n${i}  </div>\n` +
        `${i}  <aside class="service-sidebar">\n` +
        sidebar +
        `\n${i}  </aside>\n` +
        `${i}</div>`
      );
    }

    case 'heading':
      return `${i}<${p.level}${p.className ? ` class="${p.className}"` : ''}>${escHtml(p.text ?? '')}</${p.level}>`;

    case 'body-lead':
      return `${i}<p class="body-lead">${escHtml(p.text ?? '')}</p>`;

    case 'body-text':
      return `${i}<p class="body-text">${escHtml(p.text ?? '')}</p>`;

    case 'section-label':
      return `${i}<p class="section-label">${escHtml(p.text ?? '')}</p>`;

    case 'rich-text':
      // Output raw HTML directly — author is responsible for content
      return (p.html ?? '').split('\n').map((line: string) => `${i}${line}`).join('\n');

    case 'results-list': {
      const items = (p.items ?? []) as string[];
      const liLines = items.map((item: string) => `${i}  <li>${escHtml(item)}</li>`).join('\n');
      return `${i}<ul class="results-list">\n${liLines}\n${i}</ul>`;
    }

    case 'deliverable-grid': {
      const items = (p.items ?? []) as Array<{ title: string; desc: string }>;
      const cards = items
        .map(
          (item) =>
            `${i}  <div class="deliverable-card">\n` +
            `${i}    <h3 class="deliverable-title">${escHtml(item.title)}</h3>\n` +
            `${i}    <p class="deliverable-desc">${escHtml(item.desc)}</p>\n` +
            `${i}  </div>`
        )
        .join('\n');
      return `${i}<div class="deliverable-grid">\n${cards}\n${i}</div>`;
    }

    case 'timeline-table': {
      const rows = (p.rows ?? []) as Array<{ scope: string; deliverables: string }>;
      const rowLines = rows
        .map(
          (r) =>
            `${i}  <div class="timeline-row">\n` +
            `${i}    <span class="timeline-scope">${escHtml(r.scope)}</span>\n` +
            `${i}    <span class="timeline-time">${escHtml(r.deliverables)}</span>\n` +
            `${i}  </div>`
        )
        .join('\n');
      return `${i}<div class="timeline-table">\n${rowLines}\n${i}</div>`;
    }

    case 'notable-grid': {
      const items = (p.items ?? []) as Array<{ name: string; year: string }>;
      const notableItems = items
        .map(
          (item) =>
            `${i}  <div class="notable-item">\n` +
            `${i}    <span class="notable-name">${escHtml(item.name)}</span>\n` +
            `${i}    <span class="notable-year">${escHtml(item.year)}</span>\n` +
            `${i}  </div>`
        )
        .join('\n');
      return `${i}<div class="notable-grid">\n${notableItems}\n${i}</div>`;
    }

    case 'single-image':
      return (
        `${i}<img` +
        ` src="${p.src ?? ''}"` +
        ` alt="${escAttr(p.alt ?? '')}"` +
        (p.caption ? ` title="${escAttr(p.caption)}"` : '') +
        ` loading="lazy"` +
        ` />`
      );

    case 'image-gallery': {
      // Filter out non-object entries (guards against shallow-copy mutation bugs)
      const images = ((p.images ?? []) as Array<unknown>)
        .filter((img): img is { src: string; alt: string } =>
          img !== null && typeof img === 'object' && !Array.isArray(img)
        );
      const imagesExpr = JSON.stringify(images);
      return (
        `${i}<ImageLightbox\n` +
        `${i}  client:load\n` +
        `${i}  images={${imagesExpr}}\n` +
        (p.title ? `${i}  title="${escAttr(p.title)}"\n` : '') +
        `${i}/>`
      );
    }

    case 'image-compare': {
      const before = p.before ?? { src: '', alt: '' };
      const after = p.after ?? { src: '', alt: '' };
      const beforeExpr =
        `{src:"${before.src}", alt:"${escAttr(before.alt)}"` +
        (before.label ? `, label:"${escAttr(before.label)}"` : '') +
        `}`;
      const afterExpr =
        `{src:"${after.src}", alt:"${escAttr(after.alt)}"` +
        (after.label ? `, label:"${escAttr(after.label)}"` : '') +
        `}`;
      return (
        `${i}<ImageCompare\n` +
        `${i}  client:load\n` +
        `${i}  before={${beforeExpr}}\n` +
        `${i}  after={${afterExpr}}\n` +
        `${i}  initialPosition={${p.initialPosition ?? 50}}\n` +
        `${i}  aspectRatio="${p.aspectRatio ?? '16 / 9'}"\n` +
        `${i}/>`
      );
    }

    case 'film-embed':
      return `${i}<FilmEmbed vimeoId="${p.vimeoId ?? ''}" title="${escAttr(p.title ?? '')}" />`;

    case 'tour-360':
      return (
        `${i}<Tour360` +
        ` url="${p.url ?? ''}"` +
        ` title="${escAttr(p.title ?? '')}"` +
        (p.coverImage ? ` coverImage="${p.coverImage}"` : '') +
        ` />`
      );

    case 'youtube-embed':
      return (
        `${i}<YouTubeEmbed` +
        ` url="${p.url ?? ''}"` +
        (p.title ? ` title="${escAttr(p.title)}"` : '') +
        ` />`
      );

    case 'button-group': {
      const buttons = (p.buttons ?? []) as Array<{ label: string; href: string; variant: string }>;
      const btnLines = buttons
        .map((b) => `${i}<a href="${b.href}" class="btn ${b.variant}">${escHtml(b.label)}</a>`)
        .join('\n');
      return btnLines;
    }

    case 'sidebar-block':
      return (
        `${i}<div class="sidebar-block">\n` +
        `${i}  <h3 class="sidebar-label">${escHtml(p.label ?? '')}</h3>\n` +
        `${i}  <p class="body-text">${escHtml(p.content ?? '')}</p>\n` +
        `${i}</div>`
      );

    case 'diff-block':
      return (
        `${i}<div class="diff-block">\n` +
        `${i}  <p class="diff-label">${escHtml(p.label ?? '')}</p>\n` +
        `${i}  <p class="body-text">${escHtml(p.text ?? '')}</p>\n` +
        `${i}</div>`
      );

    case 'cta-section':
      return (
        `${i}<section class="about-cta">\n` +
        `${i}  <div class="container about-cta-inner">\n` +
        `${i}    <div>\n` +
        `${i}      <h2 class="cta-heading">${escHtml(p.heading ?? '')}</h2>\n` +
        `${i}      <p class="cta-sub">${escHtml(p.subtext ?? '')}</p>\n` +
        `${i}    </div>\n` +
        `${i}    <a href="${p.buttonHref ?? '#'}" class="btn btn-primary">${escHtml(p.buttonLabel ?? '')}</a>\n` +
        `${i}  </div>\n` +
        `${i}</section>`
      );

    default:
      return `${i}<!-- unknown block type: ${(block as any).type} -->`;
  }
}

// ---------------------------------------------------------------------------
// Escape helpers
// ---------------------------------------------------------------------------

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

// ---------------------------------------------------------------------------
// Determine path depth for imports based on pageType
// ---------------------------------------------------------------------------

function pageDepth(pageType: string): number {
  switch (pageType) {
    case 'service':
    case 'project':
      return 2; // src/pages/services/ or src/pages/portfolio/
    case 'article':
      return 2; // src/pages/articles/
    default:
      return 1; // src/pages/
  }
}

function pageClass(pageType: string): string {
  switch (pageType) {
    case 'service': return 'service';
    case 'project': return 'project';
    case 'article': return 'article';
    default: return 'page';
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function documentToAstro(doc: DocumentState): string {
  const depth = pageDepth(doc.pageType);
  const imports = resolveImports(doc.blocks, depth);
  const layoutBack = '../'.repeat(depth);

  const title = (doc.meta.title as string) ?? doc.slug;
  const description = (doc.meta.description as string) ?? '';
  const cls = pageClass(doc.pageType);

  const sectionCounter = { n: 0 };

  const blocksCode = doc.blocks
    .map((b) => blockToAstro(b, '    ', doc.slug, sectionCounter))
    .join('\n\n');

  const frontmatterLines = [
    `// Generated by Vision Graphics Page Editor`,
    `import Page from '${layoutBack}layouts/Page.astro';`,
    ...imports,
  ].join('\n');

  return (
    `---\n` +
    frontmatterLines +
    `\n---\n\n` +
    `<Page title="${escAttr(title)}" description="${escAttr(description)}" fullBleed>\n` +
    `  <div class="${cls}-page">\n` +
    blocksCode +
    `\n  </div>\n` +
    `</Page>\n\n` +
    `<style>\n` +
    `  .${cls}-page { width: 100%; }\n` +
    `</style>\n`
  );
}
