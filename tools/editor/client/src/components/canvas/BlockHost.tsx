import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';
import { blockRegistry } from '../../lib/block-registry.ts';
import { blockComponentMap } from '../blocks/index.tsx';
import type { BlockData } from '../../types/blocks.ts';

interface BlockHostProps {
  block: BlockData;
  isNested?: boolean;
}

export function BlockHost({ block, isNested = false }: BlockHostProps) {
  const [isHovered, setIsHovered] = useState(false);
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);
  const selectBlock = useUIStore((s) => s.selectBlock);
  const removeBlock = useDocumentStore((s) => s.removeBlock);
  const duplicateBlock = useDocumentStore((s) => s.duplicateBlock);

  const isSelected = selectedBlockId === block.id;
  const entry = blockRegistry.get(block.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'canvas', blockType: block.type },
  });

  const transformStyle = CSS.Transform.toString(transform);

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    border: isSelected
      ? '1px solid var(--color-accent)'
      : isHovered
      ? '1px solid var(--color-border)'
      : '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: 'default',
    transform: transformStyle,
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--color-bg)',
  };

  const dragHandleStyle: React.CSSProperties = {
    position: 'absolute',
    left: -20,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-faint)',
    fontSize: 14,
    lineHeight: 1,
    cursor: 'grab',
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.1s',
    padding: '4px 2px',
    userSelect: 'none',
  };

  const typeBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -1,
    left: 0,
    fontSize: 9,
    color: 'var(--color-text-faint)',
    background: 'var(--color-surface)',
    padding: '1px 5px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    opacity: isHovered && !isSelected ? 1 : 0,
    transition: 'opacity 0.1s',
    pointerEvents: 'none',
    borderBottomRightRadius: 2,
    zIndex: 1,
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 4,
    right: 4,
    display: 'flex',
    gap: 2,
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.1s',
    zIndex: 10,
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    borderRadius: 'var(--radius-sm)',
    width: 22,
    height: 22,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  };

  const BlockComponent = blockComponentMap[block.type];

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    selectBlock(block.id);
  }

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Drag handle */}
      <div
        style={dragHandleStyle}
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Block type badge */}
      <div style={typeBadgeStyle}>{entry?.label ?? block.type}</div>

      {/* Hover toolbar */}
      <div style={toolbarStyle}>
        <button
          style={iconBtnStyle}
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            duplicateBlock(block.id);
          }}
        >
          ⧉
        </button>
        <button
          style={{ ...iconBtnStyle, color: 'var(--color-accent)' }}
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
            if (selectedBlockId === block.id) selectBlock(null);
          }}
        >
          ✕
        </button>
      </div>

      {/* Block content */}
      <div style={{ overflow: 'hidden' }}>
        {BlockComponent ? (
          <BlockComponent block={block} />
        ) : (
          <div style={{ padding: 12, color: 'var(--color-text-faint)', fontSize: 12 }}>
            Unknown block: {block.type}
          </div>
        )}
      </div>
    </div>
  );
}
