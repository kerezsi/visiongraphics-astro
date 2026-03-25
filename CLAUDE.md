# CLAUDE.md — Vision Graphics Kft. Website

## Project Overview

Company website for **Vision Graphics Kft.** (visiongraphics.eu).
Budapest-based architectural visualization studio, founded 1996.
Solo operator: **László Kerezsi** — 30+ years in 3ds Max, deep AI integration,
Unreal Engine VR, custom scripting/automation.

Live dev reference: https://dev.visiongraphics.eu (WordPress prototype — do NOT copy its bugs)
Target: rebuild in Astro, deploy to Cloudflare Pages.

**Known content bugs from the WP prototype to NOT replicate:**
- Fake testimonials (John Smith, Sarah Johnson) — remove entirely
- Raw AI image prompt left as visible body text on Services page — remove
- Process steps were in wrong order on Services — see corrected content below
- Personal projects (FakeHistory.eu) listed on About — remove from main site
- No Contact page existed — we add one
- Phone number in FAQ but not in nav/footer consistently — fix to be consistent

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 4.x (static output) |
| Styling | Tailwind CSS v3 |
| Interactivity | React islands (`client:load`) |
| Search | Pagefind (post-build, static) |
| Images | Raw `<img>` tags — images served from Cloudflare R2 |
| Content | Astro Content Collections (typed) |
| Hosting | Cloudflare Pages (staging: visiongraphics-astro.pages.dev) |
| Image Storage | Cloudflare R2 bucket: `visiongraphics-images` |
| CI/CD | GitHub → Cloudflare Pages (auto-deploy on push to master) |
| Email | Google Workspace (not on this server — do not configure) |

---

## Commands

```bash
npm run dev          # local dev server (localhost:4321)
npm run build        # production build + Pagefind index
npm run preview      # preview built output
```

**package.json scripts section:**
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && npx pagefind --site dist",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

---

## Deployment

- Platform: Cloudflare Pages
- Staging URL: https://visiongraphics-astro.pages.dev
- GitHub repo: https://github.com/kerezsi/visiongraphics-astro
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20
- Environment variables: none required for static build

### Image Hosting (Cloudflare R2)

Images are NOT in Git. They live in R2 bucket `visiongraphics-images`.
Public R2 URL: `https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev`

**URL structure:**
- Portfolio images: `/_img/portfolio/[project-slug]/[filename]`  → 302 redirect → R2 `portfolio/[project-slug]/[filename]`
- Tech images:      `/_img/vision-tech/[slug]/[filename]`         → 302 redirect → R2 `vision-tech/[slug]/[filename]`
- Root images (hero, laszlo): `/hero-bg.jpg` etc.                 → 302 redirect → R2 root

**Why `/_img/` prefix?** Cloudflare Pages applies 302 redirects BEFORE static files.
`/portfolio/*` would intercept HTML page routes. `/_img/portfolio/*` avoids the conflict.

**To upload images:**
```
upload-images.bat   (in project root — uses rclone)
```

**rclone remote name:** `r2`
**rclone bucket:** `r2:visiongraphics-images`
**rclone flag required:** `--s3-no-check-bucket` (API token has no bucket management perms)

---

## Design System

### Aesthetic Direction
**Dark luxury editorial.** Architectural magazine meets precision tech studio.
Premium, confident, not flashy. The portfolio imagery is the hero — everything
else steps back. Think: deep space, warm light, refined type.

### Color Palette (CSS variables — defined in `src/styles/global.css`)

Dark neutral — matched to dev.visiongraphics.eu (no blue tint).

```css
--color-bg:          #1a1a1a;   /* page background */
--color-surface:     #121212;   /* cards, panels */
--color-surface-2:   #0f0f0f;   /* raised surfaces, hover */
--color-border:      #2a2a2a;   /* subtle borders */
--color-accent:      #da1313;   /* brand red — primary accent, CTAs */
--color-accent-2:    #da1313;   /* same brand red */
--color-text:        #f0f0f1;   /* near-white — primary text */
--color-text-muted:  #bbbbbb;   /* secondary text, captions */
--color-text-faint:  #7a7a7a;   /* disabled, placeholders */
```

