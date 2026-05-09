/**
 * One-shot migration: move every page under src/pages/ into src/pages/[lang]/,
 * fixing relative imports so they resolve from the new (deeper) location.
 *
 * Idempotent: if a destination already exists, the source is left in place and
 * a warning is printed. Re-running after manually fixing collisions is safe.
 *
 * Run: node scripts/i18n-restructure.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_PAGES = path.join(ROOT, 'src', 'pages');
const LANG_DIR = path.join(SRC_PAGES, '[lang]');

// Files we never move (already under [lang], or special)
const SKIP_DIRS = new Set(['[lang]']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.(astro|mdx?|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Rewrite relative imports in source so they keep resolving after the file
 * moves one directory deeper. Only touches `from '...'` and `import('...')`
 * specifiers that start with `./` or `../` — never absolute paths, never
 * package imports, never strings inside JSX/HTML.
 */
function rewriteImportsForExtraDepth(src) {
  // Match: import ... from '...';   import('...');   } from '...';
  const importRe = /(\b(?:from|import)\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;
  return src.replace(importRe, (_, prefix, quote, spec) => {
    // ./foo  → ../foo
    // ../foo → ../../foo
    const fixed = spec.startsWith('./') ? '../' + spec.slice(2) : '../' + spec;
    return `${prefix}${quote}${fixed}${quote}`;
  });
}

let moved = 0;
let skipped = 0;
const files = walk(SRC_PAGES);
for (const src of files) {
  const rel = path.relative(SRC_PAGES, src);
  const dest = path.join(LANG_DIR, rel);
  if (fs.existsSync(dest)) {
    console.warn(`[skip] dest exists: ${path.relative(ROOT, dest)}`);
    skipped++;
    continue;
  }
  const content = fs.readFileSync(src, 'utf8');
  const fixed = rewriteImportsForExtraDepth(content);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fixed);
  fs.unlinkSync(src);
  console.log(`[move] ${rel}`);
  moved++;
}

// Clean up newly-empty directories (not [lang])
function cleanEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) cleanEmpty(path.join(dir, entry.name));
  }
  if (dir !== SRC_PAGES && dir !== LANG_DIR && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`[rmdir] ${path.relative(ROOT, dir)}`);
  }
}
cleanEmpty(SRC_PAGES);

console.log(`\n${moved} moved, ${skipped} skipped.`);
