---
name: write-article
description: Write, edit, or publish a blog article for visiongraphics.eu in the established house voice. Use whenever the user asks for a new article, blog post, case study write-up, technical deep-dive, announcement, or to revise/publish an existing draft in src/content/articles/. Covers voice, structure, frontmatter, images, thumbs, cross-linking, and the publish checklist.
---

# Write an article

Articles are the one **EN-only** collection: plain-string frontmatter, plain-Markdown body,
no `<Lang>`, no `{en,hu}` objects, and in practice no MDX components. Blog is enabled in the
nav; new drafts start `published: false` and flip only on explicit user instruction
(hard rule 16).

## Phase 1 — Sourcing (before writing a word)

- Facts come from: existing content in this repo, the user, dev.visiongraphics.eu, or the
  linked external product (ai.visiongraphics.eu). **Never invent** project names, client
  details, dates, metrics, or capabilities (hard rule 1). Missing fact → ask, or draft with
  `TODO_<FACT>` and list every one in your report.
- No raw AI prompts as visible text (hard rule 2), no fake testimonials.
- Read the two newest articles before writing — `from-render-to-photograph-archupgrade.mdx`
  and `inside-archupgrade-technical.mdx` are the current voice benchmark. Older articles vary
  (some first-person singular); **new work uses studio "we"**.

## Phase 2 — Voice & structure

**Voice:** confident, plain-spoken, benefit-first. Written by a practitioner with 30 years in
the field, not a marketer. Second person for the reader's outcomes. Em-dashes for rhythm.
No hype adjectives; specifics instead ("about ten minutes per batch", "four candidate images").

**Canonical skeleton:**

1. **Open with the reader's concrete pain** — a scene, not a thesis.
   *"Every architectural visualization project hits the same wall: the 3D model is accurate,
   the camera angles are approved… and then the polishing begins."*
2. **What we built / how it works** — `##` sections, numbered lists for process steps.
3. **Benefit paragraphs with bold lead-ins:**
   `**You see more options, earlier.**` `**The design stays under control.**`
   One benefit per paragraph; lead sentence is the claim, rest is the evidence.
4. **"The honest position"** — a recurring house section: state plainly what the tech does
   *not* do. *"This system doesn't replace 3D work — it's built on top of it."* Every
   AI-related article includes it.
5. **Soft CTA close, always linking `/contact/`:**
   *"…[get in touch](/contact/) — the first conversation is free."*

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

## Phase 5 — Verify & (on instruction) publish

Draft checklist:
- [ ] `npm run check` clean; article renders at `/en/articles/<slug>/` (draft renders in dev).
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

Known constraint (CLAUDE.md §8.10 bug 2): the articles templates are not i18n-migrated —
HU URLs serve English text and body links resolve to `/en/`. That's accepted; do not localize
article frontmatter (it would render `[object Object]`), and do not "fix" the template as part
of an article task.
