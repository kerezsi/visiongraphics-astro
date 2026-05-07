import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PROJECT_ROOT, validatePath } from '../lib/fs-utils.js';
import { processImage } from '../lib/image/processor.js';
import { buildStagingDir, buildImageDir, buildImageUrl, buildR2RemotePath, sanitizeFilename } from '../lib/image/path-builder.js';
import type { PageType } from '../lib/image/path-builder.js';
import { spawnDetached, readChildLog, cleanupChildLog } from '../lib/spawn-detached.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const VALID_PAGE_TYPES: PageType[] = ['article', 'service', 'project', 'vision-tech'];

function validateSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

// ---------------------------------------------------------------------------
// POST /upload — upload image to local staging dir
// ---------------------------------------------------------------------------
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const pageType = (req.body.pageType as string) ?? 'project';
    const slug = (req.body.slug as string) ?? 'unknown';

    if (!VALID_PAGE_TYPES.includes(pageType as PageType)) {
      res.status(400).json({ error: `Invalid pageType: ${pageType}` });
      return;
    }
    if (!validateSlug(slug)) {
      res.status(400).json({ error: 'Invalid slug' });
      return;
    }

    try {
      // Process the image (resize, optimize)
      const processed = await processImage(
        req.file.buffer,
        req.file.originalname,
        pageType as PageType,
        slug
      );

      // Build the public URL (R2 path used in MDX content)
      const url = buildImageUrl(pageType as PageType, slug, processed.filename);

      res.json({
        url,
        width: processed.width,
        height: processed.height,
        filename: processed.filename,
        staged: true,
      });
    } catch (err: any) {
      console.error('[images] Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /list?pageType=&slug= — list images in staging dir
// ---------------------------------------------------------------------------
router.get('/list', async (req: Request, res: Response) => {
  const pageType = (req.query.pageType as string) ?? 'project';
  const slug = req.query.slug as string;

  if (!slug) { res.status(400).json({ error: 'Missing slug' }); return; }
  if (!VALID_PAGE_TYPES.includes(pageType as PageType)) { res.status(400).json({ error: 'Invalid pageType' }); return; }
  if (!validateSlug(slug)) { res.status(400).json({ error: 'Invalid slug' }); return; }

  const imageDir = buildImageDir(pageType as PageType, slug);
  const stagingPath = path.join(PROJECT_ROOT, imageDir);
  const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

  try {
    const entries = await fs.readdir(stagingPath, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile() && IMAGE_EXTS.includes(path.extname(e.name).toLowerCase()))
      .map((e) => ({
        filename: e.name,
        url: buildImageUrl(pageType as PageType, slug, e.name),
        staged: true,
      }));
    res.json(images);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// DELETE /delete — delete a staged image by URL
// ---------------------------------------------------------------------------
router.delete('/delete', async (req: Request, res: Response) => {
  const { url } = req.body as { url: string };
  if (!url) { res.status(400).json({ error: 'Missing url' }); return; }
  if (!url.startsWith('/_img/')) { res.status(403).json({ error: 'URL must start with /_img/' }); return; }

  // /_img/portfolio/slug/file.jpg → staging/portfolio/slug/file.jpg
  const parts = url.split('/').filter(Boolean); // ['_img', 'portfolio', 'slug', 'file.jpg']
  if (parts.length < 4) { res.status(400).json({ error: 'Invalid URL format' }); return; }
  const collection = parts[1];
  const slug = parts[2];
  const filename = parts[3];
  if (!validateSlug(slug)) { res.status(400).json({ error: 'Invalid slug' }); return; }

  const stagingPath = path.join(PROJECT_ROOT, 'tools', 'editor', '.staging', collection, slug, filename);
  try {
    await fs.unlink(stagingPath);
    res.json({ deleted: true });
  } catch (err: any) {
    if (err.code === 'ENOENT') res.status(404).json({ error: 'File not found' });
    else res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /push-to-r2 — sync staged images to R2 via rclone
// ---------------------------------------------------------------------------
router.post('/push-to-r2', async (req: Request, res: Response) => {
  const { pageType, slug } = req.body as { pageType: string; slug: string };

  if (!slug) { res.status(400).json({ error: 'Missing slug' }); return; }
  if (!VALID_PAGE_TYPES.includes(pageType as PageType)) { res.status(400).json({ error: 'Invalid pageType' }); return; }
  if (!validateSlug(slug)) { res.status(400).json({ error: 'Invalid slug' }); return; }

  const stagingDir = path.join(PROJECT_ROOT, buildStagingDir(pageType as PageType, slug));
  const r2Dest     = `r2:visiongraphics-images/${buildR2RemotePath(pageType as PageType, slug)}/`;

  // Check staging dir exists
  try {
    await fs.access(stagingDir);
  } catch {
    res.status(404).json({ error: `No staged images found for slug "${slug}"` });
    return;
  }

  const args = ['copy', stagingDir, r2Dest, '--s3-no-check-bucket', '--progress'];

  console.log(`[images] rclone ${args.join(' ')}`);

  // Spawn detached so the upload survives an editor server restart
  // (e.g. tsx watch reloading after a code change).
  const { child, logFile } = spawnDetached('rclone', args, { cwd: PROJECT_ROOT });

  child.on('close', (code) => {
    const log = readChildLog(logFile);
    cleanupChildLog(logFile);
    if (code === 0) {
      res.json({ ok: true, stdout: log, destination: r2Dest });
    } else {
      res.status(500).json({ ok: false, code, stdout: log });
    }
  });

  child.on('error', (err: any) => {
    cleanupChildLog(logFile);
    res.status(500).json({ error: `rclone not found or failed: ${err.message}` });
  });
});

// ---------------------------------------------------------------------------
// POST /push-all-to-r2 — sync staging + thumbnails to R2 via rclone
// Runs two sequential rclone copies:
//   tools/editor/.staging/ → r2:visiongraphics-images/        (originals)
//   public/thumbs/         → r2:visiongraphics-images/thumbs/ (thumbnails)
// ---------------------------------------------------------------------------
router.post('/push-all-to-r2', async (req: Request, res: Response) => {
  const stagingRoot = path.join(PROJECT_ROOT, 'tools', 'editor', '.staging');
  const thumbsRoot  = path.join(PROJECT_ROOT, 'public', 'thumbs');

  const jobs: Array<{ src: string; dest: string }> = [];

  try { await fs.access(stagingRoot); jobs.push({ src: stagingRoot, dest: 'r2:visiongraphics-images/' }); } catch { /* no staging */ }
  try { await fs.access(thumbsRoot);  jobs.push({ src: thumbsRoot,  dest: 'r2:visiongraphics-images/thumbs/' }); } catch { /* no thumbs */ }

  if (jobs.length === 0) {
    res.status(404).json({ error: 'No staging or thumbs directory found' });
    return;
  }

  let combinedOut = '';

  function runJob(i: number): void {
    if (i >= jobs.length) {
      res.json({ ok: true, stdout: combinedOut });
      return;
    }

    const { src, dest } = jobs[i];
    const args = ['copy', src, dest, '--s3-no-check-bucket', '--progress'];
    console.log(`[images] rclone ${args.join(' ')}`);

    // Spawn detached — survives parent restart.
    const { child, logFile } = spawnDetached('rclone', args, { cwd: PROJECT_ROOT });

    child.on('close', (code) => {
      combinedOut += `\n---- ${dest} ----\n` + readChildLog(logFile);
      cleanupChildLog(logFile);
      if (code === 0) {
        runJob(i + 1);
      } else {
        res.status(500).json({ ok: false, step: dest, code, stdout: combinedOut });
      }
    });

    child.on('error', (err: any) => {
      cleanupChildLog(logFile);
      res.status(500).json({ error: `rclone not found or failed: ${err.message}`, step: dest });
    });
  }

  runJob(0);
});

export default router;
