/**
 * Article markdown round-trip tests.
 *
 * For articles, blocks are serialised to a markdown body and re-parsed via the
 * MDAST block mapper. Tests are split into two groups:
 *
 * GROUP A — Clean round-trips:  block type is preserved exactly.
 * GROUP B — Documented lossy:   type changes are expected and documented here.
 *
 * Container blocks (section-container, two-col, service-body-grid) are NOT
 * tested here — they flatten their children in the article path and are
 * project/service-only in practice. They are already covered in codegen.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { documentToMarkdown } from '../server/lib/codegen/md-codegen.js';
import { parseMarkdown } from '../server/lib/md-import/parser.js';
import { mapAstToBlocks } from '../server/lib/md-import/block-mapper.js';
import type { BlockData, DocumentState } from '../server/types/blocks.js';

const ID = 'test-id';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal article DocumentState. */
function articleDoc(blocks: BlockData[]): DocumentState {
  return {
    pageType: 'article',
    slug: 'test',
    filePath: 'src/content/articles/test.md',
    meta: { title: 'Test', date: '2025-01-01', published: true },
    blocks,
  };
}

/** Serialise blocks to markdown then re-parse them to BlockData[]. */
async function roundtrip(blocks: BlockData[]): Promise<BlockData[]> {
  const markdown = documentToMarkdown(articleDoc(blocks));
  const { ast } = await parseMarkdown(markdown);
  return mapAstToBlocks(ast, 'article');
}

/** Strip the runtime `id` from a block for comparison. */
function noId({ id: _id, ...rest }: any) { return rest; }

// ---------------------------------------------------------------------------
// GROUP A: Clean round-trips — block type MUST be preserved
// ---------------------------------------------------------------------------

