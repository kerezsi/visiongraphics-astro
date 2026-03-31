/**
 * Codegen tests — verifies documentToMarkdown() serializes every block type
 * to the expected markdown/YAML string.
 *
 * All tests use pageType: 'article' so blocks go through the markdown-body
 * path (blockToMd). Container blocks (section-container, two-col,
 * service-body-grid) are tested with a child inside to verify flattening.
 */

import { describe, it, expect } from 'vitest';
import { documentToMarkdown } from '../server/lib/codegen/md-codegen.js';
import type { BlockData, DocumentState } from '../server/types/blocks.js';

// Helper: build a minimal article DocumentState with one (or more) blocks
function doc(...blocks: BlockData[]): DocumentState {
  return {
    pageType: 'article',
    slug: 'test',
    filePath: 'src/content/articles/test.md',
    meta: { title: 'Test', date: '2025-01-01', published: true },
    blocks,
  };
}

// Helper: extract the markdown body (everything after the closing ---)
function body(md: string): string {
  const parts = md.split(/^---\s*$/m);
  // parts[0] = '', parts[1] = yaml, parts[2] = body
  return (parts[2] ?? '').trim();
}

// Reusable test block IDs (runtime only — stripped on save)
const ID = 'test-id';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

describe('heading', () => {
  it('h2', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'heading', props: { text: 'My Heading', level: 'h2' } })));
    expect(md).toBe('## My Heading');
  });

  it('h3', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'heading', props: { text: 'Sub Heading', level: 'h3' } })));
    expect(md).toBe('### Sub Heading');
  });
});

describe('body-lead', () => {
  it('outputs plain text', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'body-lead', props: { text: 'Lead text here.' } })));
    expect(md).toBe('Lead text here.');
  });
});

describe('body-text', () => {
  it('outputs plain text', () => {
    const md = body(documentToMarkdown(doc(
      { id: ID, type: 'body-lead', props: { text: 'First para.' } },
      { id: ID, type: 'body-text', props: { text: 'Body paragraph.' } },
    )));
    expect(md).toContain('Body paragraph.');
  });
});

describe('section-label', () => {
  it('encodes as blockquote bold', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'section-label', props: { text: 'SECTION LABEL' } })));
    expect(md).toBe('> **SECTION LABEL**');
  });
});

describe('rich-text', () => {
  it('strips HTML tags', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'rich-text', props: { html: '<p>Rich <strong>content</strong></p>' } })));
    expect(md).toBe('Rich content');
  });
});

describe('diff-block', () => {
  it('encodes as blockquote with label and text', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'diff-block', props: { label: 'Key Point', text: 'Detail here.' } })));
    expect(md).toBe('> **Key Point**\n>\n> Detail here.');
  });
});

// ---------------------------------------------------------------------------
// List blocks
// ---------------------------------------------------------------------------

describe('results-list', () => {
  it('outputs bullet list', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'results-list', props: { items: ['Alpha', 'Beta', 'Gamma'] } })));
    expect(md).toBe('- Alpha\n- Beta\n- Gamma');
  });

  it('handles empty items array (returns empty string)', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'results-list', props: { items: [] } })));
    expect(md).toBe('');
  });
});

describe('deliverable-grid', () => {
  it('outputs h3 + desc pairs', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'deliverable-grid',
      props: {
        items: [
          { title: 'Wireframes', desc: 'Lo-fi sketches.' },
          { title: 'Renders', desc: 'High-quality stills.' },
        ],
        columns: 2,
      },
    })));
    expect(md).toContain('### Wireframes\n\nLo-fi sketches.');
    expect(md).toContain('### Renders\n\nHigh-quality stills.');
  });
});

describe('timeline-table', () => {
  it('outputs markdown table', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'timeline-table',
      props: {
        rows: [
          { scope: 'Phase 1', deliverables: '2 weeks' },
          { scope: 'Phase 2', deliverables: '3 weeks' },
        ],
      },
    })));
    expect(md).toContain('| Scope | Deliverables |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| Phase 1 | 2 weeks |');
    expect(md).toContain('| Phase 2 | 3 weeks |');
  });

  it('returns empty body for empty rows', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'timeline-table', props: { rows: [] } })));
    expect(md).toBe('');
  });
});

describe('notable-grid', () => {
  it('outputs bold bullet list', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'notable-grid',
      props: { items: [{ name: 'Airport Terminal', year: '2022' }, { name: 'Mol Campus', year: '2021' }] },
    })));
    expect(md).toBe('- **Airport Terminal** (2022)\n- **Mol Campus** (2021)');
  });
});

// ---------------------------------------------------------------------------
// Media blocks
// ---------------------------------------------------------------------------

describe('single-image', () => {
  it('outputs markdown image', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'single-image', props: { src: '/img/photo.jpg', alt: 'A photo' } })));
    expect(md).toBe('![A photo](/img/photo.jpg)');
  });
});

describe('image-gallery', () => {
  it('outputs stacked images', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'image-gallery',
      props: {
        images: [
          { src: '/img/a.jpg', alt: 'Image A' },
          { src: '/img/b.jpg', alt: 'Image B' },
        ],
      },
    })));
    expect(md).toBe('![Image A](/img/a.jpg)\n![Image B](/img/b.jpg)');
  });

  it('returns empty body for empty images array', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'image-gallery', props: { images: [] } })));
    expect(md).toBe('');
  });
});

