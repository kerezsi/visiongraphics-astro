export type PageType = 'article' | 'service' | 'project' | 'vision-tech' | 'page';

export type BlockType =
  // MDX component blocks
  | 'SectionBanner'
  | 'image-gallery'
  | 'image-compare'
  | 'deliverable-grid'
  | 'timeline-table'
  | 'notable-grid'
  | 'single-image'
  | 'tour-360'
  | 'youtube-embed'
  | 'film-embed'
  // Prose blocks
  | 'heading'
  | 'body-lead'
  | 'body-text'
  | 'results-list'
  | 'rich-text';

export type BlockData =
  | { id: string; type: 'SectionBanner';    props: SectionBannerProps }
  | { id: string; type: 'image-gallery';    props: ImageGalleryProps }
  | { id: string; type: 'image-compare';    props: ImageCompareProps }
  | { id: string; type: 'deliverable-grid'; props: DeliverableGridProps }
  | { id: string; type: 'timeline-table';   props: TimelineTableProps }
  | { id: string; type: 'notable-grid';     props: NotableGridProps }
  | { id: string; type: 'single-image';     props: SingleImageProps }
  | { id: string; type: 'tour-360';         props: Tour360Props }
  | { id: string; type: 'youtube-embed';    props: YouTubeEmbedProps }
  | { id: string; type: 'film-embed';       props: FilmEmbedProps }
  | { id: string; type: 'heading';          props: HeadingProps }
  | { id: string; type: 'body-lead';        props: { text: string } }
  | { id: string; type: 'body-text';        props: { text: string } }
  | { id: string; type: 'results-list';     props: ResultsListProps }
  | { id: string; type: 'rich-text';        props: { html: string } };

export interface SectionBannerProps {
  image: string;
  label: string;
  title: string;
  /** Extra props from .astro page SectionBanners (headingLevel, size, fullBleed, etc.) */
  [key: string]: unknown;
}

export interface HeadingProps {
  text: string;
  level: 'h2' | 'h3';
}

export interface ResultsListProps {
  items: string[];
}

export interface DeliverableGridProps {
  items: Array<{ title: string; desc: string }>;
  columns?: 2 | 3;
}

export interface TimelineTableProps {
  rows: Array<{ scope: string; deliverables: string }>;
}

export interface NotableGridProps {
  items: Array<{ name: string; year: string }>;
}

export interface SingleImageProps {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ImageGalleryProps {
  images: Array<{ src: string; alt: string }>;
}

// Flat props matching the MDX <ImageCompare> component signature
export interface ImageCompareProps {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  label?: string;
}

export interface FilmEmbedProps {
  vimeoId: string;
  title: string;
}

export interface Tour360Props {
  url: string;
  title: string;
  coverImage?: string;
}

export interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  group: 'mdx-component' | 'prose';
  icon: string;
  allowedIn: PageType[] | 'all';
  canNest: boolean;
  defaultProps: Record<string, unknown>;
  description?: string;
}

// Re-export DocumentState for use by codegen
export interface DocumentState {
  pageType: PageType;
  slug: string;
  filePath: string;
  isDirty: boolean;
  meta: Record<string, unknown>;
  blocks: BlockData[];
}
