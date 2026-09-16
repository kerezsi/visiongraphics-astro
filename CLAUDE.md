# CLAUDE.md — Vision Graphics operating manual

Company website for **Vision Graphics Kft.** (visiongraphics.eu) — Budapest architectural
visualization studio, founded 1996, solo operator **László Kerezsi** (30+ years 3ds Max,
deep AI integration, Unreal VR, custom scripting). Astro 5 static site on Cloudflare Pages,
bilingual EN/HU, custom block editor in `tools/editor/`.

**How to use this file.** Sections 1–5 are rules — read them as constraints, not suggestions.
Section 6 gives per-deliverable acceptance checklists. Section 7 tells you exactly when to act
and when to ask. Section 8 is lookup reference. Three procedures live as skills, invoke them
instead of improvising: `/add-mdx-component`, `/translate-hu`, `/write-article`.

Old WordPress prototype at https://dev.visiongraphics.eu is a *content reference only* — do not
copy its markup, patterns, or bugs.

---

## 1. Mental model

- **Everything renders twice.** Every page exists at `/en/...` and `/hu/...`, built from one
  template in `src/pages/[lang]/...`. Any value you print may be a plain string **or** an
  `{ en, hu }` object. The single most common failure in this repo is printing that object raw.
- **Two translation channels, never mixed:** UI chrome (nav, buttons, form labels) lives in
  `src/i18n/strings.ts` and resolves via `ui(lang)`. Content (MDX frontmatter + props) resolves
  via `t()`/`tStr()` from `src/lib/i18n.ts`; body prose uses paired `<Lang code="en|hu">` blocks.
  Articles are the deliberate exception: **EN-only, plain strings, no Lang blocks.**
- **Files are the source of truth.** Content = MDX/MD files in `src/content/`. The Zod schemas
  in `src/content/config.ts` are the contract. `keystatic.config.ts` has drifted from reality
  (flat strings vs `{en,hu}` files, unregistered components) — never "fix" content to match
  Keystatic; it's a legacy/fallback editor.
- **Two editors:** VG Editor (custom, `localhost:4323`, primary) and Keystatic
  (`localhost:4321/keystatic`, fallback). The VG Editor server (`localhost:4322`) also runs the
  git push/promote flows and image/thumbnail pipelines.
- **Prod is static, dev is server.** `npm run dev` → `output:'server'` + Node adapter + Keystatic
  + R2 dev proxy. `npm run build` → `output:'static'` + Pagefind. Pages Functions
  (`functions/api/contact.ts`) exist outside Astro and only run on Cloudflare (or `wrangler pages dev`).
- **Images are not in git.** They live in R2 (`visiongraphics-images`), referenced as
  `/_img/<collection>/<slug>/<file>`, served via `public/_redirects` 302s in prod and a Vite
  proxy in dev. Thumbs are generated WebP in `public/thumbs/` (also not committed).
- **Branch discipline:** all work happens on `develop`. `master` = production, written to only
  by the editor's ↑ Live promote flow (or its documented plumbing equivalent). Never edit master.

---

## 2. Environment & daily workflow

```bash
npm run dev            # Astro dev server :4321 (server mode, Keystatic at /keystatic)
npm run editor:server  # VG Editor API :4322 (tsx watch)
npm run editor:client  # VG Editor UI  :4323 (vite)
npm run build          # static build + Pagefind index
npm run preview        # preview built output
npm run check          # astro check (types + content schemas)
```

- `npm run check` needs `@astrojs/check`, which is deliberately **not** a project dependency
  (Astro prompts to install it). Run `npm i --no-save @astrojs/check` once per checkout, then
  `NODE_OPTIONS=--max-old-space-size=8192 npx astro check` — the language server needs the
  extra heap. Pre-existing errors: 13× `ts(2322)` in `keystatic.config.ts` (known drift, §4.17).

- `start-dev.bat` launches all three in separate terminals **and wipes `node_modules/.vite`
  first** (stale-dep guard). When starting servers yourself, use the `preview_start` tool with
  the configs in `.claude/launch.json` (`visiongraphics-dev`, `editor-server`, `editor-client`).
- **"restart servers"** (user shorthand): stop all preview servers → delete `node_modules/.vite`
  → start again → verify with a real HTTP request. No confirmation needed.
- `push.bat` and `upload-images.bat` are **retired**. Never run them (`push.bat` does
  `git add -A` + direct push to master — both forbidden below).
- Git commits follow `scope: lowercase summary` — scopes in use: `editor:`, `i18n:`, `seo:`,
  `legal:`, `build:`, `docs:`, `content:`, or the content area (`vision-tech:`). The editor
  auto-commits as `editor: update <slug>`.
- Production deploy chain: push to `master` → GitHub → Cloudflare Pages build (`npm run build`,
  dist, Node 20) → visiongraphics.eu. Push to `develop` → develop.visiongraphics-astro.pages.dev.

---

## 3. Hard rules (never break, no exceptions)

1. No fake testimonials, and no invented facts about real projects, clients, or dates.
   Facts come from existing content, dev.visiongraphics.eu, or the user — nowhere else.
