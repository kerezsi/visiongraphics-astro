#!/usr/bin/env node
/**
 * migrate-project-blocks.mjs
 *
 * One-shot migration: converts legacy frontmatter fields (story, tasks,
 * tour360, films, video, images) in project MDX files to MDX body components.
 *
 * Also sets has360 / hasFilm boolean flags in frontmatter.
 *
 * Safe to run multiple times — idempotent.
 *
 * Usage:
 *   node scripts/migrate-project-blocks.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'src', 'content', 'projects');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── YAML helpers ────────────────────────────────────────────────────────────

/** Split MDX file into { frontmatter: string, body: string } */
function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

/** Very simple YAML line reader — handles only the patterns we need */
function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip blank / comment lines
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    // key: scalar value  (quoted or unquoted)
    const scalarMatch = line.match(/^(\w[\w\d_-]*):\s*(.*)/);
    if (!scalarMatch) { i++; continue; }

    const key = scalarMatch[1];
    let raw = scalarMatch[2].trim();

    // Block scalar  |  or  >
    if (raw === '|' || raw === '>') {
      const blockLines = [];
      i++;
      // Determine indent from first non-blank line
      while (i < lines.length) {
        const bl = lines[i];
        if (bl.trim() === '') { blockLines.push(''); i++; continue; }
        if (!bl.match(/^\s/)) break; // back to top level
        blockLines.push(bl.replace(/^\s{2}/, '')); // strip 2-space indent
        i++;
      }
      result[key] = blockLines.join('\n').trimEnd();
      continue;
    }

    // Sequence (array starting on next line with  - items)
    if (raw === '') {
      // peek ahead — is the next non-blank line an array item?
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      if (j < lines.length && lines[j].match(/^\s+-/)) {
        const items = [];
        i++;
        while (i < lines.length) {
          const al = lines[i];
          if (!al.match(/^\s*-/)) break;
          // Simple  - value
          const simpleItem = al.match(/^\s*-\s+(.+)/);
          if (simpleItem) {
            const v = simpleItem[1].trim();
            items.push(stripQuotes(v));
            i++;
            continue;
          }
          // Object item  - key: value  (multiline object)
          const objItem = al.match(/^\s*-\s*$/);
          if (objItem || al.match(/^\s*-\s+\w/)) {
            // Collect indented sub-lines
            const obj = {};
            // Check if it starts inline:  - key: val
            const inlineKey = al.match(/^\s*-\s+(\w+):\s*(.*)/);
            if (inlineKey) {
              obj[inlineKey[1]] = stripQuotes(inlineKey[2].trim());
            }
            i++;
            while (i < lines.length) {
              const sl = lines[i];
              if (!sl.match(/^\s{4}/)) break;
              const subKV = sl.match(/^\s+(\w+):\s*(.*)/);
              if (subKV) obj[subKV[1]] = stripQuotes(subKV[2].trim());
              i++;
            }
            items.push(obj);
            continue;
          }
          i++;
        }
        result[key] = items;
        continue;
      }
      // else fall through with empty string value
      result[key] = '';
      i++;
      continue;
    }

    // Inline array  [...]
    if (raw.startsWith('[')) {
      try {
        result[key] = JSON.parse(raw.replace(/'/g, '"'));
      } catch {
        result[key] = raw;
      }
      i++;
      continue;
    }

    // Quoted string
    result[key] = stripQuotes(raw);
    i++;
  }
  return result;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ─── Frontmatter writer ───────────────────────────────────────────────────────

/**
 * Remove specific keys from raw YAML frontmatter string.
 * Handles scalar, block (|/>) and array values.
 */
function removeKeys(yaml, keys) {
  const lines = yaml.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w\d_-]*):/);
    if (keyMatch && keys.includes(keyMatch[1])) {
      // Skip this line and all continuation lines
      const raw = line.replace(/^[^:]+:\s*/, '').trim();
      i++;
      if (raw === '|' || raw === '>') {
        // block scalar — skip indented lines
        while (i < lines.length && (lines[i].match(/^\s/) || lines[i].trim() === '')) i++;
      } else if (raw === '') {
        // possible array — skip indented item lines
        while (i < lines.length && lines[i].match(/^\s*-/)) i++;
      }
      continue;
    }
    result.push(line);
    i++;
  }
  return result.join('\n');
}

