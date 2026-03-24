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
| Images | `astro:assets` — auto WebP/AVIF |
| Content | Astro Content Collections (typed) |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub → Cloudflare Pages (auto-deploy on push) |
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
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20
- Environment variables: none required for static build

---

## Design System

### Aesthetic Direction
**Dark luxury editorial.** Architectural magazine meets precision tech studio.
Premium, confident, not flashy. The portfolio imagery is the hero — everything
else steps back. Think: deep space, warm light, refined type.

### Color Palette (CSS variables — defined in `src/styles/global.css`)

```css
--color-bg:           #0a0a12;   /* near-black blue-black — page background */
--color-surface:      #11111e;   /* slightly lighter — cards, panels */
--color-surface-2:    #1a1a2e;   /* raised surfaces, hover states */
--color-border:       #2a2a42;   /* subtle borders */
--color-accent:       #c8a96e;   /* warm gold — primary accent, headings highlight */
--color-accent-2:     #e85d3a;   /* ember/coral — CTAs, key actions */
--color-text:         #f0ede8;   /* warm white — primary text */
--color-text-muted:   #8b8ba7;   /* secondary text, captions */
--color-text-faint:   #4a4a62;   /* disabled, placeholders */
```

### Typography

```css
/* Display / Headings */
font-family: 'Cormorant Garamond', Georgia, serif;
/* — editorial, architectural, distinctive. Used for H1, H2, large callouts */

/* Body / UI */
font-family: 'DM Sans', system-ui, sans-serif;
/* — clean, readable, modern. Used for body, nav, labels, buttons */

/* Mono (code, file formats, technical details) */
font-family: 'DM Mono', monospace;
```

Load via Google Fonts in `Base.astro`:
```
Cormorant+Garamond:wght@300;400;500;600
DM+Sans:wght@300;400;500;600
DM+Mono:wght@400
```

### Type Scale (Tailwind custom + base)

- H1 hero: `text-6xl lg:text-8xl font-display font-light tracking-tight`
- H2 section: `text-4xl lg:text-5xl font-display font-light`
- H3 sub: `text-2xl font-display`
- Body: `text-base font-body font-light leading-relaxed`
- Label/tag: `text-xs font-body font-medium tracking-widest uppercase`
- Caption: `text-sm text-muted`

### Tailwind Config Additions

```js
// tailwind.config.mjs
theme: {
  extend: {
    fontFamily: {
      display: ['Cormorant Garamond', 'Georgia', 'serif'],
      body: ['DM Sans', 'system-ui', 'sans-serif'],
      mono: ['DM Mono', 'monospace'],
    },
    colors: {
      bg:       '#0a0a12',
      surface:  '#11111e',
      surface2: '#1a1a2e',
      border:   '#2a2a42',
      accent:   '#c8a96e',
      accent2:  '#e85d3a',
    }
  }
}
```

### Visual Details
- Subtle grain texture overlay on `body` (SVG noise, opacity 0.03)
- Cards: `bg-surface border border-border rounded-sm` — squared corners, not rounded-xl
- Hover on cards: border-color shifts to `accent` with `transition-colors duration-300`
- Section dividers: single pixel `border-border` lines, or generous whitespace — never decorative squiggles
- Images: always `object-cover`, never stretched, overflow hidden
- No box shadows — use border + background contrast instead

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
10. **Do not use Inter, Roboto, or Arial** — use Cormorant Garamond + DM Sans.
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
