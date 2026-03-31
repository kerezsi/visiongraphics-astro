# CLAUDE.md — Vision Graphics Kft. Website

## Project Overview

Company website for **Vision Graphics Kft.** (visiongraphics.eu).
Budapest-based architectural visualization studio, founded 1996.
Solo operator: **László Kerezsi** — 30+ years in 3ds Max, deep AI integration,
Unreal Engine VR, custom scripting/automation.

Live dev reference: https://dev.visiongraphics.eu (WordPress prototype — do NOT copy its bugs)
Target: rebuild in Astro, deploy to Cloudflare Pages.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5.x (static output in prod, server in dev) |
| Styling | Tailwind CSS v3 |
| Interactivity | React islands (`client:load`) |
| Content | Astro Content Collections + Keystatic CMS |
| Content format | MDX (all collections) + YAML metadata (reference collections) |
| Search | Pagefind (post-build, static) |
| Hosting | Cloudflare Pages (staging: visiongraphics-astro.pages.dev) |
| Image Storage | Cloudflare R2 bucket: `visiongraphics-images` |
| CI/CD | GitHub → Cloudflare Pages (auto-deploy on push to master) |

---

## Commands

```bash
npm run dev          # dev server (localhost:4321) — server mode, Keystatic at /keystatic
npm run build        # production static build + Pagefind index
npm run preview      # preview built output
```

**Dev vs Prod output:**
- `dev` → `output: 'server'` + Node adapter (required for Keystatic write API)
- `build` → `output: 'static'` (Cloudflare Pages compatible, Keystatic excluded)

---

## Content Management

Content is managed via **Keystatic CMS** at `http://localhost:4321/keystatic` in dev mode.

### Collections

| Collection | Path | Format | Notes |
|---|---|---|---|
| Articles | `src/content/articles/*.mdx` | MDX | Blog posts with components |
| Services | `src/content/services/*.mdx` | MDX | Service pages with sidebar |
| Projects | `src/content/projects/*.mdx` | MDX | Portfolio projects |
| Vision-Tech | `src/content/vision-tech/*.mdx` | MDX | Technology detail pages |
| Clients | `src/content/clients/*.yaml` | YAML | Reference collection |
| Designers | `src/content/designers/*.yaml` | YAML | Reference collection |
| Cities | `src/content/cities/*.yaml` | YAML | Reference collection |
| Countries | `src/content/countries/*.yaml` | YAML | Reference collection |
| Client Types | `src/content/client-types/*.yaml` | YAML | Reference collection |
| Categories | `src/content/categories/*.yaml` | YAML | Reference collection |

### Keystatic Config

`keystatic.config.ts` in project root. Defines all collection schemas.

### MDX Components (for use in content files)

```
src/components/mdx/
  SectionBanner.astro       — section divider with label + title + background image
  ImageGallery.astro        — lightbox image grid
  ImageCompare.astro        — before/after slider
  DeliverableGrid.astro     — card grid for services (2 or 3 columns)
  TimelineTable.astro       — project phase table for services
  NotableGrid.astro         — two-column list of notable projects
  ProjectDescription.astro  — description text block (children, no props)
  ProjectStory.astro        — story/background section (heading prop + children)
  ProjectTasks.astro        — tasks text block (children, no props)
```

Also usable in project MDX (registered in portfolio template):
```
Tour360      — click-to-load 360° iframe
YoutubeEmbed — click-to-load YouTube facade
FilmEmbed    — Vimeo facade
```

Usage in MDX:
```jsx
<SectionBanner image="/_img/banners/banner-general.jpg" label="Label" title="Title" />
<DeliverableGrid columns={3} items={[{ title: "...", desc: "..." }]} />
<TimelineTable rows={[{ scope: "...", deliverables: "..." }]} />
<NotableGrid items={[{ name: "...", year: "..." }]} />
<ImageGallery images={[{ src: "...", alt: "..." }]} />
<Tour360 url="https://visiongraphics.eu/PANO/SLUG/" title="Description" />
<YoutubeEmbed url="https://www.youtube.com/watch?v=ID" title="Description" />

{/* Project text blocks — use children, NOT a text prop */}
<ProjectTasks>
Tasks paragraph one.

Tasks paragraph two.
</ProjectTasks>

<ProjectStory heading="The Story:">
Background paragraph one.
</ProjectStory>
```

