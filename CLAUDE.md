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

Two editors are available in dev mode:
- **VG Editor** (primary) — `http://localhost:4323/` — custom block-based editor with R2 image upload
- **Keystatic CMS** (fallback) — `http://localhost:4321/keystatic` — schema-driven MDX editor

VG Editor runs two processes: `npm run editor:server` (API, port varies) + `npm run editor:client` (UI, port 4323).
Image uploads via VG Editor go to local `.staging/<slug>/`, then "↑ R2" pushes to R2 via rclone.

**VG Editor toolbar tabs:**
- **Editor** — block-based content editor (default view)
- **Pages** — enable/disable and reorder nav items (drag-to-reorder, saved to `src/data/nav-config.json`)
- **Projects** — batch toggle Published / Featured per project; Open button loads file into editor
- **Articles** — batch toggle Published, inline tag editor; Open button loads file into editor
- **Vision-Tech** — batch toggle Published; Open button loads file into editor
- **Collections** — manage reference collections (clients, designers, cities, countries, client-types, categories)

### Collections

| Collection | Path | Format | Notes |
|---|---|---|---|
| Articles | `src/content/articles/*.mdx` | MDX | Blog posts with components |
| Services | `src/content/services/*.mdx` | MDX | Service detail pages (full-width, no sidebar) |
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

**CRITICAL — Keystatic projects MDX field has NO components registered.**
Registering `fields.array(fields.object())` schemas (e.g. `imageGalleryComponent`) in
`content: fields.mdx({ components: {...} })` for the projects collection causes a
ProseMirror `createAndFill` crash that blocks the entire editor page. Root cause: the
inline JSX prop format used in existing MDX files (`images={[{...}]}`) is incompatible
with Keystatic's internal ProseMirror node representation of array/object schemas.
**Do not add component schemas back to the projects `fields.mdx({})` call.**
Body text and all frontmatter fields are still fully editable; component blocks appear
as opaque embeds (preserved on save, not visually editable in Keystatic UI).

### MDX Components (for use in content files)

```
src/components/mdx/
  SectionBanner.astro       — section divider with label + title + background image
  ImageGallery.astro        — lightbox image grid
  ImageCompare.astro        — before/after slider
  DeliverableGrid.astro     — card grid for services (2 or 3 columns)
  TimelineTable.astro       — project phase table for services
  NotableGrid.astro         — two-column list of notable projects
  ProcessFlow.astro         — horizontal step diagram with optional feedback arc (services)
  PhaseMatrix.astro         — dot matrix: deliverable types × project phases (services)
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

Also usable in service MDX (registered in service template):
```
Tour360      — click-to-load 360° iframe
YoutubeEmbed — click-to-load YouTube facade
ProcessFlow  — workflow diagram
PhaseMatrix  — phase × deliverable matrix
NotableGrid  — two-column list of notable projects
ImageGallery — lightbox image grid
ImageCompare — before/after slider
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
- Service images:  `/_img/services/[slug]/[filename]` → 302 redirect → R2
- Article images:  `/_img/articles/[slug]/[filename]` → 302 redirect → R2
- Tech images:     `/_img/vision-tech/[slug]/[filename]` → 302 redirect → R2
- Root images:     `/hero-bg.jpg` etc. → 302 redirect → R2 root

Redirects defined in `public/_redirects` (Cloudflare Pages only).
Dev proxy in `astro.config.mjs` (`r2DevProxy`) handles `/_img/*` locally by fetching from R2.

R2 bucket path structure (no `_img/` prefix inside bucket):
- `portfolio/<slug>/<file>`, `services/<slug>/<file>`, `articles/<slug>/<file>`, `vision-tech/<slug>/<file>`

To upload images: use VG Editor image picker → "↑ R2" button (calls rclone via editor server API).
All uploads go to R2 via the editor. `upload-images.bat` is retired.

### Thumbnails

Thumbnails are WebP files stored in `public/thumbs/` locally and in R2 under `thumbs/`.
They are **not committed to git** — generated locally, pushed to R2 via "↑ R2 all", served via `_redirects`.

**Sizes:**
- `card`  — 600px wide — portfolio grid, service cards, article cards, gallery thumbnail strip
- `large` — 1600px wide — gallery main viewer, lightbox fallback

**Path structure:**
```
public/thumbs/card/<collection>/<slug>/filename.webp
public/thumbs/large/<collection>/<slug>/filename.webp
```
Collections: `portfolio`, `services`, `articles`, `vision-tech`

**Generating thumbnails:**
```bash
node scripts/generate-thumbs.mjs                          # all images (R2 + staging)
node scripts/generate-thumbs.mjs --slug portfolio/hotel-lycium  # single folder
node scripts/generate-thumbs.mjs --force                  # regenerate existing
```
Sources: R2 bucket (all 4 collections) + `tools/editor/.staging/` (locally staged images).
Output goes to `public/thumbs/` (local only — not committed). Run before "↑ R2 all" in the editor.