### Layout Constraints

- Max content width: **2400px** (`.container` / `max-w-container`)
- Min supported viewport: **500px**
- All sizing is fluid between 500px and 2400px — **one clamp on `html` drives everything**:
  `html { font-size: clamp(1rem, 0.737rem + 0.842vw, 2rem) }` → 1rem = 16px at 500px, 32px at 2400px
- Never use static breakpoint overrides for font sizes or spacing
- **PageHero heights:** `page` variant = `clamp(160px, 21vw, 280px)` · `section` variant = `clamp(195px, 25vw, 315px)`
- **SectionBanner heights:** `section` (default) = `clamp(135px, 16.5vw, 225px)` · `page` = `clamp(160px, 22.5vw, 280px)`

### Typography

Single font family site-wide — **Work Sans** for everything (display, body, UI).

```css
/* All text */
font-family: 'Work Sans', system-ui, sans-serif;
```

Load via Google Fonts in `Base.astro`:
```
Work+Sans:ital,wght@0,100..900;1,100..900
```

### Fluid Type Scale

Scale ratio: **1.2**. Variables are **static rem** values — they are fluid because the `html` font-size
itself is a clamp (see Layout Constraints above). `2.986rem` = 47.8px at 500px, 95.6px at 2400px.

**Do not hardcode font-size values in page or component files — always use the CSS variable.**

```css
/* src/styles/global.css :root */
--fs-h1:    2.986rem;   /* 47.8px → 95.6px */
--fs-h2:    2.488rem;   /* 39.8px → 79.6px */
--fs-h3:    2.074rem;   /* 33.2px → 66.4px */
--fs-h4:    1.728rem;   /* 27.6px → 55.3px */
--fs-h5:    1.44rem;    /* 23.0px → 46.1px */
--fs-h6:    1.2rem;     /* 19.2px → 38.4px */
--fs-body:  1rem;       /* 16.0px → 32.0px */
--fs-small: 0.833rem;   /* 13.3px → 26.7px */
--fs-xs:    0.694rem;   /* 11.1px → 22.2px */
```

Applied globally in `global.css`:
```css
h1 { font-size: var(--fs-h1); }  /* ... through h6 */
body, p { font-size: var(--fs-body); }
small { font-size: var(--fs-small); }
```

### Fluid Spacing Scale

Same principle — static rem values, fluid via `html` font-size clamp.
**Do not hardcode `rem`/`px` spacing values in components — use `var(--space-*)` or `var(--size-*)`.**

```css
/* src/styles/global.css :root — spacing */
--space-1:  0.25rem;   /*  4px →   8px */
--space-2:  0.5rem;    /*  8px →  16px */
--space-3:  0.75rem;   /* 12px →  24px */
--space-4:  1rem;      /* 16px →  32px */
--space-5:  1.25rem;   /* 20px →  40px */
--space-6:  1.5rem;    /* 24px →  48px */
--space-7:  1.75rem;   /* 28px →  56px */
--space-8:  2rem;      /* 32px →  64px */
--space-10: 2.5rem;    /* 40px →  80px */
--space-12: 3rem;      /* 48px →  96px */
--space-16: 4rem;      /* 64px → 128px */
--space-20: 5rem;      /* 80px → 160px */
--space-24: 6rem;      /* 96px → 192px */

/* UI element sizes */
--size-icon:    2.5rem;    /* 40px →  80px — pain icons, etc. */
--size-avatar:  4.5rem;    /* 72px → 144px — portrait photo */
--size-logo:    2.25rem;   /* 36px →  72px — header logo */
--size-logo-sm: 1.875rem;  /* 30px →  60px — footer logo */
--size-header:  4.5rem;    /* 72px → 144px — header bar height */
```

### Tailwind Config Additions

```js
// tailwind.config.mjs
theme: {
  extend: {
    fontFamily: {
      display: ['"Work Sans"', 'system-ui', 'sans-serif'],
      body:    ['"Work Sans"', 'system-ui', 'sans-serif'],
      sans:    ['"Work Sans"', 'system-ui', 'sans-serif'],
    },
    maxWidth: {
      container: '2400px',
    },
    colors: {
      bg:       '#1a1a1a',
      surface:  '#121212',
      surface2: '#0f0f0f',
      border:   '#2a2a2a',
      accent:   '#da1313',
      accent2:  '#da1313',
      muted:    '#bbbbbb',
      faint:    '#7a7a7a',
    },
  }
}
```

