import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import {
  PROJECT_ROOT,
  validatePath,
  readFile,
  writeFile,
  deleteFile,
  fileExists,
  listFilesRecursive,
} from '../lib/fs-utils.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /pages — list all .astro files under src/pages recursively
// ---------------------------------------------------------------------------
router.get('/pages', async (_req: Request, res: Response) => {
  try {
    const files = await listFilesRecursive('src/pages', '.astro');
    const result = files.map((filePath) => ({
      path: filePath,
      name: path.basename(filePath, '.astro'),
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /content/:collection — list files in src/content/[collection] with frontmatter
// ---------------------------------------------------------------------------
router.get('/content/:collection', async (req: Request, res: Response) => {
  const { collection } = req.params;

  // Validate collection name (alphanumeric + dashes only, no traversal)
  if (!/^[a-zA-Z0-9_-]+$/.test(collection)) {
    res.status(400).json({ error: 'Invalid collection name' });
    return;
  }

  const dirPath = `src/content/${collection}`;
  let safeDir: string;
  try {
    safeDir = validatePath(dirPath);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  try {
    const entries = await fs.readdir(safeDir, { withFileTypes: true });
    const mdFiles = entries.filter(
      (e) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx'))
    );

    const result = await Promise.all(
      mdFiles.map(async (entry) => {
        const filePath = `src/content/${collection}/${entry.name}`;
        const slug = entry.name.replace(/\.(md|mdx)$/, '');
        try {
          const raw = await readFile(filePath);
          const { data } = matter(raw);
          return {
            path: filePath,
            slug,
            title: data.title ?? slug,
            date: data.date ?? data.pubDate ?? null,
            published: data.published ?? data.draft === false ?? true,
            ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
            ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
            ...(data.year !== undefined && { year: data.year }),
            ...(data.client !== undefined && { client: data.client }),
            ...(data.location !== undefined && { location: data.location }),
            ...(data.categories !== undefined && { categories: data.categories }),
          };
        } catch {
          return { path: filePath, slug, title: slug };
        }
      })
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /content/:collection — create a new entry in a collection
// Body: { slug: string, title: string }
// ---------------------------------------------------------------------------
router.post('/content/:collection', async (req: Request, res: Response) => {
  const { collection } = req.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(collection)) {
    res.status(400).json({ error: 'Invalid collection name' });
    return;
  }

  const { slug, title } = req.body as { slug: string; title: string };
  if (!slug || !title) {
    res.status(400).json({ error: 'Missing slug or title' });
    return;
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens only' });
    return;
  }

  const filePath = `src/content/${collection}/${slug}.md`;
  try {
    const alreadyExists = await fileExists(filePath);
    if (alreadyExists) {
      res.status(409).json({ error: `Entry "${slug}" already exists in ${collection}` });
      return;
    }
    await writeFile(filePath, `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n`);
    res.json({ slug, title, path: filePath, created: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /read?path= — read a file and return content
// ---------------------------------------------------------------------------
router.get('/read', async (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: 'Missing path query parameter' });
    return;
  }
  try {
    const content = await readFile(filePath);
    res.json({ content });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (err.message?.includes('not allowed')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// POST /write — write content to a file
// ---------------------------------------------------------------------------
router.post('/write', async (req: Request, res: Response) => {
  const { path: filePath, content } = req.body as { path: string; content: string };
  if (!filePath) {
    res.status(400).json({ error: 'Missing path in body' });
    return;
  }
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'Missing content in body' });
    return;
  }
  try {
    await writeFile(filePath, content);
    res.json({ path: filePath, saved: true });
  } catch (err: any) {
    if (err.message?.includes('not allowed')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// DELETE /delete — delete a file
// ---------------------------------------------------------------------------
router.delete('/delete', async (req: Request, res: Response) => {
  const { path: filePath } = req.body as { path: string };
  if (!filePath) {
    res.status(400).json({ error: 'Missing path in body' });
    return;
  }
  try {
    await deleteFile(filePath);
    res.json({ deleted: true });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (err.message?.includes('not allowed')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ---------------------------------------------------------------------------
// GET /exists?path= — check if a file exists
// ---------------------------------------------------------------------------
router.get('/exists', async (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: 'Missing path query parameter' });
    return;
  }
  try {
    const exists = await fileExists(filePath);
    res.json({ exists });
  } catch (err: any) {
    // If path is not allowed, it definitely doesn't exist from the client's perspective
    res.json({ exists: false });
  }
});

export default router;
