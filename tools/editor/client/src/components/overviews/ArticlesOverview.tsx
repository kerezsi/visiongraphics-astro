import React, { useEffect, useState, useMemo } from 'react';
import { listContent, patchFrontmatter, generateThumbs } from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';

interface ArticleRow {
  slug: string;
  path: string;
  title: string;
  date: string | null;
  published: boolean;
  tags: string[];
}

type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'published';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date-desc',  label: 'Date ↓' },
  { key: 'date-asc',   label: 'Date ↑' },
  { key: 'title-asc',  label: 'Title A–Z' },
  { key: 'title-desc', label: 'Title Z–A' },
  { key: 'published',  label: 'Published first' },
];

function sortRows(rows: ArticleRow[], key: SortKey): ArticleRow[] {
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'date-desc':  return (b.date ?? '').localeCompare(a.date ?? '');
      case 'date-asc':   return (a.date ?? '').localeCompare(b.date ?? '');
      case 'title-asc':  return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      case 'published':  return Number(b.published) - Number(a.published);
    }
  });
}

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
  maxWidth: 1000,
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

function TagsCell({
  tags,
  onSave,
}: {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tags.join(', '));
  const [saving, setSaving] = useState(false);

  // Keep value in sync if tags change externally
  useEffect(() => {
    if (!editing) setValue(tags.join(', '));
  }, [tags, editing]);

  async function commit() {
    const parsed = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setEditing(false);
    setSaving(true);
    try {
      await onSave(parsed);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-accent)',
          color: 'var(--color-text)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 6px',
          fontSize: 11,
          width: '100%',
          minWidth: 160,
        }}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit tags (comma-separated)"
      style={{
        cursor: 'text',
        minHeight: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
        opacity: saving ? 0.5 : 1,
      }}
    >
      {tags.length === 0 ? (
        <span style={{ color: 'var(--color-text-faint)', fontSize: 11, fontStyle: 'italic' }}>
          click to add tags
        </span>
      ) : (
        tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            {tag}
          </span>
        ))
      )}
    </div>
  );
}

export function ArticlesOverview() {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [thumbing, setThumbingRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const setError = useUIStore((s) => s.setError);
  const setView = useUIStore((s) => s.setView);
  const loadFile = useDocumentStore((s) => s.loadFile);

  useEffect(() => {
    listContent('articles')
      .then((items) => setRows(items as ArticleRow[]))
      .catch(() => setError('Could not load articles'))
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

  async function saveTags(index: number, tags: string[]) {
    const row = rows[index];
    setRows(rows.map((r, i) => i === index ? { ...r, tags } : r));
    try {
      await patchFrontmatter(row.path, { tags });
    } catch {
      setError(`Failed to update tags for ${row.slug}`);
      setRows(rows);
    }
  }

  async function handleThumbs(row: ArticleRow) {
    setThumbingRow(row.slug);
    try {
      await generateThumbs(row.slug, 'article');
    } catch {
      setError(`Thumbs failed for ${row.slug}`);
    } finally {
      setThumbingRow(null);
    }
  }

  async function handleOpen(row: ArticleRow) {
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
      <div style={heading}>Articles</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={sub}>{rows.length} articles — toggle Published, click tags to edit.</span>
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
            <th style={{ ...th, width: 100 }}>Date</th>
            <th style={{ ...th, width: 90, textAlign: 'center' }}>Published</th>
            <th style={th}>Tags</th>
            <th style={{ ...th, width: 60 }}></th>
            <th style={{ ...th, width: 44 }}></th>
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
                  {row.date ? row.date.slice(0, 10) : '—'}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <Toggle value={row.published} onChange={() => togglePublished(i)} />
                </td>
                <td style={td}>
                  <TagsCell tags={row.tags} onSave={(tags) => saveTags(i, tags)} />
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
                <td style={td}>
                  <button
                    onClick={() => handleThumbs(row)}
                    disabled={thumbing === row.slug}
                    title="Generate thumbnails for this article"
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      color: thumbing === row.slug ? 'var(--color-text-faint)' : 'var(--color-text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 6px',
                      fontSize: 11,
                      cursor: thumbing === row.slug ? 'default' : 'pointer',
                      opacity: thumbing === row.slug ? 0.6 : 1,
                    }}
                  >
                    {thumbing === row.slug ? '…' : '⟳'}
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
