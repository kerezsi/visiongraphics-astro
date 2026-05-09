/**
 * Adds minimal `lang` plumbing to every page under src/pages/[lang]/:
 *
 *   1. Imports staticLocalePaths / localizedPaths + Locale type from src/lib/i18n.
 *   2. For pages WITHOUT getStaticPaths: appends `export const getStaticPaths = staticLocalePaths;`.
 *   3. For pages WITH getStaticPaths: wraps the existing return with localizedPaths().
 *   4. Adds `const { lang } = Astro.params as { lang: Locale; ... };` and `Astro.locals.lang = lang;`
 *      at the top of the script section (after imports / existing getStaticPaths).
 *
 * Idempotent: detects existing `Astro.locals.lang =` and skips.
 *
 * Run: node scripts/i18n-add-lang-plumbing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANG_DIR = path.join(ROOT, 'src', 'pages', '[lang]');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.isFile() && e.name.endsWith('.astro')) out.push(full);
  }
  return out;
}

function relImportPath(fromFile) {
  // From src/pages/[lang]/.../foo.astro to src/lib/i18n
  const fromDir = path.dirname(fromFile);
  const target = path.join(ROOT, 'src', 'lib', 'i18n');
  let rel = path.relative(fromDir, target).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');

  // Already done?
  if (/Astro\.locals\.lang\s*=/.test(src)) {
    console.log(`[skip done] ${path.relative(ROOT, file)}`);
    return false;
  }

  // Find frontmatter (tolerate CRLF / LF / no trailing newline before closing ---)
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    console.warn(`[skip no-frontmatter] ${path.relative(ROOT, file)}`);
    return false;
  }
  const fmInner = fm[1];

  const hasGetStaticPaths = /\bgetStaticPaths\s*[\(=]/.test(fmInner);
  const importSpec = relImportPath(file);

  let newFm = fmInner;

  // 1. Add i18n import after the last existing import statement
  const importLine = hasGetStaticPaths
    ? `import { localizedPaths, type Locale } from '${importSpec}';`
    : `import { staticLocalePaths, type Locale } from '${importSpec}';`;

  const importMatches = [...newFm.matchAll(/^import .+;$/gm)];
  if (importMatches.length > 0) {
    const last = importMatches[importMatches.length - 1];
    const insertAt = last.index + last[0].length;
    newFm = newFm.slice(0, insertAt) + '\n' + importLine + newFm.slice(insertAt);
  } else {
    newFm = importLine + '\n' + newFm;
  }

  // 2. If no getStaticPaths, add one
  if (!hasGetStaticPaths) {
    newFm = newFm.replace(
      importLine,
      importLine + '\n\nexport const getStaticPaths = staticLocalePaths;'
    );
  } else {
    // Wrap existing return with localizedPaths.
    // Two common shapes we handle:
    //   return projects.map(p => ({ params: { slug: p.slug } }));
    //   return ids.map(id => ({ params: { category: id } }));
    // We rewrite to:
    //   return localizedPaths(projects, p => ({ slug: p.slug }));
    // This is brittle — if the regex doesn't match we fall back to manual mode.

    // Pattern 1: `return X.map(VAR => ({ params: { ... } }));`
    const mapReturnRe = /return\s+([A-Za-z_$][\w$]*)\s*\.map\s*\(\s*([A-Za-z_$][\w$]*)\s*=>\s*\(\s*\{\s*params\s*:\s*(\{[^}]*\})\s*\}\s*\)\s*\)\s*;/m;
    const m = newFm.match(mapReturnRe);
    if (m) {
      const [full, listVar, itemVar, paramsObj] = m;
      const replacement = `return localizedPaths(${listVar}, ${itemVar} => (${paramsObj}));`;
      newFm = newFm.replace(full, replacement);
    } else {
      console.warn(`[manual-needed getStaticPaths]  ${path.relative(ROOT, file)}`);
    }
  }

  // 3. Add lang extraction + locals assignment.
  // Find existing `const { ... } = Astro.params;` line if any.
  const paramsLine = newFm.match(/^const\s*\{\s*([^}]*)\s*\}\s*=\s*Astro\.params\s*;?\s*$/m);
  if (paramsLine) {
    const inner = paramsLine[1].split(',').map(s => s.trim()).filter(Boolean);
    if (!inner.includes('lang')) inner.unshift('lang');
    const replaced = `const { ${inner.join(', ')} } = Astro.params as { lang: Locale; [k: string]: string | undefined };\nAstro.locals.lang = lang;`;
    newFm = newFm.replace(paramsLine[0], replaced);
  } else {
    // No existing destructure — insert after the (rewritten) getStaticPaths block, or at end of imports
    const gspMatch = newFm.match(/export\s+(?:async\s+)?function\s+getStaticPaths[\s\S]*?\n\}\s*\n?|export\s+const\s+getStaticPaths\s*=[^;]+;\s*\n?/);
    const insertion = `\nconst { lang } = Astro.params as { lang: Locale };\nAstro.locals.lang = lang;\n`;
    if (gspMatch) {
      const at = gspMatch.index + gspMatch[0].length;
      newFm = newFm.slice(0, at) + insertion + newFm.slice(at);
    } else {
      // After last import
      const ims = [...newFm.matchAll(/^import .+;$/gm)];
      if (ims.length) {
        const last = ims[ims.length - 1];
        const at = last.index + last[0].length;
        newFm = newFm.slice(0, at) + '\n' + insertion + newFm.slice(at);
      } else {
        newFm = insertion + newFm;
      }
    }
  }

  const out = src.replace(fm[0], `---\n${newFm}\n---`);
  fs.writeFileSync(file, out);
  console.log(`[done] ${path.relative(ROOT, file)}`);
  return true;
}

const files = walk(LANG_DIR);
let changed = 0;
for (const f of files) if (processFile(f)) changed++;
console.log(`\n${changed} files updated.`);
