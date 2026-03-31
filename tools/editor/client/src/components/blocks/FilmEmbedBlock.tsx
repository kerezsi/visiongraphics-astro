import React from 'react';
import type { BlockData, FilmEmbedProps } from '../../types/blocks.ts';

export default function FilmEmbedBlock({ block }: { block: BlockData & { type: 'film-embed'; props: FilmEmbedProps } }) {
  const { vimeoId, title } = block.props;

  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--color-surface-2)',
        margin: '4px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#1ab7ea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: 16, marginLeft: 2 }}>▶</span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
          {title || 'Film Title'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginTop: 2 }}>
          Vimeo ID: {vimeoId || <em>not set</em>}
        </div>
      </div>
    </div>
  );
}
