#!/usr/bin/env node
/**
 * convert-text-props-to-children.mjs
 *
 * Converts ProjectStory/ProjectTasks/ProjectDescription components from
 * self-closing prop syntax to children syntax:
 *
 *   BEFORE: <ProjectStory text={`paragraph 1\n\nparagraph 2`} />
 *   AFTER:  <ProjectStory>\n\nparagraph 1\n\nparagraph 2\n\n</ProjectStory>
 *
 * Usage: node scripts/convert-text-props-to-children.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'src', 'content', 'projects');
const DRY_RUN = process.argv.includes('--dry-run');

const COMPONENTS = ['ProjectStory', 'ProjectTasks', 'ProjectDescription'];

/**
 * Convert a single component's text prop to children syntax within a file body.
 * Handles template literal props: text={`...`}
 */
function convertComponent(content, componentName) {
  const openProp = `<${componentName} text={\``;

  let result = content;
  let offset = 0;

  while (true) {
    const startIdx = result.indexOf(openProp, offset);
    if (startIdx === -1) break;

    const textStart = startIdx + openProp.length;

    // Find the closing backtick that ends the template literal.
    // Skip escaped backticks (\`).
    let closeBacktick = -1;
    for (let i = textStart; i < result.length; i++) {
      if (result[i] === '`' && result[i - 1] !== '\\') {
        closeBacktick = i;
        break;
      }
    }
    if (closeBacktick === -1) { offset = startIdx + 1; continue; }

    // Expect `} />` immediately after the closing backtick
    const afterClose = result.slice(closeBacktick + 1);
    const selfCloseMatch = afterClose.match(/^(\} \/>|}\/>)/);
    if (!selfCloseMatch) { offset = startIdx + 1; continue; }

    const endIdx = closeBacktick + 1 + selfCloseMatch[0].length;

    // Extract and unescape the text content
    const rawText = result.slice(textStart, closeBacktick);
    const text = rawText
      .replace(/\\`/g, '`')
      .replace(/\\\\/g, '\\')
      .replace(/\\\$\{/g, '${');

    // Split into paragraphs, rejoin with double newlines
    const paragraphs = text.trim().split(/\n{1,}/).filter(s => s.trim());
    const childContent = paragraphs.join('\n\n');

    const replacement = `<${componentName}>\n\n${childContent}\n\n</${componentName}>`;

    result = result.slice(0, startIdx) + replacement + result.slice(endIdx);
    // Advance offset past the replacement to avoid infinite loops
    offset = startIdx + replacement.length;
  }

  return result;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  for (const name of COMPONENTS) {
    updated = convertComponent(updated, name);
  }

  if (updated === original) return false;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would update: ${path.basename(filePath)}`);
    return true;
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

const files = fs.readdirSync(PROJECTS_DIR)
  .filter(f => f.endsWith('.mdx'))
  .map(f => path.join(PROJECTS_DIR, f));

console.log(`\nConverting text props → children in ${files.length} project files${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

let changed = 0;
for (const file of files) {
  if (processFile(file)) {
    changed++;
    if (!DRY_RUN) console.log(`  CONVERTED: ${path.basename(file)}`);
    else console.log(`  WOULD CONVERT: ${path.basename(file)}`);
  }
}

console.log(`\nDone. ${changed} file(s) ${DRY_RUN ? 'would be' : 'were'} updated.\n`);
