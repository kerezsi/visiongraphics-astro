# Content Audit — Remediation Plan

Companion to `content-audit.md`. Each item lists: file(s), what to do, and who needs to provide what.

Items are ordered by severity. **P0** must ship before public launch; **P1** should ship before launch; **P2** is polish.

---

## P0 — Blocking / Visible Broken Content

### 1. Wire up the contact form
- **File:** `src/pages/contact/index.astro:84`
- **Action:**
  - Decide on form backend (Formspree, Cloudflare Pages Forms, Web3Forms, or self-hosted via Cloudflare Worker).
  - Replace `https://formspree.io/f/YOUR_FORM_ID` with the real endpoint.
  - Test submission end-to-end against a real inbox.
  - Verify the honeypot field still works.
- **Needs from László:** Decision on backend + the endpoint/account.
- **Effort:** 30 min once the endpoint exists.

### 2. Replace `PLACEHOLDER` YouTube URL
- **File:** `src/content/services/large-scale-projects.mdx:53`
- **Action:**
  - Either insert a real infrastructure-animation video URL, or remove the embed entirely. If no suitable video exists, replace with a still + caption instead.
- **Needs from László:** Either (a) a YouTube URL of a phased-construction animation, or (b) confirmation to delete that block.
- **Effort:** 5 min.

### 3. Fix the placeholder bullets + banner in the published AI article
- **File:** `src/content/articles/ai-in-architectural-visualization.mdx:23–27`
- **Action:**
  - Delete the `- First result / - Second result / - Third result` placeholder list (lines 23–25).
  - Either remove the `<SectionBanner label="Label" title="Section Title" />` (line 27) or fill it with a real label + title that fits the section ("Where AI Genuinely Helps" → e.g. `label="In production" title="What we use every day"`). Use a more specific banner image than `banner-general.jpg`.
- **Needs from László:** A real banner image (or approval to use an existing relevant one) + label/title text. Or a decision to drop the banner.
- **Effort:** 15 min.

### 4. Replace AI services placeholder media
- **Files:** `src/content/services/advanced-ai-services.mdx:30–35` and `:45`
- **Action:**
  - **`<ImageCompare>`** — supply one real before/after pair (input sketch → AI-enhanced render). This is the single most important visual on the AI page.
  - **`<ImageGallery>`** — six images currently all `/_img/placeholder.jpg`. Replace with real examples matching the alt text already written: sketch input, AI render output, two material variations, two lighting studies (daytime/evening). If only some examples exist, shrink the gallery; do not ship placeholders.
- **Needs from László:** 1 before/after pair + up to 6 sample images. Upload via VG Editor → "↑ R2".
- **Effort:** 30 min editor work once images exist; image production can be batched in one SwarmUI session.

### 5. Delete `test-page.mdx`
- **File:** `src/content/articles/test-page.mdx`
- **Action:** `git rm src/content/articles/test-page.mdx`. Confirm no other code references the slug.
- **Effort:** 2 min.

### 6. Hide or rewrite `cultural-context-integration.mdx`
- **File:** `src/content/vision-tech/cultural-context-integration.mdx`
- **Action (recommended):** delete the file entirely. It's `published: false`, so removing it has no user-visible effect, and the content is so off-tone it can't be cleaned up — only rewritten.
  - If the topic is worth keeping in the roadmap, add a one-line entry to a `TODO.md` in the project root and re-author from scratch using `architectural-styling.mdx` or `adaptive-reuse-illustrations.mdx` as a structural template.
- **Action (if rewriting now):**
  - Rewrite the description field (currently a raw WordPress excerpt with `&hellip;`).
  - Replace all raw HTML with proper MDX prose + `<SpecTable>` / `<CompareTable>` blocks.
  - Drop Midjourney from the tools list — it's not used elsewhere on the site.
  - Match the technical, direct tone of every other vision-tech page.
- **Needs from László:** Decision: delete vs rewrite-now vs keep-as-roadmap.
- **Effort:** 2 min to delete; 2–3 hours to rewrite properly.

