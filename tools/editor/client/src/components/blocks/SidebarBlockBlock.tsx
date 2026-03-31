import React from 'react';
import type { BlockData, SidebarBlockProps } from '../../types/blocks.ts';

export default function SidebarBlockBlock({ block }: { block: BlockData & { type: 'sidebar-block'; props: SidebarBlockProps } }) {
  const { label, content } = block.props;

  return (
    <div
      style={{
        margin: '4px 16px',
        padding: '10px 14px',
        borderLeft: '3px solid var(--color-accent)',
        background: 'var(--color-surface-2)',
        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
      }}
      className="sidebar-block"
    >
      <h3
        className="sidebar-label"
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--color-accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '0 0 6px',
        }}
      >
        {label}
      </h3>
      <p
        className="body-text"
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {content}
      </p>
    </div>
  );
}