**`thumbUrl(src, size?)` — `src/lib/image-url.ts`:**
```ts
thumbUrl('/_img/portfolio/slug/01.jpg')          // → /thumbs/card/portfolio/slug/01.webp
thumbUrl('/_img/services/slug/01.jpg', 'large')  // → /thumbs/large/services/slug/01.webp
thumbUrl(undefined)                              // → '' (safe — projects without coverImage)
```
Default size is `'card'`. Gallery main viewer uses `'large'`. Lightbox fullscreen uses the original `src` directly.
`src` accepts `string | undefined | null` — returns `''` for falsy input. Always filter out
empty strings before rendering `<img>` tags.

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

**Nav:** driven by `src/data/nav-config.json` — edit via VG Editor → Pages tab or directly in the file.
Currently enabled: Portfolio · Services · Technologies · About · Contact
Currently disabled: FAQ · Pricing · Blog (toggle on when pages are ready)

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
             ProcessFlow.astro, PhaseMatrix.astro,
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
techniques (array of vision-tech slugs), services (array of service slugs),
tags (array), coverImage, has360 (boolean), hasFilm (boolean), published, featured.

**`services` field** — which services this project demonstrates. Used for bidirectional
service↔project navigation: service pages show a carousel of projects that list them.
Set via the Keystatic multiselect or VG Editor Projects overview. Valid values match
the service collection slugs: `architectural-visualization`, `product-visualization`,
`large-scale-projects`, `advanced-ai-services`, `workflow-optimization`,
`3ds-max-tools`, `custom-rendering`.

**`story` and `tasks` are NO LONGER frontmatter fields.** They live in the MDX body
as `<ProjectStory>` and `<ProjectTasks>` children components.

**MDX body order (standard):**
1. `<ProjectTasks>` — what was done
2. `<ImageGallery>` / `<Tour360>` / `<FilmEmbed>` / `<YoutubeEmbed>` — media
3. `<ProjectStory heading="The Story:">` — background narrative (at the end)

Gallery/compare require `ArticleGalleryMounter` + `ArticleImageCompareMounter` client islands.

**Portfolio page layout** (`[slug].astro`):
- **"The Project:"** (red heading) → description text → data line (Field / Date / Location / Client / Architect)
- **"The Task:"** (red heading) → techniques bar (`|` separated) → services bar (links to service pages) → MDX body content
- **"The Story:"** (red heading, editable per project) → story text — rendered by `<ProjectStory>`

The services bar only renders when `services` frontmatter is non-empty.

**Filter detection:** `has360` and `hasFilm` are manual boolean checkboxes in the editor.
Tick them when adding a `<Tour360>` or `<FilmEmbed>`/`<YoutubeEmbed>` to a project.

**Valid category values:** `architectural-visualization`, `residential`, `commercial`,
`office`, `airport`, `infrastructure`, `urban`, `hospitality`, `industrial`,
`product-visualization`, `vr-experience`, `animation`, `exhibition`,
`education`, `healthcare`, `sports`, `civic`, `agriculture`, `renovation`, `transportation`

**YAML gotcha:** If `description` contains a colon followed by a space, wrap in double
quotes or use a block scalar (`|`).

### Services (MDX)
Frontmatter: title, description, tagline, bannerImage, order, published,
startRequirements, pricing, sidebarLabel, sidebarContent, techniques (array of vision-tech slugs).
MDX body: SectionBanner, DeliverableGrid, TimelineTable, NotableGrid, ImageGallery, ImageCompare,
ProcessFlow, PhaseMatrix, Tour360, YoutubeEmbed.

Note: the reverse link (which projects belong to this service) comes from the **project's** `services`
array — there is no `services` field on the service schema itself.

**Service detail page layout** (`src/pages/services/[slug].astro`):
- Full-width, no sidebar. Layout: banner → breadcrumb → tagline → meta strip → MDX body → techniques chips → related projects carousel → CTAs.
- **Meta strip** — horizontal flex row showing `pricing`, `startRequirements`, and optionally `sidebarLabel`+`sidebarContent`. Only renders when at least one field exists.
- **Techniques chip row** — rendered from `techniques` frontmatter array (vision-tech slugs). Links to `/vision-tech/[slug]/`.
- **Related projects carousel** — projects whose `services` array includes this service slug. Drag-to-scroll, gradient overlay cards.
- **`DeliverableGrid` `href` prop** — optional; when provided, the card title becomes a link (use for vision-tech cross-links).

**ServicesTabs active indicator** — uses `shadow-[inset_3px_0_0_var(--color-accent)]`, NOT `border-l-*`. Reason: `border-none` on the button element suppresses all border-style, making border-l invisible.

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

## Keeping CLAUDE.md Current

This file is the single source of truth for how the project works. **Update it whenever:**
- A workflow changes (editors, image upload, deployment, thumbnail generation)
- A new MDX component is added or an existing one is renamed/removed
- A content schema field is added, removed, or repurposed
- A new tool, script, or npm command is introduced
- A hard rule is added or relaxed
- The site structure or URL patterns change
- A best practice is established through trial and error (especially "we got burned by X")

Updates should be made **in the same commit** as the code change they document.
If Claude made the change, Claude updates this file. If you made the change manually, note it here.

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
