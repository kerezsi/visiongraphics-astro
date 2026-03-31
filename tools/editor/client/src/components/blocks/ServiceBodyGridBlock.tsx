import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BlockData, ServiceBodyGridProps } from '../../types/blocks.ts';
import { BlockHost } from '../canvas/BlockHost.tsx';

interface Props {
  block: BlockData & { type: 'service-body-grid'; props: ServiceBodyGridProps };
  isNested?: boolean;
}

function GridZone({ label, blocks, flex }: { label: string; blocks: BlockData[]; flex: number }) {
  return (
    <div style={{ flex, minWidth: 0 }}>
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

export default function ServiceBodyGridBlock({ block }: Props) {
  const { main, sidebar } = block.props;

  return (
    <div style={{ padding: '6px 8px' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <GridZone label="Main" blocks={main} flex={3} />
        <GridZone label="Sidebar" blocks={sidebar} flex={1} />
      </div>
    </div>
  );
}
