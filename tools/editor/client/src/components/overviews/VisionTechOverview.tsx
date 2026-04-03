import React, { useEffect, useState, useMemo } from 'react';
import { listContent, patchFrontmatter } from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';

interface VTechRow {
  slug: string;
  path: string;
  title: string;
  technique: string | null;
  cost: string | null;
  published: boolean;
}

type SortKey = 'title-asc' | 'title-desc' | 'technique-asc' | 'cost-asc' | 'published';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title-asc',     label: 'Title A–Z' },
  { key: 'title-desc',    label: 'Title Z–A' },
  { key: 'technique-asc', label: 'Technique' },
  { key: 'cost-asc',      label: 'Cost' },
  { key: 'published',     label: 'Published first' },
];

function sortRows(rows: VTechRow[], key: SortKey): VTechRow[] {
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'title-asc':     return a.title.localeCompare(b.title);
      case 'title-desc':    return b.title.localeCompare(a.title);
      case 'technique-asc': return (a.technique ?? '').localeCompare(b.technique ?? '');
      case 'cost-asc':      return (a.cost ?? '').localeCompare(b.cost ?? '');
      case 'published':     return Number(b.published) - Number(a.published);
    }
  });
}

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
  maxWidth: 900,
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

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: value ? 'var(--color-accent)' : 'var(--color-border)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 150ms',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: value ? 18 : 3,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 150ms',
      }} />
    </button>
  );
}

export function VisionTechOverview() {
  const [rows, setRows] = useState<VTechRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('title-asc');
  const setError = useUIStore((s) => s.setError);
  const setView = useUIStore((s) => s.setView);
  const loadFile = useDocumentStore((s) => s.loadFile);

  useEffect(() => {
    listContent('vision-tech')
      .then((items) => setRows(items as VTechRow[]))
      .catch(() => setError('Could not load vision-tech'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);

  async function togglePublished(index: number) {
    const row = rows[index];
    const newValue = !row.published;
    setRows(rows.map((r, i) => i === index ? { ...r, published: newValue } : r));
    setSaving(row.slug);
    try {
      await patchFrontmatter(row.path, { published: newValue });
    } catch {
      setError(`Failed to update ${row.slug}`);
      setRows(rows);
    } finally {
      setSaving(null);
    }
  }

  async function handleOpen(row: VTechRow) {
    try {
      await loadFile(row.path);
      setView('editor');
    } catch {
      setError(`Could not open ${row.slug}`);
    }
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
      <div style={heading}>Vision-Tech</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
          {rows.length} tech pages — toggle Published inline.
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

      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Title</th>
            <th style={{ ...th, width: 130 }}>Technique</th>
            <th style={{ ...th, width: 70 }}>Cost</th>
            <th style={{ ...th, width: 90, textAlign: 'center' }}>Published</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const i = rows.indexOf(row);
            return (
              <tr key={row.slug} style={{ opacity: saving === row.slug ? 0.5 : 1 }}>
                <td style={td}>
                  <span style={{ color: row.published ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                    {row.title}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>
                    {row.slug}
                  </span>
                </td>
                <td style={{ ...td, color: 'var(--color-text-muted)', fontSize: 11 }}>
                  {row.technique ?? '—'}
                </td>
                <td style={{ ...td, color: 'var(--color-text-muted)', fontSize: 11 }}>
                  {row.cost ?? '—'}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <Toggle value={row.published} onChange={() => togglePublished(i)} />
                </td>
                <td style={td}>
                  <button
                    onClick={() => handleOpen(row)}
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
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
