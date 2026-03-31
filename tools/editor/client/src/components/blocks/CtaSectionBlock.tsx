import React from 'react';
import type { BlockData, CtaSectionProps } from '../../types/blocks.ts';

export default function CtaSectionBlock({ block }: { block: BlockData & { type: 'cta-section'; props: CtaSectionProps } }) {
  const { heading, subtext, buttonLabel, buttonHref } = block.props;

  return (
    <section
      className="about-cta"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '24px 16px',
      }}
    >
      <div
        className="container about-cta-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            className="cta-heading"
            style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}
          >
            {heading}
          </h2>
          <p
            className="cta-sub"
            style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}
          >
            {subtext}
          </p>
        </div>
        <a
          href={buttonHref}
          className="btn btn-primary"
          onClick={(e) => e.preventDefault()}
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
            display: 'inline-block',
          }}
        >
          {buttonLabel}
        </a>
      </div>
    </section>
  );
}
