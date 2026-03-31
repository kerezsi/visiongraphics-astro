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
  const { before, after } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Image Compare
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ImageSlot label="Before" src={before} onUpload={(url) => updateBlock(block.id, { before: url })} />
        <div style={{ width: 1, background: 'var(--color-border)', flexShrink: 0 }} />
        <ImageSlot label="After" src={after} onUpload={(url) => updateBlock(block.id, { after: url })} />
      </div>
    </div>
  );
}
