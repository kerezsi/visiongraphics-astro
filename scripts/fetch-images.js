/**
 * fetch-images.js
 * Pulls images from dev.visiongraphics.eu and places them into
 * the correct public/ folder structure for the Astro site.
 *
 * Usage: node scripts/fetch-images.js
 *   --dry-run      Print what would happen, download nothing
 *   --project=slug Only process one WP project slug
 *   --skip-hero    Skip hero background images
 *   --skip-gallery Skip gallery images (cover.jpg only)
 *   --force        Re-download even if file already exists
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const WP_BASE    = 'https://dev.visiongraphics.eu/wp-json/wp/v2';
const WP_SITE    = 'https://dev.visiongraphics.eu';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Hero slideshow images (found on homepage)
const HERO_IMAGES = [
  { url: 'https://dev.visiongraphics.eu/wp-content/uploads/2024/10/Szobor_M002_ejjel-scaled.jpg',       dest: 'hero-bg.jpg' },
  { url: 'https://dev.visiongraphics.eu/wp-content/uploads/2024/10/NV_wellness_003_0000-scaled.jpg',    dest: 'hero-bg-2.jpg' },
  { url: 'https://dev.visiongraphics.eu/wp-content/uploads/2024/10/DV_A_strand-scaled.jpg',             dest: 'hero-bg-3.jpg' },
];

// WP portfolio slug → Astro project slug
// Add more mappings here as you add projects to the Astro site
const SLUG_MAP = {
  'hungexpo-revitalization':   'hungexpo-vr',
  'bud-t3-concept':            'bud-airport-t2b',
  'agora-budapest':            'agora-budapest',
  'mol-campus':                'mol-campus',
  'antalya-airport-t2':        'antalya-airport-t2',
  'central-park-budapest':     'central-park-budapest',
  'opera-eiffel-art-studios':  'opera-eiffel-art-studios',
  'nyugati-ter':               'nyugati-ter',
  'greenpoint-berlin':         'greenpoint-berlin',
  'nemetvolgyi-residence':     'nemetvolgyi-residence',
  'emerald-residence':         'emerald-residence',
  'hotel-aquaticum':           'hotel-aquaticum',
  'hotel-lycium':              'hotel-lycium',
  'avalon-business-center':    'avalon-business-center',
  'balatonszemes-hotel':       'balatonszemes-hotel',
  'sasad-liget-6':             'sasad-liget-6',
  // If WP slug == Astro slug, no entry needed — handled automatically
};

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const DRY_RUN     = args.includes('--dry-run');
const FORCE       = args.includes('--force');
const SKIP_HERO   = args.includes('--skip-hero');
const SKIP_GALLERY= args.includes('--skip-gallery');
const ONLY_PROJECT= (args.find(a => a.startsWith('--project=')) || '').replace('--project=', '') || null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg)  { console.log(msg); }
function ok(msg)   { console.log('  ✓ ' + msg); }
function skip(msg) { console.log('  · ' + msg); }
function warn(msg) { console.log('  ⚠ ' + msg); }
function err(msg)  { console.log('  ✗ ' + msg); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https') ? https : http).get(url, {
      headers: { 'User-Agent': 'VisionGraphics-ImageFetcher/1.0' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + e.message)); }
      });
    });
    req.on('error', reject);
  });
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https') ? https : http).get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisionGraphics-ImageFetcher/1.0)' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchHtml(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (!FORCE && fs.existsSync(destPath)) {
      skip('already exists: ' + path.basename(destPath));
      return resolve(false);
    }
    if (DRY_RUN) {
      ok('[dry-run] would download: ' + path.basename(destPath));
      return resolve(true);
    }
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, {
      headers: { 'User-Agent': 'VisionGraphics-ImageFetcher/1.0' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return downloadFile(redir, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', e => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(e);
    });
  });
}

// Extract full-size images from HTML (filter out thumbnails, logos, icons)
function extractGalleryImages(html, siteBase) {
  const urls = new Set();

  // img src attributes
  const imgMatches = html.matchAll(/\bsrc=["']([^"']*wp-content\/uploads[^"']+\.(?:jpg|jpeg|png|webp))["']/gi);
  for (const m of imgMatches) urls.add(m[1]);

  // background-image style attributes
  const bgMatches = html.matchAll(/background-image\s*:\s*url\(["']?([^"')]*wp-content\/uploads[^"')]+\.(?:jpg|jpeg|png))["']?\)/gi);
  for (const m of bgMatches) urls.add(m[1]);

  // data-src (lazy loading)
  const lazyMatches = html.matchAll(/\bdata-src=["']([^"']*wp-content\/uploads[^"']+\.(?:jpg|jpeg|png|webp))["']/gi);
  for (const m of lazyMatches) urls.add(m[1]);

  return Array.from(urls)
    .map(u => u.startsWith('http') ? u : siteBase + u)
    .filter(u => {
      // Exclude thumbnails (e.g. -240x150.jpg, -150x150.jpg)
      if (/-\d+x\d+\.(jpg|jpeg|png|webp)$/i.test(u)) return false;
      // Exclude logos / icons / UI graphics
      if (/logo|icon|favicon|arrow|menu|close|search/i.test(u)) return false;
      // Only keep jpg/jpeg/png
      if (!/\.(jpg|jpeg|png|webp)$/i.test(u)) return false;
      return true;
    })
    // Prefer -scaled.jpg over originals when both exist
    .reduce((acc, u) => {
      const base = u.replace(/-scaled(\.\w+)$/, '$1');
      const scaled = u.replace(/(\.\w+)$/, '-scaled$1');
      // If we already have this image (scaled or original), skip
      const existing = acc.find(e =>
        e.replace(/-scaled(\.\w+)$/, '$1') === base
      );
      if (!existing) acc.push(u);
      return acc;
    }, []);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('\n╔══════════════════════════════════════════════════╗');
  log('║  Vision Graphics — Image Fetcher                 ║');
  log('╚══════════════════════════════════════════════════╝');
  if (DRY_RUN) log('  DRY RUN — no files will be written\n');

  // ── 1. Hero images ────────────────────────────────────────────────────────
  if (!SKIP_HERO) {
    log('\n── Hero background images ──────────────────────────');
    for (const { url, dest } of HERO_IMAGES) {
      const destPath = path.join(PUBLIC_DIR, dest);
      try {
        const downloaded = await downloadFile(url, destPath);
        if (downloaded !== false) ok(dest);
      } catch (e) {
        err(`${dest}: ${e.message}`);
      }
    }
  }

  // ── 2. Fetch all WP portfolio posts ──────────────────────────────────────
  log('\n── Fetching WP portfolio list ──────────────────────');
  let allPosts = [];
  let page = 1;
  while (true) {
    const url = `${WP_BASE}/portfolio?per_page=100&page=${page}&_fields=id,slug,title,featured_media&_embed=wp:featuredmedia`;
    try {
      const posts = await fetchJson(url);
      if (!Array.isArray(posts) || posts.length === 0) break;
      allPosts = allPosts.concat(posts);
      log(`  page ${page}: ${posts.length} posts`);
      if (posts.length < 100) break;
      page++;
    } catch (e) {
      if (e.message.includes('rest_post_invalid_page_number') || page > 10) break;
      err('Failed to fetch portfolio page ' + page + ': ' + e.message);
      break;
    }
  }
  log(`  Total: ${allPosts.length} portfolio items\n`);

  // ── 3. Process each project ───────────────────────────────────────────────
  log('── Processing projects ─────────────────────────────');

  for (const post of allPosts) {
    const wpSlug    = post.slug;
    const astroSlug = SLUG_MAP[wpSlug] ?? wpSlug;

    if (ONLY_PROJECT && wpSlug !== ONLY_PROJECT && astroSlug !== ONLY_PROJECT) continue;

    log(`\n  ${post.title?.rendered || wpSlug} (${wpSlug})`);
    if (wpSlug !== astroSlug) log(`    → mapped to Astro slug: ${astroSlug}`);

    const destDir = path.join(PUBLIC_DIR, 'portfolio', astroSlug);

    // ── Cover image (featured media) ───────────────────────────────────────
    const featuredUrl = post?._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    if (featuredUrl) {
      try {
        const downloaded = await downloadFile(featuredUrl, path.join(destDir, 'cover.jpg'));
        if (downloaded !== false) ok('cover.jpg');
      } catch (e) {
        err(`cover.jpg: ${e.message}`);
      }
    } else {
      warn('no featured image found');
    }

    if (SKIP_GALLERY) continue;

    // ── Gallery images ─────────────────────────────────────────────────────
    try {
      const pageUrl = `${WP_SITE}/portfolio/${wpSlug}/`;
      const html    = await fetchHtml(pageUrl);
      const images  = extractGalleryImages(html, WP_SITE);

      // Skip the first image if it's the same as the cover (often repeated as hero)
      const galleryImages = images.filter(u => {
        if (!featuredUrl) return true;
        const featBase = path.basename(featuredUrl).replace(/-scaled/, '');
        const imgBase  = path.basename(u).replace(/-scaled/, '');
        return imgBase !== featBase;
      });

      log(`    ${galleryImages.length} gallery image(s) found`);

      for (let i = 0; i < galleryImages.length; i++) {
        const num      = String(i + 1).padStart(2, '0');
        const destFile = `${num}.jpg`;
        try {
          const downloaded = await downloadFile(galleryImages[i], path.join(destDir, destFile));
          if (downloaded !== false) ok(destFile);
        } catch (e) {
          err(`${destFile}: ${e.message}`);
        }
      }
    } catch (e) {
      err(`gallery scrape failed: ${e.message}`);
    }
  }

  // ── 4. László's photo ────────────────────────────────────────────────────
  log('\n── László photo ────────────────────────────────────');
  try {
    const aboutHtml = await fetchHtml(`${WP_SITE}/about/`);
    const photoMatch = aboutHtml.match(/src=["']([^"']*wp-content\/uploads[^"']*(?:laszlo|kerezsi|founder|photo|portrait|person)[^"']*)["']/i)
      || aboutHtml.match(/src=["']([^"']*wp-content\/uploads\/2024\/10\/[^"']+\.(?:jpg|jpeg|png))["']/i);
    if (photoMatch) {
      const photoUrl = photoMatch[1].startsWith('http') ? photoMatch[1] : WP_SITE + photoMatch[1];
      await downloadFile(photoUrl, path.join(PUBLIC_DIR, 'laszlo.jpg'));
      ok('laszlo.jpg');
    } else {
      warn('Could not auto-detect László photo — check /about/ page manually');
    }
  } catch (e) {
    warn('About page fetch failed: ' + e.message);
  }

  log('\n══════════════════════════════════════════════════');
  log('  Done.');
  log('\n  Next steps:');
  log('  1. Check public/hero-bg.jpg — use your best render instead if preferred');
  log('  2. Review public/portfolio/*/cover.jpg — replace any weak covers');
  log('  3. Review public/portfolio/*/01.jpg–0N.jpg — reorder if needed');
  log('  4. Run: npm run build');
  log('══════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('\nFatal error:', e.message);
  process.exit(1);
});
