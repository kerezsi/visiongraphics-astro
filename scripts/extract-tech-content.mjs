// scripts/extract-tech-content.mjs
// Extracts rich HTML body content from vision_tech.xml and writes it
// into the `blocks` frontmatter field of each vision-tech MD content file.
// Run: node scripts/extract-tech-content.mjs

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const xmlPath    = join(__dirname, '../../old_dev_site/vision_tech.xml');
const techDir    = join(__dirname, '../src/content/vision-tech');

const xmlContent = readFileSync(xmlPath, 'utf8');
const items = xmlContent.split('<item>').slice(1);

/**
 * Strip style/script blocks, linked images, standalone images, fix internal links,
 * remove data-* attributes, remove center-aligned paragraphs, remove empty tags,
 * clean whitespace.
 * Does NOT strip iframes — those are handled by splitOnIframes().
 * Also strips any stray </iframe> closing tags left after splitting.
 */
function cleanHtmlSegment(raw) {
  let html = raw;

  // 0. Strip stray </iframe> closing tags (left after splitting on iframes)
  html = html.replace(/<\/iframe>/gi, '');

  // 1. Strip <style> blocks
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');

  // 2. Strip <script> blocks
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 3. Strip linked images: <a href="..."><img ...></a>
  html = html.replace(/<a[^>]*>\s*<img[\s\S]*?<\/a>/gi, '');

  // 4. Strip standalone <img> tags
  html = html.replace(/<img\s[^>]*\/?>/gi, '');

  // 5. Fix internal links
  html = html.replace(/https?:\/\/dev\.visiongraphics\.eu\/vision-tech\//g, '/vision-tech/');
  html = html.replace(/https?:\/\/dev\.visiongraphics\.eu\//g, '/');

  // 6. Remove data-* attributes
  html = html.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');

  // 7. Remove center-aligned paragraphs (Elementor image captions)
  html = html.replace(/<p[^>]*text-align:\s*center[^>]*>[\s\S]*?<\/p>/gi, '');

  // 8. Remove itemprop / rel="prettyPhoto" / style="" attributes
  html = html.replace(/\s+itemprop="[^"]*"/gi, '');
  html = html.replace(/\s+rel="prettyPhoto[^"]*"/gi, '');

  // 9. Strip [shortcode] remnants
  html = html.replace(/\[[^\]]+\]/g, '');

  // 10. Strip empty tags
  html = html.replace(/<(p|div|span)[^>]*>\s*<\/(p|div|span)>/gi, '');

  // 11. Strip div/section/article wrappers but keep their content
  html = html.replace(/<\/?(?:div|section|article|aside|header|footer|main|span|figure|figcaption|blockquote)[^>]*>/gi, '\n');

  // 12. Collapse whitespace
  html = html.replace(/\t/g, ' ');
  html = html.replace(/  +/g, ' ');
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.trim();

  return html;
}

/**
 * Extract the src attribute from an iframe tag string.
 */
function extractIframeSrc(iframeTag) {
  const m = iframeTag.match(/src=["']([^"']+)["']/i)
    || iframeTag.match(/src=([^\s>]+)/i);
  return m ? m[1] : '';
}

/**
 * Check if a paragraph tag string is a center-aligned caption.
 * e.g. <p style="text-align: center;">caption</p>
 */
function extractCenterCaption(str) {
  const m = str.match(/<p[^>]*text-align:\s*center[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return null;
  // Strip inner HTML tags
  return m[1].replace(/<[^>]+>/g, '').trim();
}

/**
 * Parse raw HTML from XML into an array of content blocks.
 * Splits on iframes, where each iframe becomes a tour360 block,
 * and the text between becomes text blocks.
 */
function parseBlocks(rawHtml) {
  const blocks = [];

  // Split the HTML on iframe boundaries.
  // We need to find full <iframe ...></iframe> tags (or self-closing-like).
  // The XML may have them as <iframe ...></iframe> or just <iframe ...>
  // We'll split on <iframe ... > (opening tag) to find boundaries.

  // Strategy: find positions of all iframes in the raw HTML
  const iframeRegex = /<iframe[\s\S]*?(?:<\/iframe>|(?=>)>)/gi;

  let lastIndex = 0;
  let match;
  const parts = []; // { type: 'text'|'iframe', content: string }

  // Reset regex
  iframeRegex.lastIndex = 0;

  while ((match = iframeRegex.exec(rawHtml)) !== null) {
    // Text before this iframe
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: rawHtml.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'iframe', content: match[0] });
    lastIndex = iframeRegex.lastIndex;
  }

  // Remaining text after last iframe
  if (lastIndex < rawHtml.length) {
    parts.push({ type: 'text', content: rawHtml.slice(lastIndex) });
  }

  // Now process parts into blocks
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.type === 'iframe') {
      const url = extractIframeSrc(part.content);
      if (!url) continue;

      // Check if the next text part starts with a center-aligned caption
      let title = '';
      if (i + 1 < parts.length && parts[i + 1].type === 'text') {
        const nextText = parts[i + 1].content.trimStart();
        const caption = extractCenterCaption(nextText);
        if (caption) {
          title = caption;
          // Remove the caption paragraph from the next text part
          parts[i + 1].content = parts[i + 1].content.replace(
            /<p[^>]*text-align:\s*center[^>]*>[\s\S]*?<\/p>/i,
            ''
          );
        }
      }

      blocks.push({ type: 'tour360', url, title });

    } else {
      // Text segment
      const cleaned = cleanHtmlSegment(part.content);
      if (cleaned.length < 80) continue; // skip whitespace-only or tiny fragments
      blocks.push({ type: 'text', html: cleaned });
    }
  }

  return blocks;
}