/** Set / overwrite a boolean key in raw YAML frontmatter string */
function setBooleanKey(yaml, key, value) {
  const str = value ? 'true' : 'false';
  // Replace existing
  if (new RegExp(`^${key}:\\s*`, 'm').test(yaml)) {
    return yaml.replace(new RegExp(`^(${key}:\\s*).*$`, 'm'), `$1${str}`);
  }
  // Insert before featured / published line if present
  if (/^featured:/m.test(yaml)) {
    return yaml.replace(/^(featured:)/m, `${key}: ${str}\n$1`);
  }
  return yaml + `\n${key}: ${str}`;
}

// ─── MDX body helpers ─────────────────────────────────────────────────────────

function escapeTemplateLiteral(text) {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildProjectStory(text) {
  return `<ProjectStory text={\`${escapeTemplateLiteral(text)}\`} />`;
}

function buildProjectTasks(text) {
  return `<ProjectTasks text={\`${escapeTemplateLiteral(text)}\`} />`;
}

function buildTour360(url, title) {
  const safeUrl = url.replace(/"/g, '&quot;');
  const safeTitle = (title || '').replace(/"/g, '&quot;');
  return `<Tour360 url="${safeUrl}" title="${safeTitle}" />`;
}

function buildFilmEmbed(vimeoId, title, duration) {
  const safeTitle = (title || '').replace(/"/g, '&quot;');
  let tag = `<FilmEmbed vimeoId="${vimeoId}" title="${safeTitle}"`;
  if (duration) tag += ` duration="${duration}"`;
  tag += ` />`;
  return tag;
}

function buildYoutubeEmbed(url, title) {
  const safeUrl = url.replace(/"/g, '&quot;');
  const safeTitle = (title || '').replace(/"/g, '&quot;');
  return `<YoutubeEmbed url="${safeUrl}" title="${safeTitle}" />`;
}

function buildImageGallery(images) {
  const imagesJson = JSON.stringify(images);
  return `<ImageGallery images={${imagesJson}} />`;
}

// ─── Per-file migration ───────────────────────────────────────────────────────

function migrateFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const parts = splitFrontmatter(original);
  if (!parts) {
    console.log(`  SKIP (no frontmatter): ${path.basename(filePath)}`);
    return;
  }

  let { frontmatter, body } = parts;
  const parsed = parseYaml(frontmatter);

  const preamble = [];
  const keysToRemove = [];
  let has360 = parsed.has360 === 'true' || parsed.has360 === true;
  let hasFilm = parsed.hasFilm === 'true' || parsed.hasFilm === false ? (parsed.hasFilm === 'true' || parsed.hasFilm === true) : false;

  // Re-read the actual boolean values more carefully
  has360 = parsed.has360 === true || parsed.has360 === 'true';
  hasFilm = parsed.hasFilm === true || parsed.hasFilm === 'true';

  // ── story → ProjectStory ──────────────────────────────────────────
  if (parsed.story && typeof parsed.story === 'string' && parsed.story.trim()) {
    preamble.push(buildProjectStory(parsed.story.trim()));
    keysToRemove.push('story');
  }

  // ── tasks → ProjectTasks ─────────────────────────────────────────
  if (parsed.tasks && typeof parsed.tasks === 'string' && parsed.tasks.trim()) {
    preamble.push(buildProjectTasks(parsed.tasks.trim()));
    keysToRemove.push('tasks');
  }

  // ── tour360 array → Tour360 components ───────────────────────────
  const tours = parsed.tour360;
  if (Array.isArray(tours) && tours.length > 0) {
    const bodyHasTour = body.includes('<Tour360');
    if (!bodyHasTour) {
      for (const t of tours) {
        const url = typeof t === 'object' ? (t.url || '') : String(t);
        const title = typeof t === 'object' ? (t.title || '') : '';
        if (url) preamble.push(buildTour360(url, title));
      }
    }
    has360 = true;
    keysToRemove.push('tour360');
  } else if (body.includes('<Tour360')) {
    has360 = true;
  }

  // ── films array → FilmEmbed components ───────────────────────────
  const films = parsed.films;
  if (Array.isArray(films) && films.length > 0) {
    const bodyHasFilm = body.includes('<FilmEmbed');
    if (!bodyHasFilm) {
      for (const f of films) {
        if (typeof f === 'object' && f.vimeoId) {
          preamble.push(buildFilmEmbed(f.vimeoId, f.title || '', f.duration || ''));
        }
      }
    }
    hasFilm = true;
    keysToRemove.push('films');
  } else if (body.includes('<FilmEmbed')) {
    hasFilm = true;
  }

  // ── video string → YoutubeEmbed ───────────────────────────────────
  if (parsed.video && typeof parsed.video === 'string' && parsed.video.trim()) {
    const bodyHasYT = body.includes('<YoutubeEmbed') || body.includes('<YouTubeEmbed');
    if (!bodyHasYT) {
      preamble.push(buildYoutubeEmbed(parsed.video.trim(), parsed.title || ''));
    }
    hasFilm = true;
    keysToRemove.push('video');
  } else if (body.includes('<YoutubeEmbed') || body.includes('<YouTubeEmbed')) {
    hasFilm = true;
  }

  // ── images array → ImageGallery ───────────────────────────────────
  const images = parsed.images;
  if (Array.isArray(images) && images.length > 0) {
    const bodyHasGallery = body.includes('<ImageGallery');
    if (!bodyHasGallery) {
      preamble.push(buildImageGallery(images));
    }
    keysToRemove.push('images');
  }

  // If nothing to do, skip
  if (preamble.length === 0 && keysToRemove.length === 0) {
    // Still update has360/hasFilm if they were detected from body
    let changed = false;
    if (has360 && !parsed.has360) {
      frontmatter = setBooleanKey(frontmatter, 'has360', true);
      changed = true;
    }
    if (hasFilm && !parsed.hasFilm) {
      frontmatter = setBooleanKey(frontmatter, 'hasFilm', true);
      changed = true;
    }
    if (!changed) {
      console.log(`  OK (nothing to migrate): ${path.basename(filePath)}`);
      return;
    }
  }

  // Remove migrated keys from frontmatter
  if (keysToRemove.length > 0) {
    frontmatter = removeKeys(frontmatter, keysToRemove);
  }

  // Set has360 / hasFilm
  frontmatter = setBooleanKey(frontmatter, 'has360', has360);
  frontmatter = setBooleanKey(frontmatter, 'hasFilm', hasFilm);

  // Build new body — prepend preamble blocks (after any existing content)
  const newBody = preamble.length > 0
    ? preamble.join('\n\n') + '\n\n' + body.trimStart()
    : body;

  const newContent = `---\n${frontmatter.trimEnd()}\n---\n${newBody}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would update: ${path.basename(filePath)}`);
    console.log(`    Removed keys: ${keysToRemove.join(', ') || '(none)'}`);
    console.log(`    Prepended blocks: ${preamble.length}`);
    console.log(`    has360=${has360}, hasFilm=${hasFilm}`);
    return;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`  MIGRATED: ${path.basename(filePath)}`);
  if (keysToRemove.length > 0) console.log(`    Removed: ${keysToRemove.join(', ')}`);
  if (preamble.length > 0) console.log(`    Added ${preamble.length} block(s) to body`);
  console.log(`    has360=${has360}, hasFilm=${hasFilm}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(PROJECTS_DIR)
  .filter(f => f.endsWith('.mdx'))
  .map(f => path.join(PROJECTS_DIR, f));

console.log(`\nMigrating ${files.length} project files${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

let migrated = 0;
for (const file of files) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  migrateFile(file);
  if (!DRY_RUN) {
    const after = fs.readFileSync(file, 'utf8');
    if (after !== before) migrated++;
  }
}

console.log(`\nDone. ${DRY_RUN ? '(dry run, no files written)' : `${migrated} file(s) updated.`}\n`);