### Visual Details
- Cards: `bg-surface border rounded-sm` — squared corners (--radius-sm: 2px), not rounded-xl
- **Portfolio cards** (projects): white border `rgba(255,255,255,0.12)` → hover `rgba(255,255,255,0.35)`
- **Tech cards** (vision-tech): red border `var(--color-accent)` always
- Hover on all cards: `transform: translateY(-2px)` + border-color shift
- Card image: `aspect-ratio: 16/9`, `object-fit: cover`, `overflow: hidden`
- Card body layout: category badge + year (top row) → title → client/location sub
- Section dividers: single pixel `border-border` lines, or generous whitespace — never decorative squiggles
- No box shadows — use border + background contrast instead
- Image lightbox: `ImageLightbox.tsx` React island — used on all gallery sections

---

## Site Structure & Navigation

**Nav items (in order):** Portfolio · Services · Technologies · FAQ · Pricing · Blog · About · Contact

```
src/pages/
  index.astro                    # Homepage
  portfolio/
    index.astro                  # Filterable portfolio grid
    [slug].astro                 # Project detail page
    category/[category].astro    # Pre-built category pages (SEO)
  services/
    index.astro                  # Services overview
    architectural-visualization.astro
    product-visualization.astro
    large-scale-projects.astro
    advanced-ai-services.astro
    workflow-optimization.astro
    3ds-max-tools.astro
    custom-rendering.astro
  vision-tech/
    index.astro                  # Tech selector tool (React island)
  faq/
    index.astro
  pricing/
    index.astro
  articles/
    index.astro
    [slug].astro
  about/
    index.astro
  contact/
    index.astro                  # NEW — was missing
```

---

## Content Collections Schema

### Projects (`src/content/projects/`)

```typescript
// See src/content/config.ts for full schema
// Each project = one .md file
// Filename = slug (e.g., antalya-airport-t2.md)
```

**Category enum** (exhaustive — do not add without asking):
```
architectural-visualization | residential | commercial | office |
airport | infrastructure | urban | hospitality | industrial |
product-visualization | vr-experience | animation | exhibition
```

**Task/feature tags** (freeform strings for filter UI):
```
360° Tour | 3D Animation | 4K Animation | Aerial Integration |
Exterior | Interior | Historical Reconstruction | Marketing Materials |
Photo Integration | VR Experience | AI-Enhanced | Real-time
```

### Articles (`src/content/articles/`)
Blog posts. Date-sorted. Tags freeform.

---

## Component Architecture

```
src/components/
  layout/
    Header.astro          — logo + nav + mobile menu
    Footer.astro          — address, links, copyright (no newsletter widget)
    Nav.astro             — desktop nav links
    MobileNav.tsx         — React island for mobile drawer
  ui/
    Button.astro          — variants: primary (accent2), secondary (outline), ghost
    Tag.astro             — category/feature pill
    SectionLabel.astro    — small all-caps label above headings (e.g. "Our Work")
    Divider.astro         — horizontal rule with optional label
  portfolio/
    PortfolioGrid.astro   — static grid wrapper
    PortfolioFilter.tsx   — React island — ALL filtering logic lives here
    ProjectCard.astro     — image + title + year + category tags
    ProjectGallery.astro  — lightbox image grid on detail page
  media/
    Tour360.astro         — click-to-load Pano2VR iframe
    FilmEmbed.astro       — Vimeo facade (thumbnail → iframe on click)
    ImageLightbox.tsx     — React island for full-screen image viewing
  sections/
    Hero.astro            — homepage hero
    PainPoints.astro      — "The problem" section
    HowWeHelp.astro       — solution section
    Process.astro         — 3-step process
    ClientLogos.astro     — logo strip
    Stats.astro           — 30 years / 500+ projects / etc.
    Timeline.astro        — company history (About page)
```

---

## Portfolio Filter Component Spec

