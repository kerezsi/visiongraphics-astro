/**
 * Editor-side mirror of the site's i18n helpers.
 *
 * Whatever LOCALES are defined here MUST match LOCALES in
 * src/lib/i18n.ts (site) and the localizedString() schema in
 * src/content/config.ts. To add a locale (e.g. 'de'), append it
 * to all three places.
 */
export const LOCALES = ['en', 'hu'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hu: 'Magyar',
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  hu: 'HU',
};

/**
 * A localized value: either a plain string (treated as default-locale
 * content — backward-compatible with all single-language MDX), or an
 * object keyed by locale.
 *
 * Examples:
 *   "Hello"                    → plain string, treated as EN
 *   { en: "Hello", hu: "Szia" } → fully translated
 *   { en: "Hello" }            → EN only, HU falls back to EN
 */
export type LocalizedValue = string | Partial<Record<Locale, string>>;

/** Type guard — does `v` look like a locale-keyed object? */
export function isLocalizedObject(v: unknown): v is Partial<Record<Locale, string>> {
  if (v == null || typeof v !== 'object') return false;
  if (Array.isArray(v)) return false;
  return LOCALES.some((l) => l in (v as object));
}

/**
 * Read the value for a specific locale. If the input is a plain string,
 * return it for any requested locale (legacy fallback).
 */
export function readLocale(value: LocalizedValue | undefined, lang: Locale): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value[DEFAULT_LOCALE] ?? '';
}

/**
 * Write a new value for one locale. If the input is currently a plain
 * string, upgrade it to a `{ en, hu }` object preserving the existing
 * string under DEFAULT_LOCALE. If the new value matches the existing
 * single string and there are no other locales, keep it as a plain
 * string (so untranslated content stays simple).
 */
export function writeLocale(
  value: LocalizedValue | undefined,
  lang: Locale,
  next: string,
): LocalizedValue {
  // Promote scalar → object on first non-default-locale write
  if (typeof value === 'string' || value == null) {
    if (lang === DEFAULT_LOCALE) {
      // Writing to the default locale on a scalar: keep it scalar (simpler
      // round-trip; no translation has been added yet).
      return next;
    }
    // Writing to a non-default locale: upgrade to object, preserving the
    // existing scalar under DEFAULT_LOCALE.
    const existing = (value as string) ?? '';
    const obj: Partial<Record<Locale, string>> = { [DEFAULT_LOCALE]: existing };
    if (next !== '') obj[lang] = next;
    return obj;
  }

  // Already an object — update the requested locale
  const merged: Partial<Record<Locale, string>> = { ...value, [lang]: next };

  // If after the write only DEFAULT_LOCALE has content (others empty/missing),
  // collapse back to a plain string for cleanliness.
  const nonEmpty = LOCALES.filter((l) => merged[l] != null && merged[l] !== '');
  if (nonEmpty.length === 1 && nonEmpty[0] === DEFAULT_LOCALE) {
    return merged[DEFAULT_LOCALE] ?? '';
  }
  return merged;
}

/** Locales that have non-empty content. */
export function localesWithContent(value: LocalizedValue | undefined): Locale[] {
  if (value == null) return [];
  if (typeof value === 'string') return value === '' ? [] : [DEFAULT_LOCALE];
  return LOCALES.filter((l) => value[l] != null && value[l] !== '');
}

/** Does this localized value have any content at all (any locale)? */
export function hasAnyContent(value: LocalizedValue | undefined): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value !== '';
  return LOCALES.some((l) => value[l] != null && value[l] !== '');
}
