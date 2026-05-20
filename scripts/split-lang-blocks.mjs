#!/usr/bin/env node
/**
 * split-lang-blocks.mjs
 *
 * For each pair of adjacent <Lang code="en">...</Lang> + <Lang code="hu">...</Lang>
 * blocks in a vision-tech MDX file, split both at "## " H2 boundaries so each
 * Lang block contains at most one H2.  Preserves any non-Lang content between
 * Lang pairs verbatim.
 *
 * Usage:
 *   node scripts/split-lang-blocks.mjs <file>            # rewrites file in place
 *   node scripts/split-lang-blocks.mjs --dry <file>      # print result, no write
 *   node scripts/split-lang-blocks.mjs --all             # process every vision-tech mdx
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const VT_DIR = join(REPO_ROOT, 'src', 'content', 'vision-tech');

const LANG_RE = /<Lang code="(en|hu)">([\s\S]*?)<\/Lang>/g;

/** Split a Lang block's INNER content at lines starting with "## ". */
function splitByH2(inner) {
  // Normalise leading/trailing newlines around content
  const lines = inner.split(/\r?\n/);
  const sections = [];          // each: array of lines
  let current = [];
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current.length) sections.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current);
  // Strip leading/trailing blank lines per section
  return sections.map(sec => {
    let s = 0, e = sec.length;
    while (s < e && sec[s].trim() === '') s++;
    while (e > s && sec[e - 1].trim() === '') e--;
    return sec.slice(s, e).join('\n');
  }).filter(s => s.length > 0);
}

function processFile(path) {
  const src = readFileSync(path, 'utf8');

  // Find every Lang block with positions
  const blocks = [];
  let m;
  const re = new RegExp(LANG_RE.source, 'g');
  while ((m = re.exec(src)) !== null) {
    blocks.push({ start: m.index, end: m.index + m[0].length, lang: m[1], inner: m[2] });
  }
  if (blocks.length === 0) return { changed: false, file: basename(path) };

  // Pair consecutive en + hu blocks (only when adjacent within the array)
  // We DON'T enforce nothing between them; if other JSX sits between, we
  // still treat them as a logical pair (matches the existing convention).
  const pairs = [];
  let usedIdx = new Set();
  for (let i = 0; i < blocks.length - 1; i++) {
    if (usedIdx.has(i)) continue;
    if (blocks[i].lang === 'en' && blocks[i + 1].lang === 'hu') {
      pairs.push({ en: blocks[i], hu: blocks[i + 1] });
      usedIdx.add(i); usedIdx.add(i + 1);
    }
  }

  // For each pair: split inner content at H2 boundaries.
  // If en/hu split counts differ, log + skip that pair (leave it untouched).
  const replacements = []; // { start, end, replacement }
  const warnings = [];
  for (const { en, hu } of pairs) {
    const enSections = splitByH2(en.inner);
    const huSections = splitByH2(hu.inner);

    if (enSections.length <= 1 && huSections.length <= 1) continue;

    if (enSections.length !== huSections.length) {
      warnings.push(`pair at offset ${en.start}: en split=${enSections.length}, hu split=${huSections.length} — skipping`);
      continue;
    }

    // Build replacement spanning from en.start to hu.end
    const pairStart = en.start;
    const pairEnd = hu.end;
    const between = src.slice(en.end, hu.start); // whitespace between en and hu blocks

    const parts = [];
    for (let i = 0; i < enSections.length; i++) {
      const enBlock = `<Lang code="en">\n${enSections[i]}\n</Lang>`;
      const huBlock = `<Lang code="hu">\n${huSections[i]}\n</Lang>`;
      parts.push(enBlock + between + huBlock);
    }
    const replacement = parts.join('\n\n');

    replacements.push({ start: pairStart, end: pairEnd, replacement });
  }

  if (replacements.length === 0) {
    return { changed: false, file: basename(path), warnings };
  }

  // Apply replacements from the end to preserve offsets
  replacements.sort((a, b) => b.start - a.start);
  let out = src;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.replacement + out.slice(r.end);
  }

  return { changed: true, file: basename(path), out, replacements: replacements.length, warnings };
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');

let files;
if (all) {
  files = readdirSync(VT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => join(VT_DIR, f));
} else {
  files = args.filter(a => !a.startsWith('--')).map(a =>
    a.startsWith('/') || /^[A-Z]:/.test(a) ? a : join(REPO_ROOT, a)
  );
}

if (files.length === 0) {
  console.error('Usage: node scripts/split-lang-blocks.mjs [--dry] [--all | <file>...]');
  process.exit(1);
}

let totalChanged = 0;
for (const f of files) {
  const r = processFile(f);
  if (r.warnings && r.warnings.length) {
    console.warn(`[${r.file}] WARNINGS:`);
    r.warnings.forEach(w => console.warn(`  - ${w}`));
  }
  if (r.changed) {
    if (dry) {
      console.log(`[${r.file}] would split ${r.replacements} pair(s) (dry-run, not written)`);
    } else {
      writeFileSync(f, r.out, 'utf8');
      console.log(`[${r.file}] split ${r.replacements} pair(s)`);
      totalChanged++;
    }
  } else {
    console.log(`[${r.file}] no change needed`);
  }
}
console.log(`---\nfiles changed: ${totalChanged}`);
