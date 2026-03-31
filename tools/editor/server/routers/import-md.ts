import express from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { parseMdx } from '../lib/mdx-import/parser.js';
import { mapMdxToBlocks } from '../lib/mdx-import/block-mapper.js';
import { parseAstroPage } from '../lib/astro-page-parser.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Normalize a flat on-disk block into the wrapped canvas format:
//   { type, image, label, ... }  →  { id, type, props: { image, label, ... } }
// ---------------------------------------------------------------------------
function normalizeBlock(raw: any): any {
  const { type, ...rest } = raw;
  return { id: randomUUID(), type, props: rest };
}

// ---------------------------------------------------------------------------
// POST /md — parse MDX string and return blocks + frontmatter
// ---------------------------------------------------------------------------
router.post('/md', async (req: Request, res: Response) => {
  const { markdown, pageType, slug } = req.body as {
    markdown: string;
    pageType: string;
    slug: string;
  };

  if (typeof markdown !== 'string' || !markdown.trim()) {
    res.status(400).json({ error: 'Missing or empty markdown string' });
    return;
  }

  if (!pageType) {
    res.status(400).json({ error: 'Missing pageType' });
    return;
  }

  try {
    // .astro static pages have a JS script section — skip gray-matter, use
    // the dedicated Astro parser that preserves the template structure.
    if (pageType === 'page') {
      const { script, templateHeader, templateFooter, blocks } = parseAstroPage(markdown, slug);
      res.json({
        blocks,
        frontmatter: {
          title: slug,
          astroScript:     script,
          templateHeader,
          templateFooter,
        },
      });
      return;
    }

    const { frontmatter, body } = await parseMdx(markdown);

    // Projects: if frontmatter has legacy `blocks` array, use those directly.
    // New MDX-based projects have content in the body.
    if (
      (pageType === 'project') &&
      Array.isArray((frontmatter as any).blocks) &&
      (frontmatter as any).blocks.length > 0 &&
      !body.trim()
    ) {
      const blocks = ((frontmatter as any).blocks as any[]).map(normalizeBlock);
      res.json({ blocks, frontmatter });
      return;
    }

    const blocks = mapMdxToBlocks(body, pageType);
    res.json({ blocks, frontmatter });
  } catch (err: any) {
    console.error('[import-md] Parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
