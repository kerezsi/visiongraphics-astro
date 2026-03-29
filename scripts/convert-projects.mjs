/**
 * Converts projects .md files to .mdx
 * Moves `images` array → <ImageGallery> in MDX body
 * All other fields stay in frontmatter
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from '../node_modules/js-yaml/index.js';

const PROJ_DIR = new URL('../src/content/projects/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  return { fm: yaml.load(match[1]), body: match[2].trim() };
}

function buildMdx(fm, existingBody) {
  const images = fm.images || [];
  delete fm.images;

  const fmYaml = yaml.dump(fm, { lineWidth: -1, quotingType: '"', forceQuotes: false });

  const parts = [];

  // Existing markdown body (usually empty for legacy files)
  if (existingBody) parts.push(existingBody);

  // Images → ImageGallery component
  if (images.length > 0) {
    // Build compact JSON for the images prop
    const imagesJson = JSON.stringify(images);
    parts.push(`<ImageGallery images={${imagesJson}} />`);
  }

  const body = parts.join('\n\n');
  return `---\n${fmYaml}---\n${body ? '\n' + body + '\n' : '\n'}`;
}

const files = readdirSync(PROJ_DIR).filter(f => f.endsWith('.md'));
console.log(`Converting ${files.length} project files...`);

let converted = 0, skipped = 0;
for (const file of files) {
  const mdPath = join(PROJ_DIR, file);
  const mdxPath = join(PROJ_DIR, file.replace(/\.md$/, '.mdx'));

  try {
    const content = readFileSync(mdPath, 'utf8');
    const { fm, body } = parseFrontmatter(content);
    const mdxContent = buildMdx(fm, body);
    writeFileSync(mdxPath, mdxContent, 'utf8');
    unlinkSync(mdPath);
    converted++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
    skipped++;
  }
}

console.log(`Done: ${converted} converted, ${skipped} failed`);
