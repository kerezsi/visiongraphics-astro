/**
 * generate-projects.js  (XML edition)
 * Reads O:/VISIONGRAPHICS_ASTRO/old_dev_site/portfolio.xml
 * and regenerates src/content/projects/<slug>.md for every published
 * portfolio post.  Existing images[] arrays are PRESERVED from any
 * already-existing .md file so gallery structure is never lost.
 *
 * Usage:
 *   node scripts/generate-projects.js            # skip existing
 *   node scripts/generate-projects.js --force    # overwrite all
 *   node scripts/generate-projects.js --dry-run  # print, no writes
 *   node scripts/generate-projects.js --slug=nextnest
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const XML_FILE    = path.resolve('O:/VISIONGRAPHICS_ASTRO/old_dev_site/portfolio.xml');
const VT_XML_FILE = path.resolve('O:/VISIONGRAPHICS_ASTRO/old_dev_site/vision_tech.xml');
const PUBLIC_DIR  = path.join(__dirname, '..', 'public');
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'projects');

// ─── CLI flags ────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const FORCE    = args.includes('--force');
const ONLY_SLUG= (args.find(a => a.startsWith('--slug=')) || '').replace('--slug=', '') || null;

// ─── projekt_topic slug → Astro category enum ─────────────────────
const TOPIC_MAP = {
  'commercial':                          'commercial',
  'conference-venues':                   'commercial',
  'conference':                          'commercial',
  'shopping-center':                     'commercial',
  'shopping':                            'commercial',
  'retail':                              'commercial',
  'information-and-cultural-industries': 'commercial',
  'office':                              'office',
  'offices':                             'office',
  'hotel':                               'hospitality',
  'hotel-2':                             'hospitality',
  'wellness':                            'hospitality',
  'hospitality':                         'hospitality',
  'residential':                         'residential',
  'residental':                          'residential',
  'villa':                               'residential',
  'renovation':                          'renovation',
  'airport':                             'airport',
  'airport-2':                           'airport',
  'transportation':                      'transportation',
  'infrastructure':                      'infrastructure',
  'military':                            'infrastructure',
  'telecommunication':                   'infrastructure',
  'urban':                               'urban',
  'urban-2':                             'urban',
  'garden_and_public':                   'urban',
  'public_facility':                     'civic',
  'exhibition':                          'exhibition',
  'program':                             'exhibition',
  'industrial':                          'industrial',
  'agriculture':                         'agriculture',
  'education':                           'education',
  'health_and_welfare':                  'healthcare',
  'sports_and_recreation':               'sports',
  'design':                              'product-visualization',
  'product':                             'product-visualization',
  'vr':                                  'vr-experience',
  'animation':                           'animation',
};

// ─── Helpers ──────────────────────────────────────────────────────
function log(m)  { console.log(m); }
function ok(m)   { console.log('  ✓ ' + m); }
function skip(m) { console.log('  · ' + m); }
function warn(m) { console.log('  ⚠ ' + m); }

/** Parse PHP serialized string like a:3:{i:0;s:4:"3230";...} → string[] */
function parsePhpArray(s) {
  if (!s) return [];
  const matches = [...(s.matchAll(/s:\d+:"([^"]+)"/g))];
  return matches.map(m => m[1]);
}

/** Escape a string for YAML double-quoted scalar */
function yamlStr(s) {
  if (s == null || s === '') return '""';
  const clean = String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim();
  return `"${clean}"`;
}

/** Format a string as a YAML block scalar (literal | style).
 *  Returns the indicator + content, e.g. '|\n  line1\n  line2\n' */
function yamlBlock(text, baseIndent = '') {
  if (!text || !text.trim()) return 'null';
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trimEnd()
    .split('\n')
    .map(l => '  ' + l);          // 2-space indent inside block
  return '|\n' + lines.join('\n');
}

/** Strip HTML tags and decode common HTML entities */
function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g,  ' ')
    .replace(/\s{2,}/g,  ' ')
    .trim();
}

