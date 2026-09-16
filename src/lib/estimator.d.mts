// Types for src/lib/estimator.mjs (plain ESM shared with the pricing admin).
import type { CalcView, PricingData, Quote, QuoteLine, L } from './pricing.d.mts';

export interface Entry { id: string; kind: string; name: string; opts: Record<string, string | number>; q: Record<string, number>; open: boolean }
export interface Project { src: string; fw?: string; rush?: string; entries: Entry[] }
export interface ProjectQuote extends Quote { custom: { it: { code: string; name: L; custom?: L; range?: [number, number] }; e: Entry }[]; sub: Record<string, number> }
export interface MountOptions {
  lang?: string; internal?: boolean; scope?: string[]; embedded?: boolean; contactUrl?: string; estimateUrl?: string;
  hashState?: boolean; ui?: Record<string, string>; onChange?: (s: { P: Project; Q: ProjectQuote; text: string }) => void;
}
export interface TextExtra { url?: string; date?: string; vat?: boolean; huf?: boolean; head?: string[]; tail?: string[] }
export interface Api { project: Project; quote(): ProjectQuote; text(extra?: TextExtra): string; render(): void }

export const UI: Record<string, Record<string, string>>;
export function newEntry(D: CalcView | PricingData, kind: string, lang: string, over?: { name?: L | string; opts?: Record<string, string | number>; q?: Record<string, number> }): Entry | null;
export function entryLines(D: CalcView | PricingData, e: Entry): { lines: QuoteLine['e'][]; custom: string[] };
export function quoteProject(D: CalcView | PricingData, P: Project): ProjectQuote;
export function serialize(P: Project): string;
export function parse(D: CalcView | PricingData, hash: string, lang: string): Project | null;
export function fromQty(D: CalcView | PricingData, q: Record<string, number>, types: number | undefined, lang: string): Project;
export function fromStart(D: CalcView | PricingData, start: { entries: unknown[] }, lang: string): Project;
export function briefOf(D: CalcView | PricingData, e: Entry, lang: string): string;
export function displayName(D: CalcView | PricingData, e: Entry, lang: string): string;
export function quoteText(D: CalcView | PricingData, P: Project, Q: ProjectQuote, lang: string, extra?: TextExtra): string;
export function mount(root: HTMLElement, D: CalcView | PricingData, o?: MountOptions): Api;
