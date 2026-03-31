import { randomUUID } from 'crypto';
import type { BlockData } from '../../types/blocks.js';

// Recursively extract plain text from any MDAST node
function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  if (node.type === 'strong' || node.type === 'emphasis' || node.type === 'delete') {
    return (node.children ?? []).map(extractText).join('');
  }
  if (node.value !== undefined) return String(node.value);
  if (Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}

// Find the first image node within a paragraph's children
function findImageNode(node: any): any | null {
  if (!Array.isArray(node.children)) return null;
  for (const child of node.children) {
    if (child.type === 'image') return child;
  }
  return null;
}

// Find all image nodes within a paragraph's children
function findAllImageNodes(node: any): any[] {
  if (!Array.isArray(node.children)) return [];
  return node.children.filter((child: any) => child.type === 'image');
}

// Detect before/after image compare pattern:
// Two images where alts start with "Before" and "After" (case-insensitive)
function asImageCompare(node: any): { before: any; after: any } | null {
  const imgs = findAllImageNodes(node);
  if (imgs.length !== 2) return null;
  const [a, b] = imgs;
  const altA = (a.alt ?? '').trim().toLowerCase();
  const altB = (b.alt ?? '').trim().toLowerCase();
  if (altA.startsWith('before') && altB.startsWith('after')) {
    return { before: a, after: b };
  }
  if (altA.startsWith('after') && altB.startsWith('before')) {
    return { before: b, after: a };
  }
  return null;
}

// Extract all URLs from a paragraph's text content
function extractUrls(node: any): string[] {
  const urls: string[] = [];
  function walk(n: any) {
    if (n.type === 'link' && n.url) urls.push(n.url);
    if (n.type === 'text' && n.value) {
      const urlRegex = /https?:\/\/[^\s)>\]"]+/g;
      let m: RegExpExecArray | null;
      while ((m = urlRegex.exec(n.value)) !== null) {
        urls.push(m[0]);
      }
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
  }
  walk(node);
  return urls;
}

