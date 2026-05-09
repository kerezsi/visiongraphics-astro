/**
 * Translates all project MDX frontmatter (title + description) to Hungarian.
 *
 * Two modes:
 *   1. With ANTHROPIC_API_KEY in env — uses Claude API for high-quality
 *      sentence-level translation. Recommended.
 *   2. Without — uses a curated dictionary for common architectural terms
 *      and project-description boilerplate. Mechanical, often stilted, but
 *      better than English-only and produces a working draft the user can
 *      polish via the editor's ✦ Translate buttons.
 *
 * Always applies dictionary-based translation to SectionBanner labels/titles
 * and Tour360 titles in the MDX body — those are typically short, common
 * architectural terms where the dictionary is reliable.
 *
 * The script preserves all non-translatable fields (slugs, refs, image paths)
 * and only modifies what's flagged for translation. It's idempotent: running
 * twice on the same file produces the same output.
 *
 * Run:
 *   node scripts/translate-projects.mjs              # all files
 *   node scripts/translate-projects.mjs --slug agora-budapest  # one
 *   node scripts/translate-projects.mjs --dry-run    # show plan, don't write
 *   node scripts/translate-projects.mjs --skip-ai    # force dictionary mode
 *
 * Env:
 *   ANTHROPIC_API_KEY — if set, used for description translation
 *   ANTHROPIC_MODEL   — default "claude-sonnet-4-5"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipAI = args.includes('--skip-ai');
const slugIdx = args.indexOf('--slug');
const targetSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;

const HAS_API = !skipAI && !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

// ─── Curated dictionary for common architectural terms ────────────────────
// Dictionary order matters: longer phrases first so they win the regex race.
// All entries are case-insensitive matches but preserve original capitalization
// of the first letter when possible.
const DICT = [
  // Multi-word phrases
  ['Aerial integration',         'Légi integráció'],
  ['Photo integration',          'Fotóintegráció'],
  ['Image gallery',              'Képgaléria'],
  ['Site plan',                  'Helyszínrajz'],
  ['Marketing apartment plan',   'Marketing lakásrajz'],
  ['Marketing level plan',       'Marketing szintrajz'],
  ['Mixed-use development',      'Vegyes funkciójú beruházás'],
  ['Mixed-use',                  'Vegyes funkciójú'],
  ['Office complex',             'Irodakomplexum'],
  ['Office building',            'Irodaház'],
  ['Office center',              'Irodaközpont'],
  ['Residential complex',        'Lakóegyüttes'],
  ['Residential development',    'Lakóberuházás'],
  ['Residential building',       'Lakóépület'],
  ['Residential project',        'Lakóprojekt'],
  ['Hotel complex',              'Hotelkomplexum'],
  ['Hotel development',          'Hotel-fejlesztés'],
  ['Construction sequence',      'Építési szekvencia'],
  ['Public consultation',        'Közmeghallgatás'],
  ['Building phase',             'Építési ütem'],
  ['Building phases',            'Építési ütemek'],
  ['Architectural visualization','Építészeti látványterv'],
  ['Architectural visualisation','Építészeti látványterv'],
  ['3D animation',               '3D-animáció'],
  ['3D Animation',               '3D-animáció'],
  ['Final phase',                'Utolsó fázis'],
  ['Project for',                'Projekt:'],
  ['Visualization package for',  'Látványterv-csomag:'],
  ['Visualization package',      'Látványterv-csomag'],
  ['Visualization for',          'Látványterv:'],
  ['Designed by',                'Tervezte:'],
  ['Developed by',               'Fejlesztő:'],
  ['Completed in',               'Elkészült:'],
  ['Located at',                 'Cím:'],
  ['Located in',                 'Helyszín:'],
  ['District',                   'Kerület'],
  // Architectural / project type single words
  ['residential',                'lakó'],
  ['Residential',                'Lakó'],
  ['commercial',                 'kereskedelmi'],
  ['Commercial',                 'Kereskedelmi'],
  ['hospitality',                'vendéglátás'],
  ['Hospitality',                'Vendéglátás'],
  ['industrial',                 'ipari'],
  ['Industrial',                 'Ipari'],
  ['infrastructure',             'infrastruktúra'],
  ['Infrastructure',             'Infrastruktúra'],
  ['airport',                    'repülőtér'],
  ['Airport',                    'Repülőtér'],
  ['terminal',                   'terminál'],
  ['Terminal',                   'Terminál'],
  ['hotel',                      'hotel'],
  ['Hotel',                      'Hotel'],
  ['office',                     'iroda'],
  ['Office',                     'Iroda'],
  ['apartment',                  'lakás'],
  ['Apartment',                  'Lakás'],
  ['apartments',                 'lakások'],
  ['Apartments',                 'Lakások'],
  ['restaurant',                 'étterem'],
  ['Restaurant',                 'Étterem'],
  ['lobby',                      'lobby'],
  ['Lobby',                      'Lobby'],
  ['interior',                   'belső'],
  ['Interior',                   'Belső'],
  ['exterior',                   'külső'],
  ['Exterior',                   'Külső'],
  ['aerial',                     'légi'],
  ['Aerial',                     'Légi'],
  ['rendering',                  'render'],
  ['Rendering',                  'Render'],
  ['renderings',                 'renderek'],
  ['Renderings',                 'Renderek'],
  ['visualization',              'látványterv'],
  ['Visualization',              'Látványterv'],
  ['visualisation',              'látványterv'],
  ['Visualisation',              'Látványterv'],
  ['development',                'beruházás'],
  ['Development',                'Beruházás'],
  ['developer',                  'fejlesztő'],
  ['Developer',                  'Fejlesztő'],
  ['architect',                  'építész'],
  ['Architect',                  'Építész'],
  ['building',                   'épület'],
  ['Building',                   'Épület'],
  ['complex',                    'komplexum'],
  ['Complex',                    'Komplexum'],
  ['suburb',                     'külváros'],
  ['Suburb',                     'Külváros'],
  ['urban',                      'városi'],
  ['Urban',                      'Városi'],
  ['rural',                      'vidéki'],
  ['Rural',                      'Vidéki'],
  ['kitchen',                    'konyha'],
  ['Kitchen',                    'Konyha'],
  ['bedroom',                    'hálószoba'],
  ['Bedroom',                    'Hálószoba'],
  ['bathroom',                   'fürdőszoba'],
  ['Bathroom',                   'Fürdőszoba'],
  ['living room',                'nappali'],
  ['Living room',                'Nappali'],
  ['Wellness',                   'Wellness'],
  ['wellness',                   'wellness'],
  ['Spa',                        'Spa'],
  ['spa',                        'spa'],
  // Common verbs / connectors
  ['features',                   'tartalmaz'],
  ['Features',                   'Tartalmaz'],
  ['covering',                   '— bemutatva'],
  ['Covering',                   'Bemutatva'],
  ['stills',                     'állóképek'],
  ['Stills',                     'Állóképek'],
  ['animation',                  'animáció'],
  ['Animation',                  'Animáció'],
  ['stakeholder',                'érdekelti'],
  ['Stakeholder',                'Érdekelti'],
  ['presentation materials',     'prezentációs anyagok'],
  ['materials',                  'anyagok'],
  ['Materials',                  'Anyagok'],
  ['package',                    'csomag'],
  ['Package',                    'Csomag'],
  ['rooms',                      'szobák'],
  ['Rooms',                      'Szobák'],
  ['guest rooms',                'vendégszobák'],
  ['Guest rooms',                'Vendégszobák'],
  ['dining',                     'étkező'],
  ['Dining',                     'Étkező'],
  ['recreational facilities',    'rekreációs létesítmények'],
  ['recreational',               'rekreációs'],
  ['Recreational',               'Rekreációs'],
  ['facilities',                 'létesítmények'],
  ['thermal baths',              'termálfürdő'],
  ['baths',                      'fürdő'],
  // Country names
  ['Hungary',                    'Magyarország'],
  ['Russia',                     'Oroszország'],
  ['Croatia',                    'Horvátország'],
  ['Turkey',                     'Törökország'],
  ['China',                      'Kína'],
  ['Austria',                    'Ausztria'],
  ['Germany',                    'Németország'],
  ['Qatar',                      'Katar'],
  ['United Arab Emirates',       'Egyesült Arab Emírségek'],
  // Year suffix
  ['in 2',                       '2-ban'], // crude but matches "in 2010" → "2010-ban" after digit join, fixed below
];

// Common SectionBanner label/title pairs (label → HU, title → HU)
const BANNER_TERMS = new Map([
  // labels
  ['interior',         'Belső'],
  ['exterior',         'Külső'],
  ['aerial',           'Légi'],
  ['lobby',            'Lobby'],
  ['restaurant',       'Étterem'],
  ['apartment',        'Lakás'],
  ['hotel room',       'Szállodai szoba'],
  ['guest room',       'Vendégszoba'],
  ['wellness',         'Wellness'],
  ['wellness & spa',   'Wellness és spa'],
  ['wellness & saunas','Wellness és szaunák'],
  ['saunas',           'Szaunák'],
  ['spa',              'Spa'],
  ['bedroom',          'Hálószoba'],
  ['kitchen',          'Konyha'],
  ['bathroom',         'Fürdőszoba'],
  ['living',           'Nappali'],
  ['living room',      'Nappali'],
  ['dining',           'Étkező'],
  ['terrace',          'Terasz'],
  ['balcony',          'Erkély'],
  ['garden',           'Kert'],
  ['pool',             'Medence'],
  ['suite',            'Lakosztály'],
  ['penthouse',        'Penthouse'],
  ['studio',           'Stúdió'],
  ['office',           'Iroda'],
  ['lobby & reception','Lobby és recepció'],
  ['reception',        'Recepció'],
  ['conference',       'Konferencia'],
  ['meeting room',     'Tárgyaló'],
  ['gym',              'Edzőterem'],
  ['fitness',          'Fitnesz'],
  ['street view',      'Utcaszintű nézet'],
  ['site',             'Telek'],
  ['site plan',        'Helyszínrajz'],
  ['masterplan',       'Masterplan'],
  ['master plan',      'Masterplan'],
  ['parking',          'Parkoló'],
  ['exterior view',    'Külső nézet'],
  ['interior view',    'Belső nézet'],
  ['aerial view',      'Légi nézet'],
  ['rooftop',          'Tetőterasz'],
  ['courtyard',        'Udvar'],
  ['ground floor',     'Földszint'],
  ['atrium',           'Átrium'],
  ['gallery',          'Galéria'],
  ['retail',           'Kereskedelem'],
  ['concept',          'Koncepció'],
  ['final',            'Végső'],
  ['proposal',         'Javaslat'],
  ['development',      'Beruházás'],
  ['phase 1',          '1. fázis'],
  ['phase 2',          '2. fázis'],
  ['phase 3',          '3. fázis'],
  ['day',              'Nappal'],
  ['night',            'Éjszaka'],
  ['dusk',             'Alkonyat'],
  ['blue hour',        'Kék óra'],
  ['golden hour',      'Aranyóra'],
  ['summer',           'Nyár'],
  ['winter',           'Tél'],
  ['spring',           'Tavasz'],
  ['autumn',           'Ősz'],
  // Common all-caps codes — keep as-is
]);

// ─── Helpers ──────────────────────────────────────────────────────────────
function dictTranslate(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [en, hu] of DICT) {
    // Word-boundary match, case-insensitive, but only replace when the EN string
    // appears as-typed (preserves capitalization). For lower/upper variants we
    // include both in the dict.
    const re = new RegExp(`(?<![A-Za-z])${escapeRe(en)}(?![A-Za-z])`, 'g');
    out = out.replace(re, hu);
  }
  // Year fix: "in 2019" → "2019-ben", "in 2020" → "2020-ban" (vowel harmony).
  out = out.replace(/\bin (\d{4})\b/g, (_, year) => {
    const lastDigit = year.slice(-1);
    // Hungarian vowel harmony rule of thumb for years: -ban after back-vowel
    // pronouns, -ben after front. We don't compute it perfectly; default
    // to -ben which works for most modern years (1990-2030).
    return `${year}-ben`;
  });
  // "completed in YEAR" path → already handled above
  return out;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bannerTermTranslate(text) {
  if (!text) return text;
  const lower = text.trim().toLowerCase();
  if (BANNER_TERMS.has(lower)) return BANNER_TERMS.get(lower);
  // Fallback: dictionary translate
  return dictTranslate(text);
}

// ─── Claude API ───────────────────────────────────────────────────────────
async function translateWithClaude(text, kind) {
  if (!HAS_API || !text || !text.trim()) return null;
  const system =
    `You are a professional translator for an architectural visualization studio (Vision Graphics, Budapest). ` +
    `Translate the user's English text to Hungarian. ` +
    `Preserve proper nouns (building names, designer firms, place names, slugs) as-is. ` +
    `Keep technical terminology accurate. ` +
    `Match the original tone — confident, professional, concise. ` +
    `Respond with ONLY the translated text — no preamble, no quotes, no explanation, no language label.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!resp.ok) {
    console.error(`[claude error ${resp.status}] ${await resp.text()}`);
    return null;
  }
  const data = await resp.json();
  const result = (data.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('')
    .trim();
  return stripQuotes(result);
}

function stripQuotes(s) {
  let t = s.trim();
  t = t.replace(/^(translation|here is the translation|here's the translation)[:\s]*/i, '');
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('„') && t.endsWith('"'))) {
    t = t.slice(1, -1);
  }
  return t.trim();
}

