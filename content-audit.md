# Content Audit — Vision Graphics Website

_Generated: 2026-04-07. Pages reviewed: index, about, contact, faq, pricing, services (7), vision-tech (28), articles (6)._

---

## 1 — Critical / Broken

### Contact form action is a placeholder
**File:** `src/pages/contact/index.astro:84`

```html
action="https://formspree.io/f/YOUR_FORM_ID"
```

The literal string `YOUR_FORM_ID` has never been replaced. Any form submission silently fails. This is the only contact form on the site.

---

## 2 — Placeholder Content (not production-ready)

### ImageCompare — both images are `/_img/placeholder.jpg`
**File:** `src/content/services/advanced-ai-services.mdx:30–35`

```mdx
<ImageCompare
  before="/_img/placeholder.jpg"
  after="/_img/placeholder.jpg"
  beforeLabel="Input sketch"
  afterLabel="AI-enhanced render"
/>
```

The sketch-to-render comparison is the core visual proof for the AI services page. Both sides show the same placeholder.

### ImageGallery — six placeholder images
**File:** `src/content/services/advanced-ai-services.mdx:45`

Six entries all pointing to `/_img/placeholder.jpg`. The alt text describes real content (exterior, material variations, lighting studies) but the images aren't there.

### YouTube embed with literal `PLACEHOLDER` in URL
**File:** `src/content/services/large-scale-projects.mdx`

```mdx
<YoutubeEmbed url="https://www.youtube.com/watch?v=PLACEHOLDER" title="Infrastructure project — phased construction animation sample" />
```

Renders a broken embed. Either replace with a real video or remove.

### Placeholder banner AND placeholder bullets in published article
**File:** `src/content/articles/ai-in-architectural-visualization.mdx:23–27`

Two issues in the same article (which is `published: true`):

```mdx
- First result
- Second result
- Third result

<SectionBanner image="/_img/banners/banner-general.jpg" label="Label" title="Section Title" />
```

A list of three "First result / Second result / Third result" placeholder bullets, immediately followed by a `SectionBanner` with `label="Label" title="Section Title"`. Both visible on the live site.

### Test article in the repository
**File:** `src/content/articles/test-page.mdx`

- `excerpt: "aaa"`
- `<ImageCompare />` with no props
- `published: false` so it doesn't appear on the site, but it's committed to git and adds noise. Should be deleted.

---

## 3 — Content That Needs a Complete Rewrite

### `cultural-context-integration.mdx` — wrong in almost every way
**File:** `src/content/vision-tech/cultural-context-integration.mdx`

Published: `false` (hidden), but the content exists and is committed. It's a different quality tier entirely from every other page on the site and should be rewritten from scratch before it's ever enabled. Specific problems:

**Description field contains a raw WordPress excerpt with HTML entities:**
```
"How we mix AI and human touch to show cultural connections You know those buildings that just click with their neighborhood? That's what we aim for. We use both AI tools and traditional methods to show how new designs fit into local culture. Why Bother? Getting these local connections right helps everyone: Communities say yes [&hellip;]"
```
This reads as a copy-paste from a WordPress post truncation, including the unresolved `&hellip;`.

**Body is raw HTML, not MDX components:**
Every other vision-tech page uses `<SpecTable>`, `<CompareTable>`, `<ProcessFlow>` etc. This page has raw `<h3>`, `<p>`, `<ul>` HTML tags.

**Tone is completely inconsistent with the rest of the site:**
- "You know those buildings that just click with their neighborhood?"
- "AI magic that helps us work better"
- "The cool thing about using AI?"
- "Let's talk about mixing some AI smarts with local wisdom."
- "No fancy stuff just because we can."

Every other page is written in a direct, technical, professional voice. This reads like a junior content writer approximating what they think a visualization studio sounds like.

**Mentions Midjourney — not a tool in the studio's toolkit:**
The tool list in `advanced-ai-services.mdx` and `editor-config.json` reference ComfyUI, SwarmUI, Stable Diffusion, ControlNet. Midjourney is listed here and nowhere else.

**"Communities say yes faster" — hollow outcome language:**
Reads like a marketing deck from a startup, not a 30-year technical studio.

**Action:** Rewrite from scratch using the same structure as `architectural-styling.mdx` or `adaptive-reuse-illustrations.mdx` before setting `published: true`.

---

## 4 — Marketing Language / Hollow Claims

### "The most significant development in visualization in 30 years"
**File:** `src/content/services/advanced-ai-services.mdx:13`

This is an opening sentence on the AI services page. It's an unverifiable superlative claim. The rest of the page is actually well-written and honest — this opener contradicts it. The following paragraph already does the job better.

**Suggestion:** Start directly with the practical claim: _"We can now produce photorealistic images from hand sketches, rough plans, or reference photos — without building a full 3D model first."_

### "Cutting-edge specialists brought in when needed"
**File:** `src/pages/about/index.astro:211`

"Cutting-edge" is a filler adjective that adds nothing. The same bullet on the homepage (`diff-card`) doesn't use this phrase. Just "tested specialists" or "the right specialists" — which is used correctly elsewhere on the same page.

### "quality guarantees" and "solution-focused approach"
**File:** `src/pages/faq/index.astro:163`

