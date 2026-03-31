import React, { useRef } from 'react';
import type { BlockData, ImageGalleryProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';

export default function ImageGalleryBlock({ block }: { block: BlockData & { type: 'image-gallery'; props: ImageGalleryProps } }) {
  const images = Array.isArray(block.props.images) ? block.props.images : [];
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    await handleFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    updateBlock(block.id, { images: images.filter((_, i) => i !== index) });
  }

  return (
    <div style={{ padding: '8px 16px' }}>
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
          }}
        >
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={img.src}
                alt={img.alt}
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }}
              />
              <button
                onClick={() => removeImage(i)}
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
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{
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
            }}
          >
            +
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
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
