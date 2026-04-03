#!/usr/bin/env node
/**
 * populate-tour360-cover.mjs
 *
 * For every project MDX file:
 *   - Reads the frontmatter `coverImage` value
 *   - Finds all <Tour360 ... /> blocks in the MDX body that are missing a coverImage prop
 *   - Adds coverImage="<project-cover>" to those blocks
 *
 * Skips blocks that already have a coverImage attribute.
 * Safe to run multiple times (idempotent).
 *
 * Usage: node scripts/populate-tour360-cover.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'src', 'content', 'projects');
const DRY_RUN = process.argv.includes('--dry-run');

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function extractCoverImage(frontmatter) {
  const match = frontmatter.match(/^coverImage:\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function addCoverImageToTour360(body, coverImage) {
  const safe = coverImage.replace(/"/g, '&quot;');
  let changed = false;

  // Match <Tour360 ...props... /> where coverImage is NOT already present
  const updated = body.replace(
    /<Tour360(\s[^>]*?)\s*\/>/g,
    (match, props) => {
      if (/coverImage=/.test(props)) return match; // already has it
      changed = true;
      return `<Tour360${props} coverImage="${safe}" />`;
    }
  );

  return { body: updated, changed };
}

const files = fs.readdirSync(PROJECTS_DIR)
  .filter(f => f.endsWith('.mdx'))
  .map(f => path.join(PROJECTS_DIR, f));

console.log(`\nPopulating Tour360 coverImage in ${files.length} project files${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

let total = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const parts = splitFrontmatter(original);
  if (!parts) continue;

  const coverImage = extractCoverImage(parts.frontmatter);
  if (!coverImage) continue;
  if (!parts.body.includes('<Tour360')) continue;

  const { body: newBody, changed } = addCoverImageToTour360(parts.body, coverImage);
  if (!changed) continue;

  const newContent = `---\n${parts.frontmatter}\n---\n${newBody}`;
  if (!DRY_RUN) fs.writeFileSync(file, newContent, 'utf8');
  total++;
  console.log(`  ${DRY_RUN ? 'WOULD UPDATE' : 'UPDATED'}: ${path.basename(file)}`);
}

console.log(`\nDone. ${total} file(s) ${DRY_RUN ? 'would be' : 'were'} updated.\n`);
