/**
 * Derives the thumbnail URL for any R2-hosted image.
 * Inserts a `thumbs/` subfolder and changes extension to .webp:
 *   /_img/portfolio/slug/01.jpg → /_img/portfolio/slug/thumbs/01.webp
 */
export function thumbUrl(src: string): string {
  const lastSlash = src.lastIndexOf('/');
  if (lastSlash === -1) return src;
  const dir = src.slice(0, lastSlash);
  const filename = src.slice(lastSlash + 1);
  const basename = filename.replace(/\.[^.]+$/, '');
  return `${dir}/thumbs/${basename}.webp`;
}