const VIMEO_REGEX = /vimeo\.com\/(\d+)/;
const YOUTUBE_REGEX = /(youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/;
const TOUR_REGEX = /https?:\/\/[^\s]+?(\.html|pano2vr)[^\s]*/i;

export function mapAstToBlocks(ast: any, pageType: string): BlockData[] {
  const blocks: BlockData[] = [];
  const children: any[] = ast.children ?? [];
  let firstParagraphSeen = false;
  let i = 0;

  while (i < children.length) {
  const node = children[i];
    if (node.type === 'heading') {
      const text = extractText(node);

      if (node.depth === 1) {
        // Skip h1 — becomes page title / meta
        i++; continue;
      }

      if (node.depth === 2) {
        // Check for label/title separator pattern " — " or ": "
        const separatorMatch = text.match(/^(.+?)\s*[—–:]\s*(.+)$/);
        if (separatorMatch) {
          blocks.push({
            id: randomUUID(),
            type: 'SectionBanner',
            props: {
              image: '',
              label: separatorMatch[1].trim(),
              title: separatorMatch[2].trim(),
              size: 'section',
              headingLevel: 'h2',
            },
          });
        } else {
          blocks.push({
            id: randomUUID(),
            type: 'heading',
            props: { text, level: 'h2', className: 'display-md' },
          });
        }
        i++; continue;
      }

      if (node.depth === 3) {
        blocks.push({
          id: randomUUID(),
          type: 'heading',
          props: { text, level: 'h3' },
        });
        i++; continue;
      }

      // h4+ treated as body-text
      blocks.push({
        id: randomUUID(),
        type: 'body-text',
        props: { text },
      });
      i++; continue;
    }

    if (node.type === 'paragraph') {
      // Check for section-banner image (single img with alt "section-banner")
      // immediately followed by an h2 heading → SectionBanner block
      const singleImgs = findAllImageNodes(node);
      if (
        singleImgs.length === 1 &&
        (singleImgs[0].alt ?? '').trim().toLowerCase() === 'section-banner'
      ) {
        const nextNode = children[i + 1];
        if (nextNode?.type === 'heading' && (nextNode as any).depth === 2) {
          const headingText = extractText(nextNode);
          const sep = headingText.match(/^(.+?)\s*[—–:]\s*(.+)$/);
          blocks.push({
            id: randomUUID(),
            type: 'SectionBanner',
            props: {
              image: singleImgs[0].url ?? '',
              label: sep ? sep[1].trim() : '',
              title: sep ? sep[2].trim() : headingText,
              size: 'section',
              headingLevel: 'h2',
              align: 'left',
            },
          });
          i += 2; continue; // skip image paragraph + heading
        }
      }

      // Check for before/after image compare (two images with Before:/After: alt prefix)
      const compare = asImageCompare(node);
      if (compare) {
        const beforeAlt = (compare.before.alt ?? '').replace(/^before\s*:\s*/i, '').trim();
        const afterAlt  = (compare.after.alt  ?? '').replace(/^after\s*:\s*/i,  '').trim();
        blocks.push({
          id: randomUUID(),
          type: 'image-compare',
          props: {
            before: { src: compare.before.url ?? '', alt: beforeAlt, label: 'Before' },
            after:  { src: compare.after.url  ?? '', alt: afterAlt,  label: 'After'  },
            initialPosition: 50,
            aspectRatio: '16 / 9',
          },
        });
        i++; continue;
      }

      // Check for image gallery (2+ images that aren't before/after)
      const allImgs = findAllImageNodes(node);
      if (allImgs.length >= 2) {
        blocks.push({
          id: randomUUID(),
          type: 'image-gallery',
          props: {
            images: allImgs.map((img: any) => ({ src: img.url ?? '', alt: img.alt ?? '' })),
          },
        });
        i++; continue;
      }

      // Check for single image
      const imgNode = findImageNode(node);
      if (imgNode) {
        blocks.push({
          id: randomUUID(),
          type: 'single-image',
          props: { src: imgNode.url ?? '', alt: imgNode.alt ?? '' },
        });
        i++; continue;
      }

      // Check URLs in paragraph
      const urls = extractUrls(node);
      let matched = false;

      for (const url of urls) {
        const vimeoMatch = url.match(VIMEO_REGEX);
        if (vimeoMatch) {
          blocks.push({
            id: randomUUID(),
            type: 'film-embed',
            props: { vimeoId: vimeoMatch[1], title: '' },
          });
          matched = true;
          break;
        }

        const ytMatch = url.match(YOUTUBE_REGEX);
        if (ytMatch) {
          blocks.push({
            id: randomUUID(),
            type: 'youtube-embed',
            props: { url, title: '' },
          });
          matched = true;
          break;
        }

        const tourMatch = url.match(TOUR_REGEX);
        if (tourMatch) {
          blocks.push({
            id: randomUUID(),
            type: 'tour-360',
            props: { url, title: '' },
          });
          matched = true;
          break;
        }
      }

      if (matched) { i++; continue; }

      const text = extractText(node);

      if (!firstParagraphSeen) {
        firstParagraphSeen = true;
        blocks.push({
          id: randomUUID(),
          type: 'body-lead',
          props: { text },
        });
        i++; continue;
      }

      blocks.push({
        id: randomUUID(),
        type: 'body-text',
        props: { text },
      });
      i++; continue;
    }

    if (node.type === 'list' && !node.ordered) {
      const items = (node.children ?? []).map((item: any) => extractText(item));
      blocks.push({
        id: randomUUID(),
        type: 'results-list',
        props: { items },
      });
      i++; continue;
    }

    if (node.type === 'table') {
      const rows = (node.children ?? []).slice(1).map((row: any) => {
        const cells = (row.children ?? []).map((cell: any) => extractText(cell));
        return {
          scope: cells[0] ?? '',
          deliverables: cells.slice(1).join(' | '),
        };
      });
      blocks.push({
        id: randomUUID(),
        type: 'timeline-table',
        props: { rows },
      });
      i++; continue;
    }

    if (node.type === 'blockquote') {
      const text = extractText(node);
      blocks.push({
        id: randomUUID(),
        type: 'rich-text',
        props: { html: `<p>${text}</p>` },
      });
      i++; continue;
    }

    if (node.type === 'code') {
      blocks.push({
        id: randomUUID(),
        type: 'rich-text',
        props: { html: `<pre><code>${node.value ?? ''}</code></pre>` },
      });
      i++; continue;
    }

    i++; // unhandled node type — advance
  }

  return blocks;
}
