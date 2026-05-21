import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Project root = O:/VISIONGRAPHICS_ASTRO/visiongraphics-astro
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

// Allowed write prefixes (normalized)
const ALLOWED_PREFIXES = [
  path.join(PROJECT_ROOT, 'src'),
  path.join(PROJECT_ROOT, 'public'),
  path.join(PROJECT_ROOT, 'tools', 'editor'),
];

export function validatePath(filePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => resolved.startsWith(prefix + path.sep) || resolved === prefix
  );
  if (!isAllowed) throw new Error(`Path not allowed: ${filePath}`);
  return resolved;
}

export async function readFile(filePath: string): Promise<string> {
  const safe = validatePath(filePath);
  return fs.readFile(safe, 'utf-8');
}

// Editor-local temp dir for atomic writes. Lives outside src/content/ so
// Astro's content-collection glob-loader doesn't pick up the in-flight .tmp
// files. Same drive as the project root → fs.rename stays atomic.
const WRITE_TMP_DIR = path.join(PROJECT_ROOT, 'tools', 'editor', '.write-tmp');

// Serialize every writeFile through one promise chain, then leave a short
// gap before the next write starts. Astro's content collection sync
// rebuilds `.astro/data-store.json` via its own temp+rename pattern after
// every src/content file change; if two of our writes land within that
// rebuild window, Astro's rename races against itself and crashes with
// EPERM or ENOENT, leaving the collection empty until the dev server is
// restarted. A 300 ms gap is enough for Astro's data store to settle.
let writeChain: Promise<void> = Promise.resolve();
const POST_WRITE_DELAY_MS = 300;

export async function writeFile(filePath: string, content: string): Promise<void> {
  const safe = validatePath(filePath);
  await fs.mkdir(path.dirname(safe), { recursive: true });
  await fs.mkdir(WRITE_TMP_DIR, { recursive: true });

  // Chain onto the previous write so writes inside this process never overlap.
  // Use a separate promise so individual callers' rejections don't poison
  // the shared chain.
  const prev = writeChain.catch(() => undefined);
  let release!: () => void;
  writeChain = new Promise<void>((r) => { release = r; });
  await prev;

  try {
    await doAtomicWrite(safe, content);
  } finally {
    // Hold the chain for POST_WRITE_DELAY_MS so the next caller waits.
    setTimeout(release, POST_WRITE_DELAY_MS);
  }
}

async function doAtomicWrite(safe: string, content: string): Promise<void> {

  // Atomic write: write to a tmp file then rename onto the target.
  //
  // A direct fs.writeFile on Windows produces two file events (truncate +
  // content) which can cause Astro's content-collection watcher to fire
  // twice in rapid succession. When that happens, Astro's own data-store
  // temp-rename pattern races against itself and crashes with
  // `ENOENT: rename '...data-store.json.tmp' -> '...data-store.json'`.
  // After the crash the collection appears empty until the dev server
  // restarts.
  //
  // Renaming an already-fully-written file emits a single CREATE/RENAME
  // event, sidestepping the race. The tmp file lives outside src/content/
  // so the glob-loader doesn't see it as a stray entry.
  const tmpName = `${path.basename(safe)}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  const tmp = path.join(WRITE_TMP_DIR, tmpName);
  try {
    await fs.writeFile(tmp, content, 'utf-8');
    // Windows: Astro's content watcher may briefly hold the target open after
    // the previous save, causing rename to fail with EPERM/EACCES/EBUSY.
    // Retry with short backoff — the lock typically clears within ~100 ms.
    let lastErr: any = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await fs.rename(tmp, safe);
        return;
      } catch (err: any) {
        lastErr = err;
        const code = err?.code;
        if (code !== 'EPERM' && code !== 'EACCES' && code !== 'EBUSY') throw err;
        await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
      }
    }
    throw lastErr;
  } catch (err) {
    try { await fs.unlink(tmp); } catch { /* ignore */ }
    throw err;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  const safe = validatePath(filePath);
  await fs.unlink(safe);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const safe = validatePath(filePath);
    await fs.access(safe);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(dirPath: string, ext: string): Promise<string[]> {
  const safe = validatePath(dirPath);
  try {
    const entries = await fs.readdir(safe, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(ext))
      .map((e) => path.join(dirPath, e.name).replace(/\\/g, '/'));
  } catch {
    return [];
  }
}

export async function listFilesRecursive(dirPath: string, ext: string): Promise<string[]> {
  const safe = validatePath(dirPath);
  const results: string[] = [];

  async function walk(currentAbs: string, currentRel: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentAbs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absChild = path.join(currentAbs, entry.name);
      const relChild = path.join(currentRel, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        await walk(absChild, relChild);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(relChild);
      }
    }
  }

  await walk(safe, dirPath.replace(/\\/g, '/'));
  return results;
}
