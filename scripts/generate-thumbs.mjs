#!/usr/bin/env node
/**
 * generate-thumbs.mjs
 * Generates two WebP thumbnail sizes for all site images.
 *
 * Sizes:
 *   card  — 600px wide  (portfolio grid, service carousel, article cards, gallery strip)
 *   large — 1600px wide (gallery main viewer, 360 cover images)
 *
 * Sources:
 *   - R2 bucket (all collections: portfolio, services, articles, vision-tech)
 *   - tools/editor/.staging/ (locally staged, not yet pushed to R2)
 *
 * Output:
 *   public/thumbs/card/<collection>/<slug>/<filename>.webp
 *   public/thumbs/large/<collection>/<slug>/<filename>.webp
 *
 * Usage:
 *   node scripts/generate-thumbs.mjs                          # all images
 *   node scripts/generate-thumbs.mjs --slug portfolio/hotel-lycium  # single folder
 *   node scripts/generate-thumbs.mjs --force                  # regenerate existing
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const R2_PUBLIC    = 'https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev';
const R2_REMOTE    = 'r2:visiongraphics-images';
const STAGING_ROOT = join(PROJECT_ROOT, 'tools/editor/.staging');
const THUMBS_ROOT  = join(PROJECT_ROOT, 'public/thumbs');
const IMAGE_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const COLLECTIONS  = ['portfolio', 'services', 'articles', 'vision-tech'];

const SIZES = {
  card:  600,
  large: 1600,
};
const WEBP_QUALITY = 82;

// ── CLI args ──────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const slugArg   = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const force     = args.includes('--force');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive the output filename: same basename, .webp extension */
function toWebp(filename) {
  return basename(filename, extname(filename)) + '.webp';
}

/** Check whether both thumb sizes exist locally */
function thumbsExist(collectionPath) {
  const webpName = toWebp(basename(collectionPath));
  const dir = dirname(collectionPath);
  for (const size of Object.keys(SIZES)) {
    const thumbPath = join(THUMBS_ROOT, size, dir, webpName);
    if (!existsSync(thumbPath)) return false;
  }
  return true;
}

/** Generate both sizes for one source image buffer */
async function generateThumbs(srcBuffer, collectionPath) {
  const webpName = toWebp(basename(collectionPath));
  const dir      = dirname(collectionPath); // e.g. "portfolio/hotel-lycium"

  for (const [size, width] of Object.entries(SIZES)) {
    const outPath = join(THUMBS_ROOT, size, dir, webpName);
    mkdirSync(dirname(outPath), { recursive: true });
    const webpBuffer = await sharp(srcBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await writeFile(outPath, webpBuffer);
    const kb = Math.round(webpBuffer.length / 1024);
    process.stdout.write(`    ${size.padEnd(5)} ${kb} KB\n`);
  }
}

// ── List R2 images ────────────────────────────────────────────────────────────

function listR2Images() {
  console.log('Listing R2 images…');
  let output;
  try {
    const includes = COLLECTIONS.map(c => `--include "${c}/**"`).join(' ');
    output = execSync(`rclone ls "${R2_REMOTE}" --s3-no-check-bucket ${includes}`, { encoding: 'utf8' });
  } catch (e) {
    console.error('rclone ls failed:', e.message);
    process.exit(1);
  }

  const images = [];
  for (const line of output.trim().split('\n').filter(Boolean)) {
    const match = line.match(/^\s+\d+\s+(.+)$/);
    if (!match) continue;
    const key = match[1].trim(); // e.g. "portfolio/hotel-lycium/01.jpg"
    if (key.includes('/thumbs/')) continue;
    const ext = extname(key).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    if (slugArg && !key.startsWith(`${slugArg}/`)) continue;
    images.push({ collectionPath: key, source: 'r2' });
  }
  return images;
}

// ── List staged images ────────────────────────────────────────────────────────

function listStagingImages() {
  const images = [];
  if (!existsSync(STAGING_ROOT)) return images;

  for (const collection of COLLECTIONS) {
    const collDir = join(STAGING_ROOT, collection);
    if (!existsSync(collDir)) continue;
    for (const slug of readdirSync(collDir)) {
      const slugDir = join(collDir, slug);
      if (!statSync(slugDir).isDirectory()) continue;
      for (const file of readdirSync(slugDir)) {
        const ext = extname(file).toLowerCase();
        if (!IMAGE_EXTS.has(ext)) continue;
        const collectionPath = `${collection}/${slug}/${file}`;
        if (slugArg && !collectionPath.startsWith(`${slugArg}/`)) continue;
        images.push({ collectionPath, source: 'staging', localPath: join(slugDir, file) });
      }
    }
  }
  return images;
}

// ── Fetch one image from R2 ───────────────────────────────────────────────────

async function fetchFromR2(collectionPath) {
  const url = `${R2_PUBLIC}/${collectionPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Merge R2 + staging, deduplicate by collectionPath (staging wins)
  const r2Images      = listR2Images();
  const stagingImages = listStagingImages();
  const stagingPaths  = new Set(stagingImages.map(i => i.collectionPath));
  const allImages     = [...stagingImages, ...r2Images.filter(i => !stagingPaths.has(i.collectionPath))];

  if (allImages.length === 0) {
    console.log(slugArg ? `No images found for "${slugArg}".` : 'No images found.');
    return;
  }

  console.log(`Found ${allImages.length} image(s) (${stagingImages.length} staged + ${r2Images.length - (r2Images.length - (allImages.length - stagingImages.length))} R2).\n`);

  let generated = 0, skipped = 0, errors = 0;

  for (const { collectionPath, source, localPath } of allImages) {
    if (!force && thumbsExist(collectionPath)) {
      process.stdout.write(`  skip  ${collectionPath}\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`  gen   ${collectionPath} [${source}]\n`);
    try {
      const buffer = source === 'staging'
        ? await readFile(localPath)
        : await fetchFromR2(collectionPath);
      await generateThumbs(buffer, collectionPath);
      generated++;
    } catch (err) {
      console.error(`  ERROR ${collectionPath}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors.`);
  if (generated > 0) {
    console.log(`Thumbnails written to public/thumbs/`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
