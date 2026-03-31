import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BlockData, SectionContainerProps } from '../../types/blocks.ts';
import { BlockHost } from '../canvas/BlockHost.tsx';

interface Props {
  block: BlockData & { type: 'section-container'; props: SectionContainerProps };
  isNested?: boolean;
}

export default function SectionContainerBlock({ block, isNested = false }: Props) {
  const { children } = block.props;

  return (
    <div
      style={{
        padding: 8,
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        margin: '4px 8px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
          paddingLeft: 4,
        }}
      >
        section.container — {children.length} block{children.length !== 1 ? 's' : ''}
      </div>

      <SortableContext items={children.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {children.map((child) => (
          <BlockHost key={child.id} block={child} isNested />
        ))}
      </SortableContext>

      {children.length === 0 && (
        <div
          style={{
            padding: '16px 8px',
            textAlign: 'center',
            color: 'var(--color-text-faint)',
            fontSize: 11,
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Drop blocks here
        </div>
      )}
    </div>
  );
}
