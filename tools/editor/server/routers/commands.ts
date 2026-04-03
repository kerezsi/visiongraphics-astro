import express from 'express';
import type { Request, Response } from 'express';
import { spawn } from 'child_process';
import { PROJECT_ROOT } from '../lib/fs-utils.js';

const router = express.Router();

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
// Body: { slug?: string }
// ---------------------------------------------------------------------------
router.post('/generate-thumbs', (req: Request, res: Response) => {
  const { slug } = req.body as { slug?: string };

  if (slug && !validateSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  const args = ['scripts/generate-thumbs.mjs'];
  if (slug) args.push('--slug', slug);

  console.log(`[commands] generate-thumbs ${slug ?? '(all)'}`);
  runCommand('node', args, res);
});

// ---------------------------------------------------------------------------
// POST /git-push — git add, commit, push
// Body: { message?: string }
// ---------------------------------------------------------------------------
router.post('/git-push', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  const commitMsg = message ?? 'editor: update content';

  console.log(`[commands] git push: "${commitMsg}"`);

  // Run add → commit → push sequentially
  const steps: Array<{ cmd: string; args: string[] }> = [
    { cmd: 'git', args: ['add', '-A'] },
    { cmd: 'git', args: ['commit', '-m', commitMsg] },
    { cmd: 'git', args: ['push'] },
  ];

  let combinedOut = '';
  let combinedErr = '';

  function runStep(i: number): void {
    if (i >= steps.length) {
      res.json({ ok: true, stdout: combinedOut, stderr: combinedErr });
      return;
    }

    const { cmd, args } = steps[i];
    const child = spawn(cmd, args, { cwd: PROJECT_ROOT, shell: false });

    child.stdout.on('data', (d: Buffer) => { combinedOut += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { combinedErr += d.toString(); });

    child.on('close', (code) => {
      // git commit returns 1 when there's nothing to commit — treat as ok
      if (code === 0 || (cmd === 'git' && args[0] === 'commit' && code === 1)) {
        runStep(i + 1);
      } else {
        res.status(500).json({ ok: false, step: args.join(' '), code, stdout: combinedOut, stderr: combinedErr });
      }
    });

    child.on('error', (err: Error) => {
      res.status(500).json({ error: err.message, step: args.join(' ') });
    });
  }

  runStep(0);
});

export default router;
