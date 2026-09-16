// src/lib/estimator.mjs — the price calculator UI. Plain ESM, no framework: runs on the site
// (components/pricing/Estimator.astro) and inside the pricing admin (tools/editor/pricing, served
// as /lib/estimator.mjs) with `internal: true`, which adds the quote-only levers and VAT.
//
// A project is a list of cards: subjects (building, interior spaces, show flats, product) that
// each own a model line and their outputs, plus project-wide output groups (film, plans, AI
// stills, tour extras, web). Cards are defined in pricing.json → calculator.kinds; the option
// semantics that turn a card into price-list lines live in entryLines() below. Math: pricing.mjs
// quoteEntries() — tiers count the whole project, multipliers come from each card's options.
// State lives in the URL hash (#p=…), never in storage.
import { quoteEntries, item, fmt, fmtHuf, fmtPrice, fmtBoth, optValue, defaultState } from './pricing.mjs';

export const UI = {
  en: {
    startFrom: 'Start from', source: 'You can supply',
    sourceTip: 'What we model from. A usable 3D model halves model preparation, a PDF or sketch doubles it.',
    add: 'Add', subjects: 'Subjects', outputs: 'Project-wide', details: 'Codes and unit prices', remove: 'Remove', name: 'Name',
    size: 'Model size', site: 'Wider site and environment', area: 'Area', model: 'Interior model',
    furnished: 'furnished — modelled views and tour', empty: 'empty shell — AI-furnished images',
    types: 'Distinct unit types', typesTip: 'Repeated flat types make plans cheaper.',
    custom: 'custom quote', customLines: 'Quoted separately', xl: 'scoped in expert days, quoted separately',
    total: 'Estimate, net EUR', vat: 'VAT 27 % (HU)', gross: 'Gross', closest: 'Closest package:', above: 'above', below: 'below',
    nothing: 'Nothing priced yet — pick a start above or add a subject.', needsMod: 'Rendered items need model preparation (MOD) on the same order.',
    underMin: 'A film line is under its minimum length.', min: 'min.',
    request: 'Request this quote', copy: 'Copy estimate', copied: 'Copied', link: 'Copy link', print: 'Print / PDF', reset: 'Clear all',
    note: 'Point estimate from list prices. Rush and framework terms are settled on the quote.',
    fullCalc: 'Full price calculator with every service →', msgHead: 'Estimate from the price list', net: 'net',
    replace: 'Replace the current estimate?', addOutput: 'Add', more: 'more', hint: 'Fold or unfold a card by its header. Hover a name for what it includes.',
    sliderLabel: 'seconds', frameworkLine: 'Framework agreement', rushLine: 'Rush delivery',
  },
  hu: {
    startFrom: 'Kiindulás', source: 'Amit át tud adni',
    sourceTip: 'Amiből modellezünk. Használható 3D modellből feleannyi a modell-előkészítés, PDF-ből vagy vázlatból a dupla.',
    add: 'Hozzáadás', subjects: 'Témák', outputs: 'Projektszintű', details: 'Kódok és egységárak', remove: 'Eltávolítás', name: 'Név',
    size: 'Modell mérete', site: 'Tágabb telek és környezet', area: 'Terület', model: 'Belső modell',
    furnished: 'berendezett — modellezett nézetek és túra', empty: 'üres héj — AI-berendezett képek',
    types: 'Különböző lakástípusok', typesTip: 'Az ismétlődő lakástípusok olcsóbbá teszik az alaprajzokat.',
    custom: 'egyedi ajánlat', customLines: 'Külön ajánlattal', xl: 'szakértői napokban felmérve, külön ajánlat',
    total: 'Becslés, nettó EUR', vat: 'ÁFA 27 %', gross: 'Bruttó', closest: 'Legközelebbi csomag:', above: 'fölötte', below: 'alatta',
    nothing: 'Még nincs beárazva semmi — válasszon kiindulást fent, vagy adjon hozzá témát.', needsMod: 'A renderelt tételekhez modell-előkészítés (MOD) kell ugyanazon a megrendelésen.',
    underMin: 'Egy filmtétel a minimális hossz alatt van.', min: 'min.',
    request: 'Ajánlatot kérek erre', copy: 'Becslés másolása', copied: 'Másolva', link: 'Link másolása', print: 'Nyomtatás / PDF', reset: 'Törlés',
    note: 'Pontbecslés listaárakból. Sürgősségi és keretszerződéses feltételek az ajánlatban.',
    fullCalc: 'Teljes árkalkulátor minden szolgáltatással →', msgHead: 'Becslés az árlistából', net: 'nettó',
    replace: 'Lecseréli a jelenlegi becslést?', addOutput: 'Hozzáadás', more: 'további', hint: 'A kártyák a fejlécükre kattintva nyílnak és záródnak. A név fölé állva látszik, mit tartalmaz.',
    sliderLabel: 'másodperc', frameworkLine: 'Keretszerződés', rushLine: 'Sürgős határidő',
  },
};