**File:** `src/components/portfolio/PortfolioFilter.tsx`
**Mode:** React island (`client:load`)
**Data:** Receives all project metadata as props (built at compile time — no API)

**Filter controls:**
1. Category multi-select (pill buttons, not dropdown)
2. Task/feature multi-select (pill buttons)
3. Year range slider (1996–current)
4. Text search (title, client, location, tags — debounced 200ms)
5. Toggle: "Has 360° Tour"
6. Toggle: "Has Film"
7. Sort: Newest / Oldest / A–Z

**Behavior:**
- All filters are AND logic (project must match all active filters)
- Filter state reflected in URL params (for shareability)
- "No results" state shows a friendly message, not empty grid
- Animated count: "Showing 12 of 47 projects"
- Reset all button visible when any filter is active

---

## Media Component Specs

### FilmEmbed.astro (Vimeo facade)
```
1. Render: <div> with background-image from Vimeo thumbnail API
2. Overlay: play button SVG centered
3. On click: replace div with <iframe src="https://player.vimeo.com/video/{id}?autoplay=1">
4. NEVER load Vimeo JS on page load
5. Thumbnail fetch: https://vimeo.com/api/v2/video/{id}.json at BUILD time
   (use Astro's fetch in frontmatter, cache result)
```

### Tour360.astro (Pano2VR)
```
1. Render: cover image with "↗ Launch 360° Tour" button overlay
2. On click (Alpine.js or inline script): open tour URL in new tab
   OR swap in iframe if fullscreen mode preferred
3. Never auto-load iframe
```

---

## Homepage Content (CORRECTED)

### Hero Section
```
LABEL:    "30 Years · 500+ Projects · Budapest"

H1:       "Architecture Deserves
            Better Visuals"

SUBHEAD:  "We turn complex architectural plans into visuals that get
           projects approved, properties sold, and stakeholders aligned.
           Budapest-based. Working globally since 1996."

CTA primary:   "See Our Work"  → /portfolio/
CTA secondary: "Talk to Us"    → /contact/
```

### Client Logo Strip (immediately below hero)
```
LABEL: "Trusted by"
Logos: Mol Campus · Hungexpo · BUD Airport · Antalya Airport ·
       Korda Studios · Opera / Eiffel Art Studios · K&H Bank · Agora Budapest
NOTE: Use text names as placeholders until actual logo files are provided.
      Do NOT use generic placeholder boxes.
```

### Stats Bar
```
30+    Years of experience
500+   Projects delivered
4      Continents
1996   Founded
```

### Pain Points Section
```
LABEL:   "The Problem"
H2:      "Getting Good 3D Visuals Is Harder Than It Should Be"

Pain points (icon + text pairs):
• Late deliveries — you miss your pitch window
• Renders that look generic — any studio could have made them
• Freelancers who disappear mid-project
• Back-and-forth that stretches weeks into months
• Teams that can't scale when the project grows
• Visuals that confuse instead of convince
```

### Solution Section
```
LABEL:   "The Solution"
H2:      "Vision Graphics"

BODY:    "László Kerezsi has been doing this for 30 years. He works
          directly on your project — no account managers, no handoffs.
          When your project needs more firepower, we bring in our
          network of tested specialists. You get one point of contact
          and the output of a full studio."

CALLOUT: "We catch problems in your plans before they become expensive
          construction mistakes. That's 30 years of pattern recognition
          working for you."
```

### Three Differentiators
```
1. "Direct Access"
   You work with László, not a project coordinator.
   He's been doing this since 3ds Max was version 1.

2. "Scalable Without the Overhead"
   Small project? Just us. Airport terminal?
   We bring in the right specialists. You pay for what you need.

3. "AI Where It Helps"
   We've integrated AI into our workflow — not as a gimmick,
   but to deliver faster drafts, more variations, and
   better quality control on large file sets.
```

### How It Works (CORRECTED ORDER)
```
Step 1 — Quick Start (2–3 days)
  Send your plans, we take it from there.
  Clear timing and costs before we begin.

Step 2 — Working Together (1–2 weeks)
  First drafts within days.
  Regular check-ins, no surprises.
  Fix things as we go.

Step 3 — Ready to Present (final week)
  Visuals prepared for your specific format (pitch, planning, marketing).
  Files delivered in formats your team can use.
  VR upgrade available at any stage.
```

