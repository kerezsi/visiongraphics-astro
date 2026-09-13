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

/** Estimated minutes to read a Markdown/MDX body at ~220 wpm. Never below 1. */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const words = body
    .replace(/^---[\s\S]*?---/, '')        // frontmatter
    .replace(/<[^>]+>/g, ' ')              // JSX / HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/[`*_#>\[\]()]/g, ' ')        // markdown punctuation
    .split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
