import React, { useState } from 'react';
import type { BlockData } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';

export default function RichTextBlock({ block }: { block: BlockData & { type: 'rich-text'; props: { html: string } } }) {
  const { html } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(html);

  function handleSave() {
    updateBlock(block.id, { html: draft });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div style={{ padding: '8px 16px' }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            width: '100%',
            minHeight: 120,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-sm)',
            padding: 8,
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={handleSave}
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={() => { setDraft(html); setIsEditing(false); }}
            style={{
              background: 'none',
              color: 'var(--color-text-faint)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '6px 16px', cursor: 'pointer' }}
      onDoubleClick={() => { setDraft(html); setIsEditing(true); }}
      title="Double-click to edit HTML"
    >
      <div
        dangerouslySetInnerHTML={{ __html: html || '<em style="color:var(--color-text-faint)">Double-click to edit HTML…</em>' }}
        style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}
      />
    </div>
  );
}