### FAQ Preview (4 questions on homepage)
```
Q: How long does a typical project take?
A: Most architectural renders: 1–2 weeks.
   Multi-image sets: 2–3 weeks. Animations: 3–6 weeks.
   We'll give you a detailed timeline in our first conversation.

Q: What do you need from me to start?
A: Plans (CAD, PDF, sketch — any level of detail), references
   you like, and your deadline. We'll guide you through the rest.

Q: Can you handle large-scale projects?
A: Yes. Our network of specialists lets us scale to airport terminals,
   urban masterplans, and exhibition content — while László stays as
   your single point of contact.

Q: What makes you different from other studios?
A: 30 years of project pattern recognition. Direct founder access.
   AI-enhanced workflows that cut iteration time. And we've worked on
   airports on four continents, so "complex" is relative.
```

---

## Services Page Content (CORRECTED)

### Hero
```
LABEL:   "Services"
H1:      "Show It, Scale It, Build It."
SUBHEAD: "From single architectural renders to airport-scale animations.
          From custom MAXScript tools to AI-enhanced image pipelines."
```

### Service Cards

**1. Architectural Visualization**
```
TAGLINE: "Turn plans into decisions."
BODY:    "We convert technical drawings into clear 3D views that get
          projects approved and properties sold. Stills, animations,
          360° tours, VR walkthroughs — whatever the audience needs."
RESULTS:
• Pre-sell properties before construction begins
• Catch design conflicts before they reach the site
• Get planning approval with visuals that explain, not just impress
LINK: /services/architectural-visualization/
```

**2. Product Visualization**
```
TAGLINE: "Market before you manufacture."
BODY:    "Product shots, configurators, exploded views, launch materials.
          We've worked on everything from retail display design to
          industrial equipment."
LINK: /services/product-visualization/
```

**3. Large-Scale Projects**
```
TAGLINE: "Big projects need a studio that's done it before."
BODY:    "Airport terminals, urban masterplans, infrastructure corridors,
          exhibition pavilions. We know how to communicate complex
          multi-phase projects to multiple stakeholder audiences."
NOTABLE: "Past work: Budapest Airport, Antalya Airport T2, Sochi Airport,
          Pulkovo Airport, Road Safety Centre Doha, Mol Campus"
LINK: /services/large-scale-projects/
```

**4. AI-Enhanced Services**
```
TAGLINE: "Useful AI. Not hype."
BODY:    "We've integrated AI tools into our actual production workflow —
          not as a demo, but because it makes real projects faster and
          better. Batch image processing, AI-assisted render correction,
          automated file organization, ComfyUI pipelines for rapid
          concept variations."
HONEST NOTE: "We'll tell you where AI helps and where it doesn't.
              Not every problem needs an AI solution."
LINK: /services/advanced-ai-services/
```

**5. Workflow Optimization**
```
TAGLINE: "Your pipeline is probably slower than it needs to be."
BODY:    "We audit visualization workflows and build fixes: automated
          batch processes, tool integrations, MAXScript utilities,
          AI-assisted QC. We've been optimizing our own pipeline for
          30 years — we know where the time goes."
LINK: /services/workflow-optimization/
```

**6. 3ds Max Tools & Scripting**
```
TAGLINE: "Custom tools for MAX users who've hit the ceiling."
BODY:    "MAXScript and Python tools for batch processing, scene cleanup,
          render management, and workflow automation. We've been using MAX
          since version 1 — we know what breaks and why."
LINK: /services/3ds-max-tools/
```

**7. Custom Rendering**
```
TAGLINE: "When your files won't render, we fix that."
BODY:    "Scene optimization, V-Ray problem-solving, render farm access.
          15+ years with V-Ray. We handle MAX files that crash everywhere else."
LINK: /services/custom-rendering/
```

### Pricing Packages (MOVED from homepage — belongs here or /pricing/)
```
NOTE: Remove fake testimonials entirely.
      Add real ones when available, or remove section until then.

Essential    from €5,000   — stills, standard timeline, single building
Professional from €15,000  — full viz package, accelerated timeline
Enterprise   custom        — large-scale, integrated marketing support

ADD: "Not sure which fits? 30-minute consultation, no charge." → /contact/
```

