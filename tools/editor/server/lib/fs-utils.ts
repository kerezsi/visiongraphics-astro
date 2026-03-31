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

export async function writeFile(filePath: string, content: string): Promise<void> {
  const safe = validatePath(filePath);
  await fs.mkdir(path.dirname(safe), { recursive: true });
  await fs.writeFile(safe, content, 'utf-8');
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
