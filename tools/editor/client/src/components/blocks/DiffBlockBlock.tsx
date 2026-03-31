import React from 'react';
import type { BlockData, DiffBlockProps } from '../../types/blocks.ts';

export default function DiffBlockBlock({ block }: { block: BlockData & { type: 'diff-block'; props: DiffBlockProps } }) {
  const { label, text } = block.props;

  return (
    <div
      style={{
        margin: '4px 16px',
        padding: '10px 14px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
      className="diff-block"
    >
      <span style={{ color: 'var(--color-accent)', fontSize: 14, marginTop: 1, flexShrink: 0 }}>±</span>
      <div>
        <p
          className="diff-label"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: '0 0 4px',
          }}
        >
          {label}
        </p>
        <p
          className="body-text"
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
