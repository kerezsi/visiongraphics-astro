/**
 * Project / service YAML round-trip tests.
 *
 * For project and service page types, blocks are stored as structured YAML in
 * the frontmatter — NOT serialised to markdown text. This path should be
 * completely lossless: all block fields survive a documentToMarkdown → gray-matter
 * parse cycle exactly (minus the runtime `id` field which is stripped on save).
 */

import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { documentToMarkdown } from '../server/lib/codegen/md-codegen.js';
import type { BlockData, DocumentState } from '../server/types/blocks.js';

// ---------------------------------------------------------------------------
// Helper: strip `id` and unwrap `props` to flat format (mirrors stripIds in md-codegen)
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

// Helper: build a project DocumentState
function projectDoc(blocks: BlockData[]): DocumentState {
  return {
    pageType: 'project',
    slug: 'test-project',
    filePath: 'src/content/projects/test-project.md',
    meta: {
      title: 'Test Project',
      year: 2024,
      categories: ['commercial'],
      coverImage: '/_img/portfolio/test/cover.jpg',
      published: true,
      featured: false,
    },
    blocks,
  };
}

const ID = 'runtime-id';

// All 26 block types with realistic props
const allBlocks: BlockData[] = [
  // Layout
  { id: ID, type: 'SectionBanner', props: { image: '/_img/banners/hero.jpg', label: 'Overview', title: 'The Project', size: 'section', headingLevel: 'h2', align: 'left' } },
  { id: ID, type: 'section-container', props: { children: [
    { id: ID, type: 'body-text', props: { text: 'Nested body text.' } },
  ] } },
  { id: ID, type: 'two-col', props: {
    left:  [{ id: ID, type: 'heading', props: { text: 'Left Col', level: 'h3' } }],
    right: [{ id: ID, type: 'body-text', props: { text: 'Right col content.' } }],
  } },
  { id: ID, type: 'service-body-grid', props: {
    main:    [{ id: ID, type: 'body-lead', props: { text: 'Main content area.' } }],
    sidebar: [{ id: ID, type: 'sidebar-block', props: { label: 'Quick Info', content: 'Side note.' } }],
  } },
  // Typography
  { id: ID, type: 'heading',       props: { text: 'Section Heading', level: 'h2' } },
  { id: ID, type: 'body-lead',     props: { text: 'Lead paragraph.' } },
  { id: ID, type: 'body-text',     props: { text: 'Regular body text.' } },
  { id: ID, type: 'section-label', props: { text: 'OUR APPROACH' } },
  { id: ID, type: 'rich-text',     props: { html: '<p>Some <strong>rich</strong> HTML.</p>' } },
  { id: ID, type: 'diff-block',    props: { label: 'Differentiator', text: 'What sets us apart.' } },
  // Lists
  { id: ID, type: 'results-list',    props: { items: ['Result A', 'Result B', 'Result C'] } },
  { id: ID, type: 'deliverable-grid', props: { items: [{ title: 'Stills', desc: '4K renders.' }, { title: 'Animation', desc: 'HD video.' }], columns: 2 } },
  { id: ID, type: 'timeline-table',  props: { rows: [{ scope: 'Week 1', deliverables: 'Concept' }, { scope: 'Week 2', deliverables: 'Final' }] } },
  { id: ID, type: 'notable-grid',    props: { items: [{ name: 'Airport T2', year: '2022' }, { name: 'Mol Campus', year: '2021' }] } },
  // Media
  { id: ID, type: 'single-image',  props: { src: '/_img/portfolio/test/image.jpg', alt: 'Project render', caption: 'Main view' } },
  { id: ID, type: 'image-gallery', props: { images: [{ src: '/_img/a.jpg', alt: 'Img A' }, { src: '/_img/b.jpg', alt: 'Img B' }], title: 'Gallery' } },
  { id: ID, type: 'image-compare', props: { before: { src: '/_img/before.jpg', alt: 'Before', label: 'Before' }, after: { src: '/_img/after.jpg', alt: 'After', label: 'After' }, initialPosition: 50, aspectRatio: '16 / 9' } },
  { id: ID, type: 'film-embed',    props: { vimeoId: '987654321', title: 'Walkthrough' } },
  { id: ID, type: 'tour-360',      props: { url: 'https://example.com/tour.html', title: '360° Lobby', coverImage: '/_img/cover.jpg' } },
  { id: ID, type: 'youtube-embed', props: { url: 'https://youtube.com/watch?v=xyz', title: 'Behind the scenes' } },
  // CTA
  { id: ID, type: 'button-group', props: { buttons: [{ label: 'Contact', href: '/contact/', variant: 'btn-primary' }] } },
  { id: ID, type: 'sidebar-block', props: { label: 'Services Used', content: 'Arch viz, animation.' } },
  { id: ID, type: 'cta-section',   props: { heading: 'Start a Project', subtext: 'Free call.', buttonLabel: 'Contact Us', buttonHref: '/contact/' } },
];

describe('project YAML round-trip (all 26 block types)', () => {
  it('round-trips all block types losslessly through gray-matter', () => {
    const doc = projectDoc(allBlocks);
    const markdown = documentToMarkdown(doc);

    // Parse back with gray-matter
    const parsed = matter(markdown);
    const savedBlocks = parsed.data.blocks as any[];

    // Expected: same blocks but with ids stripped
    const expected = allBlocks.map(stripIds);

    expect(savedBlocks).toEqual(expected);
  });

  it('strips runtime id fields from all blocks (including nested)', () => {
    const doc = projectDoc(allBlocks);
    const markdown = documentToMarkdown(doc);
    const parsed = matter(markdown);
    const savedBlocks = parsed.data.blocks as any[];

    // Recursively check no block has an `id` field (flat disk format — no props wrapper)
    function hasId(block: any): boolean {
      if ('id' in block) return true;
      const slots = ['children', 'main', 'sidebar', 'left', 'right'];
      for (const slot of slots) {
        if (Array.isArray(block[slot]) && block[slot].some(hasId)) return true;
      }
      return false;
    }

    expect(savedBlocks.some(hasId)).toBe(false);
  });

  it('preserves meta fields in frontmatter', () => {
    const doc = projectDoc([]);
    const markdown = documentToMarkdown(doc);
    const parsed = matter(markdown);

    expect(parsed.data.title).toBe('Test Project');
    expect(parsed.data.year).toBe(2024);
    expect(parsed.data.published).toBe(true);
  });
});

describe('service YAML round-trip', () => {
  it('works the same as project (uses same code path)', () => {
    const doc: DocumentState = {
      pageType: 'service',
      slug: 'test-service',
      filePath: 'src/content/services/test-service.md',
      meta: { title: 'Test Service', order: 1, published: true },
      blocks: [
        { id: ID, type: 'heading', props: { text: 'Service Overview', level: 'h2' } },
        { id: ID, type: 'body-lead', props: { text: 'Service intro text.' } },
        { id: ID, type: 'deliverable-grid', props: { items: [{ title: 'Item 1', desc: 'Desc 1.' }], columns: 2 } },
      ],
    };

    const markdown = documentToMarkdown(doc);
    const parsed = matter(markdown);
    const savedBlocks = parsed.data.blocks as any[];

    const expected = doc.blocks.map(stripIds);
    expect(savedBlocks).toEqual(expected);
  });
});

describe('empty blocks array', () => {
  it('project with no blocks: frontmatter has no blocks key', () => {
    const doc = projectDoc([]);
    const markdown = documentToMarkdown(doc);
    const parsed = matter(markdown);
    // When blocks is empty, the key should not be present (or be undefined)
    expect(parsed.data.blocks).toBeUndefined();
  });
});