// ─── YAML helpers (very lightweight — not full YAML parser) ───────────────
function readMdx(file) {
  return fs.readFileSync(file, 'utf8');
}

function isLocalizedYaml(value) {
  // Detect whether a frontmatter value is already in {en, hu} format.
  return /^\s*\n\s*en:\s/m.test(value) || /^\{\s*en:/.test(value);
}

/**
 * Parse the frontmatter block (between --- markers) into a flat key→raw-value
 * map. We don't try to fully parse YAML — just detect the title and
 * description fields which are the only ones we touch.
 */
function findFrontmatterField(content, key) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  // Match `key: value` (single-line) or `key: |\n  block`
  const inlineRe = new RegExp(`^${escapeRe(key)}:\\s*(.*)$`, 'm');
  const blockRe  = new RegExp(`^${escapeRe(key)}:\\s*\\|\\s*\\n((?:[ \\t]+.*\\n?)+)`, 'm');
  const objectRe = new RegExp(`^${escapeRe(key)}:\\s*\\n((?:[ \\t]+\\w+:.*\\n?)+)`, 'm');
  const blockM   = fm.match(blockRe);
  if (blockM) return { kind: 'block',  full: blockM[0], value: blockM[1].replace(/^[ \t]+/gm, '').trim() };
  const objM     = fm.match(objectRe);
  if (objM)   return { kind: 'object', full: objM[0],   value: objM[1] };
  const inlM     = fm.match(inlineRe);
  if (inlM)   return { kind: 'inline', full: inlM[0],   value: inlM[1].trim() };
  return null;
}