---

## About Page Content (CORRECTED)

### Hero
```
LABEL:   "About"
H1:      "30 Years of Making
          Complex Ideas Visible"
SUBHEAD: "Vision Graphics Kft. was founded in Budapest in 1996.
          We've worked on airport terminals, urban masterplans, VR experiences,
          and retail chains across four continents."
```

### László Section
```
H2:      "László Kerezsi"
TAGLINE: "Founder & Visualization Director"

BODY:    "László started Vision Graphics in 1996. Before AI was a buzzword,
          he was writing custom MAXScript tools to solve production problems.
          Before VR was mainstream, he was building walkthrough experiences
          for real estate clients.

          He works directly on client projects — from initial brief through
          final delivery. No layers of project managers between you and the
          person making decisions about your visuals.

          Currently: integrating AI tools into production workflows,
          building custom desktop utilities for visualization pipelines,
          and preparing a presentation on AI-driven disruption in
          architectural visualization for the Ybl Conference 2026."

CONTACT: +36 30 945 4179 | info@visiongraphics.eu

REMOVE:  FakeHistory.eu and Kerezsi.hu links — not relevant to B2B clients
```

### How We Work Section
```
H2:      "Small Core. Right Specialists When You Need Them."

BODY:    "We keep the critical parts in-house: project management, quality
          control, render farm operation, and the 3D work that requires
          30 years of experience to get right.

          When a project calls for it, we bring in tested specialists:
          character animators, BIM experts, drone pilots, Unreal Engine
          developers, photogrammetry specialists, and more.

          You always work with László directly. The team scales around
          the project, not around overhead."
```

### Timeline (KEEP — it's strong, just display it well)
```
Use the full milestone timeline from the WP site.
Display as a vertical timeline component on desktop,
stacked cards on mobile.
Each era has: years, title, 2-sentence summary, key project list.

Eras:
1996–1999 | 2000–2002 | 2003–2005 | 2006–2008 | 2009–2011
2012–2014 | 2015–2017 | 2018–2020 | 2021–2022 | 2023–2024

See full content in: src/content/about-timeline.json
```

---

## Contact Page Content (NEW — did not exist)

```
LABEL:   "Contact"
H1:      "Let's Talk About Your Project"
SUBHEAD: "30-minute consultation, no charge.
          Tell us what you're building and we'll tell you
          what's realistic."

CONTACT BLOCK:
  Phone:   +36 30 945 4179
  Email:   info@visiongraphics.eu
  Address: Vision Graphics Kft.
           Hollósy Simon utca 15.
           1126 Budapest, Hungary

FORM FIELDS (simple, no plugin needed — use Cloudflare Web Analytics form or Formspree):
  Name *
  Email *
  Company
  Project type (dropdown: Architectural Viz / Large-Scale / Product / AI Services / Other)
  Brief description *
  Deadline (optional)
  [Send →]

NOTE: No newsletter subscription widget anywhere on the site.
      Removed — solo operator has no newsletter operation.
```

---

## FAQ Page Content (KEEP MOST — it's solid)

```
Retain all existing FAQ content.
Corrections:
- Section title "Technical Aspects" → "Technical Details" (minor)
- Add contact info consistently: phone + email in the intro paragraph
- Remove the "360 tours on visiongraphics.eu server: 3 years" line
  (internal detail, not useful to clients)
- Add one new Q under Getting Started:

Q: Do you work in Hungarian and English?
A: Yes. László is fluent in both. Most of our international project
   communication is in English; Hungarian clients can work entirely in Hungarian.
```

---

## Vision-Tech Page Content (KEEP CONCEPT — fix the implementation)

