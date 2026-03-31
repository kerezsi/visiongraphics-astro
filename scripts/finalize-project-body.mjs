#!/usr/bin/env node
/**
 * finalize-project-body.mjs
 *
 * Two operations on each project MDX file:
 * 1. Adds heading="The Story:" prop to <ProjectStory> (if not already present)
 * 2. Moves <ProjectStory ...>...</ProjectStory> to the END of the MDX body
 *    (after all other content), so the page order is:
 *    ProjectTasks → media → ProjectStory
 *
 * Usage: node scripts/finalize-project-body.mjs [--dry-run]
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

/**
 * Extract a <ProjectStory ...>...</ProjectStory> block from the body.
 * Returns { before, block, after } or null if not found.
 */
function extractProjectStory(body) {
  // Find opening tag (may have props or not)
  const openMatch = body.match(/<ProjectStory(\s[^>]*)?\s*>/);
  if (!openMatch) return null;

  const openStart = body.indexOf(openMatch[0]);
  const openEnd = openStart + openMatch[0].length;

  // Find matching closing tag (simple, non-nested)
  const closeTag = '</ProjectStory>';
  const closeStart = body.indexOf(closeTag, openEnd);
  if (closeStart === -1) return null;

  const closeEnd = closeStart + closeTag.length;

  const block = body.slice(openStart, closeEnd);
  const before = body.slice(0, openStart);
  const after = body.slice(closeEnd);

  return { before, block, after };
}

/**
 * Add heading="The Story:" to a <ProjectStory> tag if not already present.
 */
function addHeadingProp(block) {
  // Already has heading prop?
  if (/heading=/.test(block)) return block;

  return block.replace(/^<ProjectStory/, '<ProjectStory heading="The Story:"');
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const parts = splitFrontmatter(original);
  if (!parts) return false;

  const { frontmatter, body } = parts;
  const extracted = extractProjectStory(body);

  if (!extracted) return false; // No ProjectStory to move

  let { before, block, after } = extracted;

  // Add heading prop
  block = addHeadingProp(block);

  // Check if block is already at the end (nothing meaningful after it)
  const afterTrimmed = after.trim();
  if (afterTrimmed === '') {
    // Already at end — just ensure heading prop is added
    const newContent = `---\n${frontmatter}\n---\n${before}${block}${after}`;
    if (newContent === original) return false;
    if (!DRY_RUN) fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }

  // Move block to end of body
  const newBody = before.trimEnd() + '\n\n' + after.trim() + '\n\n' + block + '\n';
  const newContent = `---\n${frontmatter}\n---\n${newBody}`;

  if (DRY_RUN) return true;
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

const files = fs.readdirSync(PROJECTS_DIR)
  .filter(f => f.endsWith('.mdx'))
  .map(f => path.join(PROJECTS_DIR, f));

console.log(`\nFinalizing body order in ${files.length} project files${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

let changed = 0;
for (const file of files) {
  if (processFile(file)) {
    changed++;
    console.log(`  ${DRY_RUN ? 'WOULD UPDATE' : 'UPDATED'}: ${path.basename(file)}`);
  }
}

console.log(`\nDone. ${changed} file(s) ${DRY_RUN ? 'would be' : 'were'} updated.\n`);
