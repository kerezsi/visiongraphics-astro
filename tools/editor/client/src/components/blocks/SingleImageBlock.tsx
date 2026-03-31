import React, { useRef } from 'react';
import type { BlockData, SingleImageProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';

export default function SingleImageBlock({ block }: { block: BlockData & { type: 'single-image'; props: SingleImageProps } }) {
  const { src, alt, caption } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { src: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { src: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  if (src) {
    return (
      <div style={{ padding: '8px 16px' }}>
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
        />
        {caption && (
          <p style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 4, fontStyle: 'italic' }}>{caption}</p>
        )}
        <button
          onClick={() => updateBlock(block.id, { src: '' })}
          style={{
            marginTop: 6,
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-faint)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          Remove image
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px' }}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-faint)',
          fontSize: 12,
          background: 'var(--color-surface-2)',
          transition: 'border-color 0.15s',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>🌄</div>
        <p>Drop an image here or click to upload</p>
        <p style={{ fontSize: 10, marginTop: 4 }}>PNG, JPG, WEBP</p>
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