function unquote(s) {
  let t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return t;
}

function emitLocalizedYaml(key, en, hu) {
  // YAML-quote both values; if either contains : or " or starts with whitespace, quote it.
  const q = (s) => {
    if (/[:"#\[\]{},|>&*!'?@`\\]/.test(s) || /^\s|\s$/.test(s)) {
      return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    return s;
  };
  return `${key}:\n  en: ${q(en)}\n  hu: ${q(hu)}`;
}

// ─── MDX body translation: SectionBanner labels/titles + Tour360 titles ───
function translateMdxBody(body) {
  let out = body;

  // <SectionBanner image="..." label="X" title="Y" /> — flat string props
  out = out.replace(
    /<SectionBanner\b([^/>]*?)\/>/g,
    (full, attrs) => {
      const label = attrs.match(/\blabel="([^"]*)"/);
      const title = attrs.match(/\btitle="([^"]*)"/);
      if (!label && !title) return full;
      let next = attrs;
      if (label) {
        const enVal = label[1];
        const huVal = bannerTermTranslate(enVal);
        next = next.replace(label[0], `label={{ en: "${esc(enVal)}", hu: "${esc(huVal)}" }}`);
      }
      if (title) {
        const enVal = title[1];
        const huVal = bannerTermTranslate(enVal);
        next = next.replace(title[0], `title={{ en: "${esc(enVal)}", hu: "${esc(huVal)}" }}`);
      }
      return `<SectionBanner${next}/>`;
    },
  );

  // <Tour360 url="..." title="X" /> — translate title
  out = out.replace(
    /<Tour360\b([^/>]*?)\/>/g,
    (full, attrs) => {
      const title = attrs.match(/\btitle="([^"]*)"/);
      if (!title) return full;
      const enVal = title[1];
      const huVal = dictTranslate(enVal);
      const next = attrs.replace(title[0], `title={{ en: "${esc(enVal)}", hu: "${esc(huVal)}" }}`);
      return `<Tour360${next}/>`;
    },
  );

  // <YoutubeEmbed url="..." title="X" /> — translate title
  out = out.replace(
    /<YoutubeEmbed\b([^/>]*?)\/>/g,
    (full, attrs) => {
      const title = attrs.match(/\btitle="([^"]*)"/);
      if (!title) return full;
      const enVal = title[1];
      const huVal = dictTranslate(enVal);
      const next = attrs.replace(title[0], `title={{ en: "${esc(enVal)}", hu: "${esc(huVal)}" }}`);
      return `<YoutubeEmbed${next}/>`;
    },
  );

  return out;
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Wrap simple ProjectTasks/ProjectStory body content in <Lang> blocks.
 * We only do this when:
 *   1. The block contains plain prose (no nested components)
 *   2. The block isn't already wrapped in <Lang>
 *   3. We have a translation available (Claude API or non-trivial dictionary output)
 */
