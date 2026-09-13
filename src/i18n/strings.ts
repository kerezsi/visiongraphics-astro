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
    privacy:     'Privacy Policy',
    impressum:   'Imprint',
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

  // ── Accessibility / chrome labels ────────────────────────────
  a11y: {
    skipToContent:   'Skip to content',
    home:            'Vision Graphics — Home',
    servicesLinks:   'Services links',
    studioLinks:     'Studio links',
    mainNav:         'Main navigation',
    mobileNav:       'Mobile navigation',
    toggleTheme:     'Toggle light/dark mode',
    toggleNav:       'Toggle navigation',
    carouselPrev:    'Previous project',
    carouselNext:    'Next project',
    carouselSlides:  'Featured projects',
    servicesTabs:    'Services',
    projectNav:      'Project navigation',
    articleNav:      'Article navigation',
    breadcrumb:      'Breadcrumb',
  },

  // ── Portfolio filter island (plain strings only — crosses into React) ──
  portfolio: {
    searchPlaceholder: 'Search by project, client, location…',
    searchLabel:       'Search projects',
    clearSearch:       'Clear search',
    sortLabel:         'Sort projects',
    sortNewest:        'Newest first',
    sortOldest:        'Oldest first',
    sortAz:            'A – Z',
    filters:           'Filters',
    countAll:          '{n} projects',
    countSome:         '{v} of {n}',
    category:          'Category',
    outputType:        'Output type',
    year:              'Year',
    fromYear:          'From year',
    toYear:            'To year',
    tour360:           '360° Tour',
    film:              'Film',
    reset:             'Reset filters',
    noMatch:           'No projects match those filters.',
    resetAll:          'Reset all filters',
    relatedHeading:    'Related projects',
    relatedSub:        'More work in the same field.',
  },

  // ── Portfolio category pages ─────────────────────────────────
  category: {
    label:       'Portfolio',
    countOne:    '1 project in this category.',
    countMany:   '{n} projects in this category.',
    browseAll:   'Browse all →',
    allProjects: '← All Projects',
    startProject:'Start a Project',
    metaSuffix:  '— Portfolio',
    metaDesc:    '{label} projects by Vision Graphics Kft. {n} projects. Budapest-based, working globally since 1996.',
  },

  // ── Articles (EN-only content, but the chrome follows the locale) ──
  articles: {
    metaTitle:     'Articles',
    metaDesc:      'Insights on architectural visualization, AI in production workflows, 3ds Max, V-Ray, and the business of building imagery. Vision Graphics Kft.',
    bannerLabel:   'Insights & Notes',
    bannerTitle:   'Articles',
    sectionLabel:  'Writing',
    intro:         'Notes from 30 years in architectural visualization — on tools, workflows, AI integration, and the business of making imagery that works.',
    enOnlyNote:    '',
    readArticle:   'Read article →',
    readingTime:   '{n} min read',
    emptyTitle:    'Articles coming soon.',
    emptyPrefix:   'In the meantime, ',
    emptyLink:     'get in touch',
    emptySuffix:   ' directly.',
    breadcrumbRoot:'Articles',
    aboutAuthor:   'About the author',
    authorBio:     'Founder, Vision Graphics Kft. 30 years in architectural visualization, 3ds Max since version 1, AI integration since it became useful.',
    contact:       'Contact',
    startProject:  'Start a Project',
    older:         '← Older',
    newer:         'Newer →',
    allArticles:   'All Articles',
  },

  // ── About page ───────────────────────────────────────────────
  about: {
    metaTitle:        'About',
    metaDescription:  'Vision Graphics Kft. — Budapest-based architectural visualization studio founded 1996 by László Kerezsi. 30 years, 500+ projects across four continents.',

    bannerLabel:      'Vision Graphics',
    bannerTitle:      'About the Studio',

    introLead:        "We've been bringing architectural ideas to life through 3D visualization for over 30 years. What started as a small Budapest studio has grown into a globally active practice — airport terminals, urban masterplans, VR experiences, and retail rollouts across four continents.",
    diffLabel:        'What makes us different',
    diffBody:         "We solve communication problems, not just render problems. Whether you need to win investor approval, succeed in a design competition, or show a neighbourhood what's coming — we build the visual argument that makes it happen.",

    founderLabel:     'Founder',
    founderTitle:     'Meet the Expert',
    founderRole:      'Visualization Director',
    founderBio1:      'László started Vision Graphics in 1996. Before AI was a buzzword, he was writing custom MAXScript tools to solve production problems. Before VR was mainstream, he was building walkthrough experiences for real estate clients.',
    founderBio2:      'He works directly on every client project — from initial brief through final delivery. No layers of project managers between you and the person making decisions about your visuals.',
    founderBio3:      'Currently: building and running the production AI pipelines behind our image work, and developing the studio\'s own tools — render-farm control, VR tour authoring, batch automation in 3ds Max — in Python, MAXScript, and TypeScript.',
    founderPhoneLabel:'Phone',
    founderEmailLabel:'Email',
    founderPhotoAlt:  'László Kerezsi — Founder, Vision Graphics',
    statYears3dsMax:  'Years in 3ds Max',
    statYearsVRay:    'Years with V-Ray',
    statProjects:     'Projects delivered',
    statContinents:   'Continents',

    structureLabel:   'Structure',
    structureTitle:   'How We Work',
    smallTeamHeading: 'Small Team, Big Results',
    smallTeamLead:    'Think of us as the conductors of an orchestra — we bring in the right experts at the right time to make your project work.',
    smallTeamBody:    "We're a small core team that can tackle large-scale commissions through our network of tested specialists. You always work with László directly. The team scales around the project, not around overhead.",
    inhouseLabel:     'We keep the most critical parts in-house:',
    inhouseItem1:     'Project management — one point of contact, start to finish',
    inhouseItem2:     'Render farm operation and quality control before every delivery',
    inhouseItem3:     'Core 3D work requiring 30 years of judgement to get right',
    inhouseItem4:     'Final output in the formats your team can actually use',
    startConvBtn:     'Start a Conversation',

    networkLabel:     'Our Network of Experts',
    networkIntro:     'When your project needs something special, we bring in the right expert. Every specialist below has been tested on real commissions.',

    whyLabel:         'Why This Works So Well',
    benefit1Title:    'Move quickly',
    benefit1Body:     'Small core means fast decisions. No committee approvals for scope changes.',
    benefit2Title:    'Right talent',
    benefit2Body:     'The right specialists brought in when needed — not carried as overhead.',
    benefit3Title:    'Quality stays high',
    benefit3Body:     'László reviews everything before it leaves the studio. No exceptions.',
    benefit4Title:    'Precise scope',
    benefit4Body:     'You get exactly what your project needs, not a one-size-fits-all solution.',

    historyLabel:     'History',
    historyTitle:     'Our Story',
    timelineIntro:    '30 years. 10 eras. A record of how the studio grew, adapted, and kept delivering.',

    ctaHeading:       'Ready to Work Together?',
    ctaSub:           '30-minute consultation. No charge. No obligation.',
    ctaBtn:           'Get in Touch',

    specialists: [
      { role: '3D Scanning Specialist',     desc: 'Detailed digital copies of buildings and objects using scanning equipment.' },
      { role: 'Architecture Photographer',  desc: 'High-quality site photography matched to real-world detail in 3D work.' },
      { role: 'Character Animator',         desc: 'Natural movement for digital people that make spaces feel lived-in.' },
      { role: 'Character Artist',           desc: 'Digital people — from casual passersby to office workers.' },
      { role: 'Environment Artist',         desc: 'Rich digital worlds: parks, gardens, cityscapes at any scale.' },
      { role: 'UI/UX Designer',             desc: 'Interaction design for interactive projects and VR experiences.' },
      { role: 'Graphic Designer',           desc: '2D elements that complement 3D: logos, layouts, infographics.' },
      { role: 'Interior Designer',          desc: 'Furniture, materials and spatial feel for interior projects.' },
      { role: 'Web Developer',              desc: 'Websites and platforms for presenting embedded 3D work online.' },
      { role: 'Photogrammetry Expert',      desc: 'Site photos turned into accurate 3D models — the digital twin approach.' },
      { role: '3D Generalist',              desc: 'All-round modelling, texturing and rendering across any brief.' },
      { role: 'Unreal Engine Developer',    desc: 'Real-time 3D experiences: VR walkthroughs, interactive kiosks.' },
      { role: 'Drone Pilot',                desc: 'Aerial photography and video showing how projects fit surroundings.' },
      { role: 'BIM Specialist',             desc: 'Visual accuracy cross-checked against technical building data.' },
      { role: 'Crowd Simulator',            desc: 'Realistic crowd behaviour for large public spaces and transit hubs.' },
    ],
  },

  // ── Contact page ─────────────────────────────────────────────
  contact: {
    metaTitle:        'Contact',
    metaDescription:  'Start a conversation about your visualization project. 30-minute consultation, no charge. Vision Graphics Kft., Budapest.',

    bannerLabel:      "Let's Talk",
    bannerTitle:      'About Your Project',

    directLabel:      'Direct contact',
    phoneLabel:       'Phone',
    emailLabel:       'Email',
    studioLabel:      'Studio',
    studioName:       'Vision Graphics Kft.',
    studioStreet:     'Hollósy Simon utca 15.',
    studioCity:       '1126 Budapest, Hungary',

    prepLabel:        'Useful to have ready',
    prepItem1:        'Project type and rough scope',
    prepItem2:        'Plans or reference materials (any format)',
    prepItem3:        'Your deadline',
    prepItem4:        'Budget range, if known',
    prepNote:         'None of these are required — we can work out details together.',

    formTitle:        'Send a Message',
    fName:            'Name *',
    fNamePh:          'Your name',
    fEmail:           'Email *',
    fEmailPh:         'you@company.com',
    fCompany:         'Company / Organisation',
    fCompanyPh:       'Optional',
    fProjectType:     'Project type',
    fProjectTypeDef:  'Select…',
    fProjArchViz:     'Architectural Visualization',
    fProjLargeScale:  'Large-Scale / Infrastructure',
    fProjProduct:     'Product Visualization',
    fProjVR:          'VR / Real-time Experience',
    fProjAnimation:   'Animation',
    fProjAI:          'AI-Enhanced Services',
    fProjWorkflow:    'Workflow Optimization / 3ds Max Tools',
    fProjOther:       'Other',
    fMessage:         'Brief description *',
    fMessagePh:       "Tell us about your project — what you're building, who the audience is, and what outcome you need from the visuals.",
    fDeadline:        'Deadline',
    fDeadlinePh:      'e.g. End of March, or flexible',
    fSubmit:          'Send →',
    statusSending:    'Sending…',
    statusOk:         "Message sent — we'll be in touch within one business day.",
    statusErr:        'Something went wrong. Please email us directly at info@visiongraphics.hu',
    consentPrefix:    'By submitting, you agree to our ',
    consentLink:      'Privacy Policy',
    consentSuffix:    '. We use your details only to reply to your message.',
  },
} as const;