/**
 * Serialize an array of blocks to YAML lines (indented under `blocks:`).
 * Uses JSON.stringify() for all string values so special chars are escaped.
 */
function blocksToYaml(blocks) {
  if (!blocks || blocks.length === 0) return '';

  const lines = ['blocks:'];

  for (const block of blocks) {
    if (block.type === 'text') {
      lines.push(`  - type: text`);
      lines.push(`    html: ${JSON.stringify(block.html)}`);
    } else if (block.type === 'tour360') {
      lines.push(`  - type: tour360`);
      lines.push(`    url: ${JSON.stringify(block.url)}`);
      lines.push(`    title: ${JSON.stringify(block.title || '')}`);
    } else if (block.type === 'gallery') {
      lines.push(`  - type: gallery`);
      lines.push(`    title: ${JSON.stringify(block.title || '')}`);
      lines.push(`    images:`);
      for (const img of (block.images || [])) {
        lines.push(`      - src: ${JSON.stringify(img.src)}`);
        lines.push(`        alt: ${JSON.stringify(img.alt || '')}`);
      }
    } else if (block.type === 'film') {
      lines.push(`  - type: film`);
      lines.push(`    vimeoId: ${JSON.stringify(block.vimeoId)}`);
      lines.push(`    title: ${JSON.stringify(block.title || '')}`);
      if (block.duration) lines.push(`    duration: ${JSON.stringify(block.duration)}`);
    } else if (block.type === 'youtube') {
      lines.push(`  - type: youtube`);
      lines.push(`    url: ${JSON.stringify(block.url)}`);
      lines.push(`    title: ${JSON.stringify(block.title || '')}`);
    }
  }

  return lines.join('\n');
}

/**
 * Write blocks into a MD file's frontmatter.
 * Strips the old `body:` array lines AND any HTML body after the closing ---.
 * Replaces with the new `blocks:` section.
 */
function writeMdWithBlocks(mdPath, blocks) {
  const mdContent = readFileSync(mdPath, 'utf8');

  // Find the frontmatter boundaries
  const fmStart = mdContent.indexOf('---');
  if (fmStart !== 0 && fmStart !== -1) {
    console.log(`  SKIP (frontmatter not at start): ${mdPath}`);
    return false;
  }
  const fmEnd = mdContent.indexOf('\n---', fmStart + 3);
  if (fmEnd === -1) {
    console.log(`  SKIP (no closing ---): ${mdPath}`);
    return false;
  }

  // Extract the frontmatter content (between the two ---)
  let frontmatter = mdContent.substring(fmStart + 3, fmEnd);

  // Remove existing `body:` array lines
  // The body field looks like:
  //   body:
  //     - "text1"
  //     - "text2"
  frontmatter = frontmatter.replace(/^body:\n(  - ".*"\n)*/m, '');

  // Remove existing `blocks:` section (in case we're re-running).
  // Strategy: strip from `\nblocks:` to the end of frontmatter, since blocks is always last.
  frontmatter = frontmatter.replace(/\nblocks:[\s\S]*$/, '');

  // Remove any stray orphaned continuation lines that look like block YAML fields
  // (artifact from a bad previous run — lines like `    html: "..."` or `    url: "..."`)
  frontmatter = frontmatter.replace(/\n    (html|url|title|type|vimeoId|duration|src|alt|images):.*$/gm, '');

  // Clean up trailing whitespace / extra blank lines at end of frontmatter
  frontmatter = frontmatter.replace(/\n{3,}/g, '\n\n').trimEnd();

  // Build the new blocks YAML
  const blocksYaml = blocksToYaml(blocks);

  // Reconstruct the MD file
  const newMd = '---' + frontmatter + '\n' + blocksYaml + '\n---\n';

  writeFileSync(mdPath, newMd, 'utf8');
  return true;
}

let updated = 0;
let skipped = 0;

for (const item of items) {
  const nameMatch    = item.match(/<wp:post_name><!\[CDATA\[([^\]]+)\]\]>/);
  const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);

  if (!nameMatch || !contentMatch) continue;

  const slug    = nameMatch[1];
  const rawHtml = contentMatch[1].trim();
  if (!rawHtml) { skipped++; continue; }

  const mdPath = join(techDir, `${slug}.md`);
  if (!existsSync(mdPath)) {
    console.log(`  SKIP (no MD file): ${slug}`);
    skipped++;
    continue;
  }

  const blocks = parseBlocks(rawHtml);

  if (blocks.length === 0) {
    console.log(`  SKIP (no blocks after parse): ${slug}`);
    skipped++;
    continue;
  }

  const ok = writeMdWithBlocks(mdPath, blocks);
  if (ok) {
    const tourCount = blocks.filter(b => b.type === 'tour360').length;
    const textCount = blocks.filter(b => b.type === 'text').length;
    console.log(`  OK: ${slug} — ${blocks.length} blocks (${textCount} text, ${tourCount} tour360)`);
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}`);
