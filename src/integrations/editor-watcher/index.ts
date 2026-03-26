/**
 * editor-watcher integration
 *
 * On Windows mapped/network drives (e.g. O:) the OS never fires native FS
 * events, so Vite's default watcher misses files written by the page editor.
 * Rather than enabling polling for the whole project (very slow), this
 * integration sets up a separate lightweight chokidar instance that polls
 * only the small directories the editor writes to.
 *
 * When any watched file changes it sends a full-reload via Vite's HMR
 * WebSocket so the browser refreshes automatically.
 */

import type { AstroIntegration } from 'astro';
import chokidar from 'chokidar';
import path from 'node:path';

export function editorWatcher(): AstroIntegration {
  return {
    name: 'editor-watcher',
    hooks: {
      'astro:server:setup'({ server, logger }) {
        // server.config.root is the project root — reliable, no path arithmetic needed
        const root = server.config.root;

        const watchPaths = [
          path.join(root, 'src/content/articles'),
          path.join(root, 'src/content/vision-tech'),
          path.join(root, 'src/pages'),
        ];

        logger.info(`polling: ${watchPaths.map(p => path.relative(root, p)).join(', ')}`);

        const watcher = chokidar.watch(watchPaths, {
          ignoreInitial: true,
          persistent: true,
          usePolling: true,
          interval: 1200,
          awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 200 },
        });

        // Path to Astro's data store — Astro's vite plugin watches this file and
        // calls invalidateDataStore() when it changes, which (a) invalidates the
        // RESOLVED_DATA_STORE_VIRTUAL_ID module so it re-reads fresh JSON and
        // (b) sends a full-reload to the browser.
        // On Windows mapped drives native FS events never fire, so we synthesise
        // the event ourselves after giving the ContentLayer time to finish its sync.
        const dataStorePath = path.join(root, '.astro', 'data-store.json');

        function handleChange(event: 'change' | 'add', filePath: string) {
          logger.info(`${event}: ${path.relative(root, filePath)}`);
          // 1. Tell Astro's content layer about the changed .md file so it
          //    re-reads it, updates the in-memory store, and writes data-store.json
          server.watcher.emit(event, filePath);
          // 2. After the ContentLayer finishes writing data-store.json, emit a
          //    synthetic change event for that file.  Astro's content virtual-mod
          //    plugin handles this by invalidating the data-store virtual module
          //    and sending a full-reload — giving the browser fresh content.
          setTimeout(() => server.watcher.emit('change', dataStorePath), 800);
        }

        watcher.on('change', (fp) => handleChange('change', fp));
        watcher.on('add',    (fp) => handleChange('add', fp));

        server.httpServer?.on('close', () => watcher.close());
      },
    },
  };
}
