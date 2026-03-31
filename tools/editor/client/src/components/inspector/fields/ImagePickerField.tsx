import React, { useRef } from 'react';
import { useDocumentStore } from '../../../store/document.ts';
import * as api from '../../../lib/api-client.ts';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImagePickerField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);

  async function handleFile(file: File) {
    try {
      const result = await api.uploadImage(file, pageType, slug);
      onChange(result.url);
    } catch (e) {
      console.error('Image upload failed:', e);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) await handleFile(file);
  }

  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 10,
            color: 'var(--color-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 3,
          }}
        >
          {label}
        </label>
      )}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/path/to/image.jpg"
        style={{ width: '100%' }}
      />
      {value && (
        <img
          src={value}
          alt=""
          style={{
            marginTop: 6,
            width: '100%',
            height: 72,
            objectFit: 'cover',
            borderRadius: 'var(--radius-sm)',
            display: 'block',
            background: 'var(--color-surface-2)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          marginTop: 6,
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 8px',
          fontSize: 10,
          color: 'var(--color-text-faint)',
          cursor: 'pointer',
          textAlign: 'center',
          background: 'var(--color-surface-2)',
        }}
      >
        Drop image or click to upload
      </div>
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
