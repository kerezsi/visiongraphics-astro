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
  | 'rich-text'
  | 'section-label'
  | 'diff-block'
  | 'cta-section'
  | 'button-group'
  | 'sidebar-block'
  // Layout/container blocks
  | 'section-container'
  | 'two-col'
  | 'service-body-grid';

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
  | { id: string; type: 'rich-text';        props: { html: string } }
  | { id: string; type: 'section-label';    props: { text: string } }
  | { id: string; type: 'diff-block';       props: DiffBlockProps }
  | { id: string; type: 'cta-section';      props: CtaSectionProps }
  | { id: string; type: 'button-group';     props: ButtonGroupProps }
  | { id: string; type: 'sidebar-block';    props: SidebarBlockProps }
  | { id: string; type: 'section-container'; props: SectionContainerProps }
  | { id: string; type: 'two-col';          props: TwoColProps }
  | { id: string; type: 'service-body-grid'; props: ServiceBodyGridProps };

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
  className?: string;
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
  /** Gallery title (Localized). Maps to `title` prop on <ImageGallery> / <ImageLightbox>. */
  title?: import('../lib/localized.ts').LocalizedValue;
  /** Red header above the gallery (Localized). Maps to `label` prop on <ImageGallery>. */
  label?: import('../lib/localized.ts').LocalizedValue;
  /** White subtitle line under the label (Localized). Maps to `subtitle` prop on <ImageGallery>. */
  subtitle?: import('../lib/localized.ts').LocalizedValue;
}

// Flat props matching the MDX <ImageCompare> component signature
export interface ImageCompareProps {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  /** Red title above the comparison. Default: "Compare:" / "Összehasonlítás:" */
  label?: import('../lib/localized.ts').LocalizedValue;
  /** Optional white subtitle. */
  subtitle?: import('../lib/localized.ts').LocalizedValue;
  /** Override the "Before" overlay label. Default: "Before" / "Előtte" */
  beforeText?: import('../lib/localized.ts').LocalizedValue;
  /** Override the "After" overlay label. Default: "After" / "Utána" */
  afterText?: import('../lib/localized.ts').LocalizedValue;
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

export interface DiffBlockProps {
  label: string;
  text: string;
}

export interface CtaSectionProps {
  heading: string;
  subtext: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface ButtonGroupProps {
  buttons: Array<{ label: string; href: string; variant: string }>;
}

export interface SidebarBlockProps {
  label: string;
  content: string;
}

export interface SectionContainerProps {
  children: BlockData[];
}

export interface TwoColProps {
  left: BlockData[];
  right: BlockData[];
}

export interface ServiceBodyGridProps {
  main: BlockData[];
  sidebar: BlockData[];
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
