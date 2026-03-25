import type { AstroIntegration } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function tokenEditor(): AstroIntegration {
  return {
    name: 'token-editor',
    hooks: {
      'astro:config:setup'({ addDevToolbarApp, command }) {
        if (command !== 'dev') return;

        addDevToolbarApp({
          id: 'token-editor',
          name: 'Design Tokens',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="13.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M3 3l18 18"/></svg>`,
          entrypoint: new URL('./toolbar-app.ts', import.meta.url).pathname,
        });
      },

      'astro:server:setup'({ server }) {
        // Vite's Connect middleware signature: (req, res, next) => void
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        server.middlewares.use(async (req: any, res: any, next: any) => {
          // Handle CORS preflight
          if (req.url === '/__tokens/save' && req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.writeHead(204);
            res.end();
            return;
          }

          if (req.url !== '/__tokens/save' || req.method !== 'POST') {
            return next();
          }

          try {
            // Collect POST body chunks
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }

            const parsed = JSON.parse(body) as { tokens?: Record<string, string> };
            const { tokens } = parsed;

            if (!tokens || typeof tokens !== 'object') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'Invalid tokens payload' }));
              return;
            }

            // Read current global.css (resolved relative to the project root)
            const cssPath = resolve('src/styles/global.css');
            let css = await readFile(cssPath, 'utf-8');

            // Replace each token value in the CSS declaration block
            // Matches:  --token-name:   <anything-not-semicolon>;
            for (const [name, value] of Object.entries(tokens)) {
              const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const re = new RegExp(`(${escapedName}:\\s*)([^;]+)(;)`, 'g');
              css = css.replace(re, `$1${value}$3`);
            }

            await writeFile(cssPath, css, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, saved: Object.keys(tokens).length }));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[token-editor] Save error:', message);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(500);
            res.end(JSON.stringify({ ok: false, error: message }));
          }
        });
      },
    },
  };
}
