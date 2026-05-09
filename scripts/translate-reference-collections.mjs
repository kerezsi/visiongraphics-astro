/**
 * One-shot translation of reference collection titles to Hungarian.
 *
 * Categories and client-types are user-visible filter labels and breadcrumb
 * tags. Cities/countries/clients/designers stay in their original language
 * (proper nouns); cities and countries are mostly Hungarian already, and
 * client/designer firm names should not be translated.
 *
 * Hungarian translations are hardcoded here (curated by hand from the
 * common Hungarian arch-viz vocabulary). This avoids depending on Ollama/
 * Claude availability for what is a one-time data migration.
 *
 * Run: node scripts/translate-reference-collections.mjs
 *      node scripts/translate-reference-collections.mjs --dry-run    # preview only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src', 'content');
const dryRun = process.argv.includes('--dry-run');

// Hand-curated translations — review and edit before running.
const CATEGORIES = {
  'agriculture':       { en: 'Agriculture',         hu: 'Mezőgazdaság' },
  'airport':           { en: 'Airport',              hu: 'Repülőtér' },
  'animation':         { en: 'Animation',            hu: 'Animáció' },
  'bank':              { en: 'Bank',                 hu: 'Bank' },
  'civic':             { en: 'Civic',                hu: 'Közintézmény' },
  'commercial':        { en: 'Commercial',           hu: 'Kereskedelmi' },
  'culture':           { en: 'Culture',              hu: 'Kultúra' },
  'education':         { en: 'Education',            hu: 'Oktatás' },
  'exhibition':        { en: 'Exhibition',           hu: 'Kiállítás' },
  'healthcare':        { en: 'Healthcare',           hu: 'Egészségügy' },
  'hospitality':       { en: 'Hospitality',          hu: 'Vendéglátás' },
  'industrial':        { en: 'Industrial',           hu: 'Ipari' },
  'infrastructure':    { en: 'Infrastructure',       hu: 'Infrastruktúra' },
  'office':            { en: 'Office',               hu: 'Iroda' },
  'renovation':        { en: 'Renovation',           hu: 'Felújítás' },
  'residential':       { en: 'Residential',          hu: 'Lakó' },
  'sports':            { en: 'Sports',               hu: 'Sport' },
  'telecom':           { en: 'Telecom',              hu: 'Telekommunikáció' },
  'transportation':    { en: 'Transportation',       hu: 'Közlekedés' },
  'urban':             { en: 'Urban',                hu: 'Urbanisztika' },
  'vr-experience':     { en: 'VR Experience',        hu: 'VR-élmény' },
  // Schema-defined slugs that may not have a file yet — added so the
  // runtime tStr() always finds something. Harmless if file is absent.
  'architectural-visualization': { en: 'Architectural Visualization', hu: 'Építészeti látványterv' },
  'product-visualization':       { en: 'Product Visualization',       hu: 'Terméklátványterv' },
};

const CLIENT_TYPES = {
  'architect':          { en: 'Architect',           hu: 'Építész' },
  'artist':             { en: 'Artist',              hu: 'Művész' },
  'designer':           { en: 'Designer',            hu: 'Tervező' },
  'developer':          { en: 'Developer',           hu: 'Fejlesztő' },
  'interior-designer':  { en: 'Interior Designer',   hu: 'Belsőépítész' },
  'manufacturer':       { en: 'Manufacturer',        hu: 'Gyártó' },
  'municipality':       { en: 'Municipality',        hu: 'Önkormányzat' },
};

function rewriteFile(file, slug, translations) {
  if (!translations[slug]) {
    console.warn(`[skip] no translation for ${slug}`);
    return;
  }
  const t = translations[slug];
  // Use block-style YAML mapping for the title field.
  const next = `---\ntitle:\n  en: ${yamlValue(t.en)}\n  hu: ${yamlValue(t.hu)}\n---\n`;
  if (dryRun) {
    console.log(`[dry] ${path.relative(ROOT, file)}\n${next}`);
    return;
  }
  fs.writeFileSync(file, next);
  console.log(`[wrote] ${path.relative(ROOT, file)}`);
}

function yamlValue(s) {
  // Quote if contains YAML-special chars; otherwise emit as bare scalar.
  if (/[:#\[\]{},|>&*!'"?@`\\]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

for (const f of fs.readdirSync(path.join(CONTENT, 'categories'))) {
  if (!f.endsWith('.md')) continue;
  const slug = f.replace(/\.md$/, '');
  rewriteFile(path.join(CONTENT, 'categories', f), slug, CATEGORIES);
}

for (const f of fs.readdirSync(path.join(CONTENT, 'client-types'))) {
  if (!f.endsWith('.md')) continue;
  const slug = f.replace(/\.md$/, '');
  rewriteFile(path.join(CONTENT, 'client-types', f), slug, CLIENT_TYPES);
}

console.log('\nDone.', dryRun ? '(dry-run)' : '');
