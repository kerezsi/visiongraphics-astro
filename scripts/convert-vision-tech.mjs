/**
 * Converts vision-tech .md files (with YAML blocks[]) to .mdx files
 * Text blocks → inline HTML in MDX body
 * Tour360 blocks → <Tour360 url="..." title="..." />
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import yaml from '../node_modules/js-yaml/index.js';

const VT_DIR = new URL('../src/content/vision-tech/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  return { fm: yaml.load(match[1]), body: match[2].trim() };
}

function buildMdx(fm, body) {
  const blocks = fm.blocks || [];
  delete fm.blocks;

  // Rebuild frontmatter YAML (without blocks)
  const fmYaml = yaml.dump(fm, { lineWidth: -1, quotingType: '"', forceQuotes: false });

  let mdxBody = body; // existing markdown body (usually empty for these files)

  const parts = [];
  for (const block of blocks) {
    if (block.type === 'text') {
      // Embed HTML directly — Astro MDX rehype handles raw HTML at block level
      parts.push(block.html);
    } else if (block.type === 'tour360') {
      const title = (block.title || '').replace(/"/g, '&quot;');
      const url = (block.url || '').replace(/"/g, '&quot;');
      parts.push(`<Tour360 url="${url}" title="${title}" />`);
    } else if (block.type === 'gallery') {
      // Render as ImageGallery placeholder
      const images = JSON.stringify(block.images || []);
      parts.push(`<ImageGallery images={${images}} />`);
    } else if (block.type === 'film') {
      parts.push(`<FilmEmbed vimeoId="${block.vimeoId}" title="${(block.title || '').replace(/"/g, '&quot;')}" />`);
    } else if (block.type === 'youtube') {
      parts.push(`<YoutubeEmbed url="${block.url}" title="${(block.title || '').replace(/"/g, '&quot;')}" />`);
    }
  }

  if (parts.length > 0) {
    mdxBody = parts.join('\n\n');
  }

  return `---\n${fmYaml}---\n\n${mdxBody}\n`;
}

const files = readdirSync(VT_DIR).filter(f => f.endsWith('.md'));
console.log(`Converting ${files.length} vision-tech files...`);

let converted = 0;
for (const file of files) {
  const mdPath = join(VT_DIR, file);
  const mdxPath = join(VT_DIR, file.replace(/\.md$/, '.mdx'));

  try {
    const content = readFileSync(mdPath, 'utf8');
    const { fm, body } = parseFrontmatter(content);
    const mdxContent = buildMdx(fm, body);
    writeFileSync(mdxPath, mdxContent, 'utf8');
    unlinkSync(mdPath);
    converted++;
    console.log(`  ✓ ${file}`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

console.log(`\nDone: ${converted}/${files.length} converted`);
