# Vision-Tech Media Recovery — Inventory & Plan

**Status:** plan only, no files modified.
**Source of truth for recovery:** `O:\VISIONGRAPHICS_ASTRO\old_dev_site\output\custom\vision-tech\` — clean WordPress export-to-markdown dump, one folder per tech slug, each containing `index.md` + `images/`.
**Mirror as backup:** `O:\VISIONGRAPHICS_ASTRO\dev_visiongraphics_eu\wp-content\uploads\{2024..2026}\` — full original uploads tree if we ever need a higher-res original instead of the `-scaled` variant.

---

## 1. What's actually missing

The MDX **body text** on all 27 vision-tech pages is intact (6.4k–15.4k chars each).
What was lost is **inline media**: galleries, before/after compare sliders, embedded 360 tours, embedded YouTube videos.

The only frontmatter that survived per page is the single cover `image:` (`/_img/vision-tech/<slug>.jpg`).

**Three distinct editor-save regressions are responsible** (found by walking every commit in `git log --all` and counting block types per blob — full audit below):

| Commit | Date | Damage |
|---|---|---|
| `9e3e084` "editor: update new-page" | Apr 6 2026 | `3d-animation`: 6 → 5 YoutubeEmbed (lost `F1ppMBJhOMQ`). `video-production`: 9 → 7 YoutubeEmbed (lost `ZUPh1y-oNWU` and `hYO10Gz-BWU`). |
| `53a72b8` "editor: update ai-render-upgrade" | Apr 6 2026 | `aerial-integration`: 17 → 4 ImageCompare (lost 13 compare pairs). |
| `5b19ba1` "editor: update large-scale-projects" | May 6 2026 | Wiped every vision-tech `gallery:` frontmatter array to `[]` across 20 files. |

All three commit messages name only one page each, but the saves rewrote the whole collection. **Same class of bug — editor's bulk-save re-serializes neighbouring files using a normalised in-memory representation that drops fields/blocks it doesn't understand.** It has already fired three separate times.

**Audit method:** walked `git log --all` for every file under `src/content/vision-tech/`, parsed each historical blob, recorded peak counts of `<ImageCompare>`, `<ImageGallery>`, `<Tour360>`, `<YoutubeEmbed>/<YouTubeEmbed>`, `<SingleImage>`. Compared each peak to the current MDX. The only files where peak > current are the four listed above. **No other block types were silently dropped** — `<ImageGallery>`, `<Tour360>`, `<SingleImage>` counts are unchanged across history.

Note: the wiped `gallery:` arrays only ever held **3–4 placeholder paths** per page in the Astro repo. The real galleries on the live WordPress site were **never imported** in the first place — they live only in the WP export. So gallery work is an "import for the first time" job. The ImageCompare and YouTube losses are true regressions where git has the previous good state.

---

## 2. Full per-slug inventory

Counts are from the WP-export `images/` folder. `unique` strips `-scaled` and `-240x150` variants; that's the number of distinct real images.

| Slug | Total files | Unique images | Body refs | Cover OK? | 360/Video embeds |
|---|---:|---:|---:|---|---|
| `architectural-styling` | 349 | ~175 | 348 | ✓ | — |
| `interior-styling` | 255 | ~128 | 254 | ✓ | — |
| `section` | 255 | ~128 | 276 | ✓ | — |
| `site-plan` | 255 | ~128 | 276 | ✓ | — |
| `historical-reconstruction` | 233 | ~117 | 232 | ✓ | — |
| `photorealistic-rendering` | 233 | ~117 | 232 | ✓ | — |
| `virtual-reality-vr-experience` | 233 | ~117 | 232 | ✓ | 1× YouTube (`2bg24RAqv9A`) |
| `night-renderings` | 203 | ~102 | 202 | ✓ | — |
| `photo-integration` | 203 | ~102 | 202 | ✓ | — |
| `marketing-apartment-plan` | 161 | ~81 | 160 | ✓ | — |
| `architectural-details-generation` | 139 | ~70 | 138 | ✓ | — |
| `interior` | 116 | ~59 | 115 | ✓ | — |
| `cultural-context-integration` | 51 | ~26 | 50 | ✓ | — |
| `non-photorealistic-render` | 51 | ~26 | 52 | ✓ | — |
| `marketing-level-plan` | 47 | ~25 | 46 | ✓ | — |
| `aerial-integration` | 36 | ~36 | 34 | ✓ | — |
| `aerial-photography` | 34 | ~18 | 33 | ✓ | — |
| `drone-photography` | 31 | ~16 | 30 | ✓ | — |
| `exterior` | 27 | ~15 | 26 | ✓ | — |
| `adaptive-reuse-illustrations` | 5 | 5 | 6 | ✓ | — |
| `360-photo-integration` | 4 | 4 | 2 | ✓ | — |
| `3d-animation` | 1 | 1 | 0 | ✓ | 6× YouTube |
| `360-photography` | 1 | 1 | 0 | ✓ | 2× PANO iframe (MAROS, KESZ_INFOPARK) |
| `360-renderings` | 1 | 1 | 0 | ✓ | 2× PANO iframe (TESTVERHEGYI/KINT, CSERJE_A01) |
| `360-tour` | 1 | 1 | 0 | ✓ | 3× PANO iframe (GRABO_VR_001, AYT_T2_EXPO, AYT_VR) |
| `video-production` | 1 | 1 | 0 | ✓ | 8× YouTube |

**Totals:** ~1700 unique images, ~16 YouTube embeds, ~7 PANO tour embeds, **21 ImageCompare pairs** (see §7a for details — these were missed in the earlier draft).

Cover image column is `✓` because every MDX still has `image: /_img/vision-tech/<slug>.jpg` pointing at R2. I have **not** verified R2 actually contains those files (the dev site rendered them, so they probably exist, but a small audit step is in the plan below).

---

## 3. Suspected duplicates across slugs (must verify)

Several slug pairs/triples have **identical file counts** in the WP export. Possibilities: (a) WP re-used the same media library items across pages, so the markdown exporter re-downloaded the same files for each page; (b) the exporter is naively dumping every attachment from a shared category. Either way, the inventory below is per-page, but we may want to dedupe at the R2 layer (e.g. upload once under `/_img/vision-tech/shared-styles/` and reference from multiple pages).

| Match | Slugs |
|---|---|
| 255 files / 128 unique | `interior-styling`, `section`, `site-plan` |
| 233 files / 117 unique | `historical-reconstruction`, `photorealistic-rendering`, `virtual-reality-vr-experience` |
| 203 files / 102 unique | `night-renderings`, `photo-integration` |

A diff of the actual file lists between e.g. `section/images/` and `site-plan/images/` will tell us if the bytes are identical. **Decision needed**: dedupe at R2 (one upload, many references) or accept the duplication (simpler URLs, larger bucket).

---

## 4. Per-section structure for sample pages

The WP markdown groups galleries inside each `## H2` section. Recovery should preserve that structure (i.e. use an `<ImageGallery>` block per section, not one giant gallery).

