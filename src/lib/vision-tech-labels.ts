import type { Locale } from './i18n';

/**
 * Localized labels for vision-tech filter enum values.
 *
 * The canonical English value is stored in MDX frontmatter and on card
 * `data-*` attributes — only the displayed text differs between locales,
 * so filter matching is unaffected.
 */
const FILTER_LABELS: Record<Locale, Record<string, string>> = {
  en: {},
  hu: {
    // technique
    'AI-Enhanced':             'AI-vel támogatott',
    'AI-Only':                 'Csak AI',
    'Digital':                 'Digitális',
    'Hybrid':                  'Hibrid',
    'Traditional':             'Hagyományos',
    // 3D model
    'Creation of 3D Model':    '3D-modell létrehozása',
    'Enhancement of 3D Model': '3D-modell továbbfejlesztése',
    'No 3D Model Required':    'Nincs szükség 3D-modellre',
    'Output from 3D Model':    'Kimenet 3D-modellből',
    // complexity
    '1 - Basic':               '1 - Alap',
    '2 - Intermediate':        '2 - Középhaladó',
    '3 - Advanced':            '3 - Haladó',
    '4 - Expert':              '4 - Szakértői',
    '5 - Cutting-Edge':        '5 - Élvonal',
    // reality spectrum
    'Pure Reality':            'Tiszta valóság',
    'Enhanced Reality':        'Felerősített valóság',
    'Hybrid Reality-Vision':   'Hibrid valóság-vízió',
    'Conceptual Reality':      'Koncepcionális valóság',
    'Pure Vision':             'Tiszta vízió',
    // purpose
    'Communication':           'Kommunikáció',
    'Decision Support':        'Döntéstámogatás',
    'Design Development':      'Tervezésfejlesztés',
    'Documentation':           'Dokumentáció',
    'Technical Analysis':      'Műszaki elemzés',
  },
};

export function vtLabel(value: string | undefined, lang: Locale): string {
  if (!value) return '';
  return FILTER_LABELS[lang]?.[value] ?? value;
}
