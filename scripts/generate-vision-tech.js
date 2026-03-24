/**
 * generate-vision-tech.js
 * Creates src/content/vision-tech/<slug>.md for all WP vision-tech posts.
 * Usage: node scripts/generate-vision-tech.js [--force]
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const WP_BASE    = 'https://dev.visiongraphics.eu/wp-json/wp/v2';
const CONTENT_DIR= path.join(__dirname, '..', 'src', 'content', 'vision-tech');
const FORCE      = process.argv.includes('--force');

// ─── Taxonomy ID → label maps ────────────────────────────────────
const TECH  = {120:'Traditional',121:'Digital',122:'Hybrid',123:'AI-Enhanced',124:'AI-Only'};
const COST  = {125:'€',126:'€€',127:'€€€',128:'€€€€',129:'€€€€€'};
const MODEL = {130:'Output from 3D Model',131:'Creation of 3D Model',132:'Enhancement of 3D Model',133:'No 3D Model Required'};
const CPLX  = {134:'1 - Basic',135:'2 - Intermediate',136:'3 - Advanced',137:'4 - Expert',138:'5 - Cutting-Edge'};
const REAL  = {139:'Pure Reality',140:'Enhanced Reality',141:'Hybrid Reality-Vision',142:'Conceptual Reality',143:'Pure Vision'};
const PURP  = {144:'Design Development',145:'Technical Analysis',146:'Communication',147:'Documentation',148:'Decision Support'};

// ─── Related categories for portfolio filtering ───────────────────
// Maps vision-tech slug → which portfolio categories typically use it
const RELATED_CATS = {
  '360-photo-integration':          ['vr-experience','exhibition','commercial','hospitality'],
  '360-photography':                ['exhibition','commercial','hospitality','urban'],
  '360-renderings':                 ['residential','commercial','office','hospitality'],
  '360-tour':                       ['residential','commercial','hospitality','exhibition'],
  '3d-animation':                   ['animation','airport','commercial','residential'],
  'adaptive-reuse-illustrations':   ['renovation','exhibition','urban'],
  'aerial-integration':             ['airport','urban','commercial','infrastructure'],
  'aerial-photography':             ['urban','airport','infrastructure'],
  'architectural-details-generation':['residential','commercial','office','hospitality'],
  'architectural-styling':          ['residential','commercial','office'],
  'cultural-context-integration':   ['exhibition','civic','urban'],
  'drone-photography':              ['urban','airport','infrastructure','commercial'],
  'exterior':                       ['residential','commercial','office','hospitality','airport'],
  'historical-reconstruction':      ['renovation','exhibition','civic'],
  'interior':                       ['residential','commercial','office','hospitality'],
  'interior-styling':               ['residential','hospitality','commercial'],
  'marketing-apartment-plan':       ['residential'],
  'marketing-level-plan':           ['residential','commercial'],
  'night-renderings':               ['residential','commercial','office','hospitality'],
  'non-photorealistic-render':      ['residential','commercial','office'],
  'photo-integration':              ['residential','commercial','urban','airport'],
  'photorealistic-rendering':       ['residential','commercial','office','hospitality','airport'],
  'section':                        ['residential','commercial','office'],
  'site-plan':                      ['commercial','urban','residential','airport'],
  'video-production':               ['commercial','hospitality','airport','exhibition'],
  'virtual-reality-vr-experience':  ['vr-experience','residential','commercial'],
};

// ─── Related portfolio feature tags ──────────────────────────────
const RELATED_FEATURES = {
  '360-photo-integration':      ['360° Tour'],
  '360-photography':            ['360° Tour'],
  '360-renderings':             ['360° Tour'],
  '360-tour':                   ['360° Tour'],
  '3d-animation':               ['3D Animation','4K Animation'],
  'aerial-integration':         ['Aerial Integration'],
  'aerial-photography':         ['Aerial Integration'],
  'drone-photography':          ['Aerial Integration'],
  'exterior':                   ['Exterior'],
  'historical-reconstruction':  ['Historical Reconstruction'],
  'interior':                   ['Interior'],
  'photo-integration':          ['Photo Integration'],
  'virtual-reality-vr-experience': ['VR Experience'],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers:{'User-Agent':'VisionGraphics/1.0'} }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function stripHtml(html) {
  return (html||'')
    .replace(/<[^>]+>/g,' ')
    .replace(/&#8217;/g,"'").replace(/&#8220;/g,'"').replace(/&#8221;/g,'"')
    .replace(/&#8211;/g,'–').replace(/&#8212;/g,'—').replace(/&amp;/g,'&')
    .replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}

function yamlStr(s) {
  if (!s) return '""';
  const clean = String(s).replace(/"/g,'\\"').trim();
  return `"${clean}"`;
}

function yamlList(arr) {
  if (!arr || arr.length === 0) return ' []';  // space required for valid YAML
  return '\n' + arr.map(i => `  - ${yamlStr(i)}`).join('\n');
}

async function main() {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const fields = [
    'id','slug','title','excerpt',
    'vistype---technical-approach',
    'vistype---resource-requirements',
    'vistype---3d-model-relationship',
    'vistype---complexity-levels',
    'vistype--reality-vision-spectrum',
    'vistype---visualization-purpose',
  ].join(',');

  const posts = await fetchJson(`${WP_BASE}/vision-tech?per_page=100&_fields=${fields}`);
  console.log(`Fetched ${posts.length} vision-tech posts`);

  let created = 0, skipped = 0;

  for (const p of posts) {
    const slug = p.slug;
    const dest = path.join(CONTENT_DIR, `${slug}.md`);

    if (!FORCE && fs.existsSync(dest)) { skipped++; continue; }

    const title   = stripHtml(p.title?.rendered || slug);
    const excerpt = stripHtml(p.excerpt?.rendered || '');
    const tech    = TECH[  p['vistype---technical-approach']?.[0]  ] || 'Digital';
    const cost    = COST[  p['vistype---resource-requirements']?.[0]] || '€€';
    const model   = MODEL[ p['vistype---3d-model-relationship']?.[0]] || 'Output from 3D Model';
    const cplx    = CPLX[  p['vistype---complexity-levels']?.[0]   ] || '2 - Intermediate';
    const reality = REAL[  p['vistype--reality-vision-spectrum']?.[0]] || 'Conceptual Reality';
    const purpose = (p['vistype---visualization-purpose'] || []).map(id => PURP[id]).filter(Boolean);

    const relCats    = RELATED_CATS[slug]    || ['architectural-visualization'];
    const relFeatures= RELATED_FEATURES[slug]|| [];

    let md = '---\n';
    md += `title: ${yamlStr(title)}\n`;
    md += `description: ${yamlStr(excerpt)}\n`;
    md += `image: ${yamlStr(`/vision-tech/${slug}.jpg`)}\n`;
    md += `technique: ${yamlStr(tech)}\n`;
    md += `cost: ${yamlStr(cost)}\n`;
    md += `model3d: ${yamlStr(model)}\n`;
    md += `complexity: ${yamlStr(cplx)}\n`;
    md += `reality: ${yamlStr(reality)}\n`;
    md += `purpose:${yamlList(purpose)}\n`;
    md += `relatedCategories:${yamlList(relCats)}\n`;
    md += `relatedFeatures:${yamlList(relFeatures)}\n`;
    md += '---\n';

    fs.writeFileSync(dest, md, 'utf8');
    console.log(`  ✓ ${slug}.md`);
    created++;
  }

  console.log(`\nDone — created: ${created}, skipped: ${skipped}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