**`exterior/`** (15 unique, 5 galleries):
```
## What are Exterior Visualizations?   → gallery × 12 thumbs
## How We Create Them                   → gallery × 1
## When to Use Exterior Visuals         → gallery × 1
## What You Get                         → gallery × 4
## Our Approach                         → gallery × 8
```

**`aerial-integration/`** (36 unique, 5 galleries — already partially populated as `<ImageCompare>` pairs in commit 655a938; **needs cross-check against current MDX**):
```
## What is Aerial Integration?  → gallery × 10
## How We Create Them           → gallery × 6
## When to Use Aerial Integration → gallery × 14
## What You Get                 → gallery × 2
## Getting Started              → gallery × 2
```

**`section/`** (128 unique, 7 galleries — note the H3 sub-sections at end):
```
## What's a Section?     → gallery × 36
## How It Works          → gallery × 58
## What Makes It Special → gallery × 44
## When to Use It        → gallery × 64
## Common Questions      → gallery × 30
### Museum Complex       → gallery × 22
### Mixed-Use Tower      → gallery × 22
```

**`architectural-styling/`** (175 unique, 12 galleries — biggest page):
```
## What Is Architectural Styling? → gallery × 42
## Why This Matters               → gallery × 42
## How It Works                   → gallery × 16
## When To Use It                 → gallery × 22
## What We Need From You          → gallery × 20
## What You Get Back              → gallery × 30
## The Secret Sauce               → gallery × 34
## From Seeing to Building        → gallery × 34
## Ready to Try It?               → gallery × 28 + 26 + 20 + 34
```

