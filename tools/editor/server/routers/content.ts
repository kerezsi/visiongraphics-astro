import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { validatePath, readFile, writeFile, PROJECT_ROOT } from '../lib/fs-utils.js';

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
        tags: data.tags ?? [],
      };
    } catch {
      return { slug, path: file, title: slug, date: null, published: true, tags: [] };
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
        featured: data.featured ?? false,
      };
    } catch {
      return { slug, path: file, title: slug, year: null, published: true, featured: false };
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
        published: data.published ?? true,
      };
    } catch {
      return { slug, path: file, title: slug, technique: null, cost: null, published: true };
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
// PATCH /collections/:name/:slug — rename a reference collection entry (update title)
// Body: { title }
// ---------------------------------------------------------------------------
router.patch('/collections/:name/:slug', async (req: Request, res: Response) => {
  const { name, slug } = req.params;
  const ALLOWED = ['clients', 'designers', 'cities', 'countries', 'client-types', 'categories'];
  if (!ALLOWED.includes(name)) {
    res.status(400).json({ error: `Unknown collection: ${name}` });
    return;
  }
  const { title } = req.body as { title: string };
  if (!title) {
    res.status(400).json({ error: 'Missing title' });
    return;
  }
  // Prefer .md; fall back to legacy .yaml
  let safePath: string;
  let foundExt: 'md' | 'yaml' | null = null;
  for (const ext of ['md', 'yaml'] as const) {
    try {
      const candidate = validatePath(`src/content/${name}/${slug}.${ext}`);
      await fs.access(candidate);
      safePath = candidate;
      foundExt = ext;
      break;
    } catch { /* try next */ }
  }
  if (!foundExt) {
    res.status(404).json({ error: `Entry "${slug}" not found` });
    return;
  }
  const newContent = foundExt === 'md'
    ? `---\ntitle: ${JSON.stringify(title)}\n---\n`
    : `title: ${JSON.stringify(title)}\n`;
  await fs.writeFile(safePath!, newContent, 'utf-8');
  res.json({ slug, title });
});

// ---------------------------------------------------------------------------
// DELETE /collections/:name/:slug — delete a reference collection entry
// ---------------------------------------------------------------------------
router.delete('/collections/:name/:slug', async (req: Request, res: Response) => {
  const { name, slug } = req.params;
  const ALLOWED = ['clients', 'designers', 'cities', 'countries', 'client-types', 'categories'];
  if (!ALLOWED.includes(name)) {
    res.status(400).json({ error: `Unknown collection: ${name}` });
    return;
  }
  // Prefer .md; fall back to legacy .yaml
  let safePath: string | null = null;
  for (const ext of ['md', 'yaml']) {
    try {
      const candidate = validatePath(`src/content/${name}/${slug}.${ext}`);
      await fs.access(candidate);
      safePath = candidate;
      break;
    } catch { /* try next */ }
  }
  if (!safePath) {
    res.status(404).json({ error: `Entry "${slug}" not found` });
    return;
  }
  try {
    await fs.unlink(safePath);
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /collections/:name — create a new entry in a reference collection
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
  const filePath = `src/content/${name}/${slug}.md`;
  let safePath: string;
  try {
    safePath = validatePath(filePath);
  } catch {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  // Check for existing entry under either extension
  for (const ext of ['md', 'yaml']) {
    try {
      await fs.access(validatePath(`src/content/${name}/${slug}.${ext}`));
      res.status(409).json({ error: `Entry "${slug}" already exists` });
      return;
    } catch { /* doesn't exist — good */ }
  }
  const content = `---\ntitle: ${JSON.stringify(title)}\n---\n`;
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, content, 'utf-8');
  res.json({ slug, title, path: filePath });
});

// ---------------------------------------------------------------------------
// PATCH /frontmatter — update specific frontmatter fields in an MDX/MD file
// Body: { path: string, fields: Record<string, unknown> }
// ---------------------------------------------------------------------------
router.patch('/frontmatter', async (req: Request, res: Response) => {
  const { path: filePath, fields } = req.body as { path: string; fields: Record<string, unknown> };
  if (!filePath || !fields || typeof fields !== 'object') {
    res.status(400).json({ error: 'Missing path or fields' });
    return;
  }
  try { validatePath(filePath); } catch {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  try {
    const raw = await readFile(filePath);
    const parsed = matter(raw);
    const newData = { ...parsed.data, ...fields };
    const updated = matter.stringify(parsed.content, newData);
    await writeFile(filePath, updated);
    res.json({ ok: true, path: filePath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /nav-config — read src/data/nav-config.json
// ---------------------------------------------------------------------------
router.get('/nav-config', async (_req: Request, res: Response) => {
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'nav-config.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /nav-config — write src/data/nav-config.json
// Body: NavItem[]
// ---------------------------------------------------------------------------
router.put('/nav-config', async (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Body must be an array' });
    return;
  }
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'nav-config.json');
    await fs.writeFile(filePath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /pricing-packages — read src/data/pricing-packages.json
// ---------------------------------------------------------------------------
router.get('/pricing-packages', async (_req: Request, res: Response) => {
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'pricing-packages.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /pricing-packages — write src/data/pricing-packages.json
// Body: PricingPackage[]
// ---------------------------------------------------------------------------
router.put('/pricing-packages', async (req: Request, res: Response) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Body must be an array' });
    return;
  }
  // Light shape validation
  for (const it of items) {
    if (typeof it !== 'object' || it === null) {
      res.status(400).json({ error: 'Each item must be an object' });
      return;
    }
    const keys = ['name', 'price', 'desc', 'cta', 'href'];
    for (const k of keys) {
      if (typeof (it as any)[k] !== 'string') {
        res.status(400).json({ error: `Field "${k}" must be a string` });
        return;
      }
    }
    if (!Array.isArray((it as any).includes)) {
      res.status(400).json({ error: 'Field "includes" must be an array of strings' });
      return;
    }
    if (typeof (it as any).highlight !== 'boolean') {
      res.status(400).json({ error: 'Field "highlight" must be a boolean' });
      return;
    }
  }
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'pricing-packages.json');
    await fs.writeFile(filePath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /pricing-reference — read src/data/pricing-reference.json
// ---------------------------------------------------------------------------
router.get('/pricing-reference', async (_req: Request, res: Response) => {
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'pricing-reference.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /pricing-reference — write src/data/pricing-reference.json
// Body: { intro: string; note: string; categories: [{ title, rows: [{code, item, value}] }] }
// ---------------------------------------------------------------------------
router.put('/pricing-reference', async (req: Request, res: Response) => {
  const body = req.body;
  if (typeof body !== 'object' || body === null) {
    res.status(400).json({ error: 'Body must be an object' });
    return;
  }
  if (typeof body.intro !== 'string' || typeof body.note !== 'string') {
    res.status(400).json({ error: 'Fields "intro" and "note" must be strings' });
    return;
  }
  if (!Array.isArray(body.categories)) {
    res.status(400).json({ error: 'Field "categories" must be an array' });
    return;
  }
  for (const cat of body.categories) {
    if (typeof cat !== 'object' || cat === null || typeof cat.title !== 'string' || !Array.isArray(cat.rows)) {
      res.status(400).json({ error: 'Each category must have a string "title" and an array "rows"' });
      return;
    }
    for (const row of cat.rows) {
      if (typeof row !== 'object' || row === null) {
        res.status(400).json({ error: 'Each row must be an object' });
        return;
      }
      for (const k of ['code', 'item', 'value']) {
        if (typeof (row as any)[k] !== 'string') {
          res.status(400).json({ error: `Row field "${k}" must be a string` });
          return;
        }
      }
    }
  }
  try {
    const filePath = path.join(PROJECT_ROOT, 'src', 'data', 'pricing-reference.json');
    await fs.writeFile(filePath, JSON.stringify(body, null, 2) + '\n', 'utf-8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
