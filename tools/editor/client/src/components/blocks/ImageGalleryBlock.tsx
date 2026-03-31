import React, { useRef, useState } from 'react';
import type { BlockData, ImageGalleryProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';

// ─── Drag data keys ────────────────────────────────────────────────────────
// These MIME-style keys carry image data between blocks via native HTML5 drag.
export const DND_IMAGE_SRC   = 'text/x-vg-image-src';
export const DND_IMAGE_ALT   = 'text/x-vg-image-alt';
export const DND_IMAGE_BLOCK = 'text/x-vg-image-block'; // source block.id
export const DND_IMAGE_IDX   = 'text/x-vg-image-idx';   // source index (int string)

// ─── Helper used by TARGET blocks to read dragged image URL ───────────────
export function getDraggedImageSrc(e: React.DragEvent): string | null {
  return e.dataTransfer.getData(DND_IMAGE_SRC) || null;
}

// ─── Single sortable thumbnail ─────────────────────────────────────────────

interface ThumbProps {
  img: { src: string; alt: string };
  index: number;
  blockId: string;
  insertBefore: boolean; // show insertion line to the LEFT of this thumb
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
}

function Thumb({ img, index, blockId: _blockId, insertBefore, onRemove, onDragStart, onDragOver: onDragOverThumb, onDrop: onDropThumb, onDragLeave }: ThumbProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOverThumb(e, index); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropThumb(e, index); }}
      onDragLeave={(e) => { e.stopPropagation(); onDragLeave(); }}
      style={{
        position: 'relative',
        flexShrink: 0,
        cursor: 'grab',
        borderLeft: insertBefore ? '3px solid var(--color-accent)' : '3px solid transparent',
        borderRadius: 'var(--radius-sm)',
        transition: 'border-color 0.1s',
      }}
    >
      <img
        src={img.src}
        alt={img.alt}
        draggable={false} // img inside handles its own drag via parent div
        style={{
          width: 80,
          height: 60,
          objectFit: 'cover',
          borderRadius: 'var(--radius-sm)',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        title="Remove"
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          background: 'rgba(0,0,0,0.7)',
          border: 'none',
          color: '#fff',
          borderRadius: '50%',
          width: 16,
          height: 16,
          fontSize: 9,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          padding: 0,
          zIndex: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main block ────────────────────────────────────────────────────────────

export default function ImageGalleryBlock({ block }: { block: BlockData & { type: 'image-gallery'; props: ImageGalleryProps } }) {
  const images = Array.isArray(block.props.images) ? block.props.images : [];
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType    = useDocumentStore((s) => s.pageType);
  const slug        = useDocumentStore((s) => s.slug);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Index at which the insertion indicator should appear (insert BEFORE this index)
  const [insertAt, setInsertAt] = useState<number | null>(null);

  // ── File upload ──────────────────────────────────────────────────────────

  async function handleFiles(files: FileList) {
    const uploaded: { src: string; alt: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const result = await api.uploadImage(file, pageType, slug);
        uploaded.push({ src: result.url, alt: file.name.replace(/\.[^.]+$/, '') });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    if (uploaded.length > 0) {
      updateBlock(block.id, { images: [...images, ...uploaded] });
    }
  }

  function removeImage(index: number) {
    updateBlock(block.id, { images: images.filter((_, i) => i !== index) });
  }

  // ── Thumbnail drag: start ────────────────────────────────────────────────

  function handleThumbDragStart(e: React.DragEvent, index: number) {
    e.stopPropagation(); // don't fire block-level dnd-kit pointer events
    const img = images[index];
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData(DND_IMAGE_SRC,   img.src);
    e.dataTransfer.setData(DND_IMAGE_ALT,   img.alt ?? '');
    e.dataTransfer.setData(DND_IMAGE_BLOCK, block.id);
    e.dataTransfer.setData(DND_IMAGE_IDX,   String(index));
    // Use the img element itself as drag ghost
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, 40, 30);
  }

  // ── Thumbnail drag: over ─────────────────────────────────────────────────
  // Decide insertion position based on which horizontal half the pointer is over.

  function handleThumbDragOver(e: React.DragEvent, index: number) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    // Hover left half → insert before index; right half → insert after
    setInsertAt(e.clientX < midX ? index : index + 1);
  }

  // ── Thumbnail drag: drop ─────────────────────────────────────────────────

  function handleThumbDrop(e: React.DragEvent, _targetIndex: number) {
    e.preventDefault();
    const srcBlockId = e.dataTransfer.getData(DND_IMAGE_BLOCK);
    const srcIdx     = parseInt(e.dataTransfer.getData(DND_IMAGE_IDX), 10);
    const imgSrc     = e.dataTransfer.getData(DND_IMAGE_SRC);
    const imgAlt     = e.dataTransfer.getData(DND_IMAGE_ALT) || '';
    const targetPos  = insertAt ?? images.length;

    setInsertAt(null);

    if (!imgSrc) return;

    if (srcBlockId === block.id && !isNaN(srcIdx)) {
      // ── Same gallery → reorder ──────────────────────────────────────────
      if (srcIdx === targetPos || srcIdx + 1 === targetPos) return; // no-op
      const newImages = [...images];
      const [moved] = newImages.splice(srcIdx, 1);
      // After removing the source, adjust targetPos if needed
      const adjustedPos = srcIdx < targetPos ? targetPos - 1 : targetPos;
      newImages.splice(adjustedPos, 0, moved);
      updateBlock(block.id, { images: newImages });
    } else {
      // ── Different block → insert a copy ────────────────────────────────
      const newImages = [...images];
      newImages.splice(targetPos, 0, { src: imgSrc, alt: imgAlt });
      updateBlock(block.id, { images: newImages });
    }
  }

  // ── Drop zone (the "+" button area): appends files OR gallery images ─────

  async function handleZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setInsertAt(null);

    // Accept image URL dragged from another block
    const imgSrc = e.dataTransfer.getData(DND_IMAGE_SRC);
    if (imgSrc) {
      const imgAlt = e.dataTransfer.getData(DND_IMAGE_ALT) || '';
      updateBlock(block.id, { images: [...images, { src: imgSrc, alt: imgAlt }] });
      return;
    }

    // Accept file drops
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragLeave() {
    // Only clear if leaving the row entirely (not just moving between thumbs).
    // We use setTimeout so that dragover on the next thumb fires first.
    setTimeout(() => setInsertAt(null), 50);
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const dropZoneStyle: React.CSSProperties = {
    width: 80,
    height: 60,
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-faint)',
    fontSize: 20,
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div style={{ padding: '8px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Gallery — {images.length} image{images.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-faint)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {images.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            alignItems: 'center',
          }}
        >
          {images.map((img, i) => (
            <Thumb
              key={`${i}-${img.src}`}
              img={img}
              index={i}
              blockId={block.id}
              insertBefore={insertAt === i}
              onRemove={() => removeImage(i)}
              onDragStart={handleThumbDragStart}
              onDragOver={handleThumbDragOver}
              onDrop={handleThumbDrop}
              onDragLeave={handleDragLeave}
            />
          ))}

          {/* Trailing insertion indicator — after last thumb */}
          {insertAt === images.length && (
            <div style={{ width: 3, height: 60, background: 'var(--color-accent)', borderRadius: 2, flexShrink: 0 }} />
          )}

          {/* Drop zone / add button */}
          <div
            onDrop={handleZoneDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={dropZoneStyle}
          >
            +
          </div>
        </div>
      ) : (
        <div
          onDrop={handleZoneDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-faint)',
            fontSize: 12,
          }}
        >
          Drop images here or click to add
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        style={{ display: 'none' }}
      />
    </div>
  );
}