A full per-section breakdown for all 26 pages (excluding `ai-animation`/`ai-render-upgrade` which post-date the WP site and link to ai.visiongraphics.eu instead) can be generated by running:

```bash
for d in O:/VISIONGRAPHICS_ASTRO/old_dev_site/output/custom/vision-tech/*/; do
  echo "=== $(basename $d) ==="
  awk '/^## /{print "  "substr($0,4); next} /^### /{print "    "substr($0,5); next} /!\[/{
    n=gsub(/!\[/, "&", $0); print "      [gallery: "n" images]"
  }' "$d/index.md"
done
```

---

## 5. Image filename conventions

WP names are descriptive and long (often > 100 chars), e.g.:
```
171451-international-style-architecture-Professional-photo-of-A-community-center-anchor-scaled.jpeg
```
For R2 / git-friendliness the rest of the site uses sequential numeric names (`01.jpg`, `02.jpg`, … as documented in CLAUDE.md). **Decision needed:**

- **Option A — keep original WP names.** Pro: traceable back to source; preserves whatever SEO juice the descriptive names had. Con: long URLs, looks messy in MDX, mixing `.jpg`/`.jpeg`/`-scaled.jpeg` extensions.
- **Option B — rename sequentially (`01.jpg` … `NN.jpg`).** Pro: matches rest of site, clean URLs. Con: throws away the descriptive filename, need a sidecar mapping if we want to keep alt-text per image.
- **Option C — rename per section (`01-overview-01.jpg`, `01-overview-02.jpg`, `02-process-01.jpg`).** Pro: groupable, debuggable. Con: more work, custom scheme.

**Recommended: Option B**, with the descriptive part folded into the `alt=` text on each `<ImageGallery>` entry (so SEO and a11y survive, URLs stay clean).

---

## 6. Cover image audit (small, do first)

Each MDX references `/_img/vision-tech/<slug>.jpg`. The WP export covers are inside each `images/` folder under names like `121858-A-modern-glass-office-building...jpg`. We need to confirm:

1. For each slug, does the existing R2 file `/_img/vision-tech/<slug>.jpg` actually load? (Quick: HEAD request against the public R2 URL, or check the dev `_img` proxy.)
2. If yes → leave alone. If 404 → derive a replacement from `index.md` frontmatter `coverImage:` field and upload that.

This is an easy pre-flight step before the main gallery import.

---

## 7a. ImageCompare (before/after slider) inventory — UPDATED

The live dev site uses Jet Elements' **Juxtapose** widget for before/after sliders. A `grep` for the `juxtapose` class across all 26 vision-tech pages shows compares on **only three pages**:

| Slug | Live pairs | Current MDX | Δ | Source filename pattern |
|---|---:|---:|---:|---|
| `aerial-integration` | **17** | 4 | **−13** | `<base>a-scaled.jpg` (before, aerial-only) + `<base>-scaled.jpg` (after, with 3D buildings) |
| `adaptive-reuse-illustrations` | **3** | 2 | **−1** | one shared "before" (industrial ruin) + 3 different AI-generated "afters" |
| `360-photo-integration` | **1** | 0 | **−1** | `koki_FC_pano_0000000____` (before) + `koki_FC_pano_0010000____` (after) |

**Total: 21 pairs on the live site, 6 currently in MDX, 15 pairs to recover.**

(13 of the 15 can be restored straight from git commit `9e3e084^`/`9e3e084` — they were present there. The other 2 — 1 pair on `adaptive-reuse-illustrations`, 1 on `360-photo-integration` — were never in git at all and must come from the live HTML / WP export.)

All before/after image URLs were scraped from the live site's HTML (`jet-image-comparison__before-image` / `__after-image` classes). Full mapping:

### `aerial-integration` (17 pairs)
Section labels from the live page: Hotel Adria Pearl (5 pairs), Bruesa Római (3), Agora Budapest (8), Millenium City Center (1?), Sasadliget 6 (1) — section grouping needs visual confirmation against the live page; the HTML returns pairs in source order but section headers may not align 1:1.

