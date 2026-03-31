import React, { useState } from 'react';

interface Props<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onChange: (updated: T) => void, index: number) => React.ReactNode;
  defaultItem: T;
}

export function ArrayField<T>({ label, items, onChange, renderItem, defaultItem }: Props<T>) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function handleAdd() {
    const next = [...items, JSON.parse(JSON.stringify(defaultItem))];
    onChange(next);
    setExpandedIndex(next.length - 1);
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
    setExpandedIndex(index - 1);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
    setExpandedIndex(index + 1);
  }

  function handleItemChange(index: number, updated: T) {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  }

  const getItemLabel = (item: T, index: number): string => {
    const obj = item as Record<string, unknown>;
    return (obj.title as string) ?? (obj.name as string) ?? (obj.label as string) ?? `Item ${index + 1}`;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        {label && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label} ({items.length})
          </span>
        )}
        <button
          onClick={handleAdd}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            {/* Item header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 6px',
                background: 'var(--color-surface-2)',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <span style={{ fontSize: 10, color: 'var(--color-text-faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getItemLabel(item, index)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                disabled={index === 0}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', fontSize: 10, padding: '0 2px', opacity: index === 0 ? 0.3 : 1 }}
              >
                ▲
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                disabled={index === items.length - 1}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', fontSize: 10, padding: '0 2px', opacity: index === items.length - 1 ? 0.3 : 1 }}
              >
                ▼
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}
              >
                ✕
              </button>
              <span style={{ fontSize: 9, color: 'var(--color-text-faint)', paddingLeft: 2 }}>
                {expandedIndex === index ? '▾' : '▸'}
              </span>
            </div>

            {/* Item body */}
            {expandedIndex === index && (
              <div style={{ padding: 8, background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {renderItem(item, (updated) => handleItemChange(index, updated), index)}
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div
            style={{
              padding: '10px 8px',
              textAlign: 'center',
              color: 'var(--color-text-faint)',
              fontSize: 11,
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            No items. Click + Add to start.
          </div>
        )}
      </div>
    </div>
  );
}