---

## P1 — Should Ship Before Launch

### 7. Fix three identical YouTube titles in product visualization
- **File:** `src/content/services/product-visualization.mdx:22, 74, 78`
- **Action:** Give each `<YoutubeEmbed>` a `title` that describes what that specific video shows, in a way that matches the surrounding section banner ("Hero Imagery" / "Configure" / "Show How It Works").
- **Needs from László:** A one-line description per video.
- **Effort:** 10 min.

### 8. Rewrite raw-filename image alt text
- **File:** `src/content/services/product-visualization.mdx:56`
- **Action:** Replace each `alt` value with a real description of what the image shows ("Custom kitchen unit, brushed-brass finish, studio lighting" instead of "NAGYKEP copy"). Optional: rename the underlying R2 files to readable English slugs at the same time.
- **Needs from László:** One-line description per image (5 images).
- **Effort:** 15 min.

### 9. Resolve the 2–3w / 1–2w timeline contradiction
- **Files:** `src/pages/pricing/index.astro:17, 30`, `src/pages/faq/index.astro:33`
- **Issue:** Essential = "Standard 2–3 week timeline" (5 stills); Professional = "Accelerated 1–2 week timeline" (15 stills + animation); FAQ = "Most architectural renders: 1–2 weeks".
- **Action (pick one):**
  - **A — make Essential 1–2w:** Most consistent. Drop "Accelerated" from Professional. State that Professional includes more deliverables, not faster turnaround.
  - **B — make FAQ honest:** Change FAQ answer to "Single-building still set: 2–3 weeks. Multi-image packages with animation: 1–2 weeks (Professional package)." This is harder to justify to clients (paying more = faster).
  - Recommend **A**.
- **Needs from László:** Decision A vs B.
- **Effort:** 10 min.

### 10. Drop the "most significant development in 30 years" opener
- **File:** `src/content/services/advanced-ai-services.mdx:13`
- **Action:** Replace the opening sentence with the second sentence's content directly:
  > "We can now produce photorealistic images and animations from hand sketches, rough plans, or reference photos — without building a full 3D model first. What used to take weeks of modelling before a single render can now begin from a drawing."
- **Effort:** 2 min.

### 11. Remove "cutting-edge" buzzword
- **File:** `src/pages/about/index.astro:211`
- **Action:** Change `'Cutting-edge specialists brought in when needed — not carried as overhead.'` to `'The right specialists brought in when needed — not carried as overhead.'` (or "Tested specialists…", matching the language used elsewhere on the same page).
- **Effort:** 1 min.

### 12. Tighten the "What if I'm not satisfied?" FAQ answer
- **File:** `src/pages/faq/index.astro:163`
- **Action:** Drop "quality guarantees" and "solution-focused approach". Lead with the concrete part:
  > "We do checkpoint reviews throughout the project rather than revealing the final result cold. Issues are rare because of that. When something does need to change, we have a clear revision process."
- **Effort:** 5 min.

### 13. Disambiguate "Sochi, Pulkovo" in FAQ
- **File:** `src/pages/faq/index.astro:62`
- **Action:** Change `"Sochi, Pulkovo"` to `"Sochi Airport, Pulkovo Airport (St. Petersburg)"` — match the full names already used in `large-scale-projects.mdx`.
- **Effort:** 1 min.

### 14. De-duplicate pricing page heading
- **File:** `src/pages/pricing/index.astro:62–76`
- **Action:** The banner says `title="No Surprises."` and the section `<h2>` then says `"Transparent Pricing. No Surprises."`. Pick one. Suggest changing the banner to `title="Pricing"` (matches About / FAQ banner pattern) and keep the full sentence on the `<h2>`.
- **Effort:** 2 min.

---

## P2 — Polish