```
NV_exterior_006_DJI_0053a-scaled.jpg  →  NV_exterior_006_DJI_0053-scaled.jpg
NV_exterior_005_DJI_0024a-scaled.jpg  →  NV_exterior_005_DJI_0024-scaled.jpg
NV_exterior_009_DJI_0069a-scaled.jpg  →  NV_exterior_009_DJI_0069-scaled.jpg
NV_exterior_008_DJI_0067a-scaled.jpg  →  NV_exterior_008_DJI_0067-scaled.jpg
NV_exterior_007_DJI_0058a-scaled.jpg  →  NV_exterior_007_DJI_0058-scaled.jpg
legi-2a-scaled.jpg  →  legi-2-scaled.jpg
legi-4a-scaled.jpg  →  legi-4-scaled.jpg
legi-3a-scaled.jpg  →  legi-3-scaled.jpg
07a-scaled.jpg  →  07-scaled.jpg
06a-scaled.jpg  →  06-scaled.jpg
05a-scaled.jpg  →  05-scaled.jpg
04a-scaled.jpg  →  04-scaled.jpg
03a-scaled.jpg  →  03-scaled.jpg
02a-scaled.jpg  →  02-scaled.jpg
01a-scaled.jpg  →  01-scaled.jpg
Camera_LEGI_3266_B_verzioa-scaled.jpg  →  Camera_LEGI_3266_B_verzio-scaled.jpg
sasad6_v02_nappal_madar_002_016a-scaled.jpg  →  sasad6_v02_nappal_madar_002_016-scaled.jpg
```

All 36 source files are present in `O:/.../aerial-integration/images/` — the existing 4 MDX `<ImageCompare>` blocks already use 4 of these pairs under R2 paths like `/_img/vision-tech/aerial-integration/NV_exterior_006a.jpg` (note the rename: stripped `_DJI_0053`, stripped `-scaled`). The remaining 13 pairs need uploading and inserting.

### `adaptive-reuse-illustrations` (3 pairs)
```
225825-street-view-of-old-industrial-building-...veget.jpg  →  230338-cinematic-film-still-Luxury-cultural-centre...cafe.jpg
225825-street-view-of-old-industrial-building-...veget.jpg  →  232506-futurist-architecture-Luxury-cultural-centre...busy.jpg
225825-street-view-of-old-industrial-building-...veget.jpg  →  233047-Luxury-cultural-centre-based-in-a-renovated-building-busy-social-life...su.jpg
```
Same "before" image for all three, three different AI re-imaginings. Current MDX has 2 of these 3.

### `360-photo-integration` (1 pair)
```
koki_FC_pano_0000000____-scaled.jpg  →  koki_FC_pano_0010000____-scaled.jpg
```
A 360° equirectangular panorama as a single before/after. Not currently in MDX (0 ImageCompare blocks).

**Note on the WP-export markdown's loss of compare semantics:** the export-to-markdown tool flattens Juxtapose widgets into plain `[![]()](href)` links. The pair grouping is gone in the markdown output — you can only recover it from the live HTML. That's why my earlier plan version under-counted: I scanned `index.md` for `![` occurrences but the export had no way to indicate "this image was paired with that image as a compare." The list above came from re-scraping the live HTML, which is now also done.

---

## 7. Embed recovery (separate from images)

These don't go through R2 — they're component references in MDX bodies:

**360-tour**
```mdx
<Tour360 url="https://pano.visiongraphics.eu/GRABO_VR_001/" title="..." />
<Tour360 url="https://pano.visiongraphics.eu/AYT_T2_EXPO/" title="..." />
<Tour360 url="https://pano.visiongraphics.eu/AYT_VR/" title="..." />
```
(`visiongraphics.eu/PANO/X/` in the WP export must be rewritten to `pano.visiongraphics.eu/X/` — see CLAUDE.md "360 Tour Hosting".)

**360-photography** → `MAROS`, `KESZ_INFOPARK`
**360-renderings** → `TESTVERHEGYI/KINT`, `CSERJE_A01`
**virtual-reality-vr-experience** → 1× YouTube `2bg24RAqv9A` + existing media

