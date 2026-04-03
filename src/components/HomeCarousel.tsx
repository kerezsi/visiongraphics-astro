// src/components/HomeCarousel.tsx
// Auto-play full-width featured project carousel — React island

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CarouselSlide {
  slug:      string;
  title:     string;
  year:      number;
  coverImage: string;
  location?: string;
}

interface Props {
  slides: CarouselSlide[];
}

export default function HomeCarousel({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  // Randomize starting slide after hydration (avoids SSR mismatch)
  useEffect(() => {
    setCurrent(Math.floor(Math.random() * slides.length));
  }, []);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(next, 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, next]);

  if (slides.length === 0) return null;
  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden bg-surface-2"
      style={{ height: 'clamp(380px, 65vh, 900px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — positioned/faded via components.css (.hc-slide / .hc-slide.active) */}
      {slides.map((s, i) => (
        <div
          key={s.slug}
          className={i === current ? 'hc-slide active' : 'hc-slide'}
          aria-hidden={i !== current}
        >
          <img
            src={s.coverImage}
            alt={s.title}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      ))}

      {/* Bottom overlay with project info */}
      <a
        href={`/portfolio/${slide.slug}/`}
        className="absolute inset-0 flex items-end no-underline cursor-pointer transition-[background] duration-300"
        style={{ background: 'linear-gradient(to top, rgba(10,10,18,0.88) 0%, rgba(10,10,18,0.25) 45%, transparent 70%)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to top, rgba(10,10,18,0.92) 0%, rgba(10,10,18,0.3) 45%, transparent 70%)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(to top, rgba(10,10,18,0.88) 0%, rgba(10,10,18,0.25) 45%, transparent 70%)'; }}
        tabIndex={0}
      >
        {/* hc-info padding uses clamp() — applied via components.css */}
        <div className="hc-info flex flex-col gap-[0.4rem]">
          <span className="font-mono text-tiny text-faint tracking-[0.12em]">
            {slide.year}
          </span>
          {/* hc-title font-size uses clamp() — applied via components.css */}
          <h3 className="hc-title font-display font-light text-content tracking-tight-2 leading-[1.1] m-0 transition-colors duration-200">
            {slide.title}
          </h3>
          {slide.location && (
            <span className="text-small text-muted">
              {slide.location}
            </span>
          )}
        </div>
      </a>

      {/* Arrows — sizing via components.css (.hc-arrow / .hc-arrow--prev / .hc-arrow--next) */}
      <button
        className="hc-arrow hc-arrow--prev absolute top-1/2 -translate-y-1/2 border rounded-full flex items-center justify-center cursor-pointer z-10 transition-[background,border-color,color] duration-200"
        style={{
          background:   'rgba(10,10,18,0.5)',
          borderColor:  'rgba(255,255,255,0.12)',
          color:        'rgba(255,255,255,0.7)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background   = 'rgba(10,10,18,0.85)';
          el.style.borderColor  = 'rgba(255,255,255,0.35)';
          el.style.color        = '#fff';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background   = 'rgba(10,10,18,0.5)';
          el.style.borderColor  = 'rgba(255,255,255,0.12)';
          el.style.color        = 'rgba(255,255,255,0.7)';
        }}
        onClick={prev}
        aria-label="Previous project"
      >
        <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button
        className="hc-arrow hc-arrow--next absolute top-1/2 -translate-y-1/2 border rounded-full flex items-center justify-center cursor-pointer z-10 transition-[background,border-color,color] duration-200"
        style={{
          background:   'rgba(10,10,18,0.5)',
          borderColor:  'rgba(255,255,255,0.12)',
          color:        'rgba(255,255,255,0.7)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background   = 'rgba(10,10,18,0.85)';
          el.style.borderColor  = 'rgba(255,255,255,0.35)';
          el.style.color        = '#fff';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background   = 'rgba(10,10,18,0.5)';
          el.style.borderColor  = 'rgba(255,255,255,0.12)';
          el.style.color        = 'rgba(255,255,255,0.7)';
        }}
        onClick={next}
        aria-label="Next project"
      >
        <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dots — sized/styled via components.css (.hc-dot / .hc-dot.active) */}
      {/* hc-dots right offset uses clamp() — applied via components.css */}
      <div
        className="hc-dots absolute bottom-4 flex gap-[0.4rem] z-10"
        role="tablist"
        aria-label="Carousel slides"
      >
        {slides.map((s, i) => (
          <button
            key={s.slug}
            role="tab"
            aria-selected={i === current}
            className={i === current ? 'hc-dot active' : 'hc-dot'}
            onClick={() => setCurrent(i)}
            aria-label={s.title}
          />
        ))}
      </div>
    </div>
  );
}
