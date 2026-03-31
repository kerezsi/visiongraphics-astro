import React, { useRef } from 'react';
import type { BlockData, ImageCompareProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';

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
  const slug = useDocumentStore((s) => s.slug);

  async function handleFiles(file: File) {
    if (!file.type.startsWith('image/')) return;
    try {
      const result = await api.uploadImage(file, pageType, slug);
      onUpload(result.url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {src ? (
        <div style={{ position: 'relative' }}>
          <img src={src} alt={label} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
          <button
            onClick={() => onUpload('')}
            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >✕</button>
        </div>
      ) : (
        <div
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFiles(f); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ height: 100, border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)', fontSize: 11, cursor: 'pointer', background: 'var(--color-surface-2)' }}
        >
          Drop or click
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFiles(f); }} style={{ display: 'none' }} />
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
