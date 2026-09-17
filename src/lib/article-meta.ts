// src/lib/article-meta.ts
// Small helpers shared by the two article templates.
import type { Locale } from './i18n';

const DATE_LOCALE: Record<Locale, string> = { en: 'en-GB', hu: 'hu-HU' };

/** "14 February 2025" / "2025. február 14." */
export function formatDate(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

/**
 * Estimated minutes to read a Markdown/MDX body at ~220 wpm. Never below 1.
 * A bilingual body (paired `<Lang code="…">` blocks) counts only `lang`'s blocks.
 */
export function readingTime(body: string | undefined, lang: Locale = 'en'): number {
  if (!body) return 1;
  const blocks = [...body.matchAll(/<Lang code="(\w+)">([\s\S]*?)<\/Lang>/g)];
  const text = blocks.length ? blocks.filter(m => m[1] === lang).map(m => m[2]).join(' ') : body;
  const words = text
    .replace(/^---[\s\S]*?---/, '')        // frontmatter
    .replace(/<[^>]+>/g, ' ')              // JSX / HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/[`*_#>\[\]()]/g, ' ')        // markdown punctuation
    .split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
