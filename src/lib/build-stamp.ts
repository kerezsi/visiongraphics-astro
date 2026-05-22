// src/lib/build-stamp.ts
//
// Per-build constant injected by Vite `define` in astro.config.mjs.
// Imported by every React island entry so every emitted JS chunk's content
// changes on every build, forcing fresh content hashes. This works around a
// Cloudflare Pages dedupe bug where unchanged hashes can resolve to missing
// or corrupted edge blobs and 500 with empty body.
//
// The window assignment is a real side effect, which prevents Rollup from
// tree-shaking the import and also exposes the build stamp for debugging
// (browser console: `__VG_BUILD`).

declare const __BUILD_STAMP__: string;

export const BUILD_STAMP: string = __BUILD_STAMP__;

if (typeof window !== 'undefined') {
  (window as unknown as { __VG_BUILD?: string }).__VG_BUILD = BUILD_STAMP;
}
