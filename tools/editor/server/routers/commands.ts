import express from 'express';
import type { Request, Response } from 'express';
import { spawn, execFileSync } from 'child_process';
import { PROJECT_ROOT } from '../lib/fs-utils.js';
import { buildR2RemotePath } from '../lib/image/path-builder.js';
import type { PageType } from '../lib/image/path-builder.js';
import { spawnDetached, readChildLog, cleanupChildLog } from '../lib/spawn-detached.js';

// Read the current git branch synchronously without touching the working tree.
// Used as a guard for /git-push and /git-promote — both expect develop.
function getCurrentBranch(): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    return out.trim();
  } catch {
    return null;
  }
}

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
  // Spawn detached — survives a parent restart (tsx watch reloading on file
  // change). Used for long-running commands like generate-thumbs.mjs which
  // can take tens of seconds and must not be killed mid-flight.
  const { child, logFile } = spawnDetached(cmd, args, { cwd: PROJECT_ROOT });

  child.on('close', (code) => {
    const log = readChildLog(logFile);
    cleanupChildLog(logFile);
    if (code === 0) {
      res.json({ ok: true, stdout: log });
    } else {
      res.status(500).json({ ok: false, code, stdout: log });
    }
  });

  child.on('error', (err: Error) => {
    cleanupChildLog(logFile);
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
// "finallySteps" always run after main steps (success or failure) and their
// outcome doesn't affect the response status. Used to always return to a
// safe branch even if a middle step fails.
// ---------------------------------------------------------------------------
type Step = { cmd: string; args: string[]; tolerantCommit?: boolean };

function runSteps(
  steps: Step[],
  res: Response,
  cwd: string,
  finallySteps: Step[] = [],
): void {
  let combinedOut = '';
  let combinedErr = '';
  let mainOk = true;
  let mainFailure: { step: string; code: number | null } | null = null;

  function runOne(step: Step, onClose: (ok: boolean, code: number | null) => void): void {
    const { cmd, args, tolerantCommit } = step;
    combinedOut += `\n$ ${cmd} ${args.join(' ')}\n`;
    const child = spawn(cmd, args, { cwd, shell: false });
    child.stdout.on('data', (d: Buffer) => { combinedOut += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { combinedErr += d.toString(); });
    child.on('close', (code) => {
      const ok = code === 0 || (tolerantCommit === true && code === 1);
      onClose(ok, code);
    });
    child.on('error', (err: Error) => {
      combinedErr += `\n[spawn error] ${err.message}\n`;
      onClose(false, null);
    });
  }

  function respond(): void {
    if (mainOk) {
      res.json({ ok: true, stdout: combinedOut, stderr: combinedErr });
    } else {
      res.status(500).json({
        ok: false,
        step: mainFailure?.step,
        code: mainFailure?.code,
        stdout: combinedOut,
        stderr: combinedErr,
      });
    }
  }

  function runFinally(i: number): void {
    if (i >= finallySteps.length) {
      respond();
      return;
    }
    runOne(finallySteps[i], () => runFinally(i + 1));
  }

  function runMain(i: number): void {
    if (i >= steps.length) {
      runFinally(0);
      return;
    }
    const step = steps[i];
    runOne(step, (ok, code) => {
      if (ok) {
        runMain(i + 1);
      } else {
        mainOk = false;
        mainFailure = { step: `${step.cmd} ${step.args.join(' ')}`, code };
        runFinally(0);
      }
    });
  }

  runMain(0);
}

// ---------------------------------------------------------------------------
// POST /git-push — commit current changes and push to develop.
//
// Refuses to run unless the working directory is on the develop branch.
// We intentionally do NOT try to auto-switch — `git checkout` mutates the
// working tree, which causes tsx watch to kill this server mid-sequence
// (see /git-promote comment block for details).
//
// Body: { message?: string }
// ---------------------------------------------------------------------------
router.post('/git-push', async (req: Request, res: Response) => {
  const branch = getCurrentBranch();
  if (branch !== 'develop') {
    res.status(409).json({
      ok: false,
      error: `Cannot push from branch "${branch ?? 'unknown'}". The editor must be on develop.`,
      hint: 'Run `git checkout develop` in a terminal, then try again.',
    });
    return;
  }

  const { message } = req.body as { message?: string };
  const commitMsg = message ?? 'editor: update content';

  console.log(`[commands] git push → develop: "${commitMsg}"`);

  const steps: Step[] = [
    { cmd: 'git', args: ['add', '-A'] },
    { cmd: 'git', args: ['commit', '-m', commitMsg], tolerantCommit: true },
    { cmd: 'git', args: ['push', 'origin', 'develop'] },
  ];

  runSteps(steps, res, PROJECT_ROOT);
});

// ---------------------------------------------------------------------------
// POST /git-promote — promote develop → master (publish to production).
//
// IMPORTANT — NO `git checkout` calls in this sequence.
//
// The editor server runs under `tsx watch`, which restarts the process
// whenever any .ts file in the project changes. A previous version of this
// endpoint used `git checkout master` to do a merge there; that reverted
// the working tree to master's older code, tsx detected the file change,
// killed the running process mid-sequence, and the promote aborted —
// stranding the repo on master with no master push and the editor UI
// reloaded to master's older state (no Live button, etc.).
//
// The fix: push develop's tip directly to origin/master via a refspec.
// This is a fast-forward push — no merge commit, but linear history is
// fine for a solo workflow, and crucially it touches ZERO files in the
// working tree. tsx never sees a change. The process keeps running.
//
// Body: { message?: string } — used for any pending develop commit
// ---------------------------------------------------------------------------
router.post('/git-promote', async (req: Request, res: Response) => {
  const branch = getCurrentBranch();
  if (branch !== 'develop') {
    res.status(409).json({
      ok: false,
      error: `Cannot promote from branch "${branch ?? 'unknown'}". The editor must be on develop.`,
      hint: 'Run `git checkout develop` in a terminal, then try again.',
    });
    return;
  }

  const { message } = req.body as { message?: string };
  const commitMsg = message ?? 'editor: update content';

  console.log(`[commands] git promote develop → origin/master (refspec push)`);

  const steps: Step[] = [
    // Sync remote refs so we have an accurate view of origin/master
    { cmd: 'git', args: ['fetch', 'origin'] },

    // Commit any pending edits on the current (develop) branch
    { cmd: 'git', args: ['add', '-A'] },
    { cmd: 'git', args: ['commit', '-m', commitMsg], tolerantCommit: true },

    // Push develop normally (updates staging + the develop branch alias)
    { cmd: 'git', args: ['push', 'origin', 'develop'] },

    // Push develop's tip to origin/master via refspec (fast-forward).
    // This triggers the Cloudflare Pages production build for visiongraphics.eu.
    // No working-tree change → tsx watch doesn't restart → sequence completes.
    { cmd: 'git', args: ['push', 'origin', 'develop:master'] },

    // Update local master ref to match — keeps `git log master..develop`
    // and similar comparisons accurate. Pure ref update, no working-tree change.
    { cmd: 'git', args: ['update-ref', 'refs/heads/master', 'refs/heads/develop'] },
  ];

  runSteps(steps, res, PROJECT_ROOT);
});

export default router;
