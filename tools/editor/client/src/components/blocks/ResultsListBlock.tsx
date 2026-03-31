import React from 'react';
import type { BlockData, ResultsListProps } from '../../types/blocks.ts';

export default function ResultsListBlock({ block }: { block: BlockData & { type: 'results-list'; props: ResultsListProps } }) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Results list — {items.length} item{items.length !== 1 ? 's' : ''}
      </div>
      <ul className="results-list" style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: 'var(--color-accent)', marginTop: 1, flexShrink: 0 }}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