const SIZES = ['S', 'M', 'L', 'XL'];
// card option defaults — the hash omits options at their default
const DEF = { size: 'S', site: 0, m2: 40, fn: 'res', furn: 1, detail: 'standard', stillsOnly: 'incl', formats: 'one', fourK: 'hd', v360: 'flat', types: 10 };
const t = (v, lang) => (v && typeof v === 'object' ? (v[lang] ?? v.en ?? '') : (v ?? ''));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let seq = 0;
const kindOf = (D, key) => D.calculator.kinds.find((k) => k.key === key);
const optLabel = (D, k, key, lang) => { const o = D.multipliers[k]?.options.find((x) => x.key === key); return o ? t(o.long ?? o.label, lang) : key; };

// ── project model ───────────────────────────────────────────────────────────
export function newEntry(D, kindKey, lang, over = {}) {
  const K = kindOf(D, kindKey);
  if (!K) return null;
  const opts = {};
  for (const k of K.opts ?? []) opts[k] = DEF[k];
  Object.assign(opts, over.opts ?? {});
  const e = { id: 'e' + (++seq), kind: K.key, name: over.name != null ? t(over.name, lang) : '', opts, q: {}, open: true };
  const rows = over.q ? [] : visibleRows(K, e);
  for (const r of rows) if (r.default) e.q[r.code] = r.default;
  if (over.q) for (const [c, n] of Object.entries(over.q)) if (item(D, c) && n > 0) e.q[c] = n;
  return e;
}
export const visibleRows = (K, e) => K.rows.filter((r) => !r.when || (r.when === 'furn') === !!+e.opts.furn);
export const displayName = (D, e, lang) => e.name || t(kindOf(D, e.kind).defaultName ?? kindOf(D, e.kind).name, lang);

// price-list lines a card produces: model line(s) from its options, then its outputs
export function entryLines(D, e) {
  const K = kindOf(D, e.kind), o = e.opts, out = [], custom = [];
  const push = (code, q, opts) => { if (item(D, code) && q > 0) out.push({ code, q, opts, types: o.types, group: e.id, ref: e }); };
  if (e.kind === 'ext') {
    const mod = 'MOD.' + (o.size || 'S');
    if (item(D, mod)?.custom) custom.push(mod); else push(mod, 1);
    if (+o.site) custom.push('MOD.SITE');
  }
  if (e.kind === 'int') push(+o.furn ? 'MOD.INT.FURN' : 'MOD.INT.EMPTY', +o.m2 || 0, { fn: o.fn, detail: o.detail });
  const rowOpts = {};
  for (const k of K.opts ?? []) if (D.multipliers?.[k]) rowOpts[k] = o[k];
  for (const r of visibleRows(K, e)) push(r.code, e.q[r.code] || 0, rowOpts);
  return { lines: out, custom };
}

export function projectState(D, P) {
  const st = defaultState(D);
  st.source = optValue(D, 'source', P.src || 'cad');
  if (P.fw) st.framework = optValue(D, 'framework', P.fw);
  if (P.rush) st.rush = optValue(D, 'rush', P.rush);
  return st;
}
export function quoteProject(D, P) {
  const all = P.entries.flatMap((e) => entryLines(D, e).lines);
  const Q = quoteEntries(D, projectState(D, P), all);
  Q.custom = P.entries.flatMap((e) => entryLines(D, e).custom.map((code) => ({ it: item(D, code), e })));
  Q.sub = Object.fromEntries(P.entries.map((e) => [e.id, Q.lines.filter((l) => l.e.ref === e).reduce((a, l) => a + l.line, 0)]));
  return Q;
}

