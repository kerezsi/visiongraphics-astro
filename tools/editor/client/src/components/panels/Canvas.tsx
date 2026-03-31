import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDocumentStore, createDefaultBlock } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import { BlockHost } from '../canvas/BlockHost.tsx';
import { blockRegistry } from '../../lib/block-registry.ts';
import type { BlockType } from '../../types/blocks.ts';


const canvasStyle: React.CSSProperties = {
  flex: 1,
  background: '#1e1e1e',
  overflowY: 'auto',
  padding: '2rem',
  minWidth: 0,
};

const canvasInnerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: 'var(--color-text-faint)',
  fontSize: 13,
  lineHeight: 2,
};

const insertionLineStyle: React.CSSProperties = {
  height: 2,
  background: 'var(--color-accent)',
  borderRadius: 1,
  margin: '1px 0',
  pointerEvents: 'none',
};

// Droppable wrapper for the whole canvas area
function CanvasDropArea({
  children,
  isEmpty,
}: {
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-root' });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...canvasInnerStyle,
        minHeight: 200,
        outline: isOver && isEmpty ? '2px dashed var(--color-accent)' : undefined,
        borderRadius: isOver && isEmpty ? 4 : undefined,
        transition: 'outline 0.1s',
      }}
    >
      {children}
    </div>
  );
}

export function Canvas() {
  const blocks = useDocumentStore((s) => s.blocks);
  const addBlock = useDocumentStore((s) => s.addBlock);
  const moveBlock = useDocumentStore((s) => s.moveBlock);
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);
  const selectBlock = useUIStore((s) => s.selectBlock);

  const [draggingFromPalette, setDraggingFromPalette] = useState(false);
  const [paletteOverBlockId, setPaletteOverBlockId] = useState<string | null>(null);
  const [paletteBlockType, setPaletteBlockType] = useState<BlockType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Event handlers — defined before any conditional return (arrow functions avoid hoisting ambiguity)
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as Record<string, unknown> | undefined;
    if (data?.source === 'palette') {
      setDraggingFromPalette(true);
      setPaletteBlockType((data.blockType as BlockType) ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const data = event.active.data.current as Record<string, unknown> | undefined;
    if (data?.source !== 'palette') return;
    const overId = event.over?.id as string | undefined;
    setPaletteOverBlockId(overId && overId !== 'canvas-root' ? overId : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingFromPalette(false);
    setPaletteOverBlockId(null);
    setPaletteBlockType(null);

    if (!over) return;

    const activeData = active.data.current as Record<string, unknown> | undefined;

    if (activeData?.source === 'palette') {
      const blockType = activeData.blockType as BlockType;
      const newBlock = createDefaultBlock(blockType);
      const overId = over.id as string;

      if (overId === 'canvas-root') {
        addBlock(newBlock, selectedBlockId ?? undefined);
      } else {
        addBlock(newBlock, overId);
      }
    } else {
      if (active.id !== over.id) {
        moveBlock(active.id as string, over.id as string);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  // Build the overlay label for the dragged palette item
  const overlayLabel = paletteBlockType
    ? (blockRegistry.get(paletteBlockType)?.label ?? paletteBlockType)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={canvasStyle} onClick={handleCanvasClick}>
        <CanvasDropArea isEmpty={blocks.length === 0}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <React.Fragment key={block.id}>
                <BlockHost block={block} />
                {/* Insertion line AFTER this block — shows where the dropped block will land */}
                {draggingFromPalette && paletteOverBlockId === block.id && (
                  <div style={insertionLineStyle} />
                )}
              </React.Fragment>
            ))}
          </SortableContext>

          {blocks.length === 0 && (
            <div style={emptyStyle}>
              <p>Drag blocks from the palette to start building your page.</p>
              <p>
                Or use{' '}
                <strong style={{ color: 'var(--color-text-muted)' }}>Import MD</strong> to load an
                LLM-generated file.
              </p>
            </div>
          )}
        </CanvasDropArea>
      </div>

      {/* Floating ghost label while dragging from palette */}
      <DragOverlay dropAnimation={null}>
        {draggingFromPalette && overlayLabel ? (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: 12,
              color: 'var(--color-accent)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            + {overlayLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
