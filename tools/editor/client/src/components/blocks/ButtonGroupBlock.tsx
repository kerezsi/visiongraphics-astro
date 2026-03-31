import React from 'react';
import type { BlockData, ButtonGroupProps } from '../../types/blocks.ts';

const variantStyles: Record<string, React.CSSProperties> = {
  'btn-primary': {
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
  },
  'btn-secondary': {
    background: 'none',
    color: 'var(--color-text)',
    border: '1px solid var(--color-text)',
  },
  'btn-ghost': {
    background: 'none',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
  },
};

export default function ButtonGroupBlock({ block }: { block: BlockData & { type: 'button-group'; props: ButtonGroupProps } }) {
  const { buttons } = block.props;

  return (
    <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {buttons.map((btn, i) => (
        <a
          key={i}
          href={btn.href}
          className={`btn ${btn.variant}`}
          onClick={(e) => e.preventDefault()}
          style={{
            ...variantStyles[btn.variant],
            borderRadius: 'var(--radius-sm)',
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-block',
            cursor: 'default',
            letterSpacing: '0.02em',
          }}
        >
          {btn.label}
        </a>
      ))}
    </div>
  );
}