**CRITICAL — ProjectStory/ProjectTasks/ProjectDescription use children, not props.**
Never write `<ProjectStory text={`...`} />` — Keystatic will corrupt it on save.
Always use the opening/closing tag form with content as children.

MDX components must be passed via the `components` prop in the page template:
```astro
const { Content } = await entry.render();
<Content components={{ SectionBanner, DeliverableGrid, ProjectStory, ProjectTasks, ... }} />
```

**Note on `YoutubeEmbed` casing:** The component file is `YouTubeEmbed.astro` but MDX
content uses `<YoutubeEmbed>`. Both are registered in templates via alias:
`{ YouTubeEmbed, YoutubeEmbed: YouTubeEmbed }`.

### Multi-Section Project MDX Pattern

Complex projects (hotels, residential with multiple unit types, multi-building schemes)
use repeated `SectionBanner + ImageGallery + Tour360` blocks to group content:

```mdx
{/* Opening gallery — no banner needed */}
<ImageGallery images={[...exterior images...]} />

{/* Each section: banner → gallery → optional tour */}
<SectionBanner image="/_img/portfolio/slug/30.jpg" label="Apartment" title="C-401" />
<ImageGallery images={[...apartment images...]} />
<Tour360 url="https://visiongraphics.eu/PANO/SLUG_C401/" title="Apartment C-401 — 360°" />
```

Image numbering: R2 images are sequential (`01.jpg`, `02.jpg`… `09.jpg`, `10.jpg`…
`99.jpg`, `100.jpg`). Section split points map directly to this sequence.
Use the dev site to count images per section.

---

## Deployment

- Platform: Cloudflare Pages
- Staging URL: https://visiongraphics-astro.pages.dev
- GitHub repo: https://github.com/kerezsi/visiongraphics-astro
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20

### Image Hosting (Cloudflare R2)

Images are NOT in Git. They live in R2 bucket `visiongraphics-images`.
Public R2 URL: `https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev`

URL structure:
- Portfolio images: `/_img/portfolio/[project-slug]/[filename]` → 302 redirect → R2
- Tech images: `/_img/vision-tech/[slug]/[filename]` → 302 redirect → R2
- Root images: `/hero-bg.jpg` etc. → 302 redirect → R2 root

To upload: `upload-images.bat` (uses rclone, remote `r2`, bucket `r2:visiongraphics-images`,
flag `--s3-no-check-bucket`)

---

## Design System

### Aesthetic Direction
**Dark luxury editorial.** Portfolio imagery is the hero — everything else steps back.

### Color Palette (`src/styles/global.css`)

```css
--color-bg: #1a1a1a;   --color-surface: #121212;  --color-surface-2: #0f0f0f;
--color-border: #2a2a2a;  --color-accent: #da1313;
--color-text: #f0f0f1;  --color-text-muted: #bbbbbb;  --color-text-faint: #7a7a7a;
```

### Layout

- Max content width: **2400px** (`.container`)
- Fluid via single clamp: `html { font-size: clamp(1rem, 0.737rem + 0.842vw, 2rem) }`
- Never use static breakpoint overrides for font sizes or spacing

### Typography

**Work Sans** exclusively.

```css
--fs-h1: 2.986rem;  --fs-h2: 2.488rem;  --fs-h3: 2.074rem;
--fs-h4: 1.728rem;  --fs-h5: 1.44rem;   --fs-h6: 1.2rem;
--fs-body: 1rem;    --fs-small: 0.833rem;  --fs-xs: 0.694rem;
```

### Spacing Scale

```css
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-4: 1rem;
--space-6: 1.5rem;   --space-8: 2rem;     --space-12: 3rem;
--space-16: 4rem;    --size-header: 4.5rem;  --size-logo: 2.25rem;
```

---

## Site Structure

**Nav:** Portfolio · Services · Technologies · FAQ · Pricing · Blog · About · Contact

```
src/pages/
  index.astro
  portfolio/index.astro, [slug].astro, category/[cat].astro
  services/index.astro, [slug].astro
  vision-tech/index.astro, [slug].astro
  articles/index.astro, [slug].astro
  faq/index.astro
  pricing/index.astro
  about/index.astro
  contact/index.astro
```

---

## Component Architecture