**3d-animation** — live site has 6 YouTubes; current MDX has 5; commit 3908dbe added 6 and commit 9e3e084 dropped one.
- Current 5: `PqXKCl0whBk`, `yOqy4AkDurM`, `ccN5VFdpiGY`, `M85Bksymq7M`, `RJm7AEw5TCo`
- Missing 1: **`F1ppMBJhOMQ`** — restore from `git show 3908dbe:src/content/vision-tech/3d-animation.mdx`

**video-production** — live site has 9 YouTubes; current MDX has 7; commit 3908dbe added 9 and commit 9e3e084 dropped two.
- Current 7: `w3FA-emHwUA`, `k5m8m-62-iY`, `8glggVCVnR8`, `YG-e79HA9IY`, `J8sC225jB9Q`, `JsyyLxKKbvw`, `aiQ8tUT2xFk`
- Missing 2: **`ZUPh1y-oNWU`** and **`hYO10Gz-BWU`** — restore from `git show 3908dbe:src/content/vision-tech/video-production.mdx`

**virtual-reality-vr-experience** — live site has 1 YouTube `2bg24RAqv9A`; current MDX has 0. Never in git. Add fresh.

**360-photography / 360-renderings / 360-tour** — `<Tour360>` counts match live site (current = peak across history). PANO URL rewrite (`visiongraphics.eu/PANO/X/` → `pano.visiongraphics.eu/X/`) was already done in commit `ddb204b`. **No action needed.**

---

## 8. Out-of-scope (don't touch)

- **`ai-animation`** and **`ai-render-upgrade`** — these were added post-WP (commits `5ea35cd` and `e7f53c5`) and link to `ai.visiongraphics.eu`. The WP export has no folder for them. Leave them as-is.
- **`cultural-context-integration`** — `published: false` per CLAUDE.md. We can still import its 26 unique images so the page is ready if/when it's enabled, but it's not user-visible right now. Lowest priority.

---

## 9. Proposed recovery workflow

### Phase 0 — verify before touching anything
1. Run cover-image HEAD check (§6). Output: list of broken covers (probably 0).
2. Grep current MDX for `YoutubeEmbed`, `Tour360` to confirm §7 status. Output: list of slugs still needing embeds added.
3. Diff suspected-duplicate folders (`section` vs `site-plan` vs `interior-styling`; `historical-reconstruction` vs `photorealistic-rendering` vs `virtual-reality-vr-experience`; `night-renderings` vs `photo-integration`). Output: decision on dedup strategy (§3).

