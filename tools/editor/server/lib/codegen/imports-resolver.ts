import type { BlockData } from '../../types/blocks.js';

// Map block type to required import statement.
// depth is the relative path depth (2 = ../../, 3 = ../../../)
const BLOCK_IMPORT_MAP: Partial<Record<string, (depth: number) => string>> = {
  SectionBanner:  (d) => `import SectionBanner from '${back(d)}components/ui/SectionBanner.astro';`,
  'image-gallery': (d) => `import ImageLightbox from '${back(d)}components/media/ImageLightbox.tsx';`,
  'image-compare': (d) => `import ImageCompare from '${back(d)}components/ui/ImageCompare';`,
  'film-embed':    (d) => `import FilmEmbed from '${back(d)}components/media/FilmEmbed.astro';`,
  'tour-360':      (d) => `import Tour360 from '${back(d)}components/media/Tour360.astro';`,
  'youtube-embed': (d) => `import YouTubeEmbed from '${back(d)}components/media/YouTubeEmbed.astro';`,
};

function back(depth: number): string {
  return '../'.repeat(depth);
}

export function resolveImports(blocks: BlockData[], depth = 2): string[] {
  const needed = new Set<string>();

  function walk(block: BlockData) {
    const fn = BLOCK_IMPORT_MAP[block.type];
    if (fn) needed.add(fn(depth));

    // Walk nested children in known container props
    const props = block.props as any;
    for (const key of ['children', 'main', 'sidebar', 'left', 'right']) {
      if (Array.isArray(props[key])) {
        props[key].forEach(walk);
      }
    }
  }

  blocks.forEach(walk);
  return Array.from(needed);
}
