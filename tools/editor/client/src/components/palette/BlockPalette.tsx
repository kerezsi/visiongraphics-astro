import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { blocksByGroup } from '../../lib/block-registry.ts';
import type { BlockRegistryEntry } from '../../types/blocks.ts';
import { useDocumentStore, createDefaultBlock } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import type { BlockType } from '../../types/blocks.ts';

const GROUP_LABELS: Record<string, string> = {
  'mdx-component': 'MDX Components',
  'prose': 'Prose',
};

const GROUP_ORDER = ['mdx-component', 'prose'];

function PaletteItem({ entry }: { entry: BlockRegistryEntry }) {
  const addBlock = useDocumentStore((s) => s.addBlock);
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${entry.type}`,
    data: { source: 'palette', blockType: entry.type },
  });

  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'grab',
    fontSize: 11,
    color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)',
    background: isDragging ? 'var(--color-surface-2)' : 'none',
    transition: 'background 0.1s, color 0.1s',
    userSelect: 'none',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => {
        const block = createDefaultBlock(entry.type as BlockType);
        addBlock(block, selectedBlockId ?? undefined);
      }}
      title={entry.description ?? entry.label}
    >
      <span
        style={{
          fontSize: 13,
          width: 18,
          textAlign: 'center',
          flexShrink: 0,
          opacity: 0.8,
        }}
      >
        {entry.icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.label}
      </span>
    </div>
  );
}

export function BlockPalette() {
  const groups = blocksByGroup();

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}
    >
      <div
        style={{
          padding: '4px 10px 6px',
          fontSize: 10,
          color: 'var(--color-text-faint)',
          lineHeight: 1.4,
        }}
      >
        Drag to position · double-click to insert after selection
      </div>

      {GROUP_ORDER.filter((g) => groups[g]).map((groupKey) => (
        <div key={groupKey}>
          <div
            style={{
              padding: '6px 10px 3px',
              fontSize: 9,
              color: 'var(--color-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              marginTop: 4,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {GROUP_LABELS[groupKey] ?? groupKey}
          </div>
          {groups[groupKey].map((entry) => (
            <PaletteItem key={entry.type} entry={entry} />
          ))}
        </div>
      ))}
    </div>
  );
}
