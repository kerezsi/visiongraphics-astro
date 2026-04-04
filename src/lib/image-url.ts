/**
 * Derives a thumbnail URL from any R2-hosted image src.
 *
 * Thumbnails live in public/thumbs/ and are served as static files.
 *   /_img/portfolio/slug/01.jpg  →  /thumbs/card/portfolio/slug/01.webp
 *   /_img/services/slug/01.jpg   →  /thumbs/large/services/slug/01.webp
 *
 * Sizes:
 *   card  — 600px  (portfolio grid, service carousel, article cards, gallery strip)
 *   large — 1600px (gallery main viewer, 360 cover images)
 */
export function thumbUrl(src: string | undefined | null, size: 'card' | 'large' = 'card'): string {
  if (!src) return '';
  // Strip /_img/ prefix, swap extension to .webp
  const stripped = src.startsWith('/_img/') ? src.slice('/_img/'.length) : src;
  const withoutExt = stripped.replace(/\.[^./]+$/, '');
  return `/thumbs/${size}/${withoutExt}.webp`;
}
