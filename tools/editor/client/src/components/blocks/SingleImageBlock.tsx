import React, { useRef } from 'react';
import type { BlockData, SingleImageProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';
import { DND_IMAGE_SRC, DND_IMAGE_ALT } from './ImageGalleryBlock.tsx';

export default function SingleImageBlock({ block }: { block: BlockData & { type: 'single-image'; props: SingleImageProps } }) {
  const { src = '', alt = '', caption = '' } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType    = useDocumentStore((s) => s.pageType);
  const slug        = useDocumentStore((s) => s.slug);
  const inputRef    = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { src: result.url, alt: alt || file.name.replace(/\.[^.]+$/, '') });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    // Accept image URL dragged from a gallery block
    const imgSrc = e.dataTransfer.getData(DND_IMAGE_SRC);
    if (imgSrc) {
      const imgAlt = e.dataTransfer.getData(DND_IMAGE_ALT) || '';
      updateBlock(block.id, { src: imgSrc, alt: imgAlt });
      return;
    }
    if (e.dataTransfer.files[0]) await handleFile(e.dataTransfer.files[0]);
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontSize: 11,
    padding: '3px 6px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: 'var(--color-text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: 2,
  };

  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Image preview / drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !src && inputRef.current?.click()}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: src ? '1px solid var(--color-border)' : '2px dashed var(--color-border)',
          background: 'var(--color-surface-2)',
          minHeight: src ? 'auto' : 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: src ? 'default' : 'pointer',
        }}
      >
        {src ? (
          <>
            <img
              src={src}
              alt={alt}
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              title="Replace image"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(0,0,0,0.65)',
                border: 'none',
                color: '#fff',
                borderRadius: 3,
                padding: '2px 7px',
                fontSize: 9,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Replace
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🌄</div>
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
              Drop image or click to upload
            </span>
          </div>
        )}
      </div>

      {/* Alt text */}
      <div>
        <label style={labelStyle}>Alt text</label>
        <input
          style={fieldStyle}
          value={alt}
          placeholder="Descriptive alt text"
          onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
        />
      </div>

      {/* Caption */}
      <div>
        <label style={labelStyle}>Caption (optional)</label>
        <input
          style={fieldStyle}
          value={caption}
          placeholder="Caption shown below the image"
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        style={{ display: 'none' }}
      />
    </div>
  );
}