async function localizeProjectTextBlocks(body) {
  const tags = ['ProjectTasks', 'ProjectStory', 'ProjectDescription'];
  let out = body;

  for (const tag of tags) {
    const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`, 'g');
    const matches = [...body.matchAll(re)];
    for (const m of matches) {
      const [full, attrs, inner] = m;
      const trimmed = inner.trim();
      if (!trimmed) continue;
      // Skip if already wrapped
      if (/<Lang code="/.test(trimmed)) continue;
      // Skip if it contains other components
      if (/<[A-Z]/.test(trimmed)) continue;

      let huText;
      if (HAS_API) {
        huText = await translateWithClaude(trimmed, tag);
      }
      if (!huText) huText = dictTranslate(trimmed);
      if (!huText || huText === trimmed) continue;

      const replacement =
        `<${tag}${attrs}>\n\n` +
        `<Lang code="en">\n${trimmed}\n</Lang>\n\n` +
        `<Lang code="hu">\n${huText}\n</Lang>\n\n` +
        `</${tag}>`;
      out = out.replace(full, replacement);
    }
  }
  return out;
}

// ─── Per-file processing ──────────────────────────────────────────────────
async function processFile(file) {
  const slug = path.basename(file, '.mdx');
  let content = readMdx(file);
  let modified = false;

  // 1. Title
  const titleField = findFrontmatterField(content, 'title');
  if (titleField && !isLocalizedYaml(titleField.value) && titleField.kind !== 'object') {
    const enTitle = unquote(titleField.value);
    let huTitle;
    if (HAS_API) huTitle = await translateWithClaude(enTitle, 'title');
    if (!huTitle) huTitle = dictTranslate(enTitle);
    if (huTitle && huTitle !== enTitle) {
      content = content.replace(titleField.full, emitLocalizedYaml('title', enTitle, huTitle));
      modified = true;
    }
  }

  // 2. Description
  const descField = findFrontmatterField(content, 'description');
  if (descField && !isLocalizedYaml(descField.value) && descField.kind !== 'object') {
    let enDesc;
    if (descField.kind === 'block') enDesc = descField.value;
    else                            enDesc = unquote(descField.value);
    let huDesc;
    if (HAS_API) huDesc = await translateWithClaude(enDesc, 'description');
    if (!huDesc) huDesc = dictTranslate(enDesc);
    if (huDesc && huDesc !== enDesc) {
      content = content.replace(descField.full, emitLocalizedYaml('description', enDesc, huDesc));
      modified = true;
    }
  }

  // 3. MDX body — split frontmatter from body
  const bodyMatch = content.match(/^(---\r?\n[\s\S]*?\r?\n---)([\s\S]*)$/);
  if (bodyMatch) {
    const [, fm, body] = bodyMatch;
    let newBody = translateMdxBody(body);
    newBody = await localizeProjectTextBlocks(newBody);
    if (newBody !== body) {
      content = fm + newBody;
      modified = true;
    }
  }

  if (modified && !dryRun) {
    fs.writeFileSync(file, content);
  }
  return modified;
}

// ─── Main ─────────────────────────────────────────────────────────────────
const files = fs.readdirSync(PROJECTS_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .filter((f) => !targetSlug || f === `${targetSlug}.mdx`)
  .sort();

console.log(`Mode: ${HAS_API ? 'Claude API (' + MODEL + ')' : 'dictionary only'}`);
console.log(`Files: ${files.length}${dryRun ? ' (dry-run)' : ''}`);
console.log('');

let changed = 0;
let processed = 0;
for (const f of files) {
  const file = path.join(PROJECTS_DIR, f);
  try {
    const did = await processFile(file);
    processed++;
    if (did) changed++;
    process.stdout.write(`\r[${processed}/${files.length}] ${did ? '✎' : ' '} ${f.padEnd(48)}`);
  } catch (err) {
    console.error(`\n[error] ${f}: ${err.message}`);
  }
}
console.log(`\n\nDone. ${changed}/${processed} files modified.`);
