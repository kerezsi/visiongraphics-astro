import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { documentToMdx, astroPageToContent } from '../lib/codegen/mdx-codegen.js';
import { writeFile, validatePath, PROJECT_ROOT } from '../lib/fs-utils.js';
import type { DocumentState } from '../types/blocks.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Dispatch to the correct codegen based on page type
// ---------------------------------------------------------------------------
function generateCode(doc: DocumentState): { code: string; ext: string } {
  if (doc.pageType === 'page') {
    return { code: astroPageToContent(doc), ext: 'astro' };
  }
  return { code: documentToMdx(doc), ext: 'mdx' };
}

// ---------------------------------------------------------------------------
// Resolve output path based on page type and slug
// ---------------------------------------------------------------------------
function resolveOutputPath(doc: DocumentState, ext: string): string {
  if (doc.filePath) {
    // For .astro pages, keep the original .astro extension — never rename to .mdx.
    if (doc.pageType === 'page') return doc.filePath;
    // When migrating from .md → .mdx, replace the extension.
    return doc.filePath.replace(/\.(md|astro)$/, `.${ext}`);
  }

  switch (doc.pageType) {
    case 'article':
      return `src/content/articles/${doc.slug}.${ext}`;
    case 'project':
      return `src/content/projects/${doc.slug}.${ext}`;
    case 'service':
      return `src/content/services/${doc.slug}.${ext}`;
    case 'vision-tech':
      return `src/content/vision-tech/${doc.slug}.${ext}`;
    default:
      return `src/content/${doc.slug}.${ext}`;
  }
}

// ---------------------------------------------------------------------------
// Helper — extract document from request body
// ---------------------------------------------------------------------------
function extractDoc(body: Record<string, unknown>): DocumentState | null {
  if (body.document && typeof body.document === 'object') {
    return body.document as DocumentState;
  }
  if (body.pageType) {
    return body as unknown as DocumentState;
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST /preview — generate MDX without writing to disk
// ---------------------------------------------------------------------------
router.post('/preview', async (req: Request, res: Response) => {
  const doc = extractDoc(req.body);

  if (!doc) {
    res.status(400).json({ error: 'Missing document in body' });
    return;
  }

  if (!doc.pageType || !doc.slug) {
    res.status(400).json({ error: 'Document must have pageType and slug' });
    return;
  }

  try {
    const { code } = generateCode(doc);
    res.json({ code });
  } catch (err: any) {
    console.error('[codegen] Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /save — generate MDX and write to disk
// ---------------------------------------------------------------------------
router.post('/save', async (req: Request, res: Response) => {
  const doc = extractDoc(req.body);

  if (!doc) {
    res.status(400).json({ error: 'Missing document in body' });
    return;
  }

  if (!doc.pageType || !doc.slug) {
    res.status(400).json({ error: 'Document must have pageType and slug' });
    return;
  }

  try {
    const { code, ext } = generateCode(doc);
    const outputPath = resolveOutputPath(doc, ext);

    validatePath(outputPath);
    await writeFile(outputPath, code);

    // If we're overwriting a .md file with .mdx, delete the old .md
    if (doc.filePath && doc.filePath.endsWith('.md') && outputPath.endsWith('.mdx')) {
      try {
        const oldPath = path.join(PROJECT_ROOT, doc.filePath);
        await fs.unlink(oldPath);
        console.log(`[codegen] Deleted old .md file: ${doc.filePath}`);
      } catch {
        // ignore if already gone
      }
    }

    console.log(`[codegen] Saved ${outputPath}`);
    res.json({ path: outputPath, saved: true });
  } catch (err: any) {
    if (err.message?.includes('not allowed')) {
      res.status(403).json({ error: err.message });
    } else {
      console.error('[codegen] Save error:', err);
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
