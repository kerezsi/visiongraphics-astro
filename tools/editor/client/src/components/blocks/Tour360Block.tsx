import React, { useRef } from 'react';
import type { BlockData, Tour360Props } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';
import { getDraggedImageSrc } from './ImageGalleryBlock.tsx';

export default function Tour360Block({ block }: { block: BlockData & { type: 'tour-360'; props: Tour360Props } }) {
  const { url, title, coverImage } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    // Accept an image URL dragged from a gallery block
    const galleryUrl = getDraggedImageSrc(e);
    if (galleryUrl) {
      updateBlock(block.id, { coverImage: galleryUrl });
      return;
    }
    // Fall back to file upload
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { coverImage: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { coverImage: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        margin: '4px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        position: 'relative',
        height: 80,
        background: coverImage ? `url(${coverImage}) center/cover no-repeat` : 'var(--color-surface-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
      }}
    >
      {coverImage && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      )}

      {/* Cover image controls */}
      <div style={{ position: 'absolute', top: 5, right: 6, display: 'flex', gap: 4, zIndex: 2 }}>
        <button
          onClick={() => inputRef.current?.click()}
          title="Upload cover image"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 7px',
            fontSize: 10,
            cursor: 'pointer',
            lineHeight: 1.6,
          }}
        >
          {coverImage ? '↺ cover' : '+ cover'}
        </button>
        {coverImage && (
          <button
            onClick={() => updateBlock(block.id, { coverImage: '' })}
            title="Remove cover image"
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              fontSize: 10,
              cursor: 'pointer',
              lineHeight: 1.6,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 360 icon */}
      <div
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '2px solid var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--color-accent)',
          fontSize: 16,
        }}
      >
        ○
      </div>

      {/* Title / URL */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{title || '360° Tour'}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url || <em>URL not set</em>}
        </div>
        {!coverImage && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
            drop image for cover
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
