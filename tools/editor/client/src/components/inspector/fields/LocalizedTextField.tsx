import React, { useState } from 'react';
import {
  LOCALES,
  LOCALE_SHORT,
  DEFAULT_LOCALE,
  readLocale,
  writeLocale,
  type Locale,
  type LocalizedValue,
} from '../../../lib/localized.ts';
import * as api from '../../../lib/api-client.ts';

interface Props {
  label: string;
  value: LocalizedValue | undefined;
  onChange: (value: LocalizedValue) => void;
  placeholder?: string;
  /** Render a multi-line textarea instead of a single-line input. */
  textarea?: boolean;
  /** Rows for the textarea (default 3). */
  rows?: number;
  /**
   * Hide the per-locale ✦ Translate button. Useful for fields where
   * automated translation makes no sense (e.g. proper names, URLs).
   */
  noTranslate?: boolean;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 3,
};

const localeChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  marginBottom: 3,
};

const translateBtnStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: '1px 6px',
  borderRadius: 2,
  fontSize: 10,
  letterSpacing: '0.04em',
};

/**
 * Two-pane editor for a localized string. Each locale gets its own input.
 * Per-locale ✦ Translate button calls /api/translate using the default-locale
 * value as source. The default locale's row never shows the translate button
 * (it's the source).
 */
export function LocalizedTextField({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
  rows = 3,
  noTranslate = false,
}: Props) {
  const [translating, setTranslating] = useState<Locale | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setLocale(lang: Locale, next: string) {
    onChange(writeLocale(value, lang, next));
  }

  async function translateTo(target: Locale) {
    setError(null);
    const source = readLocale(value, DEFAULT_LOCALE);
    if (!source.trim()) {
      setError(`Fill in ${LOCALE_SHORT[DEFAULT_LOCALE]} first.`);
      return;
    }
    setTranslating(target);
    try {
      const translated = await api.translate(source, DEFAULT_LOCALE, target);
      setLocale(target, translated);
    } catch (e: any) {
      setError(e?.message ?? 'Translation failed');
    } finally {
      setTranslating(null);
    }
  }

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {LOCALES.map((lang) => {
          const isSource = lang === DEFAULT_LOCALE;
          const v = readLocale(value, lang);
          return (
            <div key={lang}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <span style={localeChip}>{LOCALE_SHORT[lang]}</span>
                {!isSource && !noTranslate && (
                  <button
                    type="button"
                    style={translateBtnStyle}
                    onClick={() => translateTo(lang)}
                    disabled={translating !== null}
                    title={`Translate from ${LOCALE_SHORT[DEFAULT_LOCALE]} via configured AI engine`}
                  >
                    {translating === lang ? '…' : '✦ Translate'}
                  </button>
                )}
              </div>
              {textarea ? (
                <textarea
                  value={v}
                  onChange={(e) => setLocale(lang, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type="text"
                  value={v}
                  onChange={(e) => setLocale(lang, e.target.value)}
                  placeholder={placeholder}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <div style={{ color: 'var(--color-accent)', fontSize: 10, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}