// ── hash ────────────────────────────────────────────────────────────────────
// #p=src=cad[,fw=…,rush=…]/kind:name:opt=v,…:CODE=n,…/…   (names URL-encoded; defaults omitted)
export function serialize(P) {
  const head = ['src=' + (P.src || 'cad'), P.fw && P.fw !== 'standard' ? 'fw=' + P.fw : '', P.rush && P.rush !== 'none' ? 'rush=' + P.rush : ''].filter(Boolean).join(',');
  const es = P.entries.map((e) => [
    e.kind, encodeURIComponent(e.name || ''),
    Object.entries(e.opts).filter(([k, v]) => String(v) !== String(DEF[k])).map(([k, v]) => k + '=' + encodeURIComponent(v)).join(','),
    Object.entries(e.q).filter(([, n]) => n > 0).map(([c, n]) => c + '=' + n).join(','),
  ].join(':'));
  return '#p=' + [head, ...es].join('/');
}
export function parse(D, hash, lang) {
  if (hash.startsWith('#e=')) return parseLegacy(D, hash, lang);
  if (!hash.startsWith('#p=')) return null;
  const [head, ...es] = hash.slice(3).split('/');
  const P = { src: 'cad', entries: [] };
  for (const kv of head.split(',')) { const [k, v] = kv.split('='); if (k === 'src' && D.multipliers.source?.options.some((o) => o.key === v)) P.src = v; if (k === 'fw') P.fw = v; if (k === 'rush') P.rush = v; }
  for (const s of es) {
    const [kind, name, opts, qs] = s.split(':');
    const K = kindOf(D, kind); if (!K) continue;
    const e = newEntry(D, kind, lang, { q: {} });
    e.name = decodeURIComponent(name || '');
    for (const kv of (opts || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); if (k in DEF) e.opts[k] = /^\d+(\.\d+)?$/.test(v) ? +v : decodeURIComponent(v); }
    for (const kv of (qs || '').split(',').filter(Boolean)) { const [c, n] = kv.split('='); if (item(D, c) && +n > 0) e.q[c] = +n; }
    e.open = false;
    P.entries.push(e);
  }
  return P;
}
// legacy links: #e=tab;source;CODE:n,…,types:n → cards by family
function parseLegacy(D, hash, lang) {
  const m = hash.match(/^#e=([^;]*);?([^;]*);?(.*)$/); if (!m) return null;
  const q = {}; let types;
  for (const p of (m[3] || '').split(',')) { const [c, n] = p.split(':'); if (c === 'types') types = +n; else if (item(D, c) && +n > 0) q[c] = +n; }
  const P = fromQty(D, q, types, lang);
  if (D.multipliers.source?.options.some((o) => o.key === m[2])) P.src = m[2];
  return P;
}
// a flat {code: n} map (presets, legacy links) → cards: model lines pick the subject's options, every other code goes to the first kind whose rows list it
export function fromQty(D, q, types, lang) {
  const P = { src: 'cad', entries: [] }, left = { ...q };
  const take = (code) => { const n = left[code]; delete left[code]; return n; };
  const size = SIZES.find((s) => left['MOD.' + s]); const site = take('MOD.SITE'); SIZES.forEach((s) => take('MOD.' + s));
  const ext = kindOf(D, 'ext'), extCodes = ext.rows.map((r) => r.code).filter((c) => left[c]);
  if (size || extCodes.length) { const e = newEntry(D, 'ext', lang, { opts: { size: size || 'S', site: site ? 1 : 0 }, q: Object.fromEntries(extCodes.map((c) => [c, take(c)])) }); P.entries.push(e); }
  const furn = take('MOD.INT.FURN'), empty = take('MOD.INT.EMPTY'), intK = kindOf(D, 'int');
  const intCodes = intK.rows.map((r) => r.code).filter((c) => left[c]);
  if (furn || empty || intCodes.length) P.entries.push(newEntry(D, 'int', lang, { opts: { m2: furn || empty || 100, furn: empty && !furn ? 0 : 1 }, q: Object.fromEntries(intCodes.map((c) => [c, take(c)])) }));
  for (const K of D.calculator.kinds) {
    if (K.key === 'ext' || K.key === 'int') continue;
    const codes = K.rows.map((r) => r.code).filter((c) => left[c]);
    if (codes.length) P.entries.push(newEntry(D, K.key, lang, { opts: types && K.opts?.includes('types') ? { types } : {}, q: Object.fromEntries(codes.map((c) => [c, take(c)])) }));
  }
  for (const e of P.entries) e.open = false;
  return P;
}
export const fromStart = (D, start, lang) => ({ src: 'cad', entries: start.entries.map((s) => { const e = newEntry(D, s.kind, lang, { name: s.name, opts: s.opts, q: s.q }); e.open = false; return e; }) });

// ── text ────────────────────────────────────────────────────────────────────
export function briefOf(D, e, lang) {
  const K = kindOf(D, e.kind), o = e.opts, parts = [];
  if (e.kind === 'ext') parts.push(t(item(D, 'MOD.' + o.size)?.name, lang).split(' — ')[0], +o.site ? t(item(D, 'MOD.SITE')?.name, lang) : '');
  if (e.kind === 'int') parts.push(`${o.m2} m²`, optLabel(D, 'fn', o.fn, lang), +o.furn ? (o.detail !== DEF.detail ? optLabel(D, 'detail', o.detail, lang) : '') : UIfor(lang).empty.split(' — ')[0]);
  for (const r of visibleRows(K, e)) if (e.q[r.code]) { let s = t(r.short ?? item(D, r.code).unit, lang); if (lang === 'en' && e.q[r.code] === 1 && /[a-z]s$/.test(s)) s = s.slice(0, -1); parts.push(`${e.q[r.code]} ${s}`); }
  for (const k of K.opts ?? []) if (D.multipliers?.[k] && k !== 'fn' && k !== 'detail' && String(o[k]) !== String(DEF[k])) parts.push(optLabel(D, k, o[k], lang));
  if (K.opts?.includes('types') && o.types !== DEF.types) parts.push(`${o.types} ${UIfor(lang).types.toLowerCase()}`);
  return parts.filter(Boolean).join(' · ');
}
const UIfor = (lang) => UI[lang] ?? UI.en;

export function quoteText(D, P, Q, lang, extra = {}) {
  const ui = UIfor(lang), L = [];
  L.push(`${ui.msgHead} ${D.version}${extra.date ? ' · ' + extra.date : ''}`);
  if (extra.head) L.push(...extra.head);
  L.push(`${ui.source}: ${optLabel(D, 'source', P.src || 'cad', lang)}`);
  if (P.fw && P.fw !== 'standard') L.push(`${ui.frameworkLine} ×${optValue(D, 'framework', P.fw)}`);
  if (P.rush && P.rush !== 'none') L.push(`${ui.rushLine} ×${optValue(D, 'rush', P.rush)}`);
  for (const e of P.entries) {
    const ls = Q.lines.filter((l) => l.e.ref === e), cs = Q.custom.filter((c) => c.e === e);
    if (!ls.length && !cs.length) continue;
    L.push('', `${displayName(D, e, lang)} — ${briefOf(D, e, lang)}`);
    for (const l of ls) L.push(`  ${l.it.code.padEnd(14)} ${l.q} ${t(l.it.unit, lang)} × ${fmtPrice(l.unit, lang, D.peg)}${l.tiered ? ' (' + (lang === 'hu' ? 'sávos' : 'tiered') + ')' : ''} = ${fmtPrice(l.line, lang, D.peg)}`);
    for (const c of cs) L.push(`  ${c.it.code.padEnd(14)} ${t(c.it.name, lang)} — ${t(c.it.custom, lang)}${c.it.range ? ` (${fmtPrice(c.it.range[0], lang, D.peg)}–${fmtPrice(c.it.range[1], lang, D.peg)})` : ''}`);
  }
  L.push('', `${lang === 'hu' ? 'Összesen' : 'Total'}: ${fmtBoth(Q.total, lang, D.peg)} ${ui.net}` + (lang !== 'hu' && extra.huf ? ` (${fmtHuf(Q.total, D.peg)})` : ''));
  if (extra.vat && D.vat) L.push(`${ui.vat}: ${fmtBoth(Q.total * D.vat, lang, D.peg)} · ${ui.gross}: ${fmtBoth(Q.total * (1 + D.vat), lang, D.peg)}`);
  if (extra.url) L.push(extra.url);
  if (extra.tail) L.push('', ...extra.tail);
  return L.join('\n');
}

// ── DOM ─────────────────────────────────────────────────────────────────────
// o: { lang, internal, scope, embedded, contactUrl, estimateUrl, hashState (default true), onChange, textExtra() → extra quoteText fields (client, terms…) }
export function mount(root, D, o = {}) {
  const lang = o.lang || 'en', ui = { ...UIfor(lang), ...(o.ui || {}) };
  const tt = (v) => t(v, lang);
  const money = (n) => (lang === 'hu' ? `${fmtHuf(n, D.peg)}<small>(${fmt(n, lang)})</small>` : fmt(n, lang));
  const kinds = D.calculator.kinds.filter((K) => !o.scope || o.scope.includes(K.key));
  const starts = (D.calculator.starts ?? []).filter((s) => s.entries.every((e) => kinds.some((K) => K.key === e.kind)));
  const presets = (D.presets ?? []).filter((p) => p.public !== false && p.total > 0);
  const useHash = o.hashState !== false && typeof location !== 'undefined';
  let P = (useHash && parse(D, location.hash, lang)) || { src: 'cad', entries: [] };
  let dirty = useHash && /^#(p|e)=/.test(location.hash), details = false;
  if (!P.entries.length && starts.length) P = fromStart(D, starts[0], lang);   // never an empty page: the first start is the default project
  if (P.entries.length === 1) P.entries[0].open = true;
  const write = () => { if (useHash && dirty) history.replaceState(null, '', serialize(P) ); };
  const tip = (text, cls = '') => (text ? ` class="est-tip ${cls}" tabindex="0" data-tip="${esc(text)}"` : ` class="${cls}"`);
  // multiplier factors are quote-side information: shown in the admin's quote builder only
  const factor = (v) => (o.internal && v !== 1 ? `<small>×${v}</small>` : '');
  const price = (n) => fmtPrice(n, lang, D.peg);

  // ── option controls ──
  function control(e, k) {
    const o2 = e.opts, id = `${e.id}-${k}`;
    if (k === 'size') return `<div class="est-opt"><span class="est-optlbl">${ui.size}</span><div class="est-seg" role="group" data-opt="size">${SIZES.map((s) => { const it = item(D, 'MOD.' + s); if (!it) return ''; const [short, rest] = tt(it.name).split(' — '); return `<button type="button" data-v="${s}" aria-pressed="${o2.size === s}"${tip((rest ? rest + '. ' : '') + tt(it.help))}>${short}</button>`; }).join('')}</div>${o2.size === 'XL' ? `<small class="est-hint">${ui.xl}</small>` : ''}</div>`;
    if (k === 'site') { const it = item(D, 'MOD.SITE'); return `<label class="est-opt est-switch"${tip(tt(it?.help))}><input type="checkbox" data-opt="site" ${+o2.site ? 'checked' : ''}><span>${ui.site}</span><small>${it?.range ? `${price(it.range[0])}–${price(it.range[1])} · ` : ''}${ui.custom}</small></label>`; }
    if (k === 'm2') return `<label class="est-opt est-numopt"><span class="est-optlbl">${ui.area}</span><input type="number" class="field" data-opt="m2" min="5" step="5" inputmode="numeric" value="${+o2.m2 || 0}"><span class="est-unit">m²</span></label>`;
    if (k === 'furn') return `<label class="est-opt"><span class="est-optlbl">${ui.model}</span><select class="field" data-opt="furn"><option value="1"${+o2.furn ? ' selected' : ''}>${ui.furnished}</option><option value="0"${!+o2.furn ? ' selected' : ''}>${ui.empty}</option></select></label>`;
    if (k === 'types') return `<label class="est-opt est-numopt"${tip(ui.typesTip)}><span class="est-optlbl">${ui.types}</span><input type="number" class="field" data-opt="types" min="1" step="1" inputmode="numeric" value="${+o2.types || 1}"></label>`;
    const m = D.multipliers?.[k]; if (!m) return '';
    if (k === 'detail' && !+o2.furn) return '';
    const label = tt(m.label).split(' · ').pop();
    if (m.options.length === 2) { const on = m.options.find((x) => !x.default); return `<label class="est-opt est-switch"${tip(tt(m.note))}><input type="checkbox" data-opt="${k}" ${o2[k] === on.key ? 'checked' : ''}><span>${tt(on.long ?? on.label)}</span>${factor(on.value)}</label>`; }
    return `<label class="est-opt"${tip(tt(m.note))}><span class="est-optlbl">${label[0].toUpperCase() + label.slice(1)}</span><select class="field" data-opt="${k}">${m.options.map((x) => `<option value="${x.key}"${o2[k] === x.key ? ' selected' : ''}>${tt(x.long ?? x.label)}${o.internal && x.value !== 1 ? ` ×${x.value}` : ''}</option>`).join('')}</select></label>`;
  }
  function row(e, r, by) {
    const it = item(D, r.code), q = e.q[r.code] || 0, l = by[e.id + '|' + r.code], step = r.step || 1;
    const line = l ? price(l.line) : '';
    return `<div class="est-row" data-code="${r.code}">
      <span class="est-rname"${tip(tt(it.help))}>${tt(it.name)}</span>
      <span class="est-qty"><button type="button" class="est-step" data-step="-${step}" aria-label="−">−</button><input type="number" class="field" min="0" step="${step}" inputmode="numeric" value="${q}" data-code="${r.code}" aria-label="${esc(tt(it.name))}"><button type="button" class="est-step" data-step="${step}" aria-label="+">+</button><span class="est-unit">${tt(it.unit)}</span></span>
      <span class="est-line">${line}${l?.underMin ? `<small>${ui.min} ${it.min} ${tt(it.unit)}</small>` : ''}</span>
      ${r.slider ? `<input type="range" class="est-range" min="${r.slider[0]}" max="${r.slider[1]}" step="${step}" value="${Math.min(q, r.slider[1])}" data-code="${r.code}" aria-label="${esc(tt(it.name))} ${ui.sliderLabel}">` : ''}
      ${details ? `<small class="est-detail"><span class="code">${it.code}</span> · ${price(l ? l.unit : it.base)} / ${tt(it.unit)}${l && l.tiered ? ` · ⌀ ${price(l.line / q)}` : ''}${it.desc ? ` · ${tt(it.desc)}` : ''}</small>` : ''}
    </div>`;
  }
  function card(e, Q, by) {
    const K = kindOf(D, e.kind), rows = visibleRows(K, e), active = rows.filter((r) => e.q[r.code] > 0), idle = rows.filter((r) => !(e.q[r.code] > 0));
    const sub = Q.sub[e.id], cust = Q.custom.filter((c) => c.e === e);
    const chips = (list) => list.map((r) => `<button type="button" class="est-chip" data-add="${r.code}"${tip(tt(item(D, r.code).help))}>+ ${tt(item(D, r.code).name)}</button>`).join('');
    const tagged = idle.filter((r) => r.tag), plain = idle.filter((r) => !r.tag);
    return `<section class="est-card${e.open ? ' is-open' : ''}${K.subject ? ' est-card--subject' : ''}" data-id="${e.id}">
      <header class="est-head">
        <button type="button" class="est-fold" aria-expanded="${e.open}" aria-label="${esc(displayName(D, e, lang))}"><span class="est-chev"></span></button>
        <span class="est-kind eyebrow">${tt(K.name)}</span>
        ${e.open ? `<input type="text" class="est-name field" value="${esc(e.name)}" placeholder="${esc(displayName(D, e, lang))}" aria-label="${ui.name}"${K.names ? ` list="est-names-${K.key}"` : ''}>` : `<b class="est-name">${esc(displayName(D, e, lang))}</b>`}
        <span class="est-brief">${esc(briefOf(D, e, lang))}</span>
        <b class="est-subtotal" data-sub="${e.id}">${sub ? price(sub) : (cust.length ? ui.custom : '')}</b>
      </header>
      <div class="est-body">
        <p class="est-lede">${tt(K.lede)}</p>
        ${K.opts?.length ? `<div class="est-opts">${K.opts.map((k) => control(e, k)).join('')}</div>` : ''}
        ${cust.length ? `<p class="est-custom">${cust.map((c) => `<span class="code">${c.it.code}</span> ${tt(c.it.name)} — ${tt(c.it.custom)}${c.it.range ? ` (${price(c.it.range[0])}–${price(c.it.range[1])})` : ''}`).join('<br>')}</p>` : ''}
        <div class="est-rows">${active.map((r) => row(e, r, by)).join('')}</div>
        ${plain.length ? `<div class="est-chips">${chips(plain)}</div>` : ''}
        ${tagged.length ? `<div class="est-chips est-chips--tag"><span class="est-taglbl">${tt(K.tags?.[tagged[0].tag])}</span>${chips(tagged)}</div>` : ''}
        <div class="est-foot"><button type="button" class="est-remove">${ui.remove}</button></div>
      </div>
    </section>`;
  }
  function renderAll() {
    const Q = quoteProject(D, P), by = Object.fromEntries(Q.lines.map((l) => [l.e.ref.id + '|' + l.it.code, l]));
    const subj = kinds.filter((K) => K.subject), grp = kinds.filter((K) => !K.subject);
    const addBtns = (list) => list.map((K) => `<button type="button" class="est-chip est-chip--add" data-kind="${K.key}"${tip(tt(K.lede))}>+ ${tt(K.name)}</button>`).join('');
    root.innerHTML = `
      <div class="est-top">
        ${starts.length ? `<div class="est-starts"><span class="est-lbl">${ui.startFrom}</span>${starts.map((s) => `<button type="button" class="est-chip" data-start="${s.key}">${tt(s.name)}</button>`).join('')}</div>` : ''}
        <label class="est-src"${tip(ui.sourceTip)}><span class="est-lbl">${ui.source}</span><select class="field" data-src>${D.multipliers.source.options.map((x) => `<option value="${x.key}"${(P.src || 'cad') === x.key ? ' selected' : ''}>${tt(x.long ?? x.label)}${o.internal ? ` ×${x.value}` : ''}</option>`).join('')}</select></label>
        <label class="est-details est-switch"><input type="checkbox" data-details ${details ? 'checked' : ''}><span>${ui.details}</span></label>
      </div>
      <div class="est-grid">
        <div class="est-main">
          <div class="est-cards">${P.entries.length ? P.entries.map((e) => card(e, Q, by)).join('') : `<p class="est-nothing">${ui.nothing}</p>`}</div>
          <div class="est-add">
            <span class="est-lbl">${ui.add}</span>
            ${subj.length ? `<span class="est-addgrp"><span class="est-taglbl">${ui.subjects}</span>${addBtns(subj)}</span>` : ''}
            ${grp.length ? `<span class="est-addgrp"><span class="est-taglbl">${ui.outputs}</span>${addBtns(grp)}</span>` : ''}
          </div>
          <p class="est-hint">${ui.hint}</p>
        </div>
        <aside class="est-sum">
          ${o.internal && D.multipliers.framework ? `<div class="est-internal">${['framework', 'rush'].map((k) => `<div class="est-opt"><span class="est-optlbl">${tt(D.multipliers[k].label)}</span><div class="est-seg" data-global="${k}">${D.multipliers[k].options.map((x) => `<button type="button" data-v="${x.key}" aria-pressed="${(k === 'framework' ? P.fw || 'standard' : P.rush || 'none') === x.key}">${tt(x.label)} ×${x.value}</button>`).join('')}</div></div>`).join('')}</div>` : ''}
          <p class="eyebrow">${ui.total}</p>
          <p class="est-total" data-total></p>
          <div class="est-vat" data-vat></div>
          <p class="est-near" data-near></p>
          <ul class="est-warns" data-warns></ul>
          <div class="est-lines" data-lines></div>
          ${o.contactUrl ? `<a class="btn btn-primary est-request" data-request href="${o.contactUrl}">${ui.request}</a>` : ''}
          <div class="est-actions"><button type="button" data-act="copy">${ui.copy}</button><button type="button" data-act="link">${ui.link}</button><button type="button" data-act="print">${ui.print}</button><button type="button" data-act="reset">${ui.reset}</button></div>
          ${o.embedded && o.estimateUrl ? `<a class="est-full" data-full href="${o.estimateUrl}">${ui.fullCalc}</a>` : ''}
          <p class="est-note">${ui.note}</p>
        </aside>
      </div>
      <div class="est-bar"><span data-bartotal></span>${o.contactUrl ? `<a class="btn btn-primary" data-request href="${o.contactUrl}">${ui.request}</a>` : ''}</div>
      ${kinds.filter((K) => K.names).map((K) => `<datalist id="est-names-${K.key}">${K.names.map((n) => `<option value="${esc(tt(n.name))}">`).join('')}</datalist>`).join('')}`;
    renderSum(Q);
  }
  // prices only — keeps focus in the input being typed into
  function renderPrices() {
    const Q = quoteProject(D, P), by = Object.fromEntries(Q.lines.map((l) => [l.e.ref.id + '|' + l.it.code, l]));
    root.querySelectorAll('.est-card').forEach((c) => {
      const e = P.entries.find((x) => x.id === c.dataset.id); if (!e) return;
      c.querySelector('[data-sub]').textContent = Q.sub[e.id] ? price(Q.sub[e.id]) : (Q.custom.some((x) => x.e === e) ? ui.custom : '');
      c.querySelector('.est-brief').textContent = briefOf(D, e, lang);
      c.querySelectorAll('.est-row').forEach((r) => { const l = by[e.id + '|' + r.dataset.code], it = item(D, r.dataset.code); r.querySelector('.est-line').innerHTML = (l ? price(l.line) : '') + (l?.underMin ? `<small>${ui.min} ${it.min} ${tt(it.unit)}</small>` : ''); const d = r.querySelector('.est-detail'); if (d && l) d.innerHTML = `<span class="code">${it.code}</span> · ${price(l.unit)} / ${tt(it.unit)}${l.tiered ? ` · ⌀ ${price(l.line / l.q)}` : ''}${it.desc ? ` · ${tt(it.desc)}` : ''}`; });
    });
    renderSum(Q);
  }
  function renderSum(Q) {
    write();
    const $ = (s) => root.querySelector(s);
    $('[data-total]').innerHTML = money(Q.total);
    $('[data-bartotal]').innerHTML = money(Q.total);
    $('[data-vat]').innerHTML = o.internal && D.vat ? `<span>${ui.vat}</span><b>${price(Q.total * D.vat)}</b><span>${ui.gross}</span><b>${price(Q.total * (1 + D.vat))}</b>` : '';
    const warns = []; if (Q.missing.length) warns.push(ui.needsMod); if (Q.lines.some((l) => l.underMin)) warns.push(ui.underMin);
    $('[data-warns]').innerHTML = warns.map((w) => `<li>${w}</li>`).join('');
    let near = '';
    if (Q.total > 0 && presets.length) { const p = presets.reduce((a, b) => (Math.abs(b.total - Q.total) < Math.abs(a.total - Q.total) ? b : a)); const d = Q.total - p.total; near = `${ui.closest} <b>${p.name}</b> ${price(p.total)} · ${price(Math.abs(d))} ${d >= 0 ? ui.above : ui.below}`; }
    $('[data-near]').innerHTML = near;
    $('[data-lines]').innerHTML = P.entries.map((e) => {
      const ls = Q.lines.filter((l) => l.e.ref === e), cs = Q.custom.filter((c) => c.e === e);
      if (!ls.length && !cs.length) return '';
      return `<p class="est-lines-head">${esc(displayName(D, e, lang))}</p><ul>${ls.map((l) => `<li><span class="code">${l.it.code}</span><span>${l.q} ${tt(l.it.unit)}</span><b>${price(l.line)}</b></li>`).join('')}${cs.map((c) => `<li class="est-lines-custom"><span class="code">${c.it.code}</span><span>${tt(c.it.name)}</span><b>${ui.custom}</b></li>`).join('')}</ul>`;
    }).join('') || `<p class="est-empty">${ui.nothing}</p>`;
    const url = useHash ? location.origin + location.pathname + serialize(P) : '';
    const text = quoteText(D, P, Q, lang, { url: o.estimateUrl ? (o.estimateUrl.startsWith('http') ? o.estimateUrl : location.origin + o.estimateUrl) + serialize(P) : url, ...(o.textExtra?.() || {}) });
    const lead = P.entries.reduce((a, e) => (Q.sub[e.id] > (a ? Q.sub[a.id] : 0) ? e : a), null);
    const type = lead ? kindOf(D, lead.kind).contact : '';
    root.querySelectorAll('[data-request]').forEach((a) => { a.href = `${o.contactUrl}?quote=${encodeURIComponent(text)}${type ? `&type=${encodeURIComponent(type)}` : ''}`; });
    const full = $('[data-full]'); if (full) full.href = o.estimateUrl + serialize(P);
    o.onChange?.({ P, Q, text });
  }

  // ── events ──
  const entryOf = (el) => P.entries.find((e) => e.id === el.closest('.est-card')?.dataset.id);
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button, .est-head'); if (!b) return;
    dirty = true;
    if (b.dataset.start) { const s = starts.find((x) => x.key === b.dataset.start); if (P.entries.some((e) => Object.values(e.q).some(Boolean)) && !confirm(ui.replace)) return; P = fromStart(D, s, lang); if (P.entries.length === 1) P.entries[0].open = true; return renderAll(); }
    if (b.dataset.kind) { const e = newEntry(D, b.dataset.kind, lang); P.entries.push(e); renderAll(); root.querySelector(`[data-id="${e.id}"] .est-name`)?.focus(); return; }
    if (b.dataset.act) return action(b.dataset.act, b);
    if (b.closest('[data-global]')) { const k = b.closest('[data-global]').dataset.global; if (k === 'framework') P.fw = b.dataset.v; else P.rush = b.dataset.v; return renderAll(); }
    const e = entryOf(b); if (!e) return;
    if (b.classList.contains('est-remove')) { P.entries = P.entries.filter((x) => x !== e); return renderAll(); }
    if (b.dataset.add) { e.q[b.dataset.add] = kindOf(D, e.kind).rows.find((r) => r.code === b.dataset.add)?.step || 1; if (item(D, b.dataset.add).min) e.q[b.dataset.add] = item(D, b.dataset.add).min; return renderAll(); }
    if (b.classList.contains('est-step')) { const inp = b.parentElement.querySelector('input'); const v = Math.max(0, (+inp.value || 0) + +b.dataset.step); e.q[inp.dataset.code] = v; if (v === 0) return renderAll(); inp.value = v; const rg = b.closest('.est-row').querySelector('.est-range'); if (rg) rg.value = v; return renderPrices(); }
    if (b.closest('[data-opt="size"]')) { e.opts.size = b.dataset.v; return renderAll(); }
    if (b.classList.contains('est-head') || b.classList.contains('est-fold')) { if (ev.target.closest('input')) return; e.open = !e.open; return renderAll(); }
  });
  root.addEventListener('input', (ev) => {
    const el = ev.target; dirty = true;
    if (el.dataset.code) { const e = entryOf(el); const v = Math.max(0, +el.value || 0); e.q[el.dataset.code] = v; const row = el.closest('.est-row'); row.querySelectorAll('[data-code]').forEach((x) => { if (x !== el) x.value = v; }); return renderPrices(); }
    if (el.classList.contains('est-name')) { const e = entryOf(el); e.name = el.value; const K = kindOf(D, e.kind); const hit = K.names?.find((n) => tt(n.name) === el.value); if (hit) { if (hit.m2) e.opts.m2 = hit.m2; if (hit.fn) e.opts.fn = hit.fn; el.closest('.est-card').querySelector('[data-opt="m2"]')?.setAttribute('value', hit.m2); const sel = el.closest('.est-card').querySelector('[data-opt="fn"]'); if (sel && hit.fn) sel.value = hit.fn; if (sel) sel.closest('.est-card').querySelector('[data-opt="m2"]').value = hit.m2; } return renderPrices(); }
    if (el.dataset.opt === 'm2' || el.dataset.opt === 'types') { const e = entryOf(el); e.opts[el.dataset.opt] = Math.max(el.dataset.opt === 'types' ? 1 : 0, +el.value || 0); return renderPrices(); }
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target; dirty = true;
    if (el.dataset.src !== undefined) { P.src = el.value; return renderAll(); }
    if (el.dataset.details !== undefined) { details = el.checked; return renderAll(); }
    if (el.dataset.code !== undefined && el.type === 'number' && !(+el.value > 0)) return renderAll();   // a zeroed row goes back to the chips
    const e = entryOf(el); if (!e) return;
    if (el.dataset.opt && el.dataset.opt !== 'm2' && el.dataset.opt !== 'types') {
      const k = el.dataset.opt;
      if (el.type === 'checkbox') e.opts[k] = k === 'site' ? (el.checked ? 1 : 0) : (el.checked ? D.multipliers[k].options.find((x) => !x.default).key : D.multipliers[k].options.find((x) => x.default).key);
      else e.opts[k] = k === 'furn' ? +el.value : el.value;
      if (k === 'furn') { const K = kindOf(D, e.kind); e.q = {}; for (const r of visibleRows(K, e)) if (r.default) e.q[r.code] = r.default; }
      return renderAll();
    }
    if (el.classList.contains('est-name')) return renderAll();
  });
  function action(act, b) {
    const Q = quoteProject(D, P);
    if (act === 'reset') { P = { src: P.src, fw: P.fw, rush: P.rush, entries: [] }; return renderAll(); }
    const url = (o.estimateUrl ? (o.estimateUrl.startsWith('http') ? o.estimateUrl : location.origin + o.estimateUrl) : location.origin + location.pathname) + serialize(P);
    const text = quoteText(D, P, Q, lang, { url, date: new Date().toISOString().slice(0, 10), vat: o.internal, huf: o.internal, ...(o.textExtra?.() || {}) });
    if (act === 'copy' || act === 'link') { navigator.clipboard?.writeText(act === 'copy' ? text : url).then(() => { const was = b.textContent; b.textContent = ui.copied; setTimeout(() => (b.textContent = was), 1200); }); }
    if (act === 'print') printQuote(text);
  }
  function printQuote(text) {
    const w = window.open('', '_blank', 'width=760,height=900'); if (!w) return;
    w.document.write(`<!doctype html><title>Vision Graphics · ${ui.msgHead}</title><style>body{font:13px/1.5 "Work Sans",system-ui,sans-serif;color:#18160f;margin:2.5rem;max-width:70ch}pre{font:12px/1.55 "DM Mono",Consolas,monospace;white-space:pre-wrap}h1{font-size:1.1rem;letter-spacing:.15em;text-transform:uppercase;color:#c41010;margin:0 0 1.5rem}</style><h1>Vision Graphics Kft.</h1><pre>${esc(text)}</pre>`);
    w.document.close(); w.focus(); w.print();
  }

  renderAll();
  if (useHash) {
    if (/^#(p|e)=/.test(location.hash)) root.closest('[id]')?.scrollIntoView();
    window.addEventListener('hashchange', () => { if (!/^#(p|e)=/.test(location.hash)) return; const N = parse(D, location.hash, lang); if (!N) return; P = N; dirty = true; renderAll(); root.closest('[id]')?.scrollIntoView(); });
  }
  return {
    get project() { return P; },
    set project(N) { P = N; renderAll(); },
    quote: () => quoteProject(D, P),
    text: (extra) => quoteText(D, P, quoteProject(D, P), lang, extra),
    render: renderAll,
  };
}
