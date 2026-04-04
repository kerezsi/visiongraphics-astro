// src/components/media/ImageLightbox.tsx
// React island — carousel viewer (large image + thumbnail strip) + fullscreen lightbox
// Global CSS lives in src/styles/global.css under /* Gallery / ImageLightbox */

import { useState, useEffect, useCallback, useRef } from 'react';
import { thumbUrl } from '../../lib/image-url';

interface ImageItem {
  src: string;
  alt: string;
}

interface Props {
  images: ImageItem[];
  title?: string;
}

export default function ImageLightbox({ images, title }: Props) {
  const [activeIndex, setActiveIndex]     = useState(0);
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  /* ── Carousel navigation ──────────────────────────────────────── */
  const prev = useCallback(() => {
    setActiveIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex(i => (i + 1) % images.length);
  }, [images.length]);

  /* ── Lightbox ─────────────────────────────────────────────────── */
  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const lbPrev = useCallback(() => setLightboxIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const lbNext = useCallback(() => setLightboxIndex(i => (i + 1) % images.length), [images.length]);

  /* Keyboard nav for lightbox */
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  lbPrev();
      if (e.key === 'ArrowRight') lbNext();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lbPrev, lbNext, closeLightbox]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  /* Touch swipe on main image */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next(); else prev();
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Optional gallery title */}
      {title && <p className="gallery-section-label">{title}</p>}

      {/* ── Carousel viewer ──────────────────────────────────────── */}
      <div className="gallery-viewer">

        {/* Large active image */}
        <div
          className="gallery-main"
          onClick={() => openLightbox(activeIndex)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Click to enlarge"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(activeIndex); } }}
        >
          <img
            className="gallery-main-img"
            src={thumbUrl(images[activeIndex].src, 'large')}
            alt={images[activeIndex].alt}
            onError={(e) => { (e.target as HTMLImageElement).src = images[activeIndex].src; }}
          />
          {images.length > 1 && (
            <>
              <button
                className="gallery-nav gallery-nav--prev"
                onClick={e => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
              >‹</button>
              <button
                className="gallery-nav gallery-nav--next"
                onClick={e => { e.stopPropagation(); next(); }}
                aria-label="Next image"
              >›</button>
            </>
          )}
          <span className="gallery-zoom-hint" aria-hidden="true">⊕</span>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="gallery-thumbs" role="list" aria-label="Image thumbnails">
            {images.map((img, i) => (
              <button
                key={i}
                className={`gallery-thumb${i === activeIndex ? ' gallery-thumb--active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={img.alt || `Image ${i + 1}`}
                aria-current={i === activeIndex}
                role="listitem"
              >
                <img
                  src={thumbUrl(img.src)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).src = img.src; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox ───────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            className="lightbox-close"
            onClick={e => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Close lightbox"
          >✕</button>

          {images.length > 1 && (
            <button
              className="lightbox-prev"
              onClick={e => { e.stopPropagation(); lbPrev(); }}
              aria-label="Previous image"
            >‹</button>
          )}

          <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
            <img
              className="lightbox-img"
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
            />
          </div>

          {images.length > 1 && (
            <button
              className="lightbox-next"
              onClick={e => { e.stopPropagation(); lbNext(); }}
              aria-label="Next image"
            >›</button>
          )}

          {images.length > 1 && (
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
