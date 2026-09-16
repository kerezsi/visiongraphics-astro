// src/lib/pricing.mjs — the ONE implementation of the price-list math.
//
// Consumers: the pricing page + /pricing.json endpoint (build time), the
// pricing admin tool (tools/editor/pricing, served by the editor server) and
// any client-side calculator. Pure functions, no imports, plain ESM so the
// admin tool can load it without a bundler.
//
//   data  = src/data/pricing.json
//   state = { peg, types, qty:{code:n}, base:{code:n}, <multiplierKey>: value… }
//
// Item fields that drive the math (everything else is display):
//   base     unit price EUR          min     minimum quantity (warning only)
//   mult     [multiplier keys]       tier    'pano' | 'bulk5' | 'sqm' (tiered unit count)
//   bundle   {from, x}               ratio   {fixed}   (× fixed + (1-fixed)·types/qty)
//   level    {ref, avg, min}         needs   family code required on the same quote
//   noRush   exempt from rush        custom  no price (quoted separately)
//   range    [from, to] EUR, shown next to custom (display only)
//   help     {en,hu} hover text · tech [vision-tech slugs] · family.services [service slugs] — crosslinks only
//   data.calculator  estimator cards (kinds) and one-click project shapes (starts) — src/lib/estimator.mjs
// ponytail: multipliers are plain factors, tiers are two shapes; no rules engine.

export const item = (data, code) => data.items.find((i) => i.code === code);

// A multiplier option's factor from its key ('ret' → 1.3); numbers pass through (legacy state holds values).
export const optValue = (data, k, v) =>
  typeof v === 'string' ? (data.multipliers[k]?.options.find((o) => o.key === v)?.value ?? 1) : (v ?? 1);

export function defaultState(data) {
  const s = { peg: data.peg, types: 10, qty: {}, base: {} };
  for (const [k, m] of Object.entries(data.multipliers)) {
    s[k] = (m.options.find((o) => o.default) ?? m.options[0]).value;
  }
  return s;
}

export const base = (state, it) => state.base?.[it.code] ?? it.base;

// Tiered unit counts: 'sqm' = marginal bands [[upTo, factor]…] (last upTo null),
// 'pano' / 'bulk5' = block discount {block, step, floor}: block k costs 1 - k·step, floored.
export function units(data, it, q) {
  const t = it.tier && data.tiers[it.tier];
  if (!t) return q;
  if (Array.isArray(t)) {
    let s = 0, prev = 0;
    for (const [up, r] of t) {
      const cap = up ?? Infinity;
      if (q <= prev) break;
      s += (Math.min(q, cap) - prev) * r;
      prev = cap;
    }
    return s;
  }
  let s = 0;
  for (let i = 0; i < q; i++) s += Math.max(t.floor, 1 - t.step * Math.floor(i / t.block));
  return s;
}

export function multiplier(data, state, it) {
  let m = 1;
  const q = state.qty[it.code] || 0;
  for (const k of it.mult ?? []) m *= state[k] ?? 1;
  if (it.bundle && q >= it.bundle.from) m *= it.bundle.x;
  if (it.ratio) m *= q ? it.ratio.fixed + (1 - it.ratio.fixed) * Math.min(1, state.types / q) : 1;
  if (it.level) {
    const f = state.qty[it.level.ref] || 0;
    m *= q ? Math.max(it.level.min, f / q) / it.level.avg : 1;
  }
  for (const [k, g] of Object.entries(data.multipliers)) {
    if (g.global && !(g.unless && it[g.unless])) m *= state[k] ?? 1;
  }
  return m;
}

export function lineTotal(data, state, it, q) {
  if (it.custom || !q) return 0;
  return base(state, it) * multiplier(data, state, it) * units(data, it, q);
}

// Full quote from entries: [{ code, q, opts?, types?, group? }]. Several entries may share a
// code (one per subject of a project): tiers and bundles count the project-wide quantity and each
// entry takes its share, while item multipliers (fn, detail, formats…) come from the entry's own
// opts (option keys) and fall back to the state's values. `types` (PLAN.UNIT ratio) and the
// level.ref quantity (PLAN.LEVEL) are read from entries of the same group, so plan groups stay local.
export function quoteEntries(data, state, entries) {
  const tot = {};
  for (const e of entries) tot[e.code] = (tot[e.code] || 0) + (e.q || 0);
  const lines = [], fams = new Set();
  let total = 0;
  for (const e of entries) {
    const it = item(data, e.code), q = e.q || 0;
    if (!it || !q || it.custom) continue;
    fams.add(it.family);
    const st = { ...state, types: e.types ?? state.types, qty: { [it.code]: tot[it.code] } };
    if (it.level) st.qty[it.level.ref] = entries.filter((x) => x.code === it.level.ref && x.group === e.group).reduce((a, x) => a + (x.q || 0), 0);
    for (const k of it.mult ?? []) if (e.opts && k in e.opts) st[k] = optValue(data, k, e.opts[k]);
    const unit = base(state, it) * multiplier(data, st, it);
    const u = units(data, it, tot[it.code]) * (q / tot[it.code]);
    const line = unit * u;
    lines.push({ it, q, unit, units: u, line, tiered: u !== q, underMin: !!it.min && q < it.min, e });
    total += line;
  }
  const missing = [...new Set(lines.map((l) => l.it.needs).filter((f) => f && !fams.has(f)))];
  return { lines, total, missing };
}