describe('GROUP A — clean round-trips', () => {

  it('heading h2 (plain, no separator)', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'heading', props: { text: 'Plain Heading', level: 'h2' } },
    ]);
    expect(blocks[0].type).toBe('heading');
    expect((blocks[0].props as any).level).toBe('h2');
    expect((blocks[0].props as any).text).toBe('Plain Heading');
  });

  it('heading h3', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'heading', props: { text: 'Sub Heading', level: 'h3' } },
    ]);
    expect(blocks[0].type).toBe('heading');
    expect((blocks[0].props as any).level).toBe('h3');
    expect((blocks[0].props as any).text).toBe('Sub Heading');
  });

  it('body-lead (first paragraph)', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'body-lead', props: { text: 'Opening lead paragraph.' } },
    ]);
    expect(blocks[0].type).toBe('body-lead');
    expect((blocks[0].props as any).text).toBe('Opening lead paragraph.');
  });

  it('body-text (subsequent paragraphs)', async () => {
    // body-text must come after body-lead so it is not the first paragraph
    const blocks = await roundtrip([
      { id: ID, type: 'body-lead', props: { text: 'Lead.' } },
      { id: ID, type: 'body-text', props: { text: 'Body paragraph.' } },
    ]);
    expect(blocks[1].type).toBe('body-text');
    expect((blocks[1].props as any).text).toBe('Body paragraph.');
  });

  it('results-list', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'results-list', props: { items: ['Alpha', 'Beta', 'Gamma'] } },
    ]);
    expect(blocks[0].type).toBe('results-list');
    expect((blocks[0].props as any).items).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('single-image', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'single-image', props: { src: '/_img/photo.jpg', alt: 'A photo' } },
    ]);
    expect(blocks[0].type).toBe('single-image');
    expect((blocks[0].props as any).src).toBe('/_img/photo.jpg');
    expect((blocks[0].props as any).alt).toBe('A photo');
  });

  it('image-compare', async () => {
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'image-compare',
        props: {
          before: { src: '/_img/before.jpg', alt: 'Exterior old', label: 'Before' },
          after:  { src: '/_img/after.jpg',  alt: 'Exterior new', label: 'After'  },
        },
      },
    ]);
    expect(blocks[0].type).toBe('image-compare');
    expect((blocks[0].props as any).before.src).toBe('/_img/before.jpg');
    expect((blocks[0].props as any).before.alt).toBe('Exterior old');
    expect((blocks[0].props as any).after.src).toBe('/_img/after.jpg');
    expect((blocks[0].props as any).after.alt).toBe('Exterior new');
  });

  it('image-gallery (2+ images)', async () => {
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'image-gallery',
        props: {
          images: [
            { src: '/_img/a.jpg', alt: 'Image A' },
            { src: '/_img/b.jpg', alt: 'Image B' },
          ],
        },
      },
    ]);
    expect(blocks[0].type).toBe('image-gallery');
    const imgs = (blocks[0].props as any).images as Array<{ src: string; alt: string }>;
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toEqual({ src: '/_img/a.jpg', alt: 'Image A' });
    expect(imgs[1]).toEqual({ src: '/_img/b.jpg', alt: 'Image B' });
  });

  it('film-embed (Vimeo ID)', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'film-embed', props: { vimeoId: '123456789', title: 'My Film' } },
    ]);
    expect(blocks[0].type).toBe('film-embed');
    expect((blocks[0].props as any).vimeoId).toBe('123456789');
  });

  it('youtube-embed', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'youtube-embed', props: { url: 'https://youtube.com/watch?v=abc123' } },
    ]);
    expect(blocks[0].type).toBe('youtube-embed');
    expect((blocks[0].props as any).url).toBe('https://youtube.com/watch?v=abc123');
  });

  it('tour-360 (via .html URL detection)', async () => {
    const blocks = await roundtrip([
      { id: ID, type: 'tour-360', props: { url: 'https://example.com/lobby-tour.html', title: 'Lobby' } },
    ]);
    expect(blocks[0].type).toBe('tour-360');
    expect((blocks[0].props as any).url).toBe('https://example.com/lobby-tour.html');
  });

  // NOTE: timeline-table is excluded from article round-trip tests.
  // It is a project/service-only block (allowedIn: ['service', 'project']).
  // Its markdown encoding uses GFM table syntax (| col | col |), but
  // remark-parse uses CommonMark by default which does not parse tables —
  // so the table content is treated as plain text paragraphs in articles.
  // timeline-table round-trips perfectly via the YAML frontmatter path
  // (project/service). See project-roundtrip.test.ts.

  it('SectionBanner with image (full round-trip via image+heading pattern)', async () => {
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'SectionBanner',
        props: { image: '/_img/banners/hero.jpg', label: 'Services', title: 'What We Do', size: 'section', headingLevel: 'h2', align: 'left' },
      },
    ]);
    expect(blocks[0].type).toBe('SectionBanner');
    expect((blocks[0].props as any).image).toBe('/_img/banners/hero.jpg');
    expect((blocks[0].props as any).label).toBe('Services');
    expect((blocks[0].props as any).title).toBe('What We Do');
  });

  it('SectionBanner without image (via separator heading pattern)', async () => {
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'SectionBanner',
        props: { image: '', label: 'Overview', title: 'The Project', size: 'section', headingLevel: 'h2', align: 'left' },
      },
    ]);
    expect(blocks[0].type).toBe('SectionBanner');
    expect((blocks[0].props as any).label).toBe('Overview');
    expect((blocks[0].props as any).title).toBe('The Project');
  });

});

// ---------------------------------------------------------------------------
// GROUP B: Documented lossy round-trips — type CHANGES are expected
// ---------------------------------------------------------------------------

