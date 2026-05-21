import React, { useRef, useState } from 'react';
import type { BlockData, ImageCompareProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';
import { getDraggedImageSrc } from './ImageGalleryBlock.tsx';

function ImageSlot({
  label,
  src,
  onUpload,
}: {
  label: string;
  src: string;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug     = useDocumentStore((s) => s.slug);
  const [isOver, setIsOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      onUpload(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    // Accept URL dragged from a gallery block
    const galleryUrl = getDraggedImageSrc(e);
    if (galleryUrl) {
      onUpload(galleryUrl);
      return;
    }
    // Fall back to file upload
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const overlayStyle: React.CSSProperties = isOver ? {
    position: 'absolute',
    inset: 0,
    borderRadius: 'var(--radius-sm)',
    border: '2px dashed var(--color-accent)',
    background: 'rgba(218,19,19,0.08)',
    pointerEvents: 'none',
    zIndex: 3,
  } : {};

  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 9,
        color: 'var(--color-text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 4,
        fontWeight: 600,
      }}>
        {label}
      </div>

      {src ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
          onDragLeave={() => setIsOver(false)}
          style={{ position: 'relative' }}
        >
          {isOver && <div style={overlayStyle} />}
          <img
            src={src}
            alt={label}
            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }}
          />
          <button
            onClick={() => onUpload('')}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 18, height: 18, fontSize: 9,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 0, zIndex: 4,
            }}
          >✕</button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
          onDragLeave={() => setIsOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            height: 100,
            border: `2px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: isOver ? 'rgba(218,19,19,0.06)' : 'var(--color-surface-2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isOver ? 'var(--color-accent)' : 'var(--color-text-faint)',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'border-color 0.1s, background 0.1s',
          }}
        >
          Drop or click
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default function ImageCompareBlock({ block }: { block: BlockData & { type: 'image-compare'; props: ImageCompareProps } }) {
  const { before, after, beforeAlt, afterAlt } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);

  // Swap the two images (and their alts) atomically.  Useful when the
  // before/after pair was inserted in the wrong direction — the rendered
  // <ImageCompare> shows `before` on the right (AFTER label) and `after`
  // on the left (BEFORE label), which is the inverse of the prop names,
  // so users routinely need to flip the pair.
  function handleSwap() {
    updateBlock(block.id, {
      before:    after    ?? '',
      after:     before   ?? '',
      beforeAlt: afterAlt ?? '',
      afterAlt:  beforeAlt ?? '',
    });
  }

  const canSwap = Boolean(before || after);

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Image Compare
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <ImageSlot label="Before" src={before} onUpload={(url) => updateBlock(block.id, { before: url })} />

        {/* Swap button — sits between the two slots, replacing the divider line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingTop: 14 }}>
          <button
            onClick={handleSwap}
            disabled={!canSwap}
            title="Swap before / after"
            aria-label="Swap before and after images"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              width: 26,
              height: 26,
              fontSize: 12,
              cursor: canSwap ? 'pointer' : 'not-allowed',
              opacity: canSwap ? 1 : 0.4,
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { if (canSwap) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
          >
            ⇄
          </button>
        </div>

        <ImageSlot label="After" src={after} onUpload={(url) => updateBlock(block.id, { after: url })} />
      </div>
    </div>
  );
}