### 15. Replace contact-page emoji with SVG icons
- **File:** `src/pages/contact/index.astro:33, 40`
- **Action:** Use the existing `Icon.astro` component (already imported on the homepage) with a phone and envelope SVG. Match icon styling to whatever's used in the site footer.
- **Effort:** 15 min.

### 16. Reduce reuse of `banner-general.jpg`
- **Files:**
  - `src/pages/about/index.astro:76` (Founder banner)
  - `src/pages/pricing/index.astro:63` (Pricing hero)
  - `src/pages/faq/index.astro:288` (Pricing & Confidentiality)
- **Action:** Generate or commission three distinct banner images in the same style as the existing `banner-*.jpg` set. The pricing hero in particular — first thing visitors see on that page — should not share an image with two other unrelated sections.
- **Needs from László:** Three new banner images, ideally produced via SwarmUI in one batch with consistent prompt/style.
- **Effort:** 1 hr image production + 5 min wiring.

### 17. Fix misleading related-techniques link in adaptive-reuse
- **File:** `src/content/vision-tech/adaptive-reuse-illustrations.mdx:86`
- **Action:** Current text: `"For interactive before-and-after comparison: [Photo Integration]…"`. Photo Integration is a planning compositing technique, not a slider. Replace with a sentence that doesn't mislead — e.g. drop the "interactive before-and-after" phrasing and link Photo Integration as `"For compositing the proposed building into a real site photograph"`. The `<ImageCompare>` itself is documented elsewhere.
- **Effort:** 5 min.

### 18. Confirm `gallery: []` behaviour on vision-tech pages
- **Files:** Most vision-tech `*.mdx`.
- **Action:** Verify the detail-page template handles empty galleries gracefully (no empty heading, no broken layout). Likely fine, but worth a build-and-eyeball pass through 3–4 sample pages.
- **Effort:** 10 min.

---

## Suggested Execution Order

**Session 1 (≈ 2 hr) — content fixes that need only a code editor:**
1. Delete `test-page.mdx` (#5)
2. Decide and apply for `cultural-context-integration.mdx` (#6 — recommend delete)
3. Drop "most significant development" opener (#10)
4. Remove "cutting-edge" buzzword (#11)
5. Tighten FAQ "not satisfied" answer (#12)
6. Disambiguate Sochi/Pulkovo (#13)
7. De-duplicate pricing heading (#14)
8. Resolve 2–3w / 1–2w timeline (#9 — needs decision)
9. Fix YouTube titles in product-viz (#7) + alt text (#8) — needs descriptions from László
10. Fix adaptive-reuse related link (#17)
11. Remove placeholder bullets in AI article (#3 partial — can drop list immediately even before banner is fixed)

**Session 2 — needs assets:**
12. Wire contact form (#1)
13. Replace `PLACEHOLDER` YouTube URL or drop block (#2)
14. AI services placeholder media (#4)
15. AI article banner (#3 banner part)
16. Three new banner images for #16

**Session 3 — polish:**
17. Emoji → SVG icons on contact page (#15)
18. Confirm empty-gallery rendering (#18)

---

## Open Decisions Needed From László

| # | Decision |
|---|---|
| 1 | Form backend choice + endpoint |
| 2 | Real video URL for large-scale infrastructure section, or drop the block |
| 3 | Banner image + label/title for AI article mid-banner, or drop banner |
| 4 | Real before/after pair + 6 gallery images for AI services page |
| 6 | Delete vs rewrite-now vs keep-as-roadmap for cultural-context-integration |
| 7 | One-line description for each of three product-visualization videos |
| 8 | One-line description for each of five product-visualization gallery images |
| 9 | Timeline alignment: option A (recommended) or B |
| 16 | Approve generation of three new section banners |

---

## Total Effort Estimate

- P0 work, excluding asset production: ~1.5 hr
- P1 work: ~30 min
- P2 work: ~1.5 hr (mostly banner generation)
- Asset production (images, videos, banners): variable, 2–4 hr in a single SwarmUI session

Realistic launch-ready timeline: **half a day of content work + one image-production session**.
