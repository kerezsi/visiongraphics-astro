#!/usr/bin/env node
/**
 * generate-thumbs.mjs
 * Pre-generates 900px WebP thumbnails for all portfolio images on R2.
 *
 * Usage:
 *   node scripts/generate-thumbs.mjs                       # all R2 portfolio images
 *   node scripts/generate-thumbs.mjs --slug hotel-lycium   # single project folder
 *   node scripts/generate-thumbs.mjs --force               # regenerate even if thumb exists
 *
 * Dependencies: sharp (already in package.json), rclone (configured with r2 remote)
 */

import { execSync, spawn } from 'child_process';
import { createWriteStream, mkdirSync, rmSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const R2_PUBLIC = 'https://pub-681025dcca3b4bad99aa4a4d65ecc023.r2.dev';
const R2_REMOTE = 'r2:visiongraphics-images';
const TMP_DIR = join(projectRoot, 'tmp', 'thumbs');
const THUMB_WIDTH = 900;
const WEBP_QUALITY = 82;
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const force = args.includes('--force');

// ── List R2 images ────────────────────────────────────────────────────────────
function listR2Images() {
  console.log('Listing R2 portfolio images…');
  const cmd = `rclone ls "${R2_REMOTE}" --s3-no-check-bucket --include "portfolio/**"`;
  let output;
  try {
    output = execSync(cmd, { encoding: 'utf8' });
  } catch (e) {
    console.error('rclone ls failed:', e.message);
    process.exit(1);
  }

  const lines = output.trim().split('\n').filter(Boolean);
  const images = [];

  for (const line of lines) {
    // rclone ls output: "   <size> <path>"
    const match = line.match(/^\s+\d+\s+(.+)$/);
    if (!match) continue;
    const r2Key = match[1].trim(); // e.g. "portfolio/hotel-lycium/01.jpg"

    // Skip thumbs subfolder and non-images
    if (r2Key.includes('/thumbs/')) continue;
    const ext = r2Key.match(/\.[^.]+$/)?.[0]?.toLowerCase();
    if (!ext || !IMAGE_EXTS.has(ext)) continue;

    // Filter by slug if requested
    if (slugArg && !r2Key.startsWith(`portfolio/${slugArg}/`)) continue;

    images.push(r2Key);
  }

  return images;
}

// ── Derive thumb key ──────────────────────────────────────────────────────────
function toThumbKey(r2Key) {
  // portfolio/hotel-lycium/01.jpg → portfolio/hotel-lycium/thumbs/01.webp
  const lastSlash = r2Key.lastIndexOf('/');
  const dir = r2Key.slice(0, lastSlash);
  const filename = r2Key.slice(lastSlash + 1);
  const basename = filename.replace(/\.[^.]+$/, '');
  return `${dir}/thumbs/${basename}.webp`;
}

// ── Check if thumb already exists on R2 ──────────────────────────────────────
async function thumbExists(thumbKey) {
  const url = `${R2_PUBLIC}/${thumbKey}`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Fetch image from R2 ───────────────────────────────────────────────────────
async function fetchImage(r2Key) {
  const url = `${R2_PUBLIC}/${r2Key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Generate one thumb ────────────────────────────────────────────────────────
async function generateThumb(r2Key) {
  const thumbKey = toThumbKey(r2Key);

  if (!force && await thumbExists(thumbKey)) {
    process.stdout.write(`  skip  ${thumbKey}\n`);
    return false;
  }

  process.stdout.write(`  gen   ${thumbKey}… `);
  const srcBuffer = await fetchImage(r2Key);
  const webpBuffer = await sharp(srcBuffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const localPath = join(TMP_DIR, thumbKey);
  mkdirSync(dirname(localPath), { recursive: true });
  await import('fs').then(fs => fs.promises.writeFile(localPath, webpBuffer));

  const kb = Math.round(webpBuffer.length / 1024);
  process.stdout.write(`${kb} KB\n`);
  return true;
}

// ── Upload to R2 via rclone ───────────────────────────────────────────────────
function uploadToR2() {
  console.log('\nUploading thumbs to R2…');
  const cmd = `rclone copy "${TMP_DIR}" "${R2_REMOTE}" --s3-no-check-bucket -v`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('rclone copy failed:', e.message);
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const images = listR2Images();

  if (images.length === 0) {
    console.log(slugArg
      ? `No images found for slug "${slugArg}".`
      : 'No images found in R2 portfolio/ folder.');
    return;
  }

  console.log(`Found ${images.length} image(s) to process.\n`);

  // Clean tmp dir for fresh upload
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const r2Key of images) {
    try {
      const didGenerate = await generateThumb(r2Key);
      if (didGenerate) generated++; else skipped++;
    } catch (err) {
      console.error(`  ERROR ${r2Key}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors.`);

  if (generated > 0) {
    uploadToR2();
    rmSync(TMP_DIR, { recursive: true });
    console.log('Upload complete.');
  } else {
    console.log('Nothing to upload.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
