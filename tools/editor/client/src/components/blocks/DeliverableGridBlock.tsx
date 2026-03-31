import React from 'react';
import type { BlockData, DeliverableGridProps } from '../../types/blocks.ts';

export default function DeliverableGridBlock({ block }: { block: BlockData & { type: 'deliverable-grid'; props: DeliverableGridProps } }) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  const columns = block.props.columns ?? 2;

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Deliverable grid — {items.length} item{items.length !== 1 ? 's' : ''} · {columns} col
      </div>
      <div
        className="deliverable-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 8,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="deliverable-card"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}
          >
            <div className="deliverable-title" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
              {item.title}
            </div>
            <div className="deliverable-desc" style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
