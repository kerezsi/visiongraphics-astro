/**
 * ArticleGalleryMounter
 *
 * Finds every <div class="article-gallery-mount"> emitted by the
 * remark-image-gallery plugin and mounts ImageLightbox into each one
 * via React portals.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ImageLightbox from './ImageLightbox.tsx';

interface ImageItem { src: string; alt: string; }

export default function ArticleGalleryMounter() {
  const [mounts, setMounts] = useState<{ el: HTMLElement; images: ImageItem[] }[]>([]);

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.article-gallery-mount')
    );
    const parsed = els.flatMap((el) => {
      try {
        const images: ImageItem[] = JSON.parse(el.dataset.images ?? '[]');
        return images.length > 0 ? [{ el, images }] : [];
      } catch {
        return [];
      }
    });
    setMounts(parsed);
  }, []);

  return (
    <>
      {mounts.map(({ el, images }, i) =>
        createPortal(<ImageLightbox key={i} images={images} />, el)
      )}
    </>
  );
}
