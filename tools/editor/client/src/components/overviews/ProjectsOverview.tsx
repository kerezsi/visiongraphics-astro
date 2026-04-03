import React, { useEffect, useState, useMemo } from 'react';
import { listContent, patchFrontmatter } from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';

interface ProjectRow {
  slug: string;
  path: string;
  title: string;
  year: number | null;
  published: boolean;
  featured: boolean;
}

type SortKey = 'title-asc' | 'title-desc' | 'year-desc' | 'year-asc' | 'published' | 'featured';

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

const sub: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
  marginBottom: 24,
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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'year-desc',  label: 'Year ↓' },
  { key: 'year-asc',   label: 'Year ↑' },
  { key: 'title-asc',  label: 'Title A–Z' },
  { key: 'title-desc', label: 'Title Z–A' },
  { key: 'published',  label: 'Published first' },
  { key: 'featured',   label: 'Featured first' },
];

function sortRows(rows: ProjectRow[], key: SortKey): ProjectRow[] {
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'year-desc':  return (b.year ?? 0) - (a.year ?? 0);
      case 'year-asc':   return (a.year ?? 0) - (b.year ?? 0);
      case 'title-asc':  return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      case 'published':  return Number(b.published) - Number(a.published);
      case 'featured':   return Number(b.featured) - Number(a.featured);
    }
  });
}

export function ProjectsOverview() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('year-desc');
  const setError = useUIStore((s) => s.setError);
  const setView = useUIStore((s) => s.setView);
  const loadFile = useDocumentStore((s) => s.loadFile);

  useEffect(() => {
    listContent('projects')
      .then((items) => setRows(items as ProjectRow[]))
      .catch(() => setError('Could not load projects'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);

  async function toggleField(index: number, field: 'published' | 'featured') {
    const row = rows[index];
    const newValue = !row[field];
    const updated = rows.map((r, i) => i === index ? { ...r, [field]: newValue } : r);
    setRows(updated);
    setSaving(row.slug);
    try {
      await patchFrontmatter(row.path, { [field]: newValue });
    } catch {
      setError(`Failed to update ${row.slug}`);
      setRows(rows); // revert
    } finally {
      setSaving(null);
    }
  }

  async function handleOpen(row: ProjectRow) {
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
      <div style={heading}>Projects</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={sub}>{rows.length} projects — toggle Published / Featured inline.</span>
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
            <th style={{ ...th, width: 60 }}>Year</th>
            <th style={{ ...th, width: 90, textAlign: 'center' }}>Published</th>
            <th style={{ ...th, width: 90, textAlign: 'center' }}>Featured</th>
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
                <td style={{ ...td, color: 'var(--color-text-muted)' }}>{row.year ?? '—'}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <Toggle value={row.published} onChange={() => toggleField(i, 'published')} />
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <Toggle value={row.featured} onChange={() => toggleField(i, 'featured')} />
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
