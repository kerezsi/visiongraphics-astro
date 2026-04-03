// src/components/services/ServicesTabs.tsx
// Vertical sidebar tabbed layout for services index — React island

import { useState } from 'react';

export interface ServiceItem {
  slug:        string;
  title:       string;
  tagline?:    string;
  description: string;
}

interface Props {
  services: ServiceItem[];
}

export default function ServicesTabs({ services }: Props) {
  const [active, setActive] = useState(0);
  const svc = services[active];

  if (!svc) return null;

  return (
    <div className="st-root grid min-h-[420px] border border-line bg-surface"
         style={{ gridTemplateColumns: '280px 1fr' }}>

      {/* Sidebar */}
      <nav className="st-sidebar flex flex-col overflow-y-auto border-r border-line"
           aria-label="Services">
        {services.map((s, i) => (
          <button
            key={s.slug}
            className={[
              'st-tab relative flex items-baseline gap-3 px-5 py-[1.1rem]',
              'bg-transparent border-none border-b border-line',
              'text-left cursor-pointer transition-colors duration-[180ms]',
              i === active ? 'active bg-surface-2' : 'hover:bg-surface-2',
            ].join(' ')}
            onClick={() => setActive(i)}
            aria-selected={i === active}
            role="tab"
          >
            <span className="st-tab-n font-mono text-tiny text-faint shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="st-tab-title font-body text-small font-medium text-muted leading-[1.3] transition-colors duration-[180ms]">
              {s.title}
            </span>
          </button>
        ))}
      </nav>

      {/* Content panel */}
      <div className="st-panel flex flex-col justify-center"
           style={{ padding: 'clamp(2rem, 4vw, 3.5rem) clamp(2rem, 5vw, 4rem)' }}
           role="tabpanel"
           key={svc.slug}>

        {svc.tagline && (
          <p className="font-body text-tiny font-medium tracking-[0.15em] uppercase text-accent mb-[0.6rem]">
            {svc.tagline}
          </p>
        )}

        <h2 className="font-display text-h4 font-light text-content tracking-tight-2 leading-[1.1] mb-5">
          {svc.title}
        </h2>

        <p className="text-body text-muted leading-[1.75] max-w-[60ch] mb-8">
          {svc.description}
        </p>

        <a
          href={`/services/${svc.slug}/`}
          className="st-link inline-flex items-center gap-[0.6rem] font-body text-small font-medium text-accent no-underline transition-[gap,color] duration-200 pb-[0.15rem] w-fit"
          style={{ borderBottom: '1px solid rgba(218, 19, 19, 0.3)' }}
        >
          Explore this service
          <svg viewBox="0 0 20 12" fill="none" aria-hidden="true"
               className="w-[1.1rem] h-[0.7rem] shrink-0">
            <path d="M1 6h17M13 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