2. No raw AI prompts as visible site text.
3. No newsletter widget anywhere.
4. No `localStorage`/`sessionStorage` in site code — state goes in URL params.
   (Sole existing exception: the theme toggle's `vg-theme` key. Do not add more.)
5. No `<form>` tags inside React components.
6. Work Sans exclusively. No other fonts (DM Mono is loaded for code in articles only).
7. No hardcoded font sizes or spacing — `var(--fs-*)` / `var(--space-*)` only.
8. Vimeo/YouTube: facade pattern, click-to-load. 360 tours: click-to-load. Never auto-embed.
9. Services/projects/articles/vision-tech are content-collection files — no static `.astro`
   detail pages for them.
10. MDX components render only if passed via `<Content components={{...}}>` in the template.
11. Never commit to or push `master`. Never `git push --force` anywhere (documented CF-recovery
    with the user driving is the sole exception).
12. Never `git add -A` / `git add .` — stage explicit paths. (The editor server's own flow uses
    `add -A` internally; that's its business, not yours.)
13. Never edit EN copy during a HU translation pass.
14. Never use PowerShell `Get-Content | Set-Content` (or `Out-File`) on repo text files.
15. No FTP. GitHub → Cloudflare Pages is the only deploy path.
16. `published: false → true` flips only on explicit user instruction.

---

## 4. Named failure modes

Each of these has actually happened here or is one naive edit away. Learn the name, apply the rule.

### 4.1 The `[object Object]` render
**Trigger:** printing a frontmatter field or block prop directly (`{data.title}`, `alt={image.alt}`).
**What happens:** localized fields are `{en,hu}` objects; Astro prints `[object Object]`, React
throws *"Objects are not valid as a React child"*. `portfolio/category/[category].astro`
shipped this way to production for months before it was caught — the raw object rendered
without any build error.
**Rule:** every value that could be `Localized<T>` passes through `tStr(value, lang)` (site) or
`readLocale(value, DEFAULT_LOCALE)` (editor canvas/inputs) before hitting JSX, attributes, or
React islands. React islands receive pre-flattened plain strings only.

### 4.2 The silent component
**Trigger:** using an MDX component in a collection whose template doesn't register it.
**What happens:** no error — the tag renders as nothing/escaped text. Hours lost staring at MDX.
**Rule:** before using a component in `src/content/<collection>/`, confirm it's in that
template's `<Content components={{...}}>` map (§8.6 lists all four maps). Adding a new
component = `/add-mdx-component`, which wires all registration points.

### 4.3 The mojibake pipe
**Trigger:** PowerShell 5.1 text round-trip on UTF-8 files (`Get-Content | Set-Content`).
**What happens:** Hungarian accents and `€` double-encode (`ó`→`Ã³`, `€`→`â‚¬`), a BOM is
prepended, Astro's schema validation crashes the dev server.
**Rule:** hard rule 14. Use the Edit tool; for bulk mechanical edits, a Node script
(`readFileSync/writeFileSync` with `'utf8'`). Recovery: `git checkout <paths>`, redo with Edit.

### 4.4 The EN drive-by
**Trigger:** improving English copy "while you're in there" during a HU translation pass.
**What happens:** EN is the canonical authored copy; unrequested changes get reverted, trust lost.
**Rule:** hard rule 13. Translation passes edit `hu:` values only. Diff before commit must show
zero EN-side changes. Full procedure: `/translate-hu`.

### 4.5 The bare href
**Trigger:** writing `href="/portfolio/foo/"` in a template.
**What happens:** link drops the locale; user bounces from /hu/ to /en/ via the legacy redirect.
**Rule:** in templates, all internal links go through `localeUrl(path, lang)`. In MDX bodies the
existing convention is bare paths (`/vision-tech/exterior/`) — they resolve to EN via
`_redirects`; that's known debt (§8.10). Follow the convention; don't invent per-file fixes.

### 4.6 The 65ch squeeze
**Trigger:** new prose area looks mysteriously narrow next to full-width block components.
**What happens:** `global.css` sets `p { max-width: 65ch }` globally.
**Rule:** any full-width prose container overrides with `.my-body :global(p) { max-width: none; }`.

### 4.7 The stale dep cache
**Trigger:** dev-mode React islands render their red label but no content (empty galleries,
dead lightbox); console shows `[astro-island] Error hydrating ...`; network shows
`504 Outdated Optimize Dep`.
**What happens:** Vite's pre-bundle cache went stale (after `npm install`, branch switches, long
sessions). Production is unaffected.
**Rule:** run the "restart servers" procedure (§2). After a `.vite` wipe, pre-warm one
island-bearing page, wait ~4s, then test the page you care about — the first load can race
Vite's re-optimization.

### 4.8 The phantom 500
**Trigger:** production page or JS chunk serves HTTP 500 with an empty body (`Server: cloudflare`,
no Content-Type), while the deploy reported success.
**What happens:** Cloudflare Pages content-addresses assets and dedupes across deploys; when its
edge blob for a "known" hash is missing, the route 500s. Symptom: detail pages die, or islands
silently fail to hydrate because their chunks 500.
**Rule:** two cache-busters force fresh hashes every build — never remove either:
(1) `Base.astro` emits `<meta name="x-build">`; (2) `astro.config.mjs` injects `__BUILD_STAMP__`
consumed by `src/lib/build-stamp.ts`. **Every new React island** (`client:*` in a template) adds
`import '../lib/build-stamp';` at the top of its entry file. Currently in exactly six islands
(§8.5). Recovery if it recurs: hard-reset master to last-good with the user driving, force-push,
redeploy; then touch the affected source on develop and promote.

### 4.9 The checkout suicide
**Trigger:** running `git checkout <branch>` / anything that rewrites tracked files while the
editor server is running.
**What happens:** the server runs under `tsx watch`; a working-tree rewrite restarts it
mid-operation. This is why ↑ Live promotes via `git commit-tree` + `push develop:refs/heads/master`
+ `update-ref` — pure plumbing, no checkout.
**Rule:** stay on `develop`. Never add checkout/reset to editor server flows; don't "simplify"
`commands.ts` promote logic or `spawn-detached.ts`. If you must switch branches, stop the editor
server first, and expect a Vite cache wipe after (§4.7).

### 4.10 The Keystatic corruption
**Trigger A:** writing `<ProjectStory text={`...`} />` style props.
**Rule:** `ProjectStory` / `ProjectTasks` / `ProjectDescription` take **children**, never a text
prop — Keystatic corrupts the prop form on save.
**Trigger B:** registering component schemas in the projects collection's `fields.mdx({})`.
**Rule:** never — inline JSX props (`images={[...]}`) crash Keystatic's ProseMirror
(`createAndFill`) and brick the whole editor page. The empty components map is deliberate.

### 4.11 The YAML colon
**Trigger:** frontmatter string containing `: ` unquoted (`description: NextNest: a project`).
**What happens:** YAML parse error, page vanishes from the collection.
**Rule:** quote such strings or use a block scalar (`|`). The editor's codegen always-quotes for
this reason — keep that behavior.

### 4.12 The trusting preview
**Trigger:** `preview_start` returns success, you assume the server is up.
**What happens:** it reports success on process *spawn*. Astro's content-schema validation runs
after startup; on error the process dies silently seconds later.
**Rule:** after starting or restarting, verify with a real request (`curl localhost:4321/en/`)
or `preview_logs` before concluding anything about your change.
**Corollary (2026-09-16):** if `preview_start` reports a port other than 4321, a dev server
is already running on this checkout (another session). Use *that* one — a second Astro dev
process on the same tree races the first on `.astro/data-store.json` and the pages start
serving `UnknownFilesystemError` overlays. Also: draft articles (`published: false`) 302 to
the index in dev, the template filters them — verify drafts by flipping the flag locally and
reverting in the same script, never by committing the flip (hard rule 16).

### 4.13 The debris commit
**Trigger:** broad staging in a tree that carries migration leftovers.
**What happens:** `storybook-static/` (untracked build output), scraped WP pages, `tmp/` etc.
end up in history.
**Rule:** hard rule 12 — explicit paths only. Before committing, read `git status` and account
for every file you stage.

### 4.14 The locale desync
**Trigger:** adding a UI string, a locale, or a vision-tech enum value in one place.
**What happens:** the value exists in N of the M places that must agree; some page silently
falls back or a filter matches nothing (an "Enhanced Reality" pill once shipped in the
vision-tech filter with no matching enum value — it could never match anything).
**Rule:** these lists have multiple owners — update all or none:
- **Locale set** (`en`/`hu` → adding `de`): §8.4 recipe, 8+ files.
- **UI strings:** every key added to `en` must be added to `hu` in `src/i18n/strings.ts`
  (the `Widen<typeof en>` type makes a missing key a compile error — run `npm run check`).
- **Vision-tech enums:** `src/content/config.ts` Zod enums ↔ `vision-tech/index.astro`
  filter arrays ↔ `src/lib/vision-tech-labels.ts` HU labels.
- **Nav:** `src/data/nav-config.json` hrefs ↔ `NAV_LABEL_KEY` maps duplicated in
  `Header.astro` *and* `Footer.astro` ↔ `Footer.astro` `SERVICE_LABELS`.
- **Editor block types:** client `types/blocks.ts` ↔ server `types/blocks.ts` (hand-synced).

### 4.15 The two SectionBanners
**Trigger:** editing "the SectionBanner component".
**What happens:** there are two. `src/components/ui/SectionBanner.astro` (page heroes, class
`.section-banner`) is *also* what the **services** template registers as the MDX `SectionBanner`.
`src/components/mdx/SectionBanner.astro` (class `.article-section-banner`) is what portfolio,
vision-tech, and articles register. Same MDX tag, different markup per collection.
**Rule:** before touching either, check which one the affected template imports. Never merge them
without user sign-off.

### 4.16 The block-type mirage
**Trigger:** adding an editor block type to some but not all of its registration points.
**What happens:** worst case is *silent data loss*: a block type missing from `blockToMdx()` in
`mdx-codegen.ts` hits `default: return null` and is **dropped on save**. Eight orphaned types
already exist in this state (§8.10) — never instantiate them.
**Rule:** a new block type is all 11 wiring steps in `/add-mdx-component` or none. The palette
not showing a block usually means the registry scanner mapping (step 9) is missing, not a UI bug.

### 4.17 The schema mirage
**Trigger:** noticing `keystatic.config.ts` disagrees with content files (flat `title` vs
`{en,hu}`, `beforeLabel` vs `label`, unregistered `ProcessFlow`...).
**What happens:** a "helpful" mass-normalization rewrites 200+ files against the wrong contract.
**Rule:** `src/content/config.ts` (Zod) + the files themselves are the truth. Keystatic drift is
known and tolerated. Never mass-edit content to reconcile it. Same for style inconsistencies
(two `ProjectStory heading` forms, two JSX-object quoting styles, one out-of-order project):
leave existing files alone; follow the *newer* convention in new work (§5.3).

### 4.18 The invented URL
**Trigger:** a tour/video URL or image path you don't actually know.
**What happens:** dead embeds shipped to production.
**Rule:** use the established placeholder convention — `TODO_<NAME>` inside the URL
(`https://pano.visiongraphics.eu/TODO_PLANET_2023/`) — and list every placeholder you leave in
your final report. Grep for `TODO_` before any publish step.

### 4.19 The direct content write (editor code only)
**Trigger:** "simplifying" `tools/editor/server/lib/fs-utils.ts` (temp-file + rename + 300ms
settle + serialized queue) into a plain `fs.writeFile`.
**What happens:** rapid writes into `src/content/` race Astro's collection watcher and crash the
dev server with empty collections.
**Rule:** all editor server writes go through `fs-utils.writeFile` and stay inside its
`validatePath` allow-list (`src/`, `public/`, `tools/editor/`). Not negotiable.

---

## 5. Conventions

### 5.1 Templates (`src/pages/[lang]/...`)

Every page template starts with this boilerplate — copy it, don't re-derive it:

```ts
// static page:
export const getStaticPaths = staticLocalePaths;
const { lang } = Astro.params as { lang: Locale };
Astro.locals.lang = lang;
const L = ui(lang);

// dynamic detail page:
export async function getStaticPaths() {
  const items = await getCollection('projects', ({ data }) => data.published);
  return localizedPaths(items, (p) => ({ slug: p.slug }));
}
const { lang, slug } = Astro.params as { lang: Locale; slug: string };
Astro.locals.lang = lang;
Astro.locals.pageType = 'portfolio';   // 'portfolio' | 'service' | 'article' | 'vision-tech'
```

- `Astro.locals.pageType` is **required** on any template that renders MDX content — media
  labels and gallery defaults key off it.
- Unknown locale segments (`/foo/`, `/xx/portfolio/`) are rewritten to `src/pages/404.astro`
  by `src/middleware.ts`. The dev server's own 404 fallback bypasses middleware and resolves
  `/404` through `[lang]/index.astro`, so that template also guards `lang ∉ LOCALES` itself —
  keep both. `404.astro` is bilingual on one page (no locale in a failed URL) and becomes
  `dist/404.html`, which Cloudflare Pages serves for every unmatched route.
- `Base.astro` emits `<html lang>`, `hreflang` alternates (+ `x-default` → EN) and `og:locale`
  from `Astro.locals.lang` — every template must set it (the boilerplate above does).
- Page-specific copy: `const COPY = { en: {...}, hu: {...} } as const; const c = COPY[lang];`
- Internal links: `localeUrl('/portfolio/foo', lang)`. Always trailing slash.
- Any template rendering MDX with galleries/compares must mount both islands:
  `<ArticleGalleryMounter client:load />` + `<ArticleImageCompareMounter client:load />`.
- MDX components in `.astro` files resolve locale as:
  `const lang: Locale = (Astro.locals as { lang?: Locale })?.lang ?? DEFAULT_LOCALE;` then `tStr()`.

### 5.2 Styling

- Design language: dark luxury editorial (default), warm-light mode via `[data-theme="light"]`.
  All tokens in `src/styles/global.css` (§8.9). Header background uses `var(--color-header-bg)`,
  never a hardcoded rgba.
- Fluid scaling: `html { font-size: clamp(...) }` makes every rem viewport-scaled 16→32px.
  This is why hard rule 7 exists — a hardcoded `px` opts out of the whole system.
- Media containers (`.tour-wrap`, `.yt-embed`, `.film-embed`, `.embla-viewport`) cap height at
  `calc(100vh - 6.5rem)` with matching 16/9 max-width, so media fits wide-short windows.
- Media facades call `scrollMediaIntoCenter()` (`src/lib/media-scroll.ts`) before swapping in
  the iframe.
- Tailwind custom utilities (`bg-page`, `text-content`, `border-line`, `text-h1..h6`, ...) are
  defined in `tailwind.config.mjs` and map to the CSS vars — renaming either side breaks the other.
- React-island CSS lives in `global.css` (scoped Astro styles can't reach island DOM).
- **Shared page-building blocks** (use these before writing page-local markup/CSS):
  `ui/SectionHeading` (kicker + title + intro, slots for inline markup), `ui/Callout`,
  `ui/BulletList` (check/dash/up/down markers, 2-column option, `html` items), `ui/ChipRow`
  (kicker + link chips, optional `code`/`accent`), `ui/CtaPanel`. Global utilities in
  `global.css`: `.eyebrow` (faint kicker), `.code` (mono accent identifier), `.tag-accent`,
  `.btn-row`, `.panel-grid` (hairline surface grid), `.field` (plain form control),
  `--size-field-sm`. Pricing-specific: `pricing/PackageGrid`, `pricing/PriceList`
  (full list, or `codes={[…]}` for a linked subset), `pricing/Estimator`.
  Labs: `labs/LabPromo` (one random app from `src/data/labs.json` per page load — SSR
  renders the first live app, an inline script swaps in a random one; no storage). The
  labs list mirrors https://labs.visiongraphics.eu — when an app ships there, add it to
  `labs.json` (`slug` = subdomain, `desc` `{en,hu}`, `live`, `tags`). Used on the home
  page bottom and the About page's Labs section.

### 5.3 Content authoring (current conventions — use these for new work)

**Projects** (`src/content/projects/*.mdx`, ~204 files):
- Frontmatter `title`/`description`: always `{en,hu}` block YAML. References (`client`,
  `designer`, `city`, `country`, `clientType`) are slugs into the reference collections —
  omit when unknown, never guess. `categories` ≥ 1. `services`/`techniques` are slug arrays
  driving cross-navigation. `has360`/`hasFilm` are **manual** booleans — set them when adding
  a `<Tour360>`/film, that's what the portfolio filter reads.
- Body order (canonical): `<ProjectTasks>` → media (`SectionBanner`+`ImageGallery` groups,
  `Tour360`) → `<ProjectStory heading={{ en: "The Story:", hu: "A sztori:" }}>`
  (all 15 localized-heading files use "A sztori:"; the `strings.ts` `theStory: 'A történet:'`
  string is apparently unused by templates — don't take it as the content convention).
- All body prose sits in paired `<Lang code="en">` / `<Lang code="hu">` blocks — never bare.
- Multi-section projects: repeat `<SectionBanner image label={{en,hu}} title={{en,hu}} />` +
  `<ImageGallery images={[...]} />` (+ optional `<Tour360>`) per themed group. Banner `image`
  = that section's lead image. R2 images are sequential `01.jpg`, `02.jpg`, ...
- `ImageGallery` images are single-line JSON arrays; project image `alt` is `""` by convention.
- Tour URLs: `https://pano.visiongraphics.eu/<SLUG>/` (subdomain-rooted, no `/PANO/` segment)
  with `coverImage` prop.
- New-work style: localized `heading` objects (not the older plain `"The Story:"`), unquoted
  JS-object keys (`{{ en: "...", hu: "..." }}`).

**Services** (7 files): localized frontmatter (`title`, `description`, `tagline`,
`startRequirements`, `pricing`, `sidebarLabel`, `sidebarContent`) + `bannerImage`, `order`,
`techniques[]`. Sidebar comes in two valid shapes: `startRequirements`+`pricing` OR
`sidebarLabel`+`sidebarContent`(+`pricing`). Body: intro `<Lang>` (may contain `##` headings)
→ `ProcessFlow` → `SectionBanner`+content groups (`DeliverableGrid` with optional `href` to
vision-tech, `ImageGallery`, `YoutubeEmbed`, `Tour360`, `ImageCompare`) → `PhaseMatrix` →
closing `<Lang>`. Reverse project links come from the **projects'** `services` arrays.

**Vision-tech** (27 files): localized `title`/`description`; structural enums (`technique`,
`cost` €–€€€€€, `model3d`, `complexity`, `reality`, `purpose[]`) — values must match the Zod
enums in `config.ts` (see §4.14). Body: alternating `<Lang>` blocks each holding at most one
`## H2`, interleaved with `SpecTable`/`CompareTable`/`ImageGallery`/`Tour360`/`YoutubeEmbed`.
`published: false` hides from index and redirects the slug. `ai-animation` and
`ai-render-upgrade` link out to ai.visiongraphics.eu.

**Articles** (EN-only): plain-string frontmatter (`title`, `date`, `excerpt`, `tags[]`,
`coverImage`, `published`), plain-Markdown body, images as `![alt](/_img/articles/<topic>/x.jpg)`,
no `<Lang>`, no MDX components in practice. House voice and full procedure: `/write-article`.

**Reference collections** (`clients`, `designers`, `cities`, `countries`, `client-types`,
`categories`): **`.md` files** with YAML frontmatter, empty body (not `.yaml` — Keystatic's
`format: {data:'yaml'}` still writes `.md`). `categories` and `client-types` have `{en,hu}`
titles; `cities`/`countries`/`clients`/`designers` are proper nouns, plain strings, never
translated.

### 5.4 MDX component usage

Registered-per-template maps are in §8.6. Props quick reference:

| Component | Key props (Localized unless noted) | Notes |
|---|---|---|
| `SectionBanner` | `image` (str), `label`, `title` | **Two implementations** — §4.15 |
| `ImageGallery` | `images:[{src,alt}]` (str), `label\|false`, `subtitle` | Needs mounters; auto-label "Gallery:" only on portfolio |
| `ImageCompare` | `before`,`after` (str), `beforeAlt`,`afterAlt`,`label`,`subtitle`,`beforeText`,`afterText` | Needs mounters |
| `SingleImage` | `src` (str), `alt`, `caption` | Self-mounts PhotoSwipe; never auto-labelled |
| `Tour360` | `url`,`coverImage` (str), `title`,`label`,`subtitle` | Click-to-load |
| `YoutubeEmbed` | `url` (str), `title`,`label`,`subtitle` | File is `YouTubeEmbed.astro`; registered under **both** spellings |
| `FilmEmbed` | `vimeoId` (str), `title` | Build-time Vimeo thumbnail fetch; currently unused in content |
| `ProjectTasks` / `ProjectDescription` | children only | Never a text prop (§4.10) |
| `ProjectStory` | `heading` + children | Default heading is EN-only — always pass `{en,hu}` |
| `DeliverableGrid` | `columns:2\|3`, `items:[{title,desc,href?}]` | `href` links card title |
| `ProcessFlow` | `steps:[{label,sub}]`, `feedback:[{from,to,label}]`, `title` | `from`/`to` 0-based |
| `PhaseMatrix` | `columns[]`, `rows:[{label,sub,values:['primary'\|'secondary'\|'none']}]`, `title` | |
| `SpecTable` | `rows:[{label,value}]`, `caption` | value may embed Markdown links |
| `CompareTable` | `headers[]`, `rows:[{label,values[]}]`, `caption` | |
| `NotableGrid` | `items:[{name,year}]` | |
| `TimelineTable` | `rows:[{scope,deliverables}]` | |

Media label defaults (red kicker above media): Gallery/Compare/360/Film labels are fixed per
type and locale, `label={false}` suppresses, `subtitle` adds a white line. Driven by
`Astro.locals.pageType`.

### 5.5 Editor codebase (`tools/editor/`)

- Express server (:4322) + React/Vite client (:4323), Zustand state, no tests currently
  (vitest installed, `tools/editor/tests/` empty — the deleted suite covered only the removed
  legacy pipeline).
- Live pipeline: `POST /api/import/md` (`mdx-import/parser.ts` + `block-mapper.ts`) → blocks →
  `POST /api/codegen/save` (`codegen/mdx-codegen.ts`). Frontmatter YAML is hand-serialized
  (always-quoting) — deliberately, see §4.11.
- Three registries that must agree per block type: palette (`client/src/lib/block-registry.ts`),
  render map (`client/src/components/blocks/index.tsx`), availability scanner
  (`server/lib/astro-registry-scanner.ts`, re-scans the four page templates per request).
- Canvas block components and inspector inputs render localized props via
  `readLocale(value, DEFAULT_LOCALE)` from `client/src/lib/localized.ts` — §4.1 applies.
- `writeLocale` auto-promotes scalar→`{en,hu}` on first non-default write and collapses back
  when HU empties. Don't fight it.
- ↑ Git = commit-all + push `develop`. ↑ Live = promote develop→master via plumbing (§4.9).
  Both 409 unless the repo is on `develop`.
- "ComfyUIPanel" actually drives **SwarmUI**. `comfyBase` in editor-config.json is dead.
- `ANTHROPIC_API_KEY` is env-only — never write it into `editor-config.json` (that file is
  committed).

### 5.6 Conventions added by this manual

Previously unwritten; now binding:
- Explicit-path staging only (hard rule 12) and the `TODO_` placeholder convention (§4.18).
- Files-over-Keystatic truth rule and the no-mass-normalization rule (§4.17).
- New-work content style: localized heading objects, unquoted JSX object keys, articles
  require `coverImage`.
- Every fix or feature that changes a workflow updates this file **in the same commit**
  (was already policy) — and if it invalidates a skill in `.claude/skills/`, updates that too.
- Known bugs (§8.10) are fixed only when the user asks; when your work touches adjacent code,
  flag them in your report instead of silently fixing.

---

## 6. Quality bars — checkable acceptance criteria

**Baseline for every change** (applies always):
- [ ] `npm run check` introduces no new errors (pre-existing errors: note them, don't fix unasked).
- [ ] Dev server serves the affected page with HTTP 200 — verified by request, not by
      `preview_start` return (§4.12).
- [ ] `git status` reviewed; only intended files changed; staged by explicit path.
- [ ] No hard rule (§3) violated; no named failure mode (§4) triggered.
- [ ] CLAUDE.md updated in the same commit if a workflow/schema/component/rule changed.

**Edited or new content entry (project / service / vision-tech):**
- [ ] Frontmatter validates (page loads without `InvalidContentEntryDataError`).
- [ ] Localized fields are `{en,hu}` objects; body prose is inside paired `<Lang>` blocks.
- [ ] Body order matches the collection convention (§5.3).
- [ ] Every image path is `/_img/<collection>/<slug>/<file>`; images exist in R2 or `.staging`.
- [ ] Thumbs generated (`node scripts/generate-thumbs.mjs --slug <collection>/<slug>`).
- [ ] Renders at **both** `/en/...` and `/hu/...` — zero `[object Object]`, zero raw `{en,hu}`.
- [ ] Galleries open the lightbox; tours/videos are facades (click-to-load).
- [ ] References (client/designer/city/...) point at existing reference-collection slugs.
- [ ] `has360`/`hasFilm` reflect actual body content.
- [ ] No `TODO_` placeholder left unreported.

**New article:** run `/write-article`; its checklist is the bar.

**Translation pass:** run `/translate-hu`; its checklist is the bar. Additionally:
- [ ] `git diff` shows no EN-side edits.

**New MDX component / editor block:** run `/add-mdx-component`; its checklist is the bar.

**New React island:**
- [ ] `import '../lib/build-stamp';` (path-adjusted) at the top of the entry file (§4.8).
- [ ] Receives only plain-string props (pre-flattened with `tStr`).
- [ ] No `<form>`, no storage APIs; state in URL params if shareable.
- [ ] Island CSS added to `global.css`, using tokens.
- [ ] Hydrates in dev with an empty console (check `preview_console_logs`).

**New page template:**
- [ ] Lives under `src/pages/[lang]/`; full boilerplate from §5.1 including `Astro.locals.lang`
      (+ `pageType` if it renders MDX).
- [ ] `getStaticPaths` via `staticLocalePaths` or `localizedPaths`.
- [ ] All internal links via `localeUrl`.
- [ ] Renders under both locales; LangSwitcher swaps correctly on it.
- [ ] Full-width prose overrides the 65ch cap (§4.6).
- [ ] If it renders MDX: components map complete, both mounters present.

**Editor (tools/editor) change:**
- [ ] All writes stay behind `fs-utils.writeFile` + `validatePath` (§4.19).
- [ ] No git working-tree mutation added to any server flow (§4.9).
- [ ] Client/server `types/blocks.ts` still mirror each other.
- [ ] Localized props still render through `readLocale` everywhere they're displayed.
- [ ] Both dev processes restart clean (`tsx watch` output + client console error-free).

**Build/deploy-affecting change:**
- [ ] `npm run build` completes locally; spot-check `dist/` output for the affected route.
- [ ] Neither cache-buster removed or weakened (§4.8).
- [ ] `public/_redirects` still covers `/_img/*`, `/thumbs/*`, legacy paths, `/PANO/*`.
- [ ] Deploy verified on the staging URL before any production promote.

---

## 7. When uncertain — escalation rules

**Act without asking** (reversible, on develop, in scope of the request):
- Reading anything; running dev servers; `npm run check`/`build`; generating thumbs.
- Content edits the user asked for, including creating files in `src/content/`.
- The "restart servers" procedure on its trigger phrase.
- Leaving `TODO_` placeholders for facts you can't source (then report them).

**Verify first, then act** (evidence gate, still no permission needed):
- Anything touching a Zod schema: run `npm run check` + load one affected page per collection.
- Mechanical edits across ≤ ~10 files: list the files in your report.
- Deleting code *you created this session*.

**Ask first** (one concise question, options offered):
- Any `git push` (even develop, unless the user said "push"/"↑ Git"). Any production promote.
- Flipping `published`, deleting/renaming existing content entries, changing slugs/URLs.
- Schema changes in `src/content/config.ts`; anything in `public/_redirects`; locale additions.
- New npm dependencies.
- Bulk rewrites > ~10 files, or *any* normalization of existing inconsistencies (§4.17).
- Touching: editor git flows, `fs-utils.ts`, build-stamp machinery, the promote plumbing.
- Fixing a known bug from §8.10 when the user didn't ask about it.

**Never** (without the user explicitly directing it in this conversation):
- Hard rules §3. Editing `master`. Force-push. `git add -A`. Publishing drafts.

**Uncertainty about facts** (project names, years, clients, URLs): check existing content →
check https://dev.visiongraphics.eu → then ask or leave `TODO_`. Never fabricate.

**Uncertainty about Hungarian wording:** the user is a native speaker. For anything
user-visible where register/nuance matters, propose your best translation and flag it for
review rather than silently shipping — see `/translate-hu`.

**Conflicting instructions** (this file vs user): the user wins; note the conflict in one line.
**Anything not covered:** follow the *newest* existing example in the repo, and say which file
you patterned it on.

---

## 8. Reference

### 8.1 URLs & infrastructure

| Thing | Value |
|---|---|
| Production | https://visiongraphics.eu (Cloudflare Pages, auto-deploy on `master` push) |
| Staging | https://visiongraphics-astro.pages.dev · develop.visiongraphics-astro.pages.dev |
| Repo | https://github.com/kerezsi/visiongraphics-astro |
| Build | `npm run build`, output `dist`, Node 20 |
| R2 bucket | `visiongraphics-images`, public: `https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev` |
| 360 tours | `https://pano.visiongraphics.eu/<SLUG>/` (tarhely host, `/public_html/PANO/` docroot) |
| AI product | https://ai.visiongraphics.eu (external — linked from ai-* vision-tech pages) |
| WP reference | https://dev.visiongraphics.eu (content reference only) |

Contact form: `/api/contact` Pages Function (`functions/api/contact.ts`), Resend API.
Env vars (Cloudflare Pages → Production): `RESEND_API_KEY` (secret), `CONTACT_TO`
(info@visiongraphics.hu), `CONTACT_FROM` (contact@visiongraphics.hu, Resend-verified domain).
Honeypot field `_gotcha` + **Cloudflare Turnstile**: widget on the contact page (site key from
the build env `PUBLIC_TURNSTILE_SITE_KEY`), token `cf-turnstile-response` verified server-side
with `TURNSTILE_SECRET_KEY` (Pages secret). Both unset → Cloudflare's always-pass test pair
(fine in dev, wrong in prod — the widget then says "testing only"). Local test: `npm run build` then
`npx wrangler pages dev dist --binding RESEND_API_KEY=... --binding CONTACT_TO=... --binding CONTACT_FROM=... --binding TURNSTILE_SECRET_KEY=...`.
The estimator hands off with `?quote=<text>&type=<project_type>`; `type` comes from
`pricing.json calculator.kinds[].contact` (the card with the largest subtotal wins).
Functions have their own `functions/tsconfig.json` (workers types); root tsconfig excludes them.

### 8.1a Pricing system (added 2026-09-15)

One price list drives both sites. Never type a price into a template.

| Piece | Path | Role |
|---|---|---|
| Master data | `src/data/pricing.json` | Families, items (codes `FAMILY.ITEM[.VARIANT]`, `{en,hu}` names), multipliers, tiers, presets, terms, retired codes. Rules: `E:\CLAUDE\Visiongraphics_strategies\PRICING_CODES.md`. |
| Math | `src/lib/pricing.mjs` (+ `pricing.d.mts` types) | The only implementation of base × multipliers × tiers. `quoteEntries(data, state, entries)` is the core: entries `{code, q, opts, types, group}` may repeat a code (one per subject) — tiers/bundles count the project-wide quantity, item multipliers come from each entry's option keys (`optValue`). `quote()` (flat `state.qty`), `presetTotal()`, `publicView()`, `calcView()` (what the estimator ships: items + the item-level option multipliers `CALC_MULTIPLIERS`; framework/rush stay out). Plain ESM so the admin tool can import it. |
| Estimator UI | `src/lib/estimator.mjs` (+ `estimator.d.mts`, `estimator.css`) | The calculator itself, plain ESM, framework-free, shared by the site (`pricing/Estimator.astro` is a thin shell) and the admin quote builder (`/lib/estimator.mjs`). A project = cards: **subjects** (building & exterior with one MOD size S–XL + optional MOD.SITE; interior spaces with m², function, furnished/empty, detail; show flats; product) each owning a model line and its outputs (stills, 360° viewpoints…), plus **project-wide groups** (film with formats/4K/360°, plans with unit types, AI stills, tour extras, web). Cards are `pricing.json calculator.kinds[]` (rows = codes with defaults, `when: furn\|empty`, `tag`, `slider`, `short` labels); `calculator.starts[]` are the one-click project shapes. Option semantics (size → `MOD.<size>`, furn → `MOD.INT.FURN/EMPTY` with q = m²) live in `entryLines()` — extend there, not in JSON. State = URL hash `#p=src=…/kind:name:opt=v,…:CODE=n,…/…` (`serialize`/`parse`; legacy `#e=` links still parse via `fromQty`, which also maps presets' flat `q` onto cards — `PackageGrid` builds its links with it). Cards fold (header click), "Codes and unit prices" toggle reveals the details, hover/focus help from `item.help`. Rail: total (+HUF on hu), closest package, warnings, lines by card, Request quote (contact prefill), Copy estimate, Copy link, Print/PDF (popup + `print()`), Clear. Mobile: one column + sticky total bar. `mount(root, D, { lang, scope, embedded, internal, contactUrl, estimateUrl, textExtra, onChange })`. Smoke check lives in the session scratchpad pattern: presets and starts must round-trip `fromQty → serialize → parse` at the same total — re-run `check-pricing.mjs` after touching kinds. |
| Check | `node scripts/check-pricing.mjs` | Asserts preset totals (Puli €1,975 · Vizsla €7,335 · Kuvasz €19,233 · Komondor €24,033), unique codes, tier maths. Run after any pricing change. |
| Admin tool | `tools/editor/pricing/index.html` → http://localhost:4322/pricing/ | Served by the editor server (two `express.static` mounts in `server/index.ts`: `/pricing` and `/lib`). **Quote builder** at the top = the site's estimator mounted with `internal: true` on the full data (framework/rush segmented in its rail, VAT + HUF, client/project fields, terms appended, Copy / Print) — this is how client quotations are produced; the link inside the text opens the same estimate publicly (internal factors are ignored there). Below it: bases, multiplier values, presets, raw JSON; **Save** = `POST /api/files/write`; **Publish** = `POST /api/commands/git-promote` (commits everything pending on develop, same as ↑ Live). |
| Public feed | `src/pages/pricing.json.ts` → `/pricing.json` | `publicView(data)`: list, public presets with computed totals, the `ai` block. CORS header for it in `public/_headers`. ai.visiongraphics.eu fetches it at page load and falls back to its bundled `pricing.js`. |
| Pages | `[lang]/pricing/index.astro`, `[lang]/pricing/estimate/index.astro`, `[lang]/terms/index.astro` | Pricing page = the list only, built from shared components (§5.2): `PriceList`, `SectionHeading`, `BulletList`, `Callout`, `CtaPanel`. Estimate page = `PackageGrid` (full cards; a card's CTA is a `#p=…` hash that loads the package into the calculator) + `Estimator` with every card kind. Short-form packages (`<PackageGrid compact>`) sit on the home page and on service pages (`service={slug}`, filtered by `presets[].services` in pricing.json) and link to the calculator with the package loaded. Service pages embed the estimator scoped to their kinds (`<Estimator scope={kinds} embedded>`, from `calculator.kinds[].services`); vision-tech pages render `<PriceList codes>` for the lines that deliver the technique. Terms = ÁSZF, EN + HU, effective 2026-10-01; its commercial numbers mirror `pricing.json.terms[]` — change the JSON first. |

Rules: internal multipliers (framework, rush, source…) are quote-only — `publicView()` strips them; keep it that way. `pricing-packages.json` and `pricing-reference.json` are superseded (still read by the editor's Pricing tab; delete both when that tab is retired). A price change is not done until `check-pricing.mjs` passes and `/en/pricing/` + `/hu/pricing/` render.

### 8.2 Images & thumbnails

- URL shape: `/_img/<collection>/<slug>/<file>` where collection ∈ portfolio, services,
  articles, vision-tech. Root images (`/hero-bg.jpg` etc.) redirect to R2 root. Inside the
  bucket there is **no** `_img/` prefix.
- Prod: `public/_redirects` 302 → R2. Dev: `r2DevProxy` in `astro.config.mjs` checks
  `tools/editor/.staging/<path>` first, then fetches R2.
- Upload path: VG Editor image picker → `.staging/<collection>/<slug>/` → "↑ R2" (rclone).
- Thumbs: WebP, `card` 600px / `large` 1600px, at `public/thumbs/<size>/<collection>/<slug>/x.webp`
  (not committed; pushed to R2 by "↑ R2 all").
  Generate: `node scripts/generate-thumbs.mjs [--slug portfolio/hotel-lycium] [--force]`.
- `thumbUrl(src, size?)` from `src/lib/image-url.ts` maps `/_img/...jpg` → `/thumbs/...webp`;
  returns `''` for falsy input — filter before rendering `<img>`.
- Gallery viewer uses `large`, cards use `card`, lightbox full-screen uses the original `src`.
- **Article illustrations via ArchUpgrade (added 2026-09-16).** The studio's AI pipeline
  (`E:\CLAUDE\archupgrade`, production on 192.168.0.2) renders through its render facade —
  `POST /api/render/t2i` `{prompt, workflow, width, height}` for text-to-image (permissive
  workflows only, e.g. `API_generate_Z_turbo_001`; never a `(!)` non-commercial one),
  `POST /api/render/lighting` `{tool:"time_of_day", source_path, params:{time_bin, sky,
  interior_lights, exterior_lights}}` for scene-locked relights of existing site renders
  (upload the source first with `POST /api/i2i/upload` multipart), then `GET /api/file?path=`
  to fetch the output. Auth: the backend on `:7788` refuses LAN callers, but the Vite dev
  server on `:5173` proxies `/api` from loopback, which the backend treats as owner — use
  `http://192.168.0.2:5173/api/...` (and tell the user this is an open door on the LAN).
  A render needs a SwarmUI node online: `GET /api/status` lists them; bring one up with
  farm-control (`POST http://<node>:7700/swarmui/start`, node E = 192.168.0.69 is the
  48 GB card) only on a node whose Backburner is idle. Site images for "before" halves are
  referenced by their existing `/_img/portfolio/<slug>/NN.jpg` paths, never re-uploaded;
  generated and relit outputs go to `articles/<topic>/` in R2 via `.staging` + rclone.
  Generated images are labelled as illustrations in alt text — never presented as
  screenshots of a real tool.

### 8.3 i18n API (`src/lib/i18n.ts`)

```ts
LOCALES = ['en','hu']; DEFAULT_LOCALE = 'en';
type Localized<T> = T | Partial<Record<Locale, T>>;
t(value, lang)         // resolve, fall back to default locale, else undefined
tStr(value, lang)      // like t() but '' fallback — use for anything printed
localeUrl(path, lang)  // '/portfolio/foo' + 'hu' → '/hu/portfolio/foo/'
swapLocale(pathname, lang) · localeFromPath(pathname)
staticLocalePaths()    // getStaticPaths for param-less pages
localizedPaths(items, paramsOf, propsOf?)  // locales × items
```
UI strings: `ui(lang)` from `src/i18n/strings.ts` — `hu` is typed `Widen<typeof en>` so a
missing key is a compile error (keys must match; text may differ). Sections: `nav`, `cta`,
`project`, `listing`, `meta`, `langSwitch`, `a11y` (aria-labels, skip link), `portfolio`
(filter island labels — passed as a plain-string `labels` prop, `{n}`/`{v}` placeholders),
`category`, `articles` (list/detail chrome; articles themselves stay EN — HU shows
`enOnlyNote`), `about`, `contact`. Article date/reading-time helpers: `src/lib/article-meta.ts`.
`<Lang code="en|hu">` (`src/components/i18n/Lang.astro`) renders its slot only for the active
locale; must be registered in the template's components map to work inside MDX.
`App.Locals` (see `src/env.d.ts`): `{ lang?: Locale; pageType?: 'portfolio'|'service'|'article'|'vision-tech' }`.

### 8.4 Adding a locale (e.g. `de`) — full sync list

1. `src/lib/i18n.ts` — `LOCALES`, `LOCALE_NAMES`, `LOCALE_SHORT`.
2. `src/content/config.ts` — `localizedString()` / `localizedStringArray()` object keys.
3. `tools/editor/client/src/lib/localized.ts` — `LOCALES`.
4. `astro.config.mjs` — `i18n.locales` **and** the sitemap `i18n.locales` map.
5. `src/i18n/strings.ts` — sibling locale object (type-enforced) + `STRINGS` map.
6. Every inline `COPY = {en,hu}` block: `[lang]/index.astro`, `services/index.astro`,
   `vision-tech/index.astro`, `services/[slug].astro`, `vision-tech/[slug].astro`,
   `privacy/index.astro`, `impressum/index.astro` — plus `lang==='hu'` ternaries in
   `portfolio/index.astro`, `Header.astro`, `Footer.astro`.
7. `src/lib/vision-tech-labels.ts` — label map. `Footer.astro` — `SERVICE_LABELS`.
8. `tools/editor/server/routers/translate.ts` — `LOCALE_NAMES`.
9. `scripts/translate-reference-collections.mjs` — dictionaries; re-run for categories/client-types.

### 8.5 Cache-buster island list (§4.8)

`build-stamp` is currently imported by exactly: `HomeCarousel.tsx`, `PortfolioFilter.tsx`,
`ServicesTabs.tsx`, `media/ImageLightbox.tsx`, `media/ArticleGalleryMounter.tsx`,
`media/ArticleImageCompareMounter.tsx`. (`ui/ImageCompare.tsx` is covered via its mounter.)
Add every future island to this list — and to this paragraph.

### 8.6 Template component maps (what MDX can use where)

- `portfolio/[slug].astro` — SectionBanner(=mdx), SingleImage, ImageGallery, ImageCompare,
  Tour360, YouTubeEmbed+YoutubeEmbed, FilmEmbed, ProjectDescription, ProjectStory,
  ProjectTasks, Lang.
- `services/[slug].astro` — SectionBanner(**=ui**), DeliverableGrid, TimelineTable, NotableGrid,
  ImageGallery, ImageCompare, ProcessFlow, PhaseMatrix, Tour360, YouTubeEmbed+YoutubeEmbed, Lang.
- `vision-tech/[slug].astro` — SectionBanner(=mdx), ImageGallery, ImageCompare, ProcessFlow,
  SpecTable, CompareTable, Tour360, FilmEmbed, YouTubeEmbed+YoutubeEmbed, Lang.
- `articles/[slug].astro` — SectionBanner(=mdx), SingleImage, ImageGallery, ImageCompare —
  **no Lang** (articles are EN-only).
All four templates also mount `ArticleGalleryMounter` + `ArticleImageCompareMounter`.
The editor palette mirrors these maps automatically via `GET /api/registry`
(`astro-registry-scanner.ts` re-scans the templates per request).

### 8.7 VG Editor map

**Processes:** server :4322 (`tsx watch tools/editor/server/index.ts`), client :4323 (vite).
Client proxies `/api` with no timeout (rclone/thumb jobs run minutes).

**Toolbar:** view tabs Editor · Pages (nav-config) · Pricing (pricing-*.json) · Projects ·
Articles · Services · Vision-Tech (batch publish/feature toggles, per-row thumbs) ·
Collections (reference CRUD). Buttons: ↑ R2 / ↑ R2 all (rclone staging→R2), ⟳ Thumbs /
⟳ Thumbs all (spawns generate-thumbs detached), ↑ Git (commit+push develop), ↑ Live
(promote develop→master, confirmation dialog), Preview MDX, Save (Ctrl-S).

**Server endpoints (prefix `/api`):** `/health`; `/registry`; `files/` pages·content·read·
write·delete·exists; `images/` upload·list·delete·push-to-r2·push-all-to-r2; `content/`
listings·collections CRUD·frontmatter patch·nav-config·pricing-packages·pricing-reference;
`ollama/` models·chat·generate·alt-text·excerpt·caption·paragraph·summary·banner-subject;
`swarmui/` status·models·generate·gallery·output; `config/` get·merge; `import/md`;
`codegen/` preview·save; `commands/` generate-thumbs·git-push·git-promote;
`translate` + `translate/batch` (engine `ollama` | `claude`; Claude key from env only).

**AI tab:** Ollama (status, model dropdown, excerpt/free-form; selected model also powers
block→prompt generation) + SwarmUI (model datalist from `ListModels` — use the internal `name`
filename, not display title; steps/CFG/sampler/scheduler defaults 4/1/euler/simple for
LCM-class models; Size 1024–2048 & Format 21:9…9:16 compute WxH from `sqrt(area×ratio)`
rounded to 8px; saved styles/prompts; ☰ Blocks select-mode + ✦ Generate sends selected block
text to Ollama — block text only, no page meta, error if empty; outputs saved to
`tools/editor/.swarmui-output/`, last 12 as gallery, lightbox on click, shift-click loads back).
Generate is async — clicking again queues concurrent jobs, round-robined across `swarmBases`
(multi-backend; per-backend failures reported in `warnings`, others complete).
Prompt Settings: named system prompts (one active, overrides task prompts) + per-endpoint task
prompts (`bannerSubject`, `chat`, `excerpt`, `caption`, `paragraph`, `summaryDescription/Story/Tasks`).
AI Settings: Ollama address (default :11434), SwarmUI address(es) (default :7801), translation
engine/model/prompt. SwarmUI hosts must listen on 0.0.0.0; generation is a blocking HTTP call
(3 min timeout), no websocket. Ollama NDJSON quirk: responses may stream despite
`stream:false` — server aggregates chunks (`ollamaGenerate()`), keep that.

**Config:** `tools/editor/editor-config.json` (committed!) — `ollamaBase`, `swarmBases[]`
(+legacy `swarmBase` mirror), `swarmModels`, `swarmStyles`, `swarmPrompts`,
`ollamaSystemPrompts`, `activeSystemPromptName`, `ollamaTaskPrompts`, `translation*`.
Secrets never go here (env only).

### 8.8 Scripts (`scripts/`)

Live maintenance:
| Script | Purpose |
|---|---|
| `generate-thumbs.mjs [--slug c/s] [--force]` | WebP thumbs from R2 + `.staging` → `public/thumbs/` |
| `translate-projects.mjs [--slug s] [--dry-run] [--skip-ai]` | HU for project frontmatter + banner/tour labels (Claude API if `ANTHROPIC_API_KEY`) |
| `translate-reference-collections.mjs [--dry-run]` | curated HU titles for categories + client-types |
| `split-lang-blocks.mjs <file>\|--all` | split `<Lang>` pairs at `##` boundaries (vision-tech) |
| `populate-tour360-cover.mjs [--dry-run]` | add `coverImage` to bare `<Tour360>` in projects |

Everything else in `scripts/` (`convert-*`, `migrate-*`, `i18n-*`, `generate-projects.js`,
`fetch-images.js`, `extract-tech-content.mjs`) is one-shot WordPress-migration history —
already applied, don't re-run.

### 8.9 Design tokens (`src/styles/global.css`)

Dark (`:root`): bg `#1a1a1a` · surface `#121212` · surface-2 `#0f0f0f` · border `#333` ·
accent `#da1313` · text `#f0f0f1` · muted `#c8c8c8` · faint `#8a8a8a` ·
header-bg `rgba(26,26,26,.95)`.
Light (`[data-theme="light"]`): bg `#f7f5f2` · surface `#eeeae5` · surface-2 `#e5e1da` ·
border `#d0cbc3` · accent `#c41010` · text `#18160f` · muted `#47433b` · faint `#8a8075` ·
header-bg `rgba(247,245,242,.95)`.
Type scale: `--fs-h1 2.986rem` … `--fs-h6 1.2rem`, `--fs-body 1rem`, `--fs-small .833rem`,
`--fs-xs .694rem`. Spacing: `--space-1..16` (0.25–4rem), `--size-header 4.5rem`.
Container max 2400px. Theme toggle: `ThemeToggle.astro`, `localStorage 'vg-theme'`, pre-paint
inline script in `Base.astro`.
ServicesTabs active indicator uses `shadow-[inset_3px_0_0_var(--color-accent)]` — `border-l-*`
is invisible under `border-none`; don't "fix" it back.

### 8.10 Known bugs & debt register (flag, don't fix unasked — §5.6)

1. **Articles are EN-only by design; the templates' chrome is now localized** (links via
   `localeUrl`, dates via `formatDate(date, lang)`, labels from `strings.ts articles`, prose
   marked `lang="en"`). `Lang` is still not registered in `articles/[slug].astro` — localizing
   an article body requires adding it (and `{en,hu}` frontmatter support in the template).
2. **`faq/`** ignores `lang` entirely (EN content on /hu/ URLs) and is nav-disabled. (`pricing/`
   was rebuilt bilingual and data-driven 2026-09-15 — §8.1a — but is still nav-disabled;
   `services/index.astro` links "See Pricing" → `/pricing/`.)
3. **Eight orphaned editor block types** (`section-label`, `diff-block`, `cta-section`,
   `button-group`, `sidebar-block`, `section-container`, `two-col`, `service-body-grid`):
   render+inspector exist, but absent from palette registry and from `blockToMdx` — saving a
   doc containing one **silently deletes it** (§4.16).
4. **`3ds-max-tools.mdx` ships `TODO_` media URLs** (Hungexpo gala, Rubik, Planet 2023 tour).
5. **Dead code — do not wire new work to it:** `ui/PageHero.astro` (unused), `comfyBase`
   config key + "ComfyUIPanel" misnomer, editor ImportDialog (unreachable), `FilmEmbed`
   (registered, unused; `hasFilm` flags exist with no embeds), projects `features`/`tags`
   (always empty — the portfolio filter hides its "Output type" group until they aren't),
   `components.css` double-import, mounter comments referencing nonexistent remark plugins.
   Pagefind is still indexed at build time but nothing on the site consumes it (no search UI).
6. **MDX body links are locale-blind** (bare `/vision-tech/x/` → redirects to `/en/...` even
   from HU pages) — accepted debt, consistent across all content.
7. **Editor live pipeline has zero tests** (vitest wired but `tools/editor/tests/` empty).
   A future suite should round-trip `documentToMdx` → `parseMdx` → `mapMdxToBlocks`.
8. **Working tree carries teardown debris:** `storybook-static/` is untracked build output.
   It is gitignored again, but delete it — `astro check` walks it otherwise (tsconfig now
   excludes it too).
9. **YouTubeEmbed nests a `<button>` inside a `role="button"` div** — works, but double
   announces to screen readers. Fix = drop the outer role and make the inner button the target.
10. **Light-mode `--color-border` is `#9a9088` in `global.css`** while §8.9 documents `#d0cbc3`;
    the CSS is what ships. Reconcile when the light palette is next touched.
11. **`ui/ImageCompare.tsx` reveals the *after* image on the left** (`clipPath: inset(0 X% 0 0)`
    on the after-wrap) while its corner labels sit before-left / after-right and the prop
    comments say "after — revealed on the right". Prose must not say "left side is the
    before" — the articles now say "the labels on the image say which". Fix = flip the clip
    side or the label sides, in the island, once, with the user's sign-off.
12. **ArchUpgrade's Vite dev server (`192.168.0.2:5173`) is an unauthenticated owner door**:
    it proxies `/api` from loopback, so any LAN peer is `owner` without a credential (the
    `:7788` backend itself refuses them). Convenient for §8.2 illustrations; a security gap
    on the production PC. Belongs to the archupgrade repo, noted here because the site
    tooling relies on it.

### 8.11 Keeping this file current

Update CLAUDE.md **in the same commit** whenever: a workflow changes; an MDX component or
editor block is added/renamed/removed (tables §5.4, §8.6, and the skill); a schema field
changes; a script or npm command appears; a rule is added or relaxed; URL patterns change; a
new "we got burned" lesson lands (add it to §4 with a name); a §8.10 bug is fixed (remove it).
If Claude made the change, Claude updates this file — and the affected skill under
`.claude/skills/` if the procedure changed.
