---
name: add-mdx-component
description: Add a new MDX component to the Vision Graphics site and wire it as a VG Editor block, end to end. Use whenever the user asks to create a new content component, block, embed, table, or media element for MDX content (projects/services/articles/vision-tech), to register an existing component in more page types, or to add a new block to the editor palette. Also use to diagnose "block missing from palette", "component renders as nothing", or "block disappears on save".
---

# Add an MDX component / editor block

A new component touches **up to 13 files across two codebases**. Every partially-wired state
fails *silently* (component renders as nothing; block missing from palette; block deleted on
save). Work through the phases in order and finish with the verification checklist — a block
type is all steps or none (CLAUDE.md §4.16).

## Phase 0 — Scope decision (30 seconds, saves an hour)

Answer before writing code:

1. **Which collections use it?** portfolio / services / vision-tech / articles. This decides
   which template maps (Phase 2) and which editor page types see it.
2. **Does it need to be editable in the VG Editor?** If the user will only ever hand-write it
   in MDX (rare), stop after Phase 3 and say so. Default: yes, wire the editor.
3. **Is it a media component** (renders images/iframes)? Then it needs the MediaLabel + facade
   + viewport-cap conventions in Phase 1.
4. **Does an existing component already cover it?** Check the table in CLAUDE.md §5.4 first —
   e.g. a "stats table" is `SpecTable`; a "card grid" is `DeliverableGrid`. Propose reuse
   before building.

## Phase 1 — The Astro component (site side)

Create `src/components/mdx/<Name>.astro`.

**Localized-prop boilerplate** (mandatory for every text prop):

```astro
---
import { tStr, DEFAULT_LOCALE, type Locale, type Localized } from '../../lib/i18n';

interface Props {
  title?: Localized<string>;
  // plain-string props (URLs, image srcs) stay string
}
const { title } = Astro.props;
const lang: Locale = (Astro.locals as { lang?: Locale })?.lang ?? DEFAULT_LOCALE;
const titleStr = tStr(title, lang);
---
{titleStr && <h3>{titleStr}</h3>}
```

Rules:
- Every prop a human reads is typed `Localized<string>` and resolved with `tStr` — printing it
  raw is failure mode §4.1.
- CSS: tokens only (`var(--fs-*)`, `var(--space-*)`, `var(--color-*)`); if the component
  contains prose paragraphs, add `:global(p) { max-width: none; }` inside its scope (§4.6).
- **Media components additionally:** render `<MediaLabel label={...} subtitle={...} />` above
  (accept `label?: Localized<string> | false` to suppress); facades click-to-load (never
  auto-embed, hard rule 8); call `scrollMediaIntoCenter(el)` from `src/lib/media-scroll.ts`
  before swapping in an iframe; cap the container `max-height: calc(100vh - 6.5rem)` with
  matching 16/9 `max-width`.
- If it shows zoomable images: either mount PhotoSwipe itself via a `[data-pswp-gallery]`
  wrapper (pattern: `mdx/SingleImage.astro`) or emit a mount div consumed by an existing
  mounter island (pattern: `mdx/ImageGallery.astro` → `.article-gallery-mount`). A **new**
  island entry file must `import '../lib/build-stamp';` (§4.8) and be added to CLAUDE.md §8.5.

## Phase 2 — Register in page templates

For each collection from Phase 0, import the component and add it to the
`<Content components={{ ... }}>` map:

| Collection | Template | Watch out |
|---|---|---|
| portfolio | `src/pages/[lang]/portfolio/[slug].astro` | `SectionBanner` here = `mdx/` version aliased `MdxSectionBanner` |
| services | `src/pages/[lang]/services/[slug].astro` | `SectionBanner` here = the **`ui/`** version — two different components share the tag (§4.15) |
| vision-tech | `src/pages/[lang]/vision-tech/[slug].astro` | |
| articles | `src/pages/[lang]/articles/[slug].astro` | No `Lang` in this map — articles are EN-only |

An unregistered component renders as *nothing, with no error* (§4.2). If the component's name
has case quirks (like `YouTubeEmbed`), register both spellings the way the templates do for
`YoutubeEmbed`.

## Phase 3 — Registry scanner mapping (bridges site → editor)

`tools/editor/server/lib/astro-registry-scanner.ts`:
- MDX-component block → add `'<ComponentName>': '<block-type>'` to `COMPONENT_TO_BLOCK`.
- Pure prose block (no MDX tag) → add the type to `PROSE_BLOCKS` instead.

