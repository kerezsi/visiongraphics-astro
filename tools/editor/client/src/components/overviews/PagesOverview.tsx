import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getNavConfig, putNavConfig } from '../../lib/api-client.ts';
import type { NavItem } from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';

// ─── Styles ────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '24px 32px',
  background: 'var(--color-bg)',
};

const heading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 4,
};

const table: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
  borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  padding: '6px 12px 6px 0',
  borderBottom: '1px solid var(--color-border)',
};

const td: React.CSSProperties = {
  padding: '8px 12px 8px 0',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 12,
  color: 'var(--color-text)',
  verticalAlign: 'middle',
};

// ─── Sort options ───────────────────────────────────────────────────────────

type SortKey = 'default' | 'label-asc' | 'label-desc' | 'enabled-first' | 'disabled-first';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',        label: 'Nav order' },
  { key: 'label-asc',      label: 'Label A–Z' },
  { key: 'label-desc',     label: 'Label Z–A' },
  { key: 'enabled-first',  label: 'Visible first' },
  { key: 'disabled-first', label: 'Hidden first' },
];

function applySort(items: NavItem[], key: SortKey): NavItem[] {
  if (key === 'default') return items;
  return [...items].sort((a, b) => {
    switch (key) {
      case 'label-asc':      return a.label.localeCompare(b.label);
      case 'label-desc':     return b.label.localeCompare(a.label);
      case 'enabled-first':  return Number(b.enabled) - Number(a.enabled);
      case 'disabled-first': return Number(a.enabled) - Number(b.enabled);
    }
  });
}

// ─── Sortable row ───────────────────────────────────────────────────────────

function SortableRow({
  item,
  isDragMode,
  onToggle,
}: {
  item: NavItem;
  isDragMode: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.href });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? 'var(--color-surface-2)' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Drag handle — only shown in default order */}
      <td style={{ ...td, width: 24, paddingRight: 4 }}>
        {isDragMode ? (
          <span
            {...attributes}
            {...listeners}
            title="Drag to reorder"
            style={{
              display: 'inline-block',
              cursor: 'grab',
              color: 'var(--color-text-faint)',
              fontSize: 14,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ⣿
          </span>
        ) : (
          <span style={{ display: 'inline-block', width: 16 }} />
        )}
      </td>

      <td style={td}>{item.label}</td>

      <td style={{ ...td, color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
        {item.href}
      </td>

      <td style={{ ...td, textAlign: 'center' }}>
        <button
          onClick={onToggle}
          title={item.enabled ? 'Click to hide' : 'Click to show'}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            border: 'none',
            background: item.enabled ? 'var(--color-accent)' : 'var(--color-border)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 150ms',
          }}
        >
          <span style={{
            position: 'absolute',
            top: 3,
            left: item.enabled ? 18 : 3,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 150ms',
          }} />
        </button>
      </td>
    </tr>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PagesOverview() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const setError = useUIStore((s) => s.setError);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    getNavConfig()
      .then(setItems)
      .catch(() => setError('Could not load nav config'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => applySort(items, sortKey), [items, sortKey]);
  const isDragMode = sortKey === 'default';

  async function save(updated: NavItem[]) {
    setSaving(true);
    try {
      await putNavConfig(updated);
    } catch {
      setError('Failed to save nav config');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(href: string) {
    const updated = items.map((item) =>
      item.href === href ? { ...item, enabled: !item.enabled } : item
    );
    setItems(updated);
    await save(updated);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.href === active.id);
    const newIndex = items.findIndex((i) => i.href === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    save(reordered);
  }

  if (loading) {
    return (
      <div style={wrap}>
        <div style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={heading}>Nav Pages</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
          Enable/disable items and drag rows to set their order in the site menu.
          {saving && <span style={{ marginLeft: 8, color: '#f59e0b' }}>Saving…</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              style={{
                background: sortKey === opt.key ? 'var(--color-surface)' : 'none',
                border: sortKey === opt.key ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                color: sortKey === opt.key ? 'var(--color-text)' : 'var(--color-text-faint)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.href)} strategy={verticalListSortingStrategy}>
          <table style={table}>
            <thead>
              <tr>
                <th style={{ ...th, width: 24 }} />
                <th style={th}>Label</th>
                <th style={th}>URL</th>
                <th style={{ ...th, textAlign: 'center', width: 80 }}>Visible</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <SortableRow
                  key={item.href}
                  item={item}
                  isDragMode={isDragMode}
                  onToggle={() => toggle(item.href)}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      {isDragMode && (
        <p style={{ marginTop: 12, fontSize: 10, color: 'var(--color-text-faint)' }}>
          ⣿ Drag rows to reorder — saved immediately to nav-config.json
        </p>
      )}
    </div>
  );
}
