import React from 'react';
import type { BlockData, TimelineTableProps } from '../../types/blocks.ts';

export default function TimelineTableBlock({ block }: { block: BlockData & { type: 'timeline-table'; props: TimelineTableProps } }) {
  const rows = Array.isArray(block.props.rows) ? block.props.rows : [];

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Timeline — {rows.length} row{rows.length !== 1 ? 's' : ''}
      </div>
      <div className="timeline-table" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="timeline-row"
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'baseline',
              padding: '6px 0',
              borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span className="timeline-scope" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', minWidth: 100, flexShrink: 0 }}>
              {row.scope}
            </span>
            <span className="timeline-time" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {row.deliverables}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