The scanner re-reads the four templates on every `GET /api/registry` call, so the palette
updates without a server restart — but **only for components in this map**. "Block missing
from palette" is almost always this step missed.

## Phase 4 — Editor wiring (9 files)

Work top to bottom; each row names the failure you get if you skip it.

| # | File | Add | Skipped → |
|---|---|---|---|
| 1 | `tools/editor/client/src/types/blocks.ts` | name in `BlockType` union; variant in `BlockData`; `<Name>Props` interface (text fields typed `LocalizedValue`) | type errors everywhere else |
| 2 | `tools/editor/server/types/blocks.ts` | mirror both unions (localized fields as `unknown`) — hand-synced by design | server type errors |
| 3 | `tools/editor/client/src/lib/block-registry.ts` | `Map` entry: `label, group ('mdx-component'\|'prose'), icon, allowedIn, canNest, defaultProps, description` | `createDefaultBlock` throws; can't drag from palette |
| 4 | `tools/editor/client/src/components/blocks/<Name>Block.tsx` | canvas preview. **Every displayed prop and every input `value=` goes through `readLocale(prop as any, DEFAULT_LOCALE)`** from `../../lib/localized` | React "Objects are not valid as a React child" crash once translated |
| 5 | `tools/editor/client/src/components/blocks/index.tsx` | import + `blockComponentMap` entry | canvas shows "Unknown block" |
| 6 | `tools/editor/client/src/components/inspector/Inspector.tsx` | `case '<type>':` property form; localized text props use `LocalizedTextField` (gets EN/HU inputs + ✦ Translate); names/URLs pass `noTranslate` | block uneditable |
| 7 | `tools/editor/server/lib/codegen/mdx-codegen.ts` | `case` in `blockToMdx()` serializing to MDX. Localized values: emit `key={JSON.stringify(obj)}` when object, bare string when scalar; skip empty via the existing `hasContent()` pattern | **block silently deleted on save** — the data-loss failure (§4.16) |
| 8 | `tools/editor/server/lib/mdx-import/block-mapper.ts` | component name in `MDX_COMPONENTS` set **and** a `case` in `componentToBlock()` | opening a file that contains it degrades it to prose / drops it |
| 9 | `tools/editor/server/lib/astro-page-parser.ts` | name in that file's own `MDX_COMPONENTS` set — only if it should be recognized inside static `.astro` pages | component in page templates treated as raw text |

## Phase 5 — Documentation (same commit)

- CLAUDE.md §5.4 props table + §8.6 template maps.
- If it's a media component: the media-label table too.
- If the block replaces or deprecates an old one, say so in §8.10.

## Verification checklist (all must pass)

Site side:
- [ ] Test usage added to one real content file per registered collection (or a scratch draft
      with `published: false`).
- [ ] Renders at `/en/...` **and** `/hu/...` with localized props as `{en,hu}` objects —
      no `[object Object]`, no React child error.
- [ ] `npm run check` — no new errors.
- [ ] Media: facade click loads the embed, page scrolls it into view, label/subtitle render,
      `label={false}` suppresses.

Editor side (both editor processes running):
- [ ] Palette shows the block **only** on the page types whose templates register it
      (verify: `curl localhost:4322/api/registry`).
- [ ] Drag from palette → canvas preview renders with defaultProps.
- [ ] Inspector edits every prop; EN/HU fields translate and persist.
- [ ] **Round-trip:** Save → open the written MDX file and eyeball the emitted tag → reload
      the file in the editor → block reappears with identical props. This one catch-all test
      catches steps 7+8.
- [ ] Save a doc *without* the new block — diff shows no unrelated churn.

Report: list every file touched, the round-trip diff, and any `TODO_` left.

## Symptom → missed step

| Symptom | Cause |
|---|---|
| Not in palette | Phase 3 (scanner map) or Phase 4 step 3 (registry) |
| Palette drag throws "Unknown block type" | step 3 |
| Canvas shows "Unknown block" | step 5 |
| Canvas crashes after translating a field | step 4 missing `readLocale` |
| Block vanishes after Save | step 7 (`blockToMdx` default: null) |
| Block turns into prose on file open | step 8 |
| Renders on site as nothing | Phase 2 registration |
| Renders differently on services vs portfolio | the two SectionBanners trap — §4.15 |
