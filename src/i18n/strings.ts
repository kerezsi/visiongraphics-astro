/**
 * UI strings — hardcoded labels in templates and components.
 *
 * Anything that appears as text in a .astro template (button labels, section
 * headings, breadcrumbs, alt text, error messages) lives here, NOT in the
 * template. Content from MDX files is locale-keyed in frontmatter and resolved
 * via t() from src/lib/i18n.ts — that's a separate path.
 *
 * Adding a string:
 *   1. Add the key to BOTH `en` and `hu`.
 *   2. In the template: import { ui } from '<rel>/i18n/strings'; then use `ui(lang).keyName`.
 *
 * Adding a locale:
 *   1. Add it to LOCALES in src/lib/i18n.ts.
 *   2. Add a sibling object below.
 */
import type { Locale } from '../lib/i18n';
import { DEFAULT_LOCALE } from '../lib/i18n';

const en = {
  // ── Nav / global ─────────────────────────────────────────────
  nav: {
    portfolio:   'Portfolio',
    services:    'Services',
    technologies:'Technologies',
    about:       'About',
    contact:     'Contact',
    faq:         'FAQ',
    pricing:     'Pricing',
    blog:        'Blog',
  },

  // ── Buttons / CTAs ───────────────────────────────────────────
  cta: {
    seeWork:        'See Our Work',
    talkToUs:       'Talk to Us',
    fullPortfolio:  'Full Portfolio',
    allServices:    'All Services',
    aboutStudio:    'About the studio',
    getInTouch:     'Get in Touch',
    backToPortfolio:'← Portfolio',
    allProjects:    'All Projects',
    previous:       '← Previous',
    next:           'Next →',
    similarProject: 'Similar project in mind?',
  },

  // ── Project page sections ────────────────────────────────────
  project: {
    theProject:        'The Project:',
    theTask:           'The Task:',
    theStory:          'The Story:',
    services:          'Services:',
    field:             'Field:',
    date:              'Date:',
    location:          'Location:',
    client:            'Client:',
    architectDesigner: 'Architect | Designer:',
  },

  // ── Listing pages ────────────────────────────────────────────
  listing: {
    selectedWork:    'Selected Work',
    yearsOfProjects: '30 Years of Projects',
    whatWeDo:        'What We Do',
    services:        'Services',
    studio:          'The Studio',
    visionGraphics:  'Vision Graphics',
    howItWorks:      'How It Works',
    threeSteps:      'Three Steps to Finished Visuals',
  },

  // ── Misc ─────────────────────────────────────────────────────
  meta: {
    yearsExperience:    'Years of experience',
    projectsDelivered:  'Projects delivered',
    continents:         'Continents',
    founded:            'Founded',
  },

  // ── Language switcher ────────────────────────────────────────
  langSwitch: {
    label:   'Language',
    en:      'English',
    hu:      'Magyar',
  },
} as const;

// Type-safe Hungarian object — must mirror the EN shape exactly.
type Strings = typeof en;
const hu: Strings = {
  nav: {
    portfolio:   'Portfólió',
    services:    'Szolgáltatások',
    technologies:'Technológiák',
    about:       'Rólunk',
    contact:     'Kapcsolat',
    faq:         'GYIK',
    pricing:     'Árak',
    blog:        'Blog',
  },
  cta: {
    seeWork:        'Munkáink',
    talkToUs:       'Beszéljünk',
    fullPortfolio:  'Teljes portfólió',
    allServices:    'Összes szolgáltatás',
    aboutStudio:    'A stúdióról',
    getInTouch:     'Lépjen kapcsolatba',
    backToPortfolio:'← Portfólió',
    allProjects:    'Összes projekt',
    previous:       '← Előző',
    next:           'Következő →',
    similarProject: 'Hasonló projektje van?',
  },
  project: {
    theProject:        'A projekt:',
    theTask:           'A feladat:',
    theStory:          'A történet:',
    services:          'Szolgáltatások:',
    field:             'Terület:',
    date:              'Dátum:',
    location:          'Helyszín:',
    client:            'Megbízó:',
    architectDesigner: 'Építész | Tervező:',
  },
  listing: {
    selectedWork:    'Válogatott munkák',
    yearsOfProjects: '30 év projektjei',
    whatWeDo:        'Amit csinálunk',
    services:        'Szolgáltatások',
    studio:          'A stúdió',
    visionGraphics:  'Vision Graphics',
    howItWorks:      'Hogyan működik',
    threeSteps:      'Három lépés a kész látványtervekig',
  },
  meta: {
    yearsExperience:    'Év tapasztalat',
    projectsDelivered:  'Megvalósított projekt',
    continents:         'Kontinens',
    founded:            'Alapítva',
  },
  langSwitch: {
    label:   'Nyelv',
    en:      'English',
    hu:      'Magyar',
  },
};

const STRINGS: Record<Locale, Strings> = { en, hu };

/**
 * Get UI strings for a locale. Falls back to default-locale strings if a
 * specific locale is missing (shouldn't happen — the type system enforces
 * structural equality at compile time).
 */
export function ui(lang: Locale): Strings {
  return STRINGS[lang] ?? STRINGS[DEFAULT_LOCALE];
}

export type UIStrings = Strings;
