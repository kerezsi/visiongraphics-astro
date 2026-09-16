// Types for src/lib/pricing.mjs (plain ESM so the pricing admin tool can load
// it without a bundler). Keep in step with pricing.json's shape.
export type L = { en: string; hu: string };

export interface PriceItem {
  code: string;
  legacy?: string;
  family: string;
  name: L;
  desc?: L;
  unit: L;
  base?: number;
  min?: number;
  mult?: string[];
  tier?: string;
  bundle?: { from: number; x: number };
  ratio?: { fixed: number };
  level?: { ref: string; avg: number; min: number };
  needs?: string;
  noRush?: boolean;
  custom?: L;
  range?: [number, number];
  help?: L;
  tech?: string[];
  public?: boolean;
}

export interface Family { code: string; lane: '3d' | 'ai'; name: L; lede: L; services?: string[] }
/** One output row of an estimator card. `when` shows it only for furnished/empty interiors; `tag` groups it under kinds.tags; `slider` renders a range input. */
export interface CalcRow { code: string; default: number; step?: number; when?: 'furn' | 'empty'; tag?: string; slider?: [number, number]; short?: L }
/** An estimator card type (pricing.json calculator.kinds). `subject` cards own a model line; `contact` = contact-form project_type; `services` = service pages embedding it. */
export interface CalcKind {
  key: string; subject?: boolean; contact?: string; services?: string[]; name: L; defaultName?: L; lede: L;
  opts?: string[]; tags?: Record<string, L>; names?: { name: L; m2?: number; fn?: string }[]; rows: CalcRow[];
}
export interface CalcStart { key: string; name: L; entries: { kind: string; name?: L; opts?: Record<string, string | number>; q?: Record<string, number> }[] }
export interface Calculator { kinds: CalcKind[]; starts: CalcStart[] }

export interface MultiplierOption { key?: string; label: L; long?: L; value: number; default?: boolean }
export interface Multiplier { global?: boolean; unless?: string; label: L; note: L; options: MultiplierOption[] }

export interface Preset {
  code: string; name: string; subtitle: L; desc: L;
  q: Record<string, number>; types?: number; highlight?: boolean; public?: boolean;
  /** service slugs whose pages show this package in short form */
  services?: string[];
  /** vision-tech slugs whose pages show this package; a preset with `tech` stays out of the general package grids */
  tech?: string[];
}

export interface PricingData {
  version: string; updated: string; peg: number; vat: number;
  lanes: Record<string, L>;
  families: Family[];
  items: PriceItem[];
  multipliers: Record<string, Multiplier>;
  tiers: Record<string, unknown>;
  presets: Preset[];
  ai: { image: string; edit: string; variation: string; motion: string; includedVariations: number; motionMax: number; motionStep: number; sliders: Record<string, { min: number; max: number; default: number }> };
  calculator: Calculator;
  terms: L[];
  retired: unknown[];
}

export interface State { peg: number; types: number; qty: Record<string, number>; base: Record<string, number>; [multiplier: string]: unknown }

/** One priced line to quote: `opts` = multiplier option keys, `types` = PLAN.UNIT unit types, `group` = card id (level.ref lookup); anything else rides along (estimator: `ref`). */
export interface QuoteEntry { code: string; q: number; opts?: Record<string, string | number>; types?: number; group?: string; [extra: string]: unknown }
export interface QuoteLine { it: PriceItem; q: number; unit: number; units: number; line: number; tiered: boolean; underMin: boolean; e: QuoteEntry }
export interface Quote { lines: QuoteLine[]; total: number; missing: string[] }

export interface PublicItem { code: string; legacy?: string; family: string; name: L; desc?: L; help?: L; tech?: string[]; unit: L; base?: number; min?: number; custom?: L; range?: [number, number] }
export interface CalcView {
  version: string; peg: number; tiers: Record<string, unknown>;
  multipliers: Record<string, Multiplier>;
  items: PriceItem[];
  presets: { code: string; name: string; subtitle: L; total: number; q: Record<string, number>; types?: number }[];
  calculator: Calculator;
}
export interface PublicView {
  version: string; updated: string; peg: number; vat: number;
  families: Family[];
  items: PublicItem[];
  presets: (Preset & { total: number })[];
  ai: { image: number; edit: number; variation: number; includedVariations: number; motion: number; motionMin?: number; motionMax: number; motionStep: number; formats: Record<string, number>; sliders: PricingData['ai']['sliders'] };
  terms: L[];
}

export function item(data: PricingData, code: string): PriceItem;
export function defaultState(data: PricingData): State;
export function base(state: State, it: PriceItem): number;
export function units(data: PricingData, it: PriceItem, q: number): number;
export function multiplier(data: PricingData, state: State, it: PriceItem): number;
export function lineTotal(data: PricingData, state: State, it: PriceItem, q: number): number;
export const CALC_MULTIPLIERS: string[];
export function optValue(data: PricingData | CalcView, k: string, v: string | number | undefined): number;
export function quoteEntries(data: PricingData | CalcView, state: State, entries: QuoteEntry[]): Quote;
export function quote(data: PricingData, state: State): Quote;
export function presetTotal(data: PricingData, p: Preset): number;
export function publicView(data: PricingData): PublicView;
export function calcView(data: PricingData): CalcView;
export function priceLabel(it: { unit: L; base?: number; custom?: L; range?: [number, number] }, lang?: string, peg?: number): string;
export function fmt(n: number, lang?: string): string;
export function fmtHuf(n: number, peg: number): string;
export function fmtPrice(n: number, lang?: string, peg?: number): string;
export function fmtBoth(n: number, lang?: string, peg?: number): string;