```
LABEL:   "Technologies"
H1:      "Tech Gets It Done"
SUBHEAD: "We pick the right tool for each job.
          Use the filters below to understand which approach
          fits your project type and budget."

EXPLAIN the filter BEFORE showing it:
"Every visualization project sits somewhere on a matrix of
 cost, complexity, and how 'real' the output needs to be.
 A planning approval render has different requirements than
 a marketing animation. Filter by what matters to your project
 to see which of our approaches fits."

Then render the filter tool (React island).

BELOW the filter — add a TOOLS WE USE section:
  3ds Max (since version 1) | V-Ray (15+ years) | Unreal Engine |
  Blender | Pano2VR | ComfyUI | SwarmUI | Python | MAXScript |
  DaVinci Resolve | Cloudflare Pages | Astro

NOTE: The filter tool itself needs results to show — implement as
      a React island that displays matched technique cards.
      Each card: technique name, cost tier, output examples, when to use.
```

---

## Pricing Page Content

```
LABEL:   "Pricing"
H1:      "Transparent Pricing.
          No Surprises."
SUBHEAD: "We quote based on actual scope, not package tiers.
          The tiers below are starting points for conversation."

PACKAGES (same 3 tiers, with fixes):
Essential     from €5,000    stills, standard delivery, single building/product
Professional  from €15,000   full viz package, animation included, faster timeline
Enterprise    custom          airport-scale, multi-phase, integrated marketing

THEN: Honest pricing section (differentiator):
"What drives cost up:
 • Animation vs. stills (significantly more)
 • Number of unique camera angles
 • Interior detail level (furniture, materials)
 • Tight deadlines
 • Multiple revision rounds beyond the included set

What keeps cost down:
 • Clear brief upfront
 • Good source materials (CAD, not sketches)
 • Flexible timeline
 • AI-assisted workflows where appropriate"

CTA: "Get a Quote" → /contact/

REMOVE: Fake testimonials section
```

---

## Portfolio Page Content

```
LABEL:   "Portfolio"
H1:      "Selected Work"
SUBHEAD: "30 years. 500+ projects. A selection across sectors and scales."

FILTER UI (React island — see PortfolioFilter spec above)

INITIAL STATE: Show all published projects, sorted newest first.

EMPTY STATE MESSAGE:
"No projects match those filters.
 [Reset filters] or contact us — we may have relevant unpublished work."
```

---

## Sample Project Files

See `src/content/projects/` for .md files.
Start with these high-profile projects from the timeline:
- antalya-airport-t2.md
- mol-campus.md
- hungexpo-vr.md
- bud-airport-t2b.md
- central-park-budapest.md
- opera-eiffel-art-studios.md

---

## DO NOT / HARD RULES

1. **No fake testimonials.** Remove entirely. Real ones only when available.
2. **No raw AI prompts** as visible page text.
3. **No newsletter widget** — removed from all pages including footer.
4. **No localStorage / sessionStorage** — static site, use URL params for filter state.
5. **No `<form>` tags in React components** — use controlled inputs with onClick.
6. **No WordPress patterns** — no wp-content, no PHP, no dynamic DB queries.
7. **No personal project links** (FakeHistory.eu) on main site.
8. **No FTP deployment** — everything through GitHub → Cloudflare Pages.
9. **Do not hardcode content** that belongs in content collections.
10. **Do not use Inter, Roboto, Arial, Cormorant Garamond, or DM Sans** — use Work Sans exclusively.
10b. **No hardcoded font-size or spacing values in page/component files** — use `var(--fs-*)` for type and `var(--space-*)` / `var(--size-*)` for spacing. All fluidity is driven by the single `html` font-size clamp in `global.css`.
11. **Images via `astro:assets` Image component** — never raw `<img>` tags for portfolio.
12. **Vimeo: facade pattern only** — never auto-embed iframe on page load.
13. **360 tours: click-to-load** — never auto-load Pano2VR iframe.
14. **Contact page is required** — /contact/ must exist and be in nav.

---

## File Delivery Checklist (before handoff to Cloudflare)

- [ ] All pages render without errors (`npm run build`)
- [ ] Pagefind index generated (check `dist/pagefind/` exists)
- [ ] No broken internal links
- [ ] All images have `alt` text
- [ ] Meta titles and descriptions on every page
- [ ] Contact form points to real endpoint (Formspree or Cloudflare)
- [ ] Mobile nav works
- [ ] Portfolio filter reads from URL params
- [ ] No console errors in browser
- [ ] Lighthouse score: Performance > 90, Accessibility > 95
