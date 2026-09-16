// scripts/check-pricing.mjs — the one runnable check for src/lib/pricing.mjs.
// Fails (exit 1) if a preset total drifts from the values confirmed 2026-09-14
// or if the data has duplicate / dangling codes. Run: node scripts/check-pricing.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { presetTotal, publicView, calcView, priceLabel, item, quote, defaultState } from '../src/lib/pricing.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/pricing.json', import.meta.url), 'utf8'));

// codes unique, families exist, refs resolve
const codes = new Set();
for (const it of data.items) {
  assert.ok(!codes.has(it.code), `duplicate code ${it.code}`);
  codes.add(it.code);
  assert.ok(data.families.some((f) => f.code === it.family), `${it.code}: unknown family ${it.family}`);
  assert.ok(/^[A-Z]+(\.[A-Z0-9]+){1,2}$/.test(it.code), `${it.code}: code format`);
  for (const k of it.mult ?? []) assert.ok(data.multipliers[k], `${it.code}: unknown multiplier ${k}`);
  if (it.level) assert.ok(codes.has(it.level.ref) || data.items.some((x) => x.code === it.level.ref), `${it.code}: level.ref`);
}
for (const p of data.presets) for (const c of Object.keys(p.q)) assert.ok(item(data, c), `${p.code}: unknown item ${c}`);
for (const k of ['image', 'edit', 'variation', 'motion']) assert.ok(item(data, data.ai[k]), `ai.${k}`);

// preset totals — confirmed 2026-09-14
const expected = { PULI: 1975, VIZSLA: 7335, KUVASZ: 19233, KOMONDOR: 24033, CHECK: 22245 };
const got = Object.fromEntries(data.presets.map((p) => [p.code.split('.')[0], Math.round(presetTotal(data, p))]));
for (const [k, v] of Object.entries(expected)) assert.equal(got[k], v, `${k}: ${got[k]} ≠ ${v}`);

// tiers: 8 vp €1,400 · 20 vp €3,325 · 30 vp €4,725 ; 120 m² retail ×1.3 = 92 units × 25 × 1.3 = €2,990
// (PRICING_2026.md §2 quotes €2,210 / €5,000 for its A6 examples — those figures do not follow its own tiers)
const s = defaultState(data);
const vp = (n) => { s.qty = { 'PANO.VP': n }; return Math.round(quote(data, s).total); };
assert.deepEqual([vp(8), vp(20), vp(30)], [1400, 3325, 4725]);
s.qty = { 'MOD.INT.FURN': 120 }; s.fn = 1.3; assert.equal(Math.round(quote(data, s).total), 2990);
// bulk5: 10 basic renders = 5 × 90 + 5 × 81
s.fn = 1; s.qty = { 'EXT.BASIC': 10 }; assert.equal(Math.round(quote(data, s).total), 855);
for (const it of data.items) if (it.range) assert.ok(it.custom && it.range[0] < it.range[1], `${it.code}: range`);
for (const r of data.retired) assert.ok(!codes.has(r.code), `retired ${r.code} still listed`);

// public view keeps internal presets and multipliers out
const pub = publicView(data);
assert.ok(!pub.presets.some((p) => p.code.startsWith('CHECK')));
assert.ok(!('multipliers' in pub));
assert.equal(pub.ai.includedVariations, 1);
assert.deepEqual(Object.keys(pub.ai.formats), ['one', 'square', 'second', 'all']);
assert.equal(pub.ai.formats.one, 1);

// crosslinks resolve to real content slugs; every item has hover help; estimator tabs point at priceable codes
const slugs = (dir) => new Set(readdirSync(new URL(`../src/content/${dir}`, import.meta.url)).map((f) => f.replace(/\.mdx?$/, '')));
const tech = slugs('vision-tech'), svcs = slugs('services');
for (const it of data.items) {
  assert.ok(it.help?.en && it.help?.hu, `${it.code}: help`);
  for (const s of it.tech ?? []) assert.ok(tech.has(s), `${it.code}: tech ${s}`);
}
for (const f of data.families) for (const s of f.services ?? []) assert.ok(svcs.has(s), `${f.code}: service ${s}`);
for (const p of data.presets) { for (const s of p.services ?? []) assert.ok(svcs.has(s), `${p.code}: service ${s}`); for (const s of p.tech ?? []) assert.ok(tech.has(s), `${p.code}: tech ${s}`); }
for (const k of data.calculator.kinds) for (const s of k.services ?? []) assert.ok(svcs.has(s), `kind ${k.key}: service ${s}`);
for (const k of data.calculator.kinds) for (const r of k.rows) assert.ok(item(data, r.code) && !item(data, r.code).custom, `kind ${k.key}: ${r.code}`);
const cv = calcView(data);
assert.deepEqual(Object.keys(cv.multipliers), ['source', 'fn', 'detail', 'stillsOnly', 'formats', 'fourK', 'v360']);
assert.equal(priceLabel(item(data, 'EXT.DAY')), '€180 / view');
assert.equal(priceLabel(item(data, 'MOD.SITE'), 'hu'), '600–2400 € / projekt');
// hu-HU groups thousands with a non-breaking space — compare on plain spaces
const sp = (s) => s.replace(/\s/g, ' ');
assert.equal(sp(priceLabel(item(data, 'EXT.DAY'), 'hu', 360)), '64 800 Ft / nézet');
assert.equal(sp(priceLabel(item(data, 'MOD.SITE'), 'hu', 360)), '216 000–864 000 Ft / projekt');
{ const s = defaultState(cv); s.qty = { 'MOD.S': 1, 'EXT.DAY': 5, 'EXT.NIGHT': 3 }; assert.equal(Math.round(quote(cv, s).total), 1975); }

console.log('pricing ok —', got);