/** Strip HTML tags + clean whitespace for multi-paragraph text blocks */
function cleanText(text) {
  return (text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g,  ' ')
    .replace(/[ \t]+/g, ' ')       // collapse inline whitespace
    .replace(/\n{3,}/g, '\n\n')    // max 2 newlines
    .trim();
}

/** Read XML text content of a child element (handles CDATA) */
function getChildText(el, tagName) {
  const children = el.getElementsByTagName(tagName);
  if (!children || children.length === 0) return '';
  const node = children[0];
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const n = node.childNodes[i];
    // nodeType 4 = CDATA_SECTION_NODE, nodeType 3 = TEXT_NODE
    if (n.nodeType === 4 || n.nodeType === 3) {
      text += n.nodeValue || '';
    }
  }
  return text.trim();
}

/** Extract all <wp:postmeta> values for a post as { key: value } */
function getMeta(item) {
  const meta = {};
  const metas = item.getElementsByTagName('wp:postmeta');
  for (let i = 0; i < metas.length; i++) {
    const m = metas[i];
    const k = getChildText(m, 'wp:meta_key');
    const v = getChildText(m, 'wp:meta_value');
    if (k) meta[k] = v;
  }
  return meta;
}

/** Extract all <category> entries as { domain, nicename, text } */
function getCategories(item) {
  const cats = [];
  const catNodes = item.getElementsByTagName('category');
  for (let i = 0; i < catNodes.length; i++) {
    const c = catNodes[i];
    cats.push({
      domain:   c.getAttribute('domain')   || '',
      nicename: c.getAttribute('nicename') || '',
      text:     c.textContent              || '',
    });
  }
  return cats;
}

