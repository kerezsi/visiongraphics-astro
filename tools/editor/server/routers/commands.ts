import express from 'express';
import type { Request, Response } from 'express';
import { spawn } from 'child_process';
import { PROJECT_ROOT } from '../lib/fs-utils.js';
import { buildR2RemotePath } from '../lib/image/path-builder.js';
import type { PageType } from '../lib/image/path-builder.js';

const router = express.Router();

const VALID_PAGE_TYPES: PageType[] = ['article', 'service', 'project', 'vision-tech'];

function validateSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

function runCommand(
  cmd: string,
  args: string[],
  res: Response
): void {
  const child = spawn(cmd, args, { cwd: PROJECT_ROOT, shell: false });
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
  child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

  child.on('close', (code) => {
    if (code === 0) {
      res.json({ ok: true, stdout, stderr });
    } else {
      res.status(500).json({ ok: false, code, stdout, stderr });
    }
  });

  child.on('error', (err: Error) => {
    res.status(500).json({ error: err.message });
  });
}

// ---------------------------------------------------------------------------
// POST /generate-thumbs — run generate-thumbs.mjs for a slug (or all)
// Body: { slug?: string; pageType?: string }
// When pageType + slug are provided, generates only that collection/slug folder.
// ---------------------------------------------------------------------------
router.post('/generate-thumbs', (req: Request, res: Response) => {
  const { slug, pageType } = req.body as { slug?: string; pageType?: string };

  if (slug && !validateSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  const args = ['scripts/generate-thumbs.mjs'];

  if (slug && pageType && VALID_PAGE_TYPES.includes(pageType as PageType)) {
    // Build collection-prefixed slug: e.g. "portfolio/hotel-lycium"
    const collectionSlug = buildR2RemotePath(pageType as PageType, slug);
    args.push('--slug', collectionSlug);
    console.log(`[commands] generate-thumbs --slug ${collectionSlug}`);
  } else if (slug) {
    // Fallback: bare slug (generates for matching paths in all collections)
    args.push('--slug', slug);
    console.log(`[commands] generate-thumbs --slug ${slug} (no pageType)`);
  } else {
    console.log('[commands] generate-thumbs (all)');
  }

  runCommand('node', args, res);
});

// ---------------------------------------------------------------------------
// Helper — run a sequence of git steps, accumulating output.
// "tolerantCommit" means commit returning code 1 (nothing to commit) is OK.
// ---------------------------------------------------------------------------
type Step = { cmd: string; args: string[]; tolerantCommit?: boolean };

function runSteps(
  steps: Step[],
  res: Response,
  cwd: string,
): void {
  let combinedOut = '';
  let combinedErr = '';

  function runStep(i: number): void {
    if (i >= steps.length) {
      res.json({ ok: true, stdout: combinedOut, stderr: combinedErr });
      return;
    }

    const { cmd, args, tolerantCommit } = steps[i];
    combinedOut += `\n$ ${cmd} ${args.join(' ')}\n`;
    const child = spawn(cmd, args, { cwd, shell: false });

    child.stdout.on('data', (d: Buffer) => { combinedOut += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { combinedErr += d.toString(); });

    child.on('close', (code) => {
      // git commit returns 1 when there's nothing to commit — treat as ok if flagged
      const ok = code === 0 || (tolerantCommit && code === 1);
      if (ok) {
        runStep(i + 1);
      } else {
        res.status(500).json({
          ok: false,
          step: `${cmd} ${args.join(' ')}`,
          code,
          stdout: combinedOut,
          stderr: combinedErr,
        });
      }
    });

    child.on('error', (err: Error) => {
      res.status(500).json({ error: err.message, step: `${cmd} ${args.join(' ')}` });
    });
  }

  runStep(0);
}

// ---------------------------------------------------------------------------
// POST /git-push — commit current changes and push to develop.
// Always operates on the develop branch: switches to develop if currently
// on a different branch (changes carry over), then commits and pushes.
// Body: { message?: string }
// ---------------------------------------------------------------------------
router.post('/git-push', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  const commitMsg = message ?? 'editor: update content';

  console.log(`[commands] git push → develop: "${commitMsg}"`);

  const steps: Step[] = [
    // Make sure we're on develop. If already there, this is a no-op.
    // If uncommitted changes don't conflict with develop's tree, they carry over.
    { cmd: 'git', args: ['checkout', 'develop'] },
    { cmd: 'git', args: ['add', '-A'] },
    { cmd: 'git', args: ['commit', '-m', commitMsg], tolerantCommit: true },
    { cmd: 'git', args: ['push', 'origin', 'develop'] },
  ];

  runSteps(steps, res, PROJECT_ROOT);
});

// ---------------------------------------------------------------------------
// POST /git-promote — promote develop → master (publish to production).
// 1. Ensure on develop, commit any pending changes
// 2. Push develop to origin
// 3. Switch to master, merge develop with --no-ff (creates a release commit)
// 4. Push master to origin
// 5. Switch back to develop
// Body: { message?: string }  — used for any pending develop commit
// ---------------------------------------------------------------------------
router.post('/git-promote', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  const commitMsg = message ?? 'editor: update content';
  const releaseMsg = `release: promote develop → master (${new Date().toISOString().slice(0, 19).replace('T', ' ')})`;

  console.log(`[commands] git promote develop → master`);

  const steps: Step[] = [
    // Ensure we're on develop and any pending edits are committed there
    { cmd: 'git', args: ['checkout', 'develop'] },
    { cmd: 'git', args: ['add', '-A'] },
    { cmd: 'git', args: ['commit', '-m', commitMsg], tolerantCommit: true },
    { cmd: 'git', args: ['push', 'origin', 'develop'] },

    // Promote to master
    { cmd: 'git', args: ['checkout', 'master'] },
    // Pull master in case origin/master moved (e.g. external commits)
    { cmd: 'git', args: ['pull', '--ff-only', 'origin', 'master'] },
    // Merge develop with an explicit release commit
    { cmd: 'git', args: ['merge', '--no-ff', 'develop', '-m', releaseMsg] },
    { cmd: 'git', args: ['push', 'origin', 'master'] },

    // Back to develop for continued editing
    { cmd: 'git', args: ['checkout', 'develop'] },
  ];

  runSteps(steps, res, PROJECT_ROOT);
});

export default router;
