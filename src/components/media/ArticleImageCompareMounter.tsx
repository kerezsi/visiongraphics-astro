/**
 * ArticleImageCompareMounter
 *
 * Finds every <div class="image-compare-mount"> emitted by the
 * remark-image-compare plugin and renders ImageCompare into each one via
 * React portals — the correct React 18 pattern for rendering into arbitrary
 * DOM nodes without creating nested React roots.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ImageCompare from '../ui/ImageCompare.tsx';

export default function ArticleImageCompareMounter() {
  const [mounts, setMounts] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.image-compare-mount')
    );
    setMounts(els);
  }, []);

  return (
    <>
      {mounts.map((el, i) => {
        const beforeSrc = el.dataset.beforeSrc ?? '';
        const beforeAlt = el.dataset.beforeAlt ?? '';
        const afterSrc  = el.dataset.afterSrc  ?? '';
        const afterAlt  = el.dataset.afterAlt  ?? '';
        if (!beforeSrc || !afterSrc) return null;
        return createPortal(
          <ImageCompare
            key={i}
            before={{ src: beforeSrc, alt: beforeAlt, label: 'Before' }}
            after={{ src: afterSrc,  alt: afterAlt,  label: 'After'  }}
            initialPosition={50}
            aspectRatio="16 / 9"
          />,
          el
        );
      })}
    </>
  );
}