// Flat quote from state.qty {code: n}, lines in price-list order.
export function quote(data, state) {
  const entries = data.items.filter((it) => state.qty[it.code]).map((it) => ({ code: it.code, q: state.qty[it.code] }));
  return quoteEntries(data, state, entries);
}

export function presetTotal(data, p) {
  const s = defaultState(data);
  s.qty = { ...p.q };
  if (p.types) s.types = p.types;
  return quote(data, s).total;
}

// What the live sites may publish: the list, public presets with computed
// totals, the AI self-serve subset. Internal multipliers (framework, rush,
// source…) stay quote-only — see PRICING_2026.md §5.
export function publicView(data) {
  const pub = (it) => it.public !== false;
  const b = (code) => item(data, code).base;
  const fmts = data.multipliers.formats.options;
  return {
    version: data.version,
    updated: data.updated,
    peg: data.peg,
    vat: data.vat,
    families: data.families,
    items: data.items.filter(pub).map(({ code, legacy, family, name, desc, help, tech, unit, base, min, custom, range }) =>
      ({ code, legacy, family, name, desc, help, tech, unit, base, min, custom, range })),
    presets: data.presets.filter(pub).map((p) => ({ ...p, total: Math.round(presetTotal(data, p)) })),
    ai: {
      image: b(data.ai.image), edit: b(data.ai.edit), variation: b(data.ai.variation),
      includedVariations: data.ai.includedVariations,
      motion: b(data.ai.motion), motionMin: item(data, data.ai.motion).min,
      motionMax: data.ai.motionMax, motionStep: data.ai.motionStep,
      formats: Object.fromEntries(fmts.map((o) => [o.key, o.value])),
      sliders: data.ai.sliders,
    },
    terms: data.terms,
  };
}

// What the on-page estimator gets: priceable items with their tier / bundle /
// ratio / level shape, the item-level option multipliers a client chooses per
// subject (source data, interior function and detail, tour inclusion, film
// formats / 4K / 360°), public presets and the card definitions. The global
// multipliers (framework, rush) stay quote-only.
export const CALC_MULTIPLIERS = ['source', 'fn', 'detail', 'stillsOnly', 'formats', 'fourK', 'v360'];
export function calcView(data) {
  const pub = publicView(data);
  return {
    version: data.version, peg: data.peg, tiers: data.tiers,
    multipliers: Object.fromEntries(CALC_MULTIPLIERS.filter((k) => data.multipliers[k]).map((k) => [k, data.multipliers[k]])),
    items: data.items.filter((it) => it.public !== false).map(({ code, family, name, desc, help, unit, base, min, tier, needs, bundle, ratio, level, custom, range, mult }) =>
      ({ code, family, name, desc, help, unit, base, min, tier, needs, bundle, ratio, level, custom, range, mult: (mult ?? []).filter((k) => CALC_MULTIPLIERS.includes(k)) })),
    presets: pub.presets.map(({ code, name, subtitle, total, q, types }) => ({ code, name, subtitle, total, q, types })),
    calculator: data.calculator,
  };
}

// One item's price label: "€180 / view", "€600–2,400 / project", or the custom note.
// With `peg`, Hungarian labels are in forint ("64 800 Ft / nézet") — the EUR goes on a second line.
export function priceLabel(it, lang = 'en', peg) {
  const u = it.unit[lang];
  const f = (n) => (lang === 'hu' && peg ? Math.round(n * peg).toLocaleString('hu-HU') : lang === 'hu' ? n.toLocaleString('hu-HU') : n.toLocaleString('en-US'));
  if (it.range) {
    const [a, b] = it.range;
    return (lang === 'hu' ? `${f(a)}–${f(b)} ${peg ? 'Ft' : '€'}` : `€${f(a)}–${f(b)}`) + ' / ' + u;
  }
  if (it.custom) return it.custom[lang];
  return `${fmtPrice(it.base, lang, peg)} / ${u}`;
}

export const fmt = (n, lang = 'en') =>
  lang === 'hu' ? Math.round(n).toLocaleString('hu-HU') + ' €' : '€' + Math.round(n).toLocaleString('en-US');
export const fmtHuf = (n, peg) => Math.round(n * peg).toLocaleString('hu-HU') + ' Ft';
// Hungarian pages price in forint at the peg, EUR elsewhere; fmtBoth adds the other currency in brackets on hu.
export const fmtPrice = (n, lang = 'en', peg) => (lang === 'hu' && peg ? fmtHuf(n, peg) : fmt(n, lang));
export const fmtBoth = (n, lang = 'en', peg) => (lang === 'hu' && peg ? `${fmtHuf(n, peg)} (${fmt(n, lang)})` : fmt(n, lang));
