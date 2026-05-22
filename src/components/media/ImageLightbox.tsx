// src/components/media/ImageLightbox.tsx
// Inline gallery: Embla carousel (drag, momentum, smooth slides) + thumbnail
// strip. Clicking the main image opens PhotoSwipe in fullscreen.

import { useEffect, useCallback, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { thumbUrl } from '../../lib/image-url';
import { useDragScroll } from '../../lib/use-swipe';

interface ImageItem {
  src: string;
  alt: string;
}

interface Props {
  images: ImageItem[];
  title?: string;
}

export default function ImageLightbox({ images, title }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    duration: 22,       // slide-transition speed (lower = snappier)
    dragFree: false,
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbsRef = useDragScroll<HTMLDivElement>();
  const galleryRootRef = useRef<HTMLDivElement>(null);

  // Sync state when Embla scrolls
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  // Auto-scroll the active thumbnail into view *within the thumb strip*.
  // Skip the very first mount — `block: 'nearest'` falls back to scrolling
  // the whole page when the gallery is off-screen on first paint, which
  // dragged visitors mid-page on load. After that, only the horizontal
  // strip scroll matters (`inline: 'center'`), so we use `block: 'nearest'`
  // and a `start: 0` sentinel to skip the initial run.
  const skipInitialScroll = useRef(true);
  useEffect(() => {
    if (skipInitialScroll.current) { skipInitialScroll.current = false; return; }
    const root = galleryRootRef.current;
    if (!root) return;
    const activeThumb = root.querySelector<HTMLElement>('.gallery-thumb--active');
    activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedIndex]);

  // Tell the global PhotoSwipe init to scan this gallery after hydration.
  useEffect(() => {
    document.dispatchEvent(new Event('pswp:refresh'));
  }, []);

  if (!images || images.length === 0) return null;

  return (
    <>
      {title && <p className="gallery-section-label">{title}</p>}

      <div className="gallery-viewer" ref={galleryRootRef} data-pswp-gallery>

        {/* Embla viewport */}
        <div className="embla-viewport" ref={emblaRef}>
          <div className="embla-container">
            {images.map((img, i) => (
              <a
                key={img.src + i}
                href={img.src}
                data-pswp-caption={img.alt || ''}
                className="embla-slide gallery-main"
                aria-label={img.alt || `Image ${i + 1}`}
              >
                <img
                  className="gallery-main-img"
                  src={thumbUrl(img.src, 'large')}
                  alt={img.alt}
                  draggable={false}
                  onError={(e) => { (e.target as HTMLImageElement).src = img.src; }}
                />
                {i === 0 && <span className="gallery-zoom-hint" aria-hidden="true">⊕</span>}
              </a>
            ))}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-nav gallery-nav--prev"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollPrev(); }}
                aria-label="Previous image"
              >‹</button>
              <button
                type="button"
                className="gallery-nav gallery-nav--next"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollNext(); }}
                aria-label="Next image"
              >›</button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="gallery-thumbs" role="list" aria-label="Image thumbnails" ref={thumbsRef} style={{ cursor: 'grab' }}>
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`gallery-thumb${i === selectedIndex ? ' gallery-thumb--active' : ''}`}
                onClick={() => scrollTo(i)}
                aria-label={img.alt || `Image ${i + 1}`}
                aria-current={i === selectedIndex}
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
    </>
  );
}
