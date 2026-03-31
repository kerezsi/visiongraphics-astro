import React from 'react';
import type { BlockData, NotableGridProps } from '../../types/blocks.ts';

export default function NotableGridBlock({ block }: { block: BlockData & { type: 'notable-grid'; props: NotableGridProps } }) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Notable grid — {items.length} item{items.length !== 1 ? 's' : ''}
      </div>
      <div className="notable-grid" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="notable-item"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '5px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span className="notable-name" style={{ fontSize: 12, color: 'var(--color-text)' }}>{item.name}</span>
            <span className="notable-year" style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{item.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