Answer to "What if I'm not satisfied?":
> "We have a clear revision process, quality guarantees, and a solution-focused approach."

What are the "quality guarantees" exactly? What does "solution-focused" mean beyond "we fix it"? The surrounding sentence about checkpoint reviews is the actual concrete answer — the filler phrases before it weaken it.

---

## 5 — Inconsistencies

### Essential package timeline vs FAQ timeline
**Files:** `src/pages/pricing/index.astro:17`, `src/pages/faq/index.astro:33`

- **Pricing page, Essential package:** "Standard 2–3 week timeline"
- **FAQ, Timelines section:** "Most architectural renders: 1–2 weeks"
- **Pricing page, Professional package:** "Accelerated 1–2 week timeline"

The Essential package advertises 2–3 weeks for up to 5 stills. The FAQ says most renders take 1–2 weeks. The Professional (which includes animation) claims an "accelerated 1–2 week timeline." This creates the impression that paying more gets you a faster version of what the standard timeline already claims to be. Align these.

### "Pulkovo" without context
**File:** `src/pages/faq/index.astro:62`

> "Past work includes Budapest Airport, Antalya Airport T2, Sochi, Pulkovo, and the Road Safety Centre Doha."

"Pulkovo" needs "Airport" appended (Pulkovo Airport, St. Petersburg). "Sochi" is also unclear — Sochi Airport? Sochi Olympic infrastructure? Other pages provide full names; this answer is abbreviated.

### Three YouTube embeds with identical titles
**File:** `src/content/services/product-visualization.mdx:22, 74, 78`

All three embeds (real videos: `aiQ8tUT2xFk`, `SZDejBVAV_c`, `w3FA-emHwUA`) carry the same `title="Product animation — feature demonstration sample"`. They presumably show different things. The titles also describe "feature demonstration" but they sit under different section banners (Hero Imagery, Configure, Show How It Works), so the same title is wrong in at least two of three contexts.

### Image alt text is raw working filenames (Hungarian fragments)
**File:** `src/content/services/product-visualization.mdx:56`

```mdx
<ImageGallery images={[
  {"src":"…/nagykep-copy.jpg","alt":"NAGYKEP copy"},
  {"src":"…/rajz-1.jpg","alt":"rajz_1"},
  {"src":"…/uj-010000.jpg","alt":"uj_010000"},
  {"src":"…/aprily-stand-0030000.jpg","alt":"aprily_stand_0030000"},
  {"src":"…/gold-elol-006-x0000.jpg","alt":"gold_elol_006_x0000"}
]} />
```

Alt text is just the raw filename. "NAGYKEP" = "big picture" in Hungarian. "rajz" = "drawing". These are unhelpful for screen readers and SEO, and look unprofessional if surfaced as image titles. Each image needs a real description of what it shows.

### Pricing page: duplicate heading between banner and section
**File:** `src/pages/pricing/index.astro:62–76`

The `SectionBanner` uses `title="No Surprises."` and the section heading immediately below reads:
```
"Transparent Pricing. No Surprises."
```
The page repeats the same fragment twice in close proximity.

---

## 6 — Minor Issues

### Contact page emoji icons
**File:** `src/pages/contact/index.astro:33,40`

```html
<span class="info-icon" aria-hidden="true">📞</span>
<span class="info-icon" aria-hidden="true">✉</span>
```

The rest of the site uses no emoji anywhere. These look out of place in a premium B2B context. Replace with inline SVG icons or remove.

### `banner-general.jpg` used as fallback for three different page sections
**Files:** `src/pages/about/index.astro:76`, `src/pages/pricing/index.astro:63`, `src/pages/faq/index.astro:288`

- About → "Meet the Expert" section banner: `banner-general.jpg`
- Pricing → page hero: `banner-general.jpg`
- FAQ → "Pricing & Confidentiality" section banner: `banner-general.jpg`

Not a critical error, but the same generic image as section header for the founder bio, the pricing page hero, and a FAQ section heading suggests these are unfilled placeholders rather than intentional choices.

### Related techniques link is misleading
**File:** `src/content/vision-tech/adaptive-reuse-illustrations.mdx:86`

```
For interactive before-and-after comparison: [Photo Integration](/vision-tech/photo-integration/)
```

Photo Integration is a compositing technique for planning submissions, not an "interactive before-and-after comparison" tool. The ImageCompare / before-and-after slider is described two paragraphs above — the related link text misrepresents what Photo Integration is. Either fix the link text or link to something else (the ImageCompare block isn't a vision-tech page, but the confusion should be resolved in the text).

### `section.mdx` and `site-plan.mdx` — `gallery: []` everywhere
**Multiple vision-tech files**

Many vision-tech pages have `gallery: []`. This may be intentional (gallery is optional), but it's worth confirming whether the index page or detail template renders differently for pages with an empty gallery vs no gallery field. No visible issue in the templates reviewed — noting for completeness.

---

## Summary

| Severity | Count |
|---|---|
| Critical / broken | 1 |
| Placeholder content | 5 |
| Content requiring rewrite | 1 |
| Marketing language | 3 |
| Inconsistencies | 4 |
| Minor | 4 |
