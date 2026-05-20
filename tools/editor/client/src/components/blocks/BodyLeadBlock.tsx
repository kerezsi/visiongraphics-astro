import React from 'react';
import type { BlockData } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import { readLocale, DEFAULT_LOCALE } from '../../lib/localized.ts';

export default function BodyLeadBlock({ block }: { block: BlockData & { type: 'body-lead'; props: { text: string } } }) {
  const text = readLocale(block.props.text as any, DEFAULT_LOCALE);
  const updateBlock = useDocumentStore((s) => s.updateBlock);

  function handleBlur(e: React.FocusEvent<HTMLParagraphElement>) {
    const newText = e.currentTarget.textContent ?? '';
    if (newText !== text) updateBlock(block.id, { text: newText });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }

  return (
    <div style={{ padding: '6px 16px' }}>
      <p
        className="body-lead"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: 15,
          fontWeight: 400,
          color: 'var(--color-text)',
          margin: 0,
          outline: 'none',
          cursor: 'text',
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  );
}
