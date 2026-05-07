// tools/editor/server/lib/spawn-detached.ts
//
// Spawn long-running child processes that survive parent restart.
//
// Background — the editor server runs under `tsx watch`, which kills the
// running process whenever any project .ts file changes. Without detaching,
// any in-flight rclone or thumbnail generation gets killed mid-execution
// (e.g., a thumbnail sync to R2 leaves the bucket partially populated).
//
// This helper spawns the child with:
//   - detached: true       → child runs in its own process group (or new
//                            session on Linux). On Windows this uses
//                            CREATE_NEW_PROCESS_GROUP, so the child won't
//                            receive the parent's death signals.
//   - stdio piped to a temp log file (not the parent's pipes) — so when the
//     parent dies, the child's stdout/stderr writes don't break.
//   - windowsHide: true    → no console window pop-up on Windows.
//   - child.unref()        → parent doesn't wait for the child on event loop.
//
// The HTTP handler still waits for the child's `close` event in the normal
// case. If the parent restarts mid-execution, the HTTP connection drops
// (browser sees a network error) but the child completes its work in the
// background and the log file is preserved for inspection.

import { spawn } from 'child_process';
import type { ChildProcess, SpawnOptions } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DetachedSpawnResult {
  child:   ChildProcess;
  logFile: string;
}

/**
 * Spawn a child detached from the parent process. The child writes
 * stdout+stderr to a temp log file. Caller should read the log file in
 * the `close` handler, then delete it via `cleanupChildLog`.
 */
export function spawnDetached(
  cmd: string,
  args: string[],
  options: SpawnOptions = {},
): DetachedSpawnResult {
  const logDir  = path.join(os.tmpdir(), 'vg-editor-spawn');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(
    logDir,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${path.basename(cmd)}.log`,
  );
  const fd = fs.openSync(logFile, 'w');

  const child = spawn(cmd, args, {
    ...options,
    detached: true,
    stdio: ['ignore', fd, fd],
    windowsHide: true,
  });

  // Parent releases its file handle — the child holds its own copy via the
  // dup'd fd in stdio, so the file stays open from the child's side.
  fs.closeSync(fd);

  // Remove the child reference from the parent's event loop so the parent
  // can exit cleanly even if the child is still running.
  child.unref();

  return { child, logFile };
}

/**
 * Read the combined stdout+stderr log of a detached child.
 * Returns empty string if the log file doesn't exist or can't be read.
 */
export function readChildLog(logFile: string): string {
  try {
    return fs.readFileSync(logFile, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Delete the log file. Safe to call multiple times or when the file is
 * already gone.
 */
export function cleanupChildLog(logFile: string): void {
  try {
    fs.unlinkSync(logFile);
  } catch {
    // ignore — file may already be gone or permissions issue
  }
}
