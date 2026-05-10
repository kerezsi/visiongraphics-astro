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
    founderBio3:      'Currently: integrating AI tools into production workflows, building custom desktop utilities for visualization pipelines, and preparing a presentation on AI-driven disruption in architectural visualization for the Ybl Conference 2026.',
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

  about: {
    metaTitle:        'Rólunk',
    metaDescription:  'Vision Graphics Kft. — budapesti építészeti látványterv-stúdió, amelyet Kerezsi László alapított 1996-ban. 30 év, több mint 500 projekt négy kontinensen.',

    bannerLabel:      'Vision Graphics',
    bannerTitle:      'A stúdióról',

    introLead:        'Több mint 30 éve keltünk életre építészeti elképzeléseket 3D látványtervezéssel. Ami egy kis budapesti stúdióként indult, mára globálisan tevékeny gyakorlattá nőtte ki magát — repülőtéri terminálok, városi mestertervek, VR-élmények és kiskereskedelmi roll-outok négy kontinensen.',
    diffLabel:        'Miben vagyunk mások',
    diffBody:         'Kommunikációs problémákat oldunk meg, nem csak rendereléseket készítünk. Akár befektetői jóváhagyásra van szüksége, akár tervpályázatot kell megnyernie, akár a környékkel szeretné megismertetni, mi készül — mi felépítjük azt a vizuális érvelést, amellyel mindez sikerülhet.',

    founderLabel:     'Alapító',
    founderTitle:     'Találkozzon a szakértővel',
    founderRole:      'Látványterv-igazgató',
    founderBio1:      'László 1996-ban alapította a Vision Graphics-et. Még mielőtt az MI divatszó lett volna, már egyedi MAXScript-eszközöket írt termelési problémák megoldására. Mielőtt a VR a fősodorba került, már virtuális bejárás-élményeket épített ingatlanos megbízók számára.',
    founderBio2:      'Minden ügyfélprojekten személyesen dolgozik — az első brieftől a végleges leszállításig. Nincsenek projektmenedzseri rétegek Ön és a látványterveire vonatkozó döntéseket meghozó személy között.',
    founderBio3:      'Jelenleg: MI-eszközök integrációja a produkciós munkafolyamatokba, egyedi asztali segédeszközök fejlesztése a látványterv-pipeline-okhoz, valamint előadás készítése az MI okozta változásokról az építészeti látványtervezésben az Ybl Konferencia 2026-ra.',
    founderPhoneLabel:'Telefon',
    founderEmailLabel:'E-mail',
    founderPhotoAlt:  'Kerezsi László — alapító, Vision Graphics',
    statYears3dsMax:  'Év 3ds Max-szal',
    statYearsVRay:    'Év V-Ray-jel',
    statProjects:     'Megvalósított projekt',
    statContinents:   'Kontinens',

    structureLabel:   'Felépítés',
    structureTitle:   'Hogyan dolgozunk',
    smallTeamHeading: 'Kis csapat, nagy eredmények',
    smallTeamLead:    'Tekintsen ránk úgy, mint egy zenekar karmestereire — a megfelelő szakértőket vonjuk be a megfelelő pillanatban, hogy az Ön projektje sikeres legyen.',
    smallTeamBody:    'Egy kis központi csapat vagyunk, amely nagyléptékű megbízásokat is kezel a kipróbált szakértőink hálózatán keresztül. Mindig közvetlenül Lászlóval dolgozik együtt. A csapat a projekthez igazodik, nem a fenntartott kapacitáshoz.',
    inhouseLabel:     'A legkritikusabb részeket házon belül tartjuk:',
    inhouseItem1:     'Projektmenedzsment — egyetlen kapcsolattartó az elejétől a végéig',
    inhouseItem2:     'Renderfarm üzemeltetése és minőségellenőrzés minden leszállítás előtt',
    inhouseItem3:     'A 30 éves tapasztalatot igénylő alapvető 3D-munka',
    inhouseItem4:     'Végleges anyag olyan formátumokban, amelyeket a csapata valóban tud használni',
    startConvBtn:     'Beszéljünk',

    networkLabel:     'Szakértői hálózatunk',
    networkIntro:     'Ha az Ön projektjéhez valami különleges kell, bevonjuk a megfelelő szakértőt. Az alábbi specialisták mindegyikét valós megbízásokon teszteltük.',

    whyLabel:         'Miért működik ez ennyire jól',
    benefit1Title:    'Gyors lépések',
    benefit1Body:     'A kis központi csapat gyors döntéseket jelent. Nincs bizottsági jóváhagyás a hatóköri változtatásokra.',
    benefit2Title:    'A megfelelő szakértelem',
    benefit2Body:     'A megfelelő szakembereket akkor vonjuk be, amikor szükség van rájuk — nem fenntartott kapacitásként visszük őket.',
    benefit3Title:    'Folyamatosan magas minőség',
    benefit3Body:     'László mindent átnéz, mielőtt elhagyja a stúdiót. Kivétel nélkül.',
    benefit4Title:    'Pontosan szabott hatókör',
    benefit4Body:     'Pontosan azt kapja, amire a projektjének szüksége van — nem egy mindenkire szabott megoldást.',

    historyLabel:     'Történet',
    historyTitle:     'A történetünk',
    timelineIntro:    '30 év. 10 korszak. Hogyan nőtt, alkalmazkodott és szállított folyamatosan a stúdió.',

    ctaHeading:       'Készen áll a közös munkára?',
    ctaSub:           '30 perces konzultáció. Ingyenes. Kötelezettség nélkül.',
    ctaBtn:           'Lépjen kapcsolatba',

    specialists: [
      { role: '3D-szkennelési szakember',    desc: 'Részletes digitális másolatok épületekről és tárgyakról szkennelőeszközökkel.' },
      { role: 'Építészeti fotós',            desc: 'Magas minőségű helyszíni fotózás, amely illeszkedik a 3D-munka valós részleteihez.' },
      { role: 'Karakter-animátor',           desc: 'Természetes mozgás digitális szereplőknek, amelytől élővé válnak a terek.' },
      { role: 'Karakterművész',              desc: 'Digitális szereplők — alkalmi járókelőktől irodai dolgozókig.' },
      { role: 'Környezetművész',             desc: 'Gazdag digitális világok: parkok, kertek, városképek bármilyen léptékben.' },
      { role: 'UI/UX-tervező',               desc: 'Interakciótervezés interaktív projektekhez és VR-élményekhez.' },
      { role: 'Grafikus',                    desc: '2D-s elemek a 3D kiegészítéseként: logók, layoutok, infografikák.' },
      { role: 'Belsőépítész',                desc: 'Bútorok, anyagok és térhangulat belsőépítészeti projektekhez.' },
      { role: 'Webfejlesztő',                desc: 'Weboldalak és platformok beágyazott 3D-munkák online bemutatásához.' },
      { role: 'Fotogrammetria-szakértő',     desc: 'Helyszíni fotókból pontos 3D-modellek — a digitális iker megközelítés.' },
      { role: '3D-generalista',              desc: 'Sokoldalú modellezés, textúrázás és renderelés bármilyen feladatra.' },
      { role: 'Unreal Engine fejlesztő',     desc: 'Valós idejű 3D-élmények: VR-bejárások, interaktív kioszkok.' },
      { role: 'Drónpilóta',                  desc: 'Légifotók és videók arról, hogyan illeszkednek a projektek a környezetükbe.' },
      { role: 'BIM-szakember',               desc: 'A vizuális pontosság összevetése a műszaki épületadatokkal.' },
      { role: 'Tömegszimulációs szakértő',   desc: 'Reális tömegviselkedés nagy közterekhez és közlekedési csomópontokhoz.' },
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

    prepLabel:        'Hasznos, ha kéznél van',
    prepItem1:        'A projekt típusa és nagyjából a hatóköre',
    prepItem2:        'Tervek vagy referenciaanyagok (bármilyen formátumban)',
    prepItem3:        'Az Ön határideje',
    prepItem4:        'Költségvetési keret, ha ismert',
    prepNote:         'Egyik sem feltétel — a részleteket közösen ki tudjuk dolgozni.',

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
