import React from 'react';
import type { BlockData, YouTubeEmbedProps } from '../../types/blocks.ts';

export default function YouTubeEmbedBlock({ block }: { block: BlockData & { type: 'youtube-embed'; props: YouTubeEmbedProps } }) {
  const { url, title } = block.props;

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
          borderRadius: 8,
          background: '#ff0000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: 16, marginLeft: 2 }}>▷</span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
          {title || 'YouTube Video'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url || <em>URL not set</em>}
        </div>
      </div>
    </div>
  );
}
