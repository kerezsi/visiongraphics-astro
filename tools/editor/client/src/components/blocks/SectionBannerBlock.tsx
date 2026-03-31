import React, { useRef } from 'react';
import type { BlockData, SectionBannerProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import * as api from '../../lib/api-client.ts';

export default function SectionBannerBlock({ block }: { block: BlockData & { type: 'SectionBanner'; props: SectionBannerProps } }) {
  const { image, label, title } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const setError = useUIStore((s) => s.setError);
  const inputRef = useRef<HTMLInputElement>(null);

  const height = 80;
  const Tag = 'h2';
  const textAlign = 'left';
  const alignItems = 'flex-start';

  async function uploadImage(file: File) {
    try {
      const result = await api.uploadImage(file, pageType, slug);
      updateBlock(block.id, { image: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Image upload failed — check the editor server is running');
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    await uploadImage(file);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        height,
        background: image
          ? `url(${image}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems,
        padding: '12px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Image controls — top-right corner */}
      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, zIndex: 2 }}>
        <button
          onClick={() => inputRef.current?.click()}
          title="Upload background image"
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
          {image ? '↺ image' : '+ image'}
        </button>
        {image && (
          <button
            onClick={() => updateBlock(block.id, { image: '' })}
            title="Remove background image"
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

      {/* Drop hint when no image */}
      {!image && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
            drop image to set background
          </span>
        </div>
      )}

      {/* Text content */}
      <div style={{ position: 'relative', textAlign }}>
        {label && (
          <p style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            {label}
          </p>
        )}
        <Tag style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>
          {title || 'Section Title'}
        </Tag>
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
