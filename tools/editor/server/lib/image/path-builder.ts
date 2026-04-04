export type PageType = 'article' | 'service' | 'project' | 'vision-tech';

// R2 bucket sub-path per collection type (no leading _img/ — that prefix is
// only used in the Astro site's public URLs and /_redirects rules).
const R2_COLLECTION: Record<PageType, string> = {
  project:       'portfolio',
  article:       'articles',
  service:       'services',
  'vision-tech': 'vision-tech',
};

/**
 * Returns the LOCAL staging directory for a given page's images.
 * Mirrors the R2 collection structure.
 * e.g. "tools/editor/.staging/portfolio/koki_foodcourt"
 */
export function buildStagingDir(pageType: PageType, slug: string): string {
  return `tools/editor/.staging/${R2_COLLECTION[pageType]}/${slug}`;
}

/**
 * Returns the R2 remote path prefix for rclone.
 * e.g. "portfolio/koki_foodcourt"
 */
export function buildR2RemotePath(pageType: PageType, slug: string): string {
  return `${R2_COLLECTION[pageType]}/${slug}`;
}

/**
 * Returns the public URL used in MDX content (via the /_img/ redirect).
 * e.g. "/_img/portfolio/koki_foodcourt/photo.jpg"
 */
export function buildImageUrl(pageType: PageType, slug: string, filename: string): string {
  return `/_img/${R2_COLLECTION[pageType]}/${slug}/${filename}`;
}

/**
 * Returns the staging directory path where images are stored locally.
 */
export function buildImageDir(pageType: PageType, slug: string): string {
  return buildStagingDir(pageType, slug);
}

export function sanitizeFilename(original: string): string {
  const lastDot = original.lastIndexOf('.');
  if (lastDot === -1) {
    return original.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }
  const ext = original.slice(lastDot);
  const base = original.slice(0, lastDot);
  return base.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + ext;
}