describe('GROUP B — documented lossy round-trips (article markdown path)', () => {

  it('section-label → rich-text (blockquote becomes rich-text on re-import)', async () => {
    // section-label encodes as `> **TEXT**` (blockquote).
    // The article importer maps all blockquotes to rich-text.
    const blocks = await roundtrip([
      { id: ID, type: 'section-label', props: { text: 'OUR APPROACH' } },
    ]);
    expect(blocks[0].type).toBe('rich-text');
    // Text content should be preserved (inside <p>)
    expect((blocks[0].props as any).html).toContain('OUR APPROACH');
  });

  it('diff-block → rich-text (blockquote becomes rich-text on re-import)', async () => {
    // diff-block encodes as `> **label**\n>\n> text` (blockquote).
    const blocks = await roundtrip([
      { id: ID, type: 'diff-block', props: { label: 'Key Point', text: 'Detail here.' } },
    ]);
    expect(blocks[0].type).toBe('rich-text');
    expect((blocks[0].props as any).html).toContain('Key Point');
  });

  it('sidebar-block → rich-text (blockquote becomes rich-text on re-import)', async () => {
    // sidebar-block encodes as `> **label**\n>\n> content` (blockquote).
    const blocks = await roundtrip([
      { id: ID, type: 'sidebar-block', props: { label: 'Info', content: 'Side note.' } },
    ]);
    expect(blocks[0].type).toBe('rich-text');
  });

  it('rich-text → body-lead (HTML stripped, treated as first paragraph)', async () => {
    // rich-text strips HTML; the resulting plain text becomes a paragraph.
    // As the first paragraph, it decodes as body-lead.
    const blocks = await roundtrip([
      { id: ID, type: 'rich-text', props: { html: '<p>Rich content here.</p>' } },
    ]);
    expect(blocks[0].type).toBe('body-lead');
    expect((blocks[0].props as any).text).toBe('Rich content here.');
  });

  it('cta-section → multiple blocks (heading + body-lead/text + body-text)', async () => {
    // cta-section encodes as: `## heading\n\nsubtext\n\n[button](href)`
    // This re-parses as: heading h2 (no separator) + body-lead + body-text
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'cta-section',
        props: { heading: 'Get Started', subtext: 'Free consultation.', buttonLabel: 'Contact Us', buttonHref: '/contact/' },
      },
    ]);
    // Should produce more than one block (heading + body-lead + body-text or similar)
    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks[0].type).toBe('heading');
    expect((blocks[0].props as any).text).toBe('Get Started');
  });

  it('deliverable-grid → multiple heading+body-text blocks', async () => {
    // deliverable-grid encodes as h3+desc pairs; re-parses as separate heading+body-text blocks.
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'deliverable-grid',
        props: { items: [{ title: 'Stills', desc: 'Renders.' }, { title: 'Animation', desc: 'Video.' }], columns: 2 },
      },
    ]);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    // First decoded block is a heading
    expect(blocks[0].type).toBe('heading');
  });

  it('notable-grid → results-list (bold items lose name/year structure)', async () => {
    // notable-grid encodes as `- **Name** (Year)` bullet list.
    // Re-parses as results-list (items are plain text strings).
    const blocks = await roundtrip([
      {
        id: ID,
        type: 'notable-grid',
        props: { items: [{ name: 'Airport', year: '2022' }] },
      },
    ]);
    expect(blocks[0].type).toBe('results-list');
    // Text content is preserved but flattened
    const items = (blocks[0].props as any).items as string[];
    expect(items[0]).toContain('Airport');
  });

});

// ---------------------------------------------------------------------------
// Edge-case: heading h2 with separator text → SectionBanner
// ---------------------------------------------------------------------------

describe('EDGE CASE — heading h2 with separator chars', () => {

  it('heading h2 containing ":" decodes as SectionBanner (known ambiguity)', async () => {
    // A heading like `## Label: Title` is valid heading text but the
    // article importer's separator heuristic converts it to SectionBanner.
    // This is a known design trade-off: headings with colons in article
    // bodies should be avoided, or authors should use h3 instead.
    const blocks = await roundtrip([
      { id: ID, type: 'heading', props: { text: 'Services: What We Do', level: 'h2' } },
    ]);
    // Documents expected (not ideal) behavior — decoded as SectionBanner, not heading
    expect(blocks[0].type).toBe('SectionBanner');
  });

});