### Phase 1 — image staging (local, reversible)
For each slug:
1. Read `O:/.../<slug>/index.md`, walk it section-by-section, build a JSON manifest `{ section: 'What Is...', images: ['filename1.jpeg', 'filename2.jpeg', ...] }`.
2. Pick the `-scaled.jpeg` variant when present, else the bare file. Drop `-240x150` thumbs (PhotoSwipe / thumbnail script generates its own).
3. Optionally downscale 3000px-wide originals to ≤ 2400px to save R2 storage.
4. Rename sequentially per page (Option B above): `01.jpg`, `02.jpg`, …
5. Copy into `tools/editor/.staging/vision-tech/<slug>/` (or the editor's expected staging path).

No R2 upload yet. No MDX edits yet.

### Phase 2 — R2 upload
1. `↑ R2` push from VG Editor, or `rclone copy` directly. Target: `vision-tech/<slug>/01.jpg` … etc.
2. Generate thumbs: `node scripts/generate-thumbs.mjs --slug vision-tech/<slug>` for each slug.
3. Push thumbs to R2.

### Phase 3 — MDX rewrites (one PR per ~5 slugs, reviewable)
For each slug, edit the body to insert one `<ImageGallery images={[...]} />` block under each H2 that had images in the WP source:

```mdx
## What are Exterior Visualizations?

[existing body text]

<ImageGallery images={[
  { src: "/_img/vision-tech/exterior/01.jpg", alt: "modern glass facade at dusk" },
  { src: "/_img/vision-tech/exterior/02.jpg", alt: "residential building, side elevation" },
  ...
]} />
```

For the three slugs that use before/after compares (see §7a), insert `<ImageCompare>` blocks per pair instead of (or alongside) the gallery:

```mdx
<ImageCompare
  before="/_img/vision-tech/aerial-integration/NV_exterior_005a.jpg"
  after="/_img/vision-tech/aerial-integration/NV_exterior_005.jpg"
  label={{ en: "...", hu: "..." }}
/>
```

For 360/video pages, add `<Tour360>` / `<YoutubeEmbed>` blocks per §7.

Keep the frontmatter `gallery:` array **empty** — the new structure is in-body via `<ImageGallery>` blocks, which is the documented pattern in CLAUDE.md (`MDX body: prose + SectionBanner, ImageGallery, ImageCompare`). The frontmatter field is legacy and probably not even rendered any more.

**Naming for compare pairs:** keep the `a` suffix convention from aerial-integration (`Xa.jpg` = before, `X.jpg` = after). It's already established in the 4 existing pairs. For adaptive-reuse-illustrations, name the shared "before" once (e.g. `industrial-ruin-before.jpg`) and reference it three times against three different `-after-N.jpg` files.

### Phase 4 — Hungarian alt-text
The WP exports are English-only. Once English alt-text is in, run the editor's per-image ✦ Translate button (or batch via `/api/translate/batch`) to populate `alt: { en: '...', hu: '...' }` for the localized schema.

### Phase 5 — editor bug fix (prevent recurrence)
**Two regressions, same class of bug.** Both came from editor saves whose commit message names a single page but whose diff touches the whole vision-tech collection:

| Commit | File | Damage | Symptom |
|---|---|---|---|
| `53a72b8` (Apr 6) | `aerial-integration.mdx` | 17 `<ImageCompare>` → 4 | Editor dropped blocks it didn't recognise from the in-memory representation |
| `5b19ba1` (May 6) | 20× vision-tech `.mdx` | `gallery:` → `[]` | Editor normalised an "unknown" frontmatter field to default-empty |

Likely root causes in `tools/editor/server/`:
- Block-mapper or codegen treats `ImageCompare` (and any block not in its current registry) as "unknown" and drops it on round-trip serialize.
- Frontmatter serializer fills any "expected but missing" field with its default value (`[]` for arrays) — even when the field was unchanged by the edit.
- A "save all" / bulk-write in a collection update endpoint that touches sibling files unnecessarily.

Add at least two regression tests:
1. Load a vision-tech MDX with `<ImageCompare>` blocks, parse it, serialize back, assert byte-identity (apart from a field actually mutated).
2. Edit one file in a collection, save it, assert no sibling files in the same collection were modified on disk.

These catch the whole class of "side-effect on save" bugs that produced both regressions documented in §1.

---

## 10. Effort estimate

| Phase | Time |
|---|---|
| 0. Verify | 30 min |
| 1. Image staging script + dedup decisions | 2–3 h (one script, runs over all 26 slugs) |
| 2. R2 upload + thumbs | 1 h (mostly waiting on rclone + thumb generation; ~1700 images × 2 sizes) |
| 3. MDX rewrites | 4–6 h (~26 pages × 10 min each, mostly clicking through the editor; or scripted) |
| 4. Hungarian alt-text | 1–2 h (depends on translation engine; batch API is fast) |
| 5. Editor bug fix + test | 2–3 h |
| **Total** | **~12–16 h** |

Bulk of the work is mechanical and scriptable. The decision points that gate everything:

- **Filename scheme** (§5 — A / B / C)
- **Dedup strategy** (§3 — keep duplicates per page vs shared folder)
- **Whether to downscale** (Phase 1 step 3 — saves ~50% bucket size)
- **Whether to rebuild `cultural-context-integration`** while we're in there

Once those four are answered, the rest can run end-to-end without further input.

---

## 11. What I need from you to proceed

1. ✅ / ❌ — **Option B (sequential `01.jpg` filenames, descriptive text moves to `alt=`)**
2. ✅ / ❌ — **Dedupe at R2 (one upload, many MDX references) for the three duplicate groups in §3**
3. ✅ / ❌ — **Downscale originals to ≤ 2400px before upload**
4. ✅ / ❌ — **Include `cultural-context-integration` in this pass even though it's unpublished**
5. Pick a starting batch: e.g. start with the 5 smallest pages (`exterior`, `drone-photography`, `aerial-photography`, `aerial-integration`, `adaptive-reuse-illustrations`) as a dry run before tackling the 350-image monster.
