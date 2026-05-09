// ─── Locale config ───────────────────────────────────────────────
// Single source of truth for available locales. Add new locales here.
export const LOCALES = ['en', 'hu'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

// Display names for the language switcher
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hu: 'Magyar',
};

// Short codes for chip-style switchers
export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  hu: 'HU',
};

// ─── Type helpers ────────────────────────────────────────────────
/**
 * A localized string is either a plain string (treated as default-locale value,
 * i.e. backward-compatible with all existing single-language content) or a
 * record keyed by locale code.
 *
 * Examples:
 *   "Hello"                       → string, treated as EN content
 *   { en: "Hello", hu: "Szia" }   → fully translated
 *   { en: "Hello" }               → EN only, HU falls back to EN
 */
export type Localized<T = string> = T | Partial<Record<Locale, T>>;

/**
 * Type guard — does this value look like a locale-keyed object?
 * Plain strings, arrays, null, undefined → false.
 * Record with at least one known locale key → true.
 */
export function isLocalized(value: unknown): value is Partial<Record<Locale, unknown>> {
  if (value == null) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return LOCALES.some((l) => l in (value as object));
}

/**
 * Resolve a Localized<T> value for the given locale.
 * Falls back to the default locale, then to the first available value,
 * then to undefined.
 */
export function t<T>(value: Localized<T> | undefined, lang: Locale): T | undefined {
  if (value == null) return undefined;
  if (!isLocalized(value)) return value as T;
  const obj = value as Partial<Record<Locale, T>>;
  if (obj[lang] != null) return obj[lang];
  if (obj[DEFAULT_LOCALE] != null) return obj[DEFAULT_LOCALE];
  for (const l of LOCALES) if (obj[l] != null) return obj[l];
  return undefined;
}

/**
 * Same as t() but returns an empty string instead of undefined.
 * Useful where the consumer expects a string (template interpolation, props).
 */
export function tStr(value: Localized<string> | undefined, lang: Locale): string {
  return t(value, lang) ?? '';
}

/**
 * Does this localized value have content for the requested locale?
 * Returns false if the value is missing OR if it's a Localized object with no
 * entry for `lang`. Strings count as "has content for any locale" because they
 * are treated as default-locale fallback.
 */
export function hasLocale(value: Localized<unknown> | undefined, lang: Locale): boolean {
  if (value == null) return false;
  if (!isLocalized(value)) return true; // plain string = always available
  const v = (value as Record<string, unknown>)[lang];
  return v != null && v !== '';
}

// ─── URL helpers ─────────────────────────────────────────────────
/**
 * Build a locale-prefixed URL.
 *   localeUrl('/portfolio/foo', 'hu')  → '/hu/portfolio/foo'
 *   localeUrl('portfolio/foo', 'hu')   → '/hu/portfolio/foo'
 *   localeUrl('/', 'en')               → '/en/'
 *   localeUrl('/en/portfolio', 'hu')   → '/hu/portfolio'   (locale swap)
 */
export function localeUrl(path: string, lang: Locale): string {
  // Strip leading slashes and any existing locale prefix
  let clean = path.replace(/^\/+/, '');
  for (const l of LOCALES) {
    if (clean === l || clean.startsWith(`${l}/`)) {
      clean = clean.slice(l.length).replace(/^\/+/, '');
      break;
    }
  }
  // Always trail with a slash for directory-style URLs unless there's a file extension
  const hasExt = /\.[a-z0-9]+$/i.test(clean);
  if (clean === '') return `/${lang}/`;
  return hasExt ? `/${lang}/${clean}` : `/${lang}/${clean}`.replace(/\/?$/, '/');
}

/**
 * Extract the active locale from an Astro pathname or params.lang.
 * Returns DEFAULT_LOCALE if none can be determined.
 */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  return (LOCALES as readonly string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

/**
 * Swap the locale segment in a URL. Used by the language switcher.
 *   swapLocale('/en/portfolio/foo', 'hu')  → '/hu/portfolio/foo'
 *   swapLocale('/portfolio/foo', 'hu')     → '/hu/portfolio/foo'
 */
export function swapLocale(pathname: string, lang: Locale): string {
  return localeUrl(pathname, lang);
}

// ─── Static-paths helper ─────────────────────────────────────────
/**
 * Cartesian product of locales × items. Use in getStaticPaths for any
 * dynamic route that needs to be emitted under every locale.
 *
 *   export async function getStaticPaths() {
 *     const projects = await getCollection('projects');
 *     return localizedPaths(projects, (p) => ({ slug: p.slug }), (p) => ({ project: p }));
 *   }
 */
/**
 * Static-only locale paths. Use in getStaticPaths for pages with no other
 * dynamic params (e.g. about, contact, services index).
 *
 *   export function getStaticPaths() { return staticLocalePaths(); }
 */
export function staticLocalePaths(): Array<{ params: { lang: Locale }; props: { lang: Locale } }> {
  return LOCALES.map((lang) => ({ params: { lang }, props: { lang } }));
}

export function localizedPaths<T, P extends Record<string, string>, D = unknown>(
  items: T[],
  paramsOf: (item: T) => P,
  propsOf?: (item: T) => D,
): Array<{ params: P & { lang: Locale }; props: D & { lang: Locale } }> {
  const out: Array<{ params: P & { lang: Locale }; props: D & { lang: Locale } }> = [];
  for (const item of items) {
    const params = paramsOf(item);
    const props = (propsOf ? propsOf(item) : ({} as D));
    for (const lang of LOCALES) {
      out.push({
        params: { ...params, lang },
        props: { ...(props as object), lang } as D & { lang: Locale },
      });
    }
  }
  return out;
}