```
src/components/
  layout/    Header.astro, Footer.astro, Nav.astro, MobileNav.tsx
  ui/        Button.astro, Tag.astro, SectionLabel.astro, SectionBanner.astro
  portfolio/ PortfolioGrid.astro, PortfolioFilter.tsx, ProjectCard.astro, ProjectGallery.astro
  media/     Tour360.astro, FilmEmbed.astro, YouTubeEmbed.astro, ImageLightbox.tsx,
             ArticleGalleryMounter.tsx, ArticleImageCompareMounter.tsx
  mdx/       SectionBanner.astro, ImageGallery.astro, ImageCompare.astro,
             DeliverableGrid.astro, TimelineTable.astro, NotableGrid.astro,
             ProjectDescription.astro, ProjectStory.astro, ProjectTasks.astro
  blocks/    BlockRenderer.astro  (legacy — kept for reference, no longer used)
```

`src/components/ui/SectionBanner.astro` = page-level hero/section divider (used in templates).
`src/components/mdx/SectionBanner.astro` = in-body banner (used via MDX content files).

---

## Content Collection Schemas

See `src/content/config.ts` for full Zod schemas.

### Projects (MDX)
Frontmatter fields: title, displayTitle, year, description (SEO/cards only),
client (reference), designer (reference), city (reference), country (reference),
clientType (reference), categories (array of references), features (array),
techniques (array of vision-tech slugs), tags (array), coverImage,
has360 (boolean), hasFilm (boolean), published, featured.

**`story` and `tasks` are NO LONGER frontmatter fields.** They live in the MDX body
as `<ProjectStory>` and `<ProjectTasks>` children components.

**MDX body order (standard):**
1. `<ProjectTasks>` — what was done
2. `<ImageGallery>` / `<Tour360>` / `<FilmEmbed>` / `<YoutubeEmbed>` — media
3. `<ProjectStory heading="The Story:">` — background narrative (at the end)

Gallery/compare require `ArticleGalleryMounter` + `ArticleImageCompareMounter` client islands.

**Portfolio page layout** (`[slug].astro`):
- **"The Project:"** (red heading) → description text → data line (Field / Date / Location / Client / Architect)
- **"The Task:"** (red heading) → techniques bar (`|` separated) → MDX body content
- **"The Story:"** (red heading, editable per project) → story text — rendered by `<ProjectStory>`

**Filter detection:** `has360` and `hasFilm` are manual boolean checkboxes in the editor.
Tick them when adding a `<Tour360>` or `<FilmEmbed>`/`<YoutubeEmbed>` to a project.

**Valid category values:** `architectural-visualization`, `residential`, `commercial`,
`office`, `airport`, `infrastructure`, `urban`, `hospitality`, `industrial`,
`product-visualization`, `vr-experience`, `animation`, `exhibition`

**YAML gotcha:** If `description` contains a colon followed by a space, wrap in double
quotes or use a block scalar (`|`).

### Services (MDX)
Frontmatter: title, description, tagline, bannerImage, order, published,
startRequirements, pricing, sidebarLabel, sidebarContent.
MDX body: SectionBanner, DeliverableGrid, TimelineTable, NotableGrid, ImageGallery, ImageCompare.

### Articles (MDX)
Frontmatter: title, date, excerpt, tags, coverImage, published.
MDX body: prose + SectionBanner, ImageGallery, ImageCompare.

### Reference Collections
clients, designers, cities, countries, client-types, categories — title field only.
Managed via Keystatic. Used as `reference()` in projects schema.

---

## Portfolio Filter

`src/components/portfolio/PortfolioFilter.tsx` — React island (`client:load`).
Filters: category multi-select, features multi-select, year range, text search,
360 toggle, film toggle, sort. All AND logic. State in URL params.

360/film toggles read `has360` / `hasFilm` boolean fields from frontmatter (not derived
from MDX body). Set these manually in the editor when a project has tours or films.

---

## DO NOT / HARD RULES

1. No fake testimonials.
2. No raw AI prompts as visible text.
3. No newsletter widget anywhere.
4. No `localStorage`/`sessionStorage` — use URL params.
5. No `<form>` tags in React components.
6. No WordPress patterns.
7. No personal project links (FakeHistory.eu) on main site.
8. No FTP — GitHub → Cloudflare Pages only.
9. Work Sans exclusively — no other fonts.
10. No hardcoded font-size or spacing — use `var(--fs-*)` and `var(--space-*)`.
11. Vimeo: facade pattern only — never auto-embed iframe on page load.
12. 360 tours: click-to-load — never auto-load iframe.
13. Contact page required at /contact/.
14. Services are content collection files — no static `.astro` service pages.
15. MDX components must be passed via `<Content components={{...}} />`.
