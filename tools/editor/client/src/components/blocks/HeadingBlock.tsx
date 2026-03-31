import React from 'react';
import type { BlockData, HeadingProps } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';

export default function HeadingBlock({ block }: { block: BlockData & { type: 'heading'; props: HeadingProps } }) {
  const { text, level, className } = block.props;
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const Tag = level as 'h2' | 'h3';

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
    const newText = e.currentTarget.textContent ?? '';
    if (newText !== text) {
      updateBlock(block.id, { text: newText });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }

  return (
    <div style={{ padding: '8px 16px' }}>
      <Tag
        className={className}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: level === 'h2' ? 22 : 17,
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: 0,
          outline: 'none',
          cursor: 'text',
          lineHeight: 1.3,
        }}
      >
        {text}
      </Tag>
    </div>
  );
}
