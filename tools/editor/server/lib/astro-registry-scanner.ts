import { readFileSync } from 'fs';
import { join } from 'path';
import type { BlockType } from '../types/blocks.js';

// ---------------------------------------------------------------------------
// Component name → VG Editor block type mapping
// Only covers components that have a corresponding editor block.
// Components without editor blocks (ProcessFlow, SpecTable, CompareTable,
// PhaseMatrix, PhaseMatrix, ProjectDescription, ProjectStory, ProjectTasks,
// ArticleGalleryMounter, ArticleImageCompareMounter) are intentionally absent.
// ---------------------------------------------------------------------------

const COMPONENT_TO_BLOCK: Record<string, BlockType> = {
  SectionBanner:   'SectionBanner',
  SingleImage:     'single-image',
  ImageGallery:    'image-gallery',
  ImageCompare:    'image-compare',
  DeliverableGrid: 'deliverable-grid',
  TimelineTable:   'timeline-table',
  NotableGrid:     'notable-grid',
  Tour360:         'tour-360',
  YoutubeEmbed:    'youtube-embed',
  YouTubeEmbed:    'youtube-embed',
  FilmEmbed:       'film-embed',
};

// Prose blocks are always available for content page types.
// They are not Astro MDX components — they generate plain markdown.
const PROSE_BLOCKS: BlockType[] = ['heading', 'body-lead', 'body-text', 'results-list', 'rich-text'];

export type PageTypeRegistry = Record<string, BlockType[]>;

// ---------------------------------------------------------------------------
// Extract component names from a single Astro template file.
// Finds the `components={{ ... }}` prop and extracts all keys.
// ---------------------------------------------------------------------------

function extractComponentsFromTemplate(filePath: string): Set<string> {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return new Set();
  }

  // Match `components={{...}}` — may span multiple lines
  const match = content.match(/components=\{\{([\s\S]*?)\}\}/);
  if (!match) return new Set();

  const propsStr = match[1];
  const names = new Set<string>();

  // Extract all identifiers that start with an uppercase letter.
  // These appear as both shorthand keys (Name,) and aliased keys (Name: ...).
  // Values of aliased props (Name: Value) may also be matched, but since we
  // only use COMPONENT_TO_BLOCK for lookup, any non-registered value is ignored.
  const re = /\b([A-Z][A-Za-z0-9]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(propsStr)) !== null) {
    names.add(m[1]);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Scan all four content page templates and return a pageType → BlockType[]
// registry that the VG Editor can use to filter the block palette.
// ---------------------------------------------------------------------------

export function scanAstroRegistry(projectRoot: string): PageTypeRegistry {
  const templates: Record<string, string> = {
    project:         join(projectRoot, 'src', 'pages', 'portfolio', '[slug].astro'),
    service:         join(projectRoot, 'src', 'pages', 'services',  '[slug].astro'),
    'vision-tech':   join(projectRoot, 'src', 'pages', 'vision-tech', '[slug].astro'),
    article:         join(projectRoot, 'src', 'pages', 'articles',  '[slug].astro'),
  };

  const registry: PageTypeRegistry = {};

  for (const [pageType, templatePath] of Object.entries(templates)) {
    const componentNames = extractComponentsFromTemplate(templatePath);
    const blockTypes = new Set<BlockType>();

    for (const name of componentNames) {
      const blockType = COMPONENT_TO_BLOCK[name];
      if (blockType) blockTypes.add(blockType);
    }

    // Prose blocks are always available in content page types
    for (const b of PROSE_BLOCKS) {
      blockTypes.add(b);
    }

    registry[pageType] = [...blockTypes];
  }

  // 'page' type: static .astro files — show everything
  const allBlocks = new Set<BlockType>([
    ...Object.values(COMPONENT_TO_BLOCK),
    ...PROSE_BLOCKS,
  ]);
  registry['page'] = [...allBlocks];

  return registry;
}
