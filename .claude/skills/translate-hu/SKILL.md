---
name: translate-hu
description: Run a Hungarian translation pass over Vision Graphics content or UI strings. Use whenever the user asks to translate a page, project, service, vision-tech entry, or UI copy to Hungarian, to fill missing hu values, to review or fix Hungarian text, or says "translate", "HU pass", "magyar", "hungarian version". Covers frontmatter {en,hu} promotion, <Lang> body blocks, JSX props, strings.ts, and the strict never-touch-EN rule.
---

# Hungarian translation pass

## The prime directive

**Never edit English copy during a translation pass.** EN is the canonical authored version;
HU adapts *toward* it. Even when the HU rewrite reveals an EN improvement, note it in your
report and leave EN alone unless the user explicitly asks (CLAUDE.md §4.4, hard rule 13).
The final `git diff` must show **only** `hu:` additions/changes — that's the acceptance test.

Also: **never PowerShell-pipe text files** (§4.3). Hungarian accents + `€` mojibake instantly.
Edit tool only; Node script for true bulk.

## What localizes, and how — decision table

| Surface | Localize? | Mechanism |
|---|---|---|
| Project/service/vision-tech frontmatter (`title`, `description`, `tagline`, `startRequirements`, `pricing`, `sidebarLabel`, `sidebarContent`) | yes | `{en,hu}` block YAML |
| MDX body prose (all collections) | yes | paired `<Lang code="en">` / `<Lang code="hu">` blocks |
| JSX props on components (`SectionBanner` label/title, `Tour360`/`YoutubeEmbed` title, gallery label/subtitle, `ProcessFlow` steps, table rows...) | yes | `prop={{ en: "…", hu: "…" }}` |
| `ProjectStory` heading | yes | `heading={{ en: "The Story:", hu: "A sztori:" }}` — the component's default is EN-only |
| UI chrome (nav, buttons, form labels, section headings) | yes | `src/i18n/strings.ts` `hu` object — never inline in templates |
| Page-local copy in templates | yes | the file's `COPY = { en: {...}, hu: {...} }` block — edit `hu` only |
| **Articles** | yes, by script | Never hand-wrap. `node scripts/wrap-article-hu.mjs --dump <slug>` lists the prose runs and the localizable component captions; write a translation module (`export default { title, excerpt, props: {EN→HU}, segments: [HU markdown per run] }`, HU alt text on Markdown images inside the segments, en dashes `–` in HU) in the scratchpad; then `node scripts/wrap-article-hu.mjs <slug> <module.mjs>`. The script turns `title`/`excerpt` into `{en,hu}`, wraps runs in `<Lang>` pairs, rewrites captions as `{{ en, hu }}`, and refuses to write if the EN text would change — that is the hard-rule-13 proof. Verify at `/hu/articles/<slug>/` (drafts: flip `published` locally, revert in the same script). |
| Reference collections: `categories`, `client-types` | yes | `{en,hu}` title (curated list lives in `scripts/translate-reference-collections.mjs`) |
| Reference collections: `clients`, `designers`, `cities`, `countries` | **no** | proper nouns, plain strings, never translated |
| Image `alt` in project galleries | no | `""` by convention — leave empty |
| URLs, slugs, image paths, pano tour slugs | **never** | |

## Mechanics

**Scalar → object promotion.** A previously untranslated field is a plain string. Promote it,
preserving the string under `en` byte-for-byte:

```yaml
# before                        # after
description: "One-line text."   description:
                                  en: "One-line text."
                                  hu: "Egysoros szöveg."
```

Same in JSX: `title="Lobby"` → `title={{ en: "Lobby", hu: "Lobby" }}`. Use unquoted JS-object
keys (`{{ en: ..., hu: ... }}`) — the newer house style. Quote YAML strings containing `: `
(§4.11).

**Body prose.** Wrap in Lang pairs, EN first, blank lines around each block, both *inside*
`ProjectTasks`/`ProjectStory` wrappers:

```mdx
<ProjectTasks>

<Lang code="en">
Aerial integration, exterior visualization, interior visualization.
</Lang>

<Lang code="hu">
Légi integráció, külső látványterv, belső látványterv.
</Lang>

</ProjectTasks>
```

Vision-tech bodies keep at most one `## H2` per Lang block (run
`node scripts/split-lang-blocks.mjs <file>` if a block accumulated several).

Body Markdown links stay bare (`/vision-tech/exterior/`) exactly as in EN — locale-blind links
are accepted debt (§8.10 bug 10); do not invent `/hu/...` prefixes.

**UI strings** (`src/i18n/strings.ts`): the `hu` object is typed `Widen<typeof en>` — every key
you add to `en` must exist in `hu` or `npm run check` fails. During a HU pass you only touch
values inside `hu`.

**Bulk frontmatter option:** `node scripts/translate-projects.mjs --slug <slug> --dry-run`
translates project title/description + SectionBanner/Tour360 labels (Claude API when
`ANTHROPIC_API_KEY` is set). Prefer writing translations yourself for quality; use the script
only for large mechanical backlogs, and review its diff.

## Translation quality bar

- Register: professional, natural Hungarian — match the tone of existing `hu:` strings in
  `src/i18n/strings.ts` and recently translated projects (e.g. `nextnest.mdx`,
  `adria-pearl.mdx`). Read two before writing.
- Established glossary (keep consistent): visualization → *látványterv*; exterior/interior →
  *külső / belső látványterv*; 360° tour → *360°-os túra* (media label) / *360°-os virtuális
  séta* (page titles); aerial integration → *légi integráció*; "The Story:" → *"A sztori:"*
  (the convention in every localized project file; `strings.ts` has an apparently-unused
  *"A történet:"* variant — don't propagate it); Gallery → *Galéria*; Compare → *Összehasonlítás*.
- Adapt, don't transliterate: restructure sentences to natural Hungarian word order; keep
  technical terms the industry uses in English (3ds Max, render, AI) as-is where existing HU
  content does.
- Proper nouns, client names, project names: unchanged.
- **The user is a native Hungarian speaker.** For high-visibility copy (home page, taglines,
  CTAs) present EN + proposed HU side by side in your report for sign-off. For routine content
  (project descriptions, banner labels), translate directly — flag only genuinely ambiguous
  phrasing.

## Verification checklist

- [ ] `git diff` contains **zero** EN-side changes (the prime directive, checked mechanically).
- [ ] `npm run check` passes (schema still validates; strings.ts still type-checks).
- [ ] Affected page loads at `/hu/...` — Hungarian shows; no `[object Object]`; no raw EN
      leaking in translated sections (untranslated *other* sections falling back to EN is fine).
- [ ] Same page at `/en/...` — pixel-identical to before the pass.
- [ ] Accented characters + `€` intact in the diff (mojibake check, §4.3).
- [ ] Report lists: files touched, fields translated, anything left untranslated and why,
      EN improvements noticed but not made, phrasing flagged for native review.