// Type-safe Hungarian object — must mirror the EN shape exactly.
// `en` is `as const`, so `typeof en` carries literal string values. We widen
// those literals back to `string` so sibling locales are checked for the same
// KEY structure (a missing key is a compile error) without being forced to
// repeat the English text verbatim.
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };
type Strings = Widen<typeof en>;
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
    privacy:     'Adatkezelési tájékoztató',
    impressum:   'Impresszum',
  },
  cta: {
    seeWork:        'Munkáink',
    talkToUs:       'Beszéljünk',
    fullPortfolio:  'Teljes portfólió',
    allServices:    'Összes szolgáltatás',
    aboutStudio:    'A stúdióról',
    getInTouch:     'Lépjen velünk kapcsolatba',
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

  a11y: {
    skipToContent:   'Ugrás a tartalomra',
    home:            'Vision Graphics — Kezdőlap',
    servicesLinks:   'Szolgáltatások linkjei',
    studioLinks:     'Stúdió linkjei',
    mainNav:         'Főmenü',
    mobileNav:       'Mobil menü',
    toggleTheme:     'Világos / sötét mód váltása',
    toggleNav:       'Menü megnyitása',
    carouselPrev:    'Előző projekt',
    carouselNext:    'Következő projekt',
    carouselSlides:  'Kiemelt projektek',
    servicesTabs:    'Szolgáltatások',
    projectNav:      'Projektek közötti navigáció',
    articleNav:      'Cikkek közötti navigáció',
    breadcrumb:      'Navigációs útvonal',
  },

  portfolio: {
    searchPlaceholder: 'Keresés projekt, megbízó vagy helyszín szerint…',
    searchLabel:       'Keresés a projektek között',
    clearSearch:       'Keresés törlése',
    sortLabel:         'Projektek rendezése',
    sortNewest:        'Legújabb elöl',
    sortOldest:        'Legrégebbi elöl',
    sortAz:            'A – Z',
    filters:           'Szűrők',
    countAll:          '{n} projekt',
    countSome:         '{v} / {n}',
    category:          'Kategória',
    outputType:        'Kimenet típusa',
    year:              'Év',
    fromYear:          'Évtől',
    toYear:            'Évig',
    tour360:           '360°-os túra',
    film:              'Film',
    reset:             'Szűrők törlése',
    noMatch:           'Nincs a szűrőknek megfelelő projekt.',
    resetAll:          'Összes szűrő törlése',
    relatedHeading:    'Kapcsolódó projektek',
    relatedSub:        'További munkáink ugyanebből a területből.',
  },

  category: {
    label:       'Portfólió',
    countOne:    '1 projekt ebben a kategóriában.',
    countMany:   '{n} projekt ebben a kategóriában.',
    browseAll:   'Összes megtekintése →',
    allProjects: '← Összes projekt',
    startProject:'Projekt indítása',
    metaSuffix:  '— Portfólió',
    metaDesc:    '{label} projektek a Vision Graphics Kft.-től. {n} projekt. Budapesti székhely, 1996 óta globálisan dolgozunk.',
  },

  articles: {
    metaTitle:     'Cikkek',
    metaDesc:      'Gondolatok az építészeti látványtervezésről, az AI produkciós használatáról, a 3ds Maxról, a V-Rayről és a képkészítés üzleti oldaláról. Vision Graphics Kft.',
    bannerLabel:   'Jegyzetek és tapasztalatok',
    bannerTitle:   'Cikkek',
    sectionLabel:  'Írások',
    intro:         'Jegyzetek 30 év építészeti látványtervezésből — eszközökről, munkafolyamatokról, AI-integrációról és arról, hogyan készül olyan kép, ami működik.',
    enOnlyNote:    'Cikkeink jelenleg csak angol nyelven érhetők el.',
    readArticle:   'Cikk olvasása →',
    readingTime:   '{n} perc olvasás',
    emptyTitle:    'Hamarosan érkeznek a cikkek.',
    emptyPrefix:   'Addig is ',
    emptyLink:     'vegye fel velünk a kapcsolatot',
    emptySuffix:   ' közvetlenül.',
    breadcrumbRoot:'Cikkek',
    aboutAuthor:   'A szerzőről',
    authorBio:     'A Vision Graphics Kft. alapítója. 30 év építészeti látványtervezés, 3ds Max az 1-es verzió óta, AI-integráció azóta, hogy valóban hasznossá vált.',
    contact:       'Kapcsolat',
    startProject:  'Projekt indítása',
    older:         '← Korábbi',
    newer:         'Újabb →',
    allArticles:   'Összes cikk',
  },

  about: {
    metaTitle:        'Rólunk',
    metaDescription:  'Vision Graphics Kft. — budapesti építészeti látványterv-stúdió, amelyet Kerezsi László alapított 1996-ban. 30 év, több mint 500 projekt négy kontinensen.',

    bannerLabel:      'Vision Graphics',
    bannerTitle:      'A stúdióról',

    introLead:        'Már több mint 30 éve keltjük életre az építészeti elképzeléseket 3D vizualizáció segítségével. Ami egy kis budapesti stúdióként indult, mára globálisan aktív műhellyé nőtte ki magát – repülőtéri terminálok, városfejlesztési mestertervek, VR-élmények és nemzetközi kereskedelmi hálózatok beépítései fűződnek a nevünkhöz négy kontinensen.',
    diffLabel:        'Miben vagyunk mások?',
    diffBody:         'Nem csupán renderelési feladatokat oldunk meg, hanem kommunikációs problémákra nyújtunk választ. Legyen szó a befektetők jóváhagyásának elnyeréséről, egy építészeti tervpályázat megnyeréséről vagy a jövőbeli fejlesztések bemutatásáról a helyi lakosságnak – mi felépítjük azt a vizuális érvrendszert, amely sikerre viszi a projektet.',

    founderLabel:     'Alapító',
    founderTitle:     'Ismerje meg szakértőnket',
    founderRole:      'Vizualizációs igazgató',
    founderBio1:      'László 1996-ban alapította a Vision Graphics stúdiót. Még mielőtt az AI divatszóvá vált volna, ő már egyedi MAXScript eszközöket írt a produkciós kihívások megoldására. Mielőtt a VR elterjedt volna a fősodorban, már interaktív bejárásokat készített ingatlanfejlesztő ügyfelei számára.',
    founderBio2:      'Közvetlenül részt vesz minden egyes projektben – az első egyeztetéstől kezdve a végleges átadásig. Nincsenek felesleges projektmenedzseri rétegek Ön és a látványtervekről döntéseket hozó szakember között.',
    founderBio3:      'Jelenleg: a képi munkánk mögött álló produkciós AI-pipeline-ok fejlesztése és üzemeltetése, valamint a stúdió saját eszközeinek építése — renderfarm-vezérlés, VR-bejárások szerkesztése, kötegelt automatizálás 3ds Maxban — Pythonban, MAXScriptben és TypeScriptben.',
    founderPhoneLabel:'Telefon',
    founderEmailLabel:'E-mail',
    founderPhotoAlt:  'Kerezsi László — alapító, Vision Graphics',
    statYears3dsMax:  'év a 3ds Max-ban',
    statYearsVRay:    'év a V-Ray-jel',
    statProjects:     'sikeresen átadott projekt',
    statContinents:   'kontinens',

    structureLabel:   'Felépítés',
    structureTitle:   'Hogyan dolgozunk?',
    smallTeamHeading: 'Kis csapat, nagy eredmények',
    smallTeamLead:    'Tekintsen ránk úgy, mint egy zenekar karmestereire: a megfelelő szakértőket vonjuk be a megfelelő időben, hogy az Ön projektje a legsikeresebben valósuljon meg.',
    smallTeamBody:    'Egy kis létszámú magcsapat vagyunk, amely kipróbált specialistákból álló hálózatán keresztül képes nagyléptékű megbízásokat is teljesíteni. Ön mindig közvetlenül Lászlóval dolgozik együtt. A csapat mérete a projekthez igazodik, nem pedig a fenntartási költségekhez.',
    inhouseLabel:     'A legkritikusabb folyamatokat házon belül tartjuk:',
    inhouseItem1:     'Projektmenedzsment – egyetlen kapcsolattartó az elejétől a végéig.',
    inhouseItem2:     'Saját renderfarm – üzemeltetés és szigorú minőségellenőrzés minden átadás előtt.',
    inhouseItem3:     'Alapvető 3D-s munka – amelyhez elengedhetetlen a 30 évnyi szakmai tapasztalat és döntésképesség.',
    inhouseItem4:     'Végső kimenetek – olyan formátumokban, amelyeket az Ön csapata valóban használni tud.',
    startConvBtn:     'Beszéljünk',

    networkLabel:     'Szakértői hálózatunk',
    networkIntro:     'Amikor projektjének valami egészen különlegesre van szüksége, a legmegfelelőbb szakértőt vonjuk be. Az alábbi specialisták mindegyike valós, éles megbízásokon bizonyította már tudását.',

    whyLabel:         'Miért működik ez ilyen jól?',
    benefit1Title:    'Gyors reakcióidő',
    benefit1Body:     'A kis létszámú magcsapat gyors döntéseket jelent. Nincsenek felesleges bizottsági jóváhagyások a feladatleírás módosításakor.',
    benefit2Title:    'A megfelelő szakértelem',
    benefit2Body:     'Mindig a szükséges specialistákat vonjuk be – felesleges, folyamatos fenntartási költségek (overhead) nélkül.',
    benefit3Title:    'Folyamatosan magas minőség',
    benefit3Body:     'László személyesen ellenőriz mindent, mielőtt az elhagyná a stúdiót. Kivétel nélkül.',
    benefit4Title:    'Pontos feladatleírás',
    benefit4Body:     'Pontosan azt kapja, amire a projektjének szüksége van, nem pedig egy sablonmegoldást.',

    historyLabel:     'Történet',
    historyTitle:     'Történetünk',
    timelineIntro:    '30 év. 10 korszak. Kronologikus áttekintés arról, hogyan növekedett, alkalmazkodott és teljesített folyamatosan a stúdió.',

    ctaHeading:       'Készen áll a közös munkára?',
    ctaSub:           '30 perces konzultáció. Ingyenes. Kötelezettség nélkül.',
    ctaBtn:           'Lépjen velünk kapcsolatba',

    specialists: [
      { role: '3D szkennelési specialista',  desc: 'Épületek és tárgyak részletes digitális másolatának elkészítése szkennereszközökkel.' },
      { role: 'Építészeti fotós',            desc: 'Kimagasló minőségű helyszíni fotók készítése, amelyek pontosan illeszkednek a 3D-s munka valós részleteihez.' },
      { role: 'Karakteranimátor',            desc: 'Digitális alakok természetes mozgásának kidolgozása, amely élettel tölti meg a tereket.' },
      { role: 'Karakterművész',              desc: 'Digitális alakok modellezése – a hétköznapi járókelőktől az irodai dolgozókig.' },
      { role: 'Környezet- és tájművész',     desc: 'Részletgazdag digitális világok: parkok, kertek, városképek bármilyen léptékben.' },
      { role: 'UI/UX tervező',               desc: 'Interakciós dizájn interaktív projektekhez és VR-élményekhez.' },
      { role: 'Grafikus tervező',            desc: 'A 3D-t kiegészítő 2D-s elemek: logók, elrendezések, infografikák.' },
      { role: 'Belsőépítész',                desc: 'Bútorok, anyagok és térérzet belső téri projektekhez.' },
      { role: 'Webfejlesztő',                desc: 'Weboldalak és platformok a beágyazott 3D-s munkák online prezentálásához.' },
      { role: 'Fotogrammetriai szakértő',    desc: 'Helyszíni fotók átalakítása pontos 3D modellekké – a digitális iker (digital twin) megközelítés.' },
      { role: '3D generalista',              desc: 'Sokoldalú modellezés, textúrázás és renderelés bármilyen feladatleírás alapján.' },
      { role: 'Unreal Engine fejlesztő',     desc: 'Valós idejű 3D élmények: VR-bejárások, interaktív kioszkok.' },
      { role: 'Drónpilóta',                  desc: 'Légi fotók és videók készítése, bemutatva, hogyan illeszkednek a projektek a környezetükhöz.' },
      { role: 'BIM specialista',             desc: 'A vizuális pontosság összevetése és ellenőrzése a technikai épületadatokkal.' },
      { role: 'Tömegszimulációs szakértő',   desc: 'Valósághű tömegviselkedés modellezése nagyméretű közterekhez és közlekedési csomópontokhoz.' },
    ],
  },

  contact: {
    metaTitle:        'Kapcsolat',
    metaDescription:  'Beszélgessünk az Ön látványterv-projektjéről. 30 perces konzultáció, ingyenesen. Vision Graphics Kft., Budapest.',

    bannerLabel:      'Beszéljünk',
    bannerTitle:      'A projektjéről',

    directLabel:      'Közvetlen elérhetőség',
    phoneLabel:       'Telefon',
    emailLabel:       'E-mail',
    studioLabel:      'Stúdió',
    studioName:       'Vision Graphics Kft.',
    studioStreet:     'Hollósy Simon utca 15.',
    studioCity:       '1126 Budapest, Magyarország',

    prepLabel:        'Mit érdemes előkészíteni',
    prepItem1:        'A projekt típusa és hozzávetőleges léptéke',
    prepItem2:        'Tervek vagy referenciaanyagok (bármilyen formátumban)',
    prepItem3:        'Tervezett határidő',
    prepItem4:        'Költségvetési keret (ha ismert)',
    prepNote:         'Ezek közül egyik sem feltétel – a részleteket közösen is kidolgozhatjuk.',

    formTitle:        'Üzenet küldése',
    fName:            'Név *',
    fNamePh:          'Az Ön neve',
    fEmail:           'E-mail *',
    fEmailPh:         'on@cegnev.hu',
    fCompany:         'Cég / szervezet',
    fCompanyPh:       'Nem kötelező',
    fProjectType:     'Projekt típusa',
    fProjectTypeDef:  'Válasszon…',
    fProjArchViz:     'Építészeti látványterv',
    fProjLargeScale:  'Nagyléptékű / infrastruktúra',
    fProjProduct:     'Termék-látványterv',
    fProjVR:          'VR / valós idejű élmény',
    fProjAnimation:   'Animáció',
    fProjAI:          'MI-alapú szolgáltatások',
    fProjWorkflow:    'Munkafolyamat-optimalizálás / 3ds Max eszközök',
    fProjOther:       'Egyéb',
    fMessage:         'Rövid leírás *',
    fMessagePh:       'Meséljen a projektjéről — mit épít, kik a célközönsége, és milyen eredményt vár a látványtervektől.',
    fDeadline:        'Határidő',
    fDeadlinePh:      'pl. március vége, vagy rugalmas',
    fSubmit:          'Küldés →',
    statusSending:    'Küldés…',
    statusOk:         'Üzenet elküldve — egy munkanapon belül jelentkezünk.',
    statusErr:        'Hiba történt. Kérjük, írjon közvetlenül az info@visiongraphics.hu címre.',
    consentPrefix:    'A beküldéssel elfogadja az ',
    consentLink:      'adatkezelési tájékoztatónkat',
    consentSuffix:    '. Az adatait kizárólag az üzenetére adott válaszhoz használjuk fel.',
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