describe('image-compare', () => {
  it('outputs Before:/After: pattern', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'image-compare',
      props: {
        before: { src: '/img/before.jpg', alt: 'Exterior old', label: 'Before' },
        after:  { src: '/img/after.jpg',  alt: 'Exterior new', label: 'After'  },
      },
    })));
    expect(md).toBe('![Before: Exterior old](/img/before.jpg)\n![After: Exterior new](/img/after.jpg)');
  });
});

describe('film-embed', () => {
  it('outputs vimeo URL', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'film-embed', props: { vimeoId: '123456789', title: 'My Film' } })));
    expect(md).toBe('https://vimeo.com/123456789');
  });
});

describe('youtube-embed', () => {
  it('outputs YouTube URL', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'youtube-embed', props: { url: 'https://youtube.com/watch?v=abc123' } })));
    expect(md).toBe('https://youtube.com/watch?v=abc123');
  });
});

describe('tour-360', () => {
  it('outputs a link when url is set', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'tour-360', props: { url: 'https://example.com/tour.html', title: 'Lobby Tour' } })));
    expect(md).toBe('[360 Tour: Lobby Tour](https://example.com/tour.html)');
  });

  it('returns empty body when url is empty', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'tour-360', props: { url: '', title: 'Tour' } })));
    expect(md).toBe('');
  });
});

// ---------------------------------------------------------------------------
// CTA blocks
// ---------------------------------------------------------------------------

describe('button-group', () => {
  it('outputs links joined with hard line break', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'button-group',
      props: {
        buttons: [
          { label: 'Primary', href: '/contact/', variant: 'btn-primary' },
          { label: 'Secondary', href: '/portfolio/', variant: 'btn-secondary' },
        ],
      },
    })));
    expect(md).toBe('[Primary](/contact/)  \n[Secondary](/portfolio/)');
  });
});

describe('cta-section', () => {
  it('outputs heading, subtext, and button link', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'cta-section',
      props: { heading: 'Get Started', subtext: 'Free consultation.', buttonLabel: 'Contact Us', buttonHref: '/contact/' },
    })));
    expect(md).toBe('## Get Started\n\nFree consultation.\n\n[Contact Us](/contact/)');
  });
});

describe('sidebar-block', () => {
  it('encodes as blockquote with label and content', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'sidebar-block', props: { label: 'Note', content: 'This is important.' } })));
    expect(md).toBe('> **Note**\n>\n> This is important.');
  });
});

// ---------------------------------------------------------------------------
// SectionBanner
// ---------------------------------------------------------------------------

describe('SectionBanner', () => {
  it('with image: outputs image + heading', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'SectionBanner',
      props: { image: '/_img/banners/hero.jpg', label: 'Services', title: 'What We Do', size: 'section', headingLevel: 'h2', align: 'left' },
    })));
    expect(md).toBe('![section-banner](/_img/banners/hero.jpg)\n\n## Services: What We Do');
  });

  it('without image: outputs heading only', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'SectionBanner',
      props: { image: '', label: 'Services', title: 'What We Do', size: 'section', headingLevel: 'h2', align: 'left' },
    })));
    expect(md).toBe('## Services: What We Do');
  });

  it('without label: omits label from heading', () => {
    const md = body(documentToMarkdown(doc({
      id: ID,
      type: 'SectionBanner',
      props: { image: '', label: '', title: 'Plain Title', size: 'section', headingLevel: 'h2', align: 'left' },
    })));
    expect(md).toBe('## Plain Title');
  });
});

// ---------------------------------------------------------------------------
// Layout / container blocks
// ---------------------------------------------------------------------------

describe('section-container', () => {
  it('flattens children into body', () => {
    const child: BlockData = { id: ID, type: 'body-text', props: { text: 'Inner text.' } };
    const md = body(documentToMarkdown(doc({ id: ID, type: 'section-container', props: { children: [child] } })));
    expect(md).toBe('Inner text.');
  });

  it('returns empty body when no children', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'section-container', props: { children: [] } })));
    expect(md).toBe('');
  });
});

describe('two-col', () => {
  it('flattens left and right columns', () => {
    const left: BlockData = { id: ID, type: 'body-text', props: { text: 'Left content.' } };
    const right: BlockData = { id: ID, type: 'body-text', props: { text: 'Right content.' } };
    const md = body(documentToMarkdown(doc({ id: ID, type: 'two-col', props: { left: [left], right: [right] } })));
    expect(md).toContain('Left content.');
    expect(md).toContain('Right content.');
  });

  it('returns empty body when both slots empty', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'two-col', props: { left: [], right: [] } })));
    expect(md).toBe('');
  });
});

describe('service-body-grid', () => {
  it('flattens main and sidebar', () => {
    const main: BlockData = { id: ID, type: 'body-text', props: { text: 'Main content.' } };
    const sidebar: BlockData = { id: ID, type: 'sidebar-block', props: { label: 'Info', content: 'Side info.' } };
    const md = body(documentToMarkdown(doc({ id: ID, type: 'service-body-grid', props: { main: [main], sidebar: [sidebar] } })));
    expect(md).toContain('Main content.');
    expect(md).toContain('> **Info**');
  });

  it('returns empty body when both slots empty', () => {
    const md = body(documentToMarkdown(doc({ id: ID, type: 'service-body-grid', props: { main: [], sidebar: [] } })));
    expect(md).toBe('');
  });
});
