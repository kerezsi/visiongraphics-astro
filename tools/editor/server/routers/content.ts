import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { validatePath, readFile, writeFile } from '../lib/fs-utils.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper — list MDX/MD files in a content directory
// ---------------------------------------------------------------------------
async function listMdxFiles(dirPath: string): Promise<Array<{ slug: string; file: string }>> {
  let safeDir: string;
  try { safeDir = validatePath(dirPath); } catch { return []; }

  try {
    const entries = await fs.readdir(safeDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')))
      .map((e) => ({
        slug: e.name.replace(/\.(md|mdx)$/, ''),
        file: `${dirPath}/${e.name}`,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helper — list reference collection entries (.md or .yaml files)
// Keystatic creates .yaml but older/manual entries may be .md — read both.
// ---------------------------------------------------------------------------
async function listYamlFiles(dirPath: string): Promise<Array<{ slug: string; title: string }>> {
  let safeDir: string;
  try { safeDir = validatePath(dirPath); } catch { return []; }

  try {
    const entries = await fs.readdir(safeDir, { withFileTypes: true });
    const results: Array<{ slug: string; title: string }> = [];
    for (const e of entries) {
      if (!e.isFile()) continue;
      const isYaml = e.name.endsWith('.yaml');
      const isMd   = e.name.endsWith('.md');
      if (!isYaml && !isMd) continue;

      const slug = e.name.replace(/\.(yaml|md)$/, '');
      try {
        const raw = await readFile(`${dirPath}/${e.name}`);
        // .yaml files: plain YAML; .md files: gray-matter frontmatter
        let title: string;
        if (isYaml) {
          const data = yaml.load(raw) as any;
          title = data?.title ?? slug;
        } else {
          // Use gray-matter to parse the YAML frontmatter in .md files
          const { data } = matter(raw);
          title = (data?.title as string) ?? slug;
        }
        results.push({ slug, title });
      } catch {
        results.push({ slug, title: slug });
      }
    }
    return results.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GET /articles
// ---------------------------------------------------------------------------
router.get('/articles', async (_req: Request, res: Response) => {
  const files = await listMdxFiles('src/content/articles');
  const articles = await Promise.all(files.map(async ({ slug, file }) => {
    try {
      const raw = await readFile(file);
      const { data } = matter(raw);
      return {
        slug, path: file,
        title: data.title ?? slug,
        date: data.date ?? null,
        published: data.published ?? true,
      };
    } catch {
      return { slug, path: file, title: slug, date: null, published: true };
    }
  }));
  articles.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  res.json(articles);
});

// ---------------------------------------------------------------------------
// GET /projects
// ---------------------------------------------------------------------------
router.get('/projects', async (_req: Request, res: Response) => {
  const files = await listMdxFiles('src/content/projects');
  const projects = await Promise.all(files.map(async ({ slug, file }) => {
    try {
      const raw = await readFile(file);
      const { data } = matter(raw);
      return {
        slug, path: file,
        title: data.title ?? slug,
        year: data.year ?? null,
        published: data.published ?? true,
      };
    } catch {
      return { slug, path: file, title: slug, year: null, published: true };
    }
  }));
  projects.sort((a, b) => {
    if (!a.year && !b.year) return 0;
    if (!a.year) return 1;
    if (!b.year) return -1;
    return Number(b.year) - Number(a.year);
  });
  res.json(projects);
});

// ---------------------------------------------------------------------------
// GET /services — now MDX collection (not .astro pages)
// ---------------------------------------------------------------------------
router.get('/services', async (_req: Request, res: Response) => {
  const files = await listMdxFiles('src/content/services');
  const services = await Promise.all(files.map(async ({ slug, file }) => {
    try {
      const raw = await readFile(file);
      const { data } = matter(raw);
      return {
        slug, path: file,
        title: data.title ?? slug,
        order: data.order ?? 999,
        published: data.published ?? true,
      };
    } catch {
      return { slug, path: file, title: slug, order: 999, published: true };
    }
  }));
  services.sort((a, b) => a.order - b.order);
  res.json(services);
});

// ---------------------------------------------------------------------------
// GET /vision-tech
// ---------------------------------------------------------------------------
router.get('/vision-tech', async (_req: Request, res: Response) => {
  const files = await listMdxFiles('src/content/vision-tech');
  const items = await Promise.all(files.map(async ({ slug, file }) => {
    try {
      const raw = await readFile(file);
      const { data } = matter(raw);
      return {
        slug, path: file,
        title: data.title ?? slug,
        technique: data.technique ?? null,
        cost: data.cost ?? null,
      };
    } catch {
      return { slug, path: file, title: slug, technique: null, cost: null };
    }
  }));
  items.sort((a, b) => a.title.localeCompare(b.title));
  res.json(items);
});

// ---------------------------------------------------------------------------
// GET /collections/:name — list reference collection (YAML files)
// Returns: [{ slug, title }]
// ---------------------------------------------------------------------------
router.get('/collections/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  const ALLOWED = ['clients', 'designers', 'cities', 'countries', 'client-types', 'categories'];
  if (!ALLOWED.includes(name)) {
    res.status(400).json({ error: `Unknown collection: ${name}` });
    return;
  }
  const items = await listYamlFiles(`src/content/${name}`);
  res.json(items);
});

// ---------------------------------------------------------------------------
// POST /collections/:name — create a new YAML entry in a reference collection
// Body: { slug, title }
// ---------------------------------------------------------------------------
router.post('/collections/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  const ALLOWED = ['clients', 'designers', 'cities', 'countries', 'client-types', 'categories'];
  if (!ALLOWED.includes(name)) {
    res.status(400).json({ error: `Unknown collection: ${name}` });
    return;
  }
  const { slug, title } = req.body as { slug: string; title: string };
  if (!slug || !title) {
    res.status(400).json({ error: 'Missing slug or title' });
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }
  const filePath = `src/content/${name}/${slug}.yaml`;
  let safePath: string;
  try {
    safePath = validatePath(filePath);
  } catch {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  try {
    await fs.access(safePath);
    res.status(409).json({ error: `Entry "${slug}" already exists` });
    return;
  } catch { /* doesn't exist — good */ }
  const content = `title: ${JSON.stringify(title)}\n`;
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, content, 'utf-8');
  res.json({ slug, title, path: filePath });
});

// ---------------------------------------------------------------------------
// GET /:name — list any collection (reference or MDX)
// ---------------------------------------------------------------------------
router.get('/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  const REFERENCE_COLLECTIONS = ['clients', 'designers', 'cities', 'countries', 'client-types', 'categories'];

  if (REFERENCE_COLLECTIONS.includes(name)) {
    const items = await listYamlFiles(`src/content/${name}`);
    res.json(items);
    return;
  }

  // Content collections
  const MDX_COLLECTIONS: Record<string, string> = {
    articles: 'src/content/articles',
    projects: 'src/content/projects',
    services: 'src/content/services',
    'vision-tech': 'src/content/vision-tech',
  };
  if (MDX_COLLECTIONS[name]) {
    const files = await listMdxFiles(MDX_COLLECTIONS[name]);
    const items = await Promise.all(files.map(async ({ slug, file }) => {
      try {
        const raw = await readFile(file);
        const { data } = matter(raw);
        return { slug, title: data.title ?? slug, path: file };
      } catch {
        return { slug, title: slug, path: file };
      }
    }));
    res.json(items);
    return;
  }

  res.status(404).json({ error: `Unknown collection: ${name}` });
});

export default router;
