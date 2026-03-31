import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BlockData, TwoColProps } from '../../types/blocks.ts';
import { BlockHost } from '../canvas/BlockHost.tsx';

interface Props {
  block: BlockData & { type: 'two-col'; props: TwoColProps };
  isNested?: boolean;
}

function ColZone({ label, blocks }: { label: string; blocks: BlockData[] }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
          paddingLeft: 2,
        }}
      >
        {label} — {blocks.length} block{blocks.length !== 1 ? 's' : ''}
      </div>
      <div
        style={{
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 4,
          minHeight: 60,
          background: 'var(--color-surface-2)',
        }}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((child) => (
            <BlockHost key={child.id} block={child} isNested />
          ))}
        </SortableContext>
        {blocks.length === 0 && (
          <div
            style={{
              padding: '12px 8px',
              textAlign: 'center',
              color: 'var(--color-text-faint)',
              fontSize: 11,
            }}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function TwoColBlock({ block }: Props) {
  const { left, right } = block.props;

  return (
    <div style={{ padding: '6px 8px' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <ColZone label="Left" blocks={left} />
        <ColZone label="Right" blocks={right} />
      </div>
    </div>
  );
}
