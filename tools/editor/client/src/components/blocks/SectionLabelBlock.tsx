import React from 'react';
import type { BlockData } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';

export default function SectionLabelBlock({ block }: { block: BlockData & { type: 'section-label'; props: { text: string } } }) {
  const { text } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);

  function handleBlur(e: React.FocusEvent<HTMLParagraphElement>) {
    const newText = e.currentTarget.textContent ?? '';
    if (newText !== text) updateBlock(block.id, { text: newText });
  }

  return (
    <div style={{ padding: '4px 16px' }}>
      <p
        className="section-label"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        style={{
          fontSize: 10,
          color: 'var(--color-accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          margin: 0,
          outline: 'none',
          cursor: 'text',
        }}
      >
        {text}
      </p>
    </div>
  );
}