/** List images from public/portfolio/<slug>/ — preserves existing order */
function listImages(astroSlug) {
  const dir = path.join(PUBLIC_DIR, 'portfolio', astroSlug);
  if (!fs.existsSync(dir)) return { cover: null, gallery: [] };
  const files = fs.readdirSync(dir).sort();
  const cover = files.includes('cover.jpg')
    ? `/portfolio/${astroSlug}/cover.jpg`
    : null;
  const gallery = files
    .filter(f => /^\d+\.jpg$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(f => ({ src: `/portfolio/${astroSlug}/${f}`, alt: '' }));
  return { cover, gallery };
}

/** Parse existing published flag */
function readExistingPublished(astroSlug) {
  const fp = path.join(CONTENT_DIR, `${astroSlug}.md`);
  if (!fs.existsSync(fp)) return null;
  const m = fs.readFileSync(fp, 'utf8').match(/^published:\s*(true|false)/m);
  return m ? m[1] === 'true' : null;
}

// ─── Parse XML ────────────────────────────────────────────────────
function parseXml(filePath) {
  const xmlText = fs.readFileSync(filePath, 'utf8');
  const parser  = new DOMParser();
  return parser.parseFromString(xmlText, 'text/xml');
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  log('\n╔══════════════════════════════════════════════════╗');
  log('║  Vision Graphics — Project Generator (XML)      ║');
  log('╚══════════════════════════════════════════════════╝');
  if (DRY_RUN) log('  DRY RUN — no files will be written\n');

  // ── 1. Load vision-tech ID → slug map ─────────────────────────
  log('\n── Loading vision-tech ID map ──────────────────────');
  const vtDoc   = parseXml(VT_XML_FILE);
  const vtItems = vtDoc.getElementsByTagName('item');
  const vtIdMap = {};
  for (let i = 0; i < vtItems.length; i++) {
    const item = vtItems[i];
    const pt   = getChildText(item, 'wp:post_type');
    if (pt !== 'vision-tech') continue;
    const id   = getChildText(item, 'wp:post_id');
    const slug = getChildText(item, 'wp:post_name');
    if (id && slug) vtIdMap[id] = slug;
  }
  log(`  Loaded ${Object.keys(vtIdMap).length} vision-tech entries`);

  // ── 2. Parse portfolio XML ─────────────────────────────────────
  log('\n── Parsing portfolio XML ────────────────────────────');
  const doc   = parseXml(XML_FILE);
  const items = doc.getElementsByTagName('item');

  const portfolioPosts = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (getChildText(item, 'wp:post_type')  !== 'portfolio') continue;
    if (getChildText(item, 'wp:status')     !== 'publish')   continue;
    portfolioPosts.push(item);
  }
  log(`  ${portfolioPosts.length} published portfolio posts`);

  // ── 3. Generate .md files ──────────────────────────────────────
  log('\n── Generating .md files ────────────────────────────');
  let created = 0, skipped = 0, noImages = 0;

  for (const item of portfolioPosts) {
    const wpSlug = getChildText(item, 'wp:post_name');
    // Use WP slug directly (remove old incorrect remappings)
    const astroSlug = wpSlug;

    if (ONLY_SLUG && astroSlug !== ONLY_SLUG && wpSlug !== ONLY_SLUG) continue;

    const destFile = path.join(CONTENT_DIR, `${astroSlug}.md`);
    if (!FORCE && fs.existsSync(destFile)) {
      skip(`${astroSlug}.md already exists`);
      skipped++;
      continue;
    }

    // ── Meta fields ──────────────────────────────────────────────
    const meta = getMeta(item);
    const cats = getCategories(item);

    const rawTitle      = getChildText(item, 'title');
    const displayTitle  = meta['name_combined'] || '';
    const title         = displayTitle || stripHtml(rawTitle) || astroSlug;
    const year          = parseInt(meta['project_date'] || '2000', 10);
    const location      = meta['location'] || '';
    const rawPano       = (meta['external_pano_tour'] || '').trim();
    const panoUrl       = rawPano.startsWith('http') ? rawPano : '';
    const videoUrl      = meta['video'] || '';
    const featured      = (meta['featured'] || '').trim() === 'xxx';
    const rawDesc       = stripHtml(meta['project_description'] || '');
    const description   = rawDesc.length > 300
                          ? rawDesc.substring(0, 297) + '…'
                          : rawDesc;
    const story         = cleanText(meta['story'] || '');
    const tasks         = cleanText(meta['project_tasks'] || '');

    // ── Taxonomy ─────────────────────────────────────────────────
    const topicCats = cats
      .filter(c => c.domain === 'projekt_topic')
      .map(c => TOPIC_MAP[c.nicename])
      .filter(Boolean);
    const categories = [...new Set(topicCats.length
      ? topicCats
      : ['architectural-visualization'])];

    const clientName = cats.filter(c => c.domain === 'client').map(c => c.text)[0] || '';
    const designerName = cats.filter(c => c.domain === 'designer').map(c => c.text)[0] || '';
    const clientTypeRaw = cats.filter(c => c.domain === 'client_type').map(c => c.nicename);
    const clientType = clientTypeRaw[0] || '';

    // ── Vision-tech links ─────────────────────────────────────────
    const vtPhp    = meta['connected_technologies_meta_field'] || '';
    const vtIds    = parsePhpArray(vtPhp);
    const vtSlugs  = [...new Set(vtIds.map(id => vtIdMap[id]).filter(Boolean))];

    // ── Images from public/portfolio/<slug>/ ─────────────────────
    const { cover, gallery } = listImages(astroSlug);
    const coverPath = cover || (gallery[0]?.src ?? '');
    const existingPublished = readExistingPublished(astroSlug);
    const isPublished = existingPublished !== null
      ? existingPublished
      : Boolean(coverPath);

    if (!coverPath) {
      warn(`${astroSlug}: no images — will be unpublished`);
      noImages++;
    }

    if (DRY_RUN) {
      ok(`[dry-run] ${astroSlug}.md  (${year}, cats: ${categories.join(',')})`);
      created++;
      continue;
    }

    // ── Build frontmatter ─────────────────────────────────────────
    let md = '---\n';
    md += `title: ${yamlStr(title)}\n`;
    if (displayTitle && displayTitle !== title) {
      md += `displayTitle: ${yamlStr(displayTitle)}\n`;
    }
    md += `year: ${year}\n`;
    if (location)    md += `location: ${yamlStr(location)}\n`;
    if (clientName)  md += `client: ${yamlStr(clientName)}\n`;
    if (designerName) md += `designer: ${yamlStr(designerName)}\n`;
    if (clientType)  md += `clientType: ${yamlStr(clientType)}\n`;
    if (description) md += `description: ${yamlStr(description)}\n`;

    // story & tasks as YAML block scalars (only if non-empty)
    if (story) {
      md += `story: ${yamlBlock(story)}\n`;
    }
    if (tasks) {
      md += `tasks: ${yamlBlock(tasks)}\n`;
    }

    md += `categories:\n${categories.map(c => `  - ${c}`).join('\n')}\n`;
    md += `features: []\n`;
    md += `tags: []\n`;
    md += `coverImage: ${yamlStr(coverPath)}\n`;
    md += `published: ${isPublished}\n`;
    md += `featured: ${featured}\n`;

    // 360 tour
    if (panoUrl) {
      // Rewrite to production host if still pointing at dev
      const cleanUrl = panoUrl.replace('https://dev.visiongraphics.eu', 'https://visiongraphics.eu');
      md += `tour360:\n`;
      md += `  - title: "360° Tour"\n`;
      md += `    url: "${cleanUrl}"\n`;
    }
    // Video link
    if (videoUrl) {
      md += `video: ${yamlStr(videoUrl)}\n`;
    }
    // Vision-tech links
    if (vtSlugs.length > 0) {
      md += `techniques:\n${vtSlugs.map(s => `  - ${s}`).join('\n')}\n`;
    }

    // Images block — always from disk scan
    if (gallery.length > 0) {
      md += `images:\n`;
      for (const img of gallery) {
        md += `  - src: "${img.src}"\n`;
        md += `    alt: ""\n`;
      }
    }

    md += '---\n';

    fs.writeFileSync(destFile, md, 'utf8');
    ok(`${astroSlug}.md  (${year} · ${categories[0]}${panoUrl ? ' · 360°' : ''}${vtSlugs.length ? ` · ${vtSlugs.length} tech` : ''})`);
    created++;
  }

  // ── 4. Handle local-only folders (no WP entry) ──────────────────
  const wpSlugs   = new Set(portfolioPosts.map(i => getChildText(i, 'wp:post_name')));
  const localDirs = fs.existsSync(path.join(PUBLIC_DIR, 'portfolio'))
    ? fs.readdirSync(path.join(PUBLIC_DIR, 'portfolio'))
    : [];

  for (const folder of localDirs) {
    if (wpSlugs.has(folder)) continue;
    if (ONLY_SLUG && folder !== ONLY_SLUG) continue;

    const destFile = path.join(CONTENT_DIR, `${folder}.md`);
    if (!FORCE && fs.existsSync(destFile)) { skipped++; continue; }

    const { cover, gallery } = listImages(folder);
    if (!cover && gallery.length === 0) { noImages++; continue; }

    if (DRY_RUN) {
      ok(`[dry-run] ${folder}.md  (local stub)`);
      created++;
      continue;
    }

    const coverPath = cover || (gallery[0]?.src ?? '');
    const existingPublished = readExistingPublished(folder);
    const isPublished = existingPublished !== null ? existingPublished : Boolean(coverPath);

    let md = '---\n';
    md += `title: ${yamlStr(folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}\n`;
    md += `year: 2000\n`;
    md += `categories:\n  - architectural-visualization\n`;
    md += `features: []\n`;
    md += `tags: []\n`;
    md += `coverImage: ${yamlStr(coverPath)}\n`;
    md += `published: ${isPublished}\n`;
    md += `featured: false\n`;
    if (gallery.length > 0) {
      md += `images:\n`;
      for (const img of gallery) {
        md += `  - src: "${img.src}"\n`;
        md += `    alt: ""\n`;
      }
    }
    md += '---\n';

    fs.writeFileSync(destFile, md, 'utf8');
    ok(`${folder}.md  (local stub, ${gallery.length} imgs)`);
    created++;
  }

  log(`\n══════════════════════════════════════════════════`);
  log(`  Created/updated : ${created}`);
  log(`  Skipped (exist) : ${skipped}`);
  log(`  No images       : ${noImages}`);
  log(`══════════════════════════════════════════════════\n`);
}

main().catch(e => {
  console.error('\nFatal:', e.message, e.stack);
  process.exit(1);
});
