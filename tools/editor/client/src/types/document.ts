import type { BlockData, PageType } from './blocks.ts';

export interface ArticleMeta {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  coverImage: string;
  published: boolean;
}

export interface ProjectMeta {
  title: string;
  displayTitle?: string;
  year: number;
  client?: string;
  designer?: string;
  clientType?: string;
  city?: string;
  country?: string;
  description?: string;
  story?: string;
  tasks?: string;
  categories: string[];
  features: string[];
  tags: string[];
  techniques?: string[];
  services?: string[];
  coverImage: string;
  published: boolean;
  featured: boolean;
}

export interface ServiceMeta {
  title: string;
  description: string;
  tagline?: string;
  bannerImage?: string;
  order?: number;
  published: boolean;
  startRequirements?: string;
  pricing?: string;
  sidebarLabel?: string;
  sidebarContent?: string;
}

export interface VisionTechMeta {
  title: string;
  description: string;
  image: string;
  technique?: string;
  cost?: string;
  model3d?: string;
  complexity?: string;
  reality?: string;
  purpose?: string[];
  gallery?: string[];
  relatedCategories?: string[];
  relatedFeatures?: string[];
}

export type PageMeta = ArticleMeta | ProjectMeta | ServiceMeta | VisionTechMeta | Record<string, unknown>;

export interface DocumentState {
  pageType: PageType;
  slug: string;
  filePath: string;
  isDirty: boolean;
  meta: PageMeta;
  blocks: BlockData[];
  /** Raw file content for static .astro pages (not MDX collections) */
  rawContent?: string;
}
