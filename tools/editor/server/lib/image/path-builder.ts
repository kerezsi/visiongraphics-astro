export type PageType = 'article' | 'service' | 'project' | 'vision-tech';

// R2 sub-path prefix per collection type.
// Images are served through /_img/ → R2 redirects on the Astro site.
const R2_PREFIX: Record<PageType, string> = {
  project:      '_img/portfolio',
  article:      '_img/articles',
  service:      '_img/services',
  'vision-tech': '_img/vision-tech',
};

/**
 * Returns the LOCAL staging directory for a given page's images.
 * e.g. "tools/editor/.staging/koki_foodcourt"
 */
export function buildStagingDir(slug: string): string {
  return `tools/editor/.staging/${slug}`;
}

/**
 * Returns the R2 remote path prefix for rclone.
 * e.g. "_img/portfolio/koki_foodcourt"
 */
export function buildR2RemotePath(pageType: PageType, slug: string): string {
  return `${R2_PREFIX[pageType]}/${slug}`;
}

/**
 * Returns the public URL used in MDX content (via the /_img/ redirect).
 * e.g. "/_img/portfolio/koki_foodcourt/photo.jpg"
 */
export function buildImageUrl(pageType: PageType, slug: string, filename: string): string {
  return `/${R2_PREFIX[pageType]}/${slug}/${filename}`;
}

/**
 * Returns the staging directory path where images are stored locally.
 */
export function buildImageDir(pageType: PageType, slug: string): string {
  return buildStagingDir(slug);
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
