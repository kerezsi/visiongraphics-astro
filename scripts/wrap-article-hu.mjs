// scripts/wrap-article-hu.mjs — make one article bilingual from a translation module.
//   node scripts/wrap-article-hu.mjs --dump [slug]        list prose segments + localizable props
//   node scripts/wrap-article-hu.mjs <slug> <hu.mjs>      apply; refuses to write if the EN text would change
// The translation module: export default { title, excerpt, props: { '<EN caption>': '<HU>' },
//   segments: ['<HU markdown for prose run 0>', ...] } — one segment per prose run --dump lists,
//   props keyed by the EN value of subtitle/beforeText/afterText/label/title on component lines.
// Run from the repo root (see CLAUDE.md §5.3 Articles and /translate-hu).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';

const ROOT = 'src/content/articles/';
const PROP_RE = /\b(subtitle|beforeText|afterText|label|title)=(?:"([^"]*)"|\{"([^"]*)"\})/g;

const SLUGS = readdirSync(ROOT).filter(f => f.endsWith('.mdx')).map(f => f.slice(0, -4));

function split(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  return { fm: m[1], body: m[2] };
}

// Segments: { type: 'prose', text } | { type: 'raw', text }  (raw = JSX line or {/* */} block)
function segment(body) {
  const lines = body.split('\n');
  const segs = [];
  let prose = [];
  const flush = () => {
    const t = prose.join('\n').replace(/^\n+|\n+$/g, '');
    if (t) segs.push({ type: 'prose', text: t });
    prose = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^<[A-Z]/.test(l) || /^\{\/\*/.test(l)) {
      flush();
      if (/^\{\/\*/.test(l) && !/\*\/\}\s*$/.test(l)) {
        const buf = [l];
        while (!/\*\/\}\s*$/.test(lines[i]) && i < lines.length - 1) buf.push(lines[++i]);
        segs.push({ type: 'raw', text: buf.join('\n') });
      } else segs.push({ type: 'raw', text: l });
    } else prose.push(l);
  }
  flush();
  return segs;
}

if (process.argv[2] === '--dump') {
  for (const slug of process.argv[3] ? [process.argv[3]] : SLUGS) {
    const { fm, body } = split(readFileSync(ROOT + slug + '.mdx', 'utf8'));
    const data = YAML.parse(fm);
    console.log(`\n=== ${slug}  (${typeof data.title === 'string' ? 'EN-only' : 'bilingual'})`);
    let p = 0;
    for (const s of segment(body)) {
      if (s.type === 'prose') console.log(`  [${p++}] ${s.text.split('\n')[0].slice(0, 70)}  …(${s.text.split(/\n\n+/).length} paras)`);
      else {
        const props = [...s.text.matchAll(PROP_RE)].map(m => `${m[1]}="${m[2] ?? m[3]}"`);
        console.log(`  <${s.text.match(/^<(\w+)/)?.[1] ?? 'comment'}> ${props.join(' | ')}`);
      }
    }
  }
  process.exit(0);
}

const jsStr = (s) => JSON.stringify(s);

{
  const [slug, trFile] = process.argv.slice(2);
  if (!slug || !trFile) throw new Error('usage: wrap-article-hu.mjs <slug> <translation.mjs> | --dump [slug]');
  const file = ROOT + slug + '.mdx';
  const tr = (await import(pathToFileURL(resolve(trFile)).href)).default;
  const src = readFileSync(file, 'utf8');
  const { fm, body } = split(src);
  const data = YAML.parse(fm);
  if (typeof data.title !== 'string') throw new Error(`${slug}: already bilingual`);

  // Frontmatter: title/excerpt → {en,hu}; other keys untouched in order.
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'title') out.title = { en: v, hu: tr.title };
    else if (k === 'excerpt') out.excerpt = { en: v, hu: tr.excerpt };
    else out[k] = v;
  }
  const fmOut = YAML.stringify(out, { lineWidth: 0 }).trimEnd();

  const segs = segment(body);
  const proseSegs = segs.filter(s => s.type === 'prose');
  if (proseSegs.length !== tr.segments.length)
    throw new Error(`${slug}: ${proseSegs.length} prose segments, ${tr.segments.length} translations`);
  const used = new Set();
  let pi = 0;
  const parts = segs.map(s => {
    if (s.type === 'prose') {
      const hu = tr.segments[pi++].trim();
      return `<Lang code="en">\n${s.text}\n</Lang>\n\n<Lang code="hu">\n${hu}\n</Lang>`;
    }
    return s.text.replace(PROP_RE, (all, name, a, b) => {
      const en = a ?? b;
      const hu = tr.props?.[en];
      if (hu == null) return all;
      used.add(en);
      return `${name}={{ en: ${jsStr(en)}, hu: ${jsStr(hu)} }}`;
    });
  });
  for (const k of Object.keys(tr.props ?? {})) if (!used.has(k)) throw new Error(`${slug}: unused prop translation ${jsStr(k)}`);
  const result = `---\n${fmOut}\n---\n\n${parts.join('\n\n')}\n`;

  // EN invariance: strip HU, unwrap Lang, un-localize props → must equal the original body.
  const back = result.replace(/^---\n[\s\S]*?\n---\n\n/, '')
    .replace(/<Lang code="hu">\n[\s\S]*?\n<\/Lang>\n\n?/g, '')
    .replace(/<Lang code="en">\n([\s\S]*?)\n<\/Lang>/g, '$1')
    .replace(/(\b(?:subtitle|beforeText|afterText|label|title))=\{\{ en: ("(?:[^"\\]|\\.)*"), hu: "(?:[^"\\]|\\.)*" \}\}/g,
      (all, name, en) => name === 'subtitle' && src.includes(`${name}={${en}}`) ? `${name}={${en}}` : `${name}=${en}`);
  const norm = (t) => t.replace(/\n{2,}/g, '\n\n').trim();
  if (norm(back) !== norm(body)) {
    throw new Error(`${slug}: EN text would change — not written`);
  }
  writeFileSync(file, result, 'utf8');
  console.log(`${slug}: ${proseSegs.length} segments, ${used.size} props`);
}
