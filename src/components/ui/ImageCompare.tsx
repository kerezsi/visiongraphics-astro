import { useState, useRef, useCallback, useEffect } from 'react';

export interface ImageCompareProps {
  /** The "before" image — shown on the left */
  before: { src: string; alt: string; label?: string };
  /** The "after" image — revealed on the right */
  after: { src: string; alt: string; label?: string };
  /** Initial divider position as 0–100 percentage. Default: 50 */
  initialPosition?: number;
  /** CSS aspect-ratio string. Default: '16 / 9' */
  aspectRatio?: string;
  className?: string;
}

export default function ImageCompare({
  before,
  after,
  initialPosition = 50,
  aspectRatio = '16 / 9',
  className = '',
}: ImageCompareProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const posFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return position;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, [position]);

  // ── Mouse ──────────────────────────────────────────────────────────
  const onHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setPosition(posFromClientX(e.clientX));
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, posFromClientX]);

  // ── Touch ──────────────────────────────────────────────────────────
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    setPosition(posFromClientX(e.touches[0].clientX));
  };

  // ── Keyboard (when handle is focused) ─────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  setPosition(p => clamp(p - 2));
    if (e.key === 'ArrowRight') setPosition(p => clamp(p + 2));
    if (e.key === 'Home')       setPosition(0);
    if (e.key === 'End')        setPosition(100);
  };

  // ── Click anywhere on container to jump ───────────────────────────
  const onContainerClick = (e: React.MouseEvent) => {
    // Ignore if clicking the handle itself (it stops propagation)
    setPosition(posFromClientX(e.clientX));
  };

  return (
    <div
      ref={containerRef}
      className={`image-compare${className ? ` ${className}` : ''}`}
      style={{
        aspectRatio,
        userSelect: isDragging ? 'none' : undefined,
        cursor: isDragging ? 'col-resize' : undefined,
      }}
      onClick={onContainerClick}
      aria-label="Image comparison — drag the handle to compare before and after"
    >
      {/* ── BEFORE — full-size background ── */}
      <img
        className="image-compare__img image-compare__img--before"
        src={before.src}
        alt={before.alt}
        draggable={false}
      />

      {/* ── AFTER — clipped to reveal from left ── */}
      <div
        className="image-compare__after-wrap"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        aria-hidden="true"
      >
        <img
          className="image-compare__img image-compare__img--after"
          src={after.src}
          alt={after.alt}
          draggable={false}
        />
      </div>

      {/* ── HANDLE ── */}
      <div
        className="image-compare__handle"
        style={{ left: `${position}%` }}
        role="slider"
        aria-label="Comparison divider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onMouseDown={onHandleMouseDown}
        onTouchMove={onTouchMove}
        onTouchStart={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        onClick={e => e.stopPropagation()}
      >
        <div className="image-compare__line" />
        <div className="image-compare__grip" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M6 4L2 9l4 5M12 4l4 5-4 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── LABELS ── */}
      {before.label && (
        <span className="image-compare__label image-compare__label--before" aria-hidden="true">
          {before.label}
        </span>
      )}
      {after.label && (
        <span className="image-compare__label image-compare__label--after" aria-hidden="true">
          {after.label}
        </span>
      )}
    </div>
  );
}
