import type { BlockRegistryEntry, BlockType } from '../types/blocks.ts';

export const blockRegistry = new Map<BlockType, BlockRegistryEntry>([
  // ── MDX Component Blocks ─────────────────────────────────────────

  ['SectionBanner', {
    type: 'SectionBanner',
    label: 'Section Banner',
    group: 'mdx-component',
    icon: '🖼',
    allowedIn: 'all',
    canNest: false,
    defaultProps: {
      image: '/_img/banners/banner-general.jpg',
      label: 'Label',
      title: 'Section Title',
    },
    description: '<SectionBanner> — full-width banner with image, label, heading',
  }],

  ['single-image', {
    type: 'single-image',
    label: 'Single Image',
    group: 'mdx-component',
    icon: '□',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { src: '', alt: '', caption: '' },
    description: '<SingleImage> — one image with click-to-fullscreen',
  }],

  ['image-gallery', {
    type: 'image-gallery',
    label: 'Image Gallery',
    group: 'mdx-component',
    icon: '🖼🖼',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { images: [] },
    description: '<ImageGallery> — lightbox grid of images',
  }],

  ['image-compare', {
    type: 'image-compare',
    label: 'Image Compare',
    group: 'mdx-component',
    icon: '◧',
    allowedIn: 'all',
    canNest: false,
    defaultProps: {
      before: '',
      after: '',
      beforeAlt: '',
      afterAlt: '',
      label: '',
    },
    description: '<ImageCompare> — before/after slider',
  }],

  ['deliverable-grid', {
    type: 'deliverable-grid',
    label: 'Deliverable Grid',
    group: 'mdx-component',
    icon: '⊞',
    allowedIn: ['service', 'project'],
    canNest: false,
    defaultProps: {
      columns: 3,
      items: [
        { title: 'Deliverable 1', desc: 'Description of this deliverable.' },
        { title: 'Deliverable 2', desc: 'Description of this deliverable.' },
        { title: 'Deliverable 3', desc: 'Description of this deliverable.' },
      ],
    },
    description: '<DeliverableGrid> — card grid with title + description',
  }],

  ['timeline-table', {
    type: 'timeline-table',
    label: 'Timeline Table',
    group: 'mdx-component',
    icon: '⏱',
    allowedIn: ['service', 'project'],
    canNest: false,
    defaultProps: {
      rows: [
        { scope: 'Phase 1 (2–4 weeks)', deliverables: 'Deliverable A · Deliverable B' },
        { scope: 'Phase 2 (3–5 weeks)', deliverables: 'Deliverable C · Deliverable D' },
      ],
    },
    description: '<TimelineTable> — two-column phase / deliverables table',
  }],

  ['notable-grid', {
    type: 'notable-grid',
    label: 'Notable Grid',
    group: 'mdx-component',
    icon: '★',
    allowedIn: ['service', 'project'],
    canNest: false,
    defaultProps: {
      items: [
        { name: 'Project Name', year: '2024' },
        { name: 'Another Project', year: '2023' },
      ],
    },
    description: '<NotableGrid> — name + year pairs',
  }],

  ['tour-360', {
    type: 'tour-360',
    label: '360° Tour',
    group: 'mdx-component',
    icon: '○',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { url: '', title: '360° Tour' },
    description: '<Tour360> — Pano2VR 360° tour (click-to-load)',
  }],

  ['youtube-embed', {
    type: 'youtube-embed',
    label: 'YouTube Embed',
    group: 'mdx-component',
    icon: '▷',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { url: '', title: '' },
    description: '<YoutubeEmbed> — YouTube video (facade)',
  }],

  ['film-embed', {
    type: 'film-embed',
    label: 'Vimeo Film',
    group: 'mdx-component',
    icon: '▶',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { vimeoId: '', title: '' },
    description: '<FilmEmbed> — Vimeo film (facade)',
  }],

  // ── Prose Blocks ─────────────────────────────────────────────────

  ['heading', {
    type: 'heading',
    label: 'Heading',
    group: 'prose',
    icon: 'H',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { text: 'Heading Text', level: 'h2' },
    description: 'Markdown ## or ###',
  }],

  ['body-lead', {
    type: 'body-lead',
    label: 'Lead Paragraph',
    group: 'prose',
    icon: '¶',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { text: 'Lead paragraph — larger introductory copy.' },
    description: 'First/introductory paragraph',
  }],

  ['body-text', {
    type: 'body-text',
    label: 'Body Text',
    group: 'prose',
    icon: '≡',
    allowedIn: 'all',
    canNest: false,
    defaultProps: { text: 'Body text paragraph.' },
    description: 'Standard body paragraph',
  }],

  ['results-list', {
    type: 'results-list',
    label: 'Bullet List',
    group: 'prose',
    icon: '•',
    allowedIn: 'all',
    canNest: false,
    defaultProps: {
      items: ['First item', 'Second item', 'Third item'],
    },
    description: 'Markdown unordered list',
  }],

  ['rich-text', {
    type: 'rich-text',
    label: 'Raw HTML',
    group: 'prose',
    icon: '</>',
    allowedIn: ['vision-tech', 'article', 'service'],
    canNest: false,
    defaultProps: { html: '<p>HTML content</p>' },
    description: 'Raw HTML block (used in vision-tech pages)',
  }],
]);

export const blocksByGroup = (): Record<string, BlockRegistryEntry[]> => {
  const groups: Record<string, BlockRegistryEntry[]> = {};
  for (const entry of blockRegistry.values()) {
    if (!groups[entry.group]) groups[entry.group] = [];
    groups[entry.group].push(entry);
  }
  return groups;
};
