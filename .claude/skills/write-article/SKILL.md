---
name: write-article
description: Write, edit, or publish a blog article for visiongraphics.eu in the established house voice. Use whenever the user asks for a new article, blog post, case study write-up, technical deep-dive, announcement, or to revise/publish an existing draft in src/content/articles/. Covers voice, structure, frontmatter, images, thumbs, cross-linking, and the publish checklist.
---

# Write an article

Articles are **authored in English and translated afterwards** (all 15 bilingual since
2026-09-17). Write the EN draft as plain Markdown with plain-string `title`/`excerpt`; the HU pass
(`/translate-hu`) then turns those into `{en,hu}`, wraps every prose run in paired
`<Lang code="en">` / `<Lang code="hu">` blocks and localizes component captions
(`subtitle`, `beforeText`, `afterText`, `label`, `title` → `{{ en, hu }}`) by script — see the
articles paragraph in CLAUDE.md §5.3 for the exact file shape. Blog is enabled in the nav; new
drafts start `published: false` and flip only on explicit user instruction (hard rule 16).

## Phase 1 — Sourcing (before writing a word)

- Facts come from: existing content in this repo, the user, dev.visiongraphics.eu, or the
  linked external product (ai.visiongraphics.eu). **Never invent** project names, client
  details, dates, metrics, or capabilities (hard rule 1). Missing fact → ask, or draft with
  `TODO_<FACT>` and list every one in your report.
- No raw AI prompts as visible text (hard rule 2), no fake testimonials.
- Read the two newest articles before writing — `inside-archupgrade-technical.mdx` and
  `the-3ds-max-toolkit-we-built-for-ourselves.mdx` are the current voice benchmark (all
  fifteen were rewritten to it on 2026-09-17).

## Phase 2 — Voice & structure

**Voice (owner's decision, 2026-09-17):** László's own, **first person singular**. "We" only
where the studio team literally acts (rendering, delivery). Compact and concise: facts only,
no marketing or "AI" adjectives, no benefit-selling, no "the first conversation is free"
boilerplate. Dry, occasionally sarcastic, never at the reader's expense. The stance is a
practitioner who does not know everything, expects the ground to move, learns, experiments,
and says so when he was wrong ("I was right then and wrong now"). Specifics over claims
("about a minute per image per GPU"). Bold lead-ins only for parallel list items, never for
claims. Cut prose, not facts: keep every number, name, image and component the old version had.

**Canonical skeleton:**

1. **Open with the concrete problem** — a scene, not a thesis, two to four sentences.
2. **What I built / how it works** — `##` sections, numbered lists for process steps.
3. **Where it stands / What it is not / What I do not trust it with** — the recurring house
   section, in plain words, replacing the old "The honest position". State what the tech does
   *not* do, what is unverified, what was deliberately left unbuilt. Every AI-related article
   includes it, and it should read as the least certain part of the piece.
4. **One-line close linking `/contact/`.** No sales paragraph before it.

**Formatting rules:** `##` for sections (never `#` — the title renders from frontmatter);
`###` sparingly for sub-points; `**bold**` for emphasis and lead-ins; numbered lists for
sequences, bullets for parallel items; short paragraphs (2–4 sentences).

**Links:** internal links are bare paths with trailing slash — `/services/advanced-ai-services/`,
`/vision-tech/ai-render-upgrade/`, `/contact/`. Cross-link relevant service and vision-tech
pages naturally in-text. External product: `ai.visiongraphics.eu`.

**The companion pattern:** substantial topics ship as a pair — a client-facing piece (outcomes,
plain language) and a technical deep-dive (real stack names, architecture, version labels) —
each opening with a link to the other: *"In a [companion article](/articles/<slug>/) we showed
what X does for clients. This one is for the technically curious."* Offer this split when the
material supports both audiences.

## Phase 3 — Frontmatter

```yaml
---
title: "From Render to Photograph: Our In-House AI Enhancement Pipeline"
date: 2026-07-07
excerpt: "One-to-two sentence hook, quoted, no markdown."
tags:
  - ai
  - workflow
coverImage: /_img/articles/<topic>/<image>.jpg
published: false
---
```

- `title`: plain string, quoted if it contains `: ` (§4.11). Colon-subtitle pattern is house
  style.
- `date`: today, `YYYY-MM-DD`.
- `tags`: lowercase kebab, reuse the existing vocabulary before coining new:
  `ai`, `workflow`, `tools`, `comfyui`, `architectural-visualization`, `guide`, `process`.
- `coverImage`: **required for new articles** (newer convention; powers cards/index). Path
  under `/_img/articles/<topic>/`.
- `published: false` until the user says publish.

## Phase 4 — Images

- Markdown images only: `![meaningful alt text](/_img/articles/<topic>/<name>.jpg)` —
  articles *do* write real alt text (unlike project galleries).
- Path discipline: `/_img/articles/<topic>/...`. Files must reach R2 (or the editor's
  `.staging/articles/<topic>/`) — images referenced but never uploaded 404 in production.
  If you can't upload, list required files + target paths in your report.
- House visual conventions: two adjacent images = before/after pair (tell the reader:
  *"Drag the slider…"* if it's an ImageCompare, or caption the pair); four consecutive
  images = variation grid.
- After images land: `node scripts/generate-thumbs.mjs --slug articles/<topic>`, then push
  thumbs via the editor's "↑ R2 all" (or note it for the user).
- **Illustrations:** generate through ArchUpgrade's render facade (CLAUDE.md §8.2 — text-to-image
  for editorial heroes, `time_of_day` relights of existing portfolio renders for honest
  before/after pairs), and reuse site images by their existing `/_img/portfolio/...` paths.
  Generated images say so in their alt text ("Illustration: …"); never pass one off as a
  screenshot of a real tool. Real tool screenshots: headless Chrome over CDP works for public
  and LAN pages; crop out sidebars that carry internal project codenames.
- Before/after pairs go in `<ImageCompare>` (registered in the articles template), variation
  sets in `<ImageGallery label={false} subtitle="…">` — plain markdown images are just `<img>`,
  there is no remark plugin turning adjacent images into anything.

## Phase 5 — Verify & (on instruction) publish

Draft checklist:
- [ ] `npm run check` clean; article renders at `/en/articles/<slug>/`. Drafts do **not** render in
      dev (the template filters `published`) — verify by flipping the flag locally and reverting in
      the same script, never by committing it.
- [ ] No invented facts; every `TODO_` reported; no raw prompts; no testimonial-like quotes.
- [ ] Voice check: opens with pain, bold benefit lead-ins, "honest position" present (if the
      topic claims capabilities), CTA closes with `/contact/` link.
- [ ] All images resolve (dev proxy fetches R2/staging — a broken image means a wrong path or
      missing upload); alt text on every image.
- [ ] Excerpt reads as a hook on the articles index card.
- [ ] Companion piece cross-links both ways (if pair).

Publish (only when the user says so):
- [ ] Flip `published: true`.
- [ ] Images pushed to R2; thumbs generated and pushed.
- [ ] Appears on `/en/articles/` index with cover + excerpt.
- [ ] Deploy via the normal flow (↑ Git → staging check → user drives ↑ Live).

Until the HU pass runs, a draft with a plain-string title renders as English on `/hu/` too
(marked `lang="en"`, and the HU index shows its "English only" note) — that is the designed
fallback, not a bug. Body links stay bare paths and resolve to `/en/` (CLAUDE.md §8.10).
