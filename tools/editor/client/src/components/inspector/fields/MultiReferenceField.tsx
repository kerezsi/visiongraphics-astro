import React, { useEffect, useState, useRef } from 'react';
import * as api from '../../../lib/api-client.ts';

interface Option {
  slug: string;
  title: string;
}

interface Props {
  label: string;
  collection: string;
  value: string[];
  onChange: (slugs: string[]) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
  padding: '4px 8px',
  fontSize: 11,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  display: 'block',
  marginBottom: 3,
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 3,
  padding: '2px 6px',
  fontSize: 10,
  color: 'var(--color-text-muted)',
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function MultiReferenceField({ label, collection, value, onChange }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listReferenceCollection(collection).then((items) => {
      setOptions(items);
    }).catch(() => {/* ignore */});
  }, [collection]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value ?? [];
  const filtered = query
    ? options.filter(
        (o) =>
          !selected.includes(o.slug) &&
          (o.title.toLowerCase().includes(query.toLowerCase()) ||
           o.slug.toLowerCase().includes(query.toLowerCase()))
      )
    : options.filter((o) => !selected.includes(o.slug));

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  function remove(slug: string) {
    onChange(selected.filter((s) => s !== slug));
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const slug = slugify(newTitle.trim());
    setCreating(true);
    try {
      await api.createCollectionEntry(collection, slug, newTitle.trim());
      const newOpt = { slug, title: newTitle.trim() };
      setOptions((prev) => [...prev, newOpt].sort((a, b) => a.title.localeCompare(b.title)));
      onChange([...selected, slug]);
      setAdding(false);
      setNewTitle('');
      setOpen(false);
    } catch (err: any) {
      alert(err.message ?? 'Failed to create entry');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>{label}</label>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {selected.map((slug) => {
            const opt = options.find((o) => o.slug === slug);
            return (
              <span key={slug} style={tagStyle}>
                {opt?.title ?? slug}
                <button
                  onMouseDown={(e) => { e.preventDefault(); remove(slug); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--color-text-faint)',
                    cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 11,
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {adding ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            autoFocus
            style={{ ...inputStyle, flex: 1 }}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`New ${collection.replace(/-/g, ' ')} name…`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            style={{
              background: 'var(--color-accent)', border: 'none', color: '#fff',
              borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 10, cursor: 'pointer',
            }}
          >
            {creating ? '…' : 'Add'}
          </button>
          <button
            onClick={() => { setAdding(false); setNewTitle(''); }}
            style={{
              background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)',
              borderRadius: 'var(--radius-sm)', padding: '4px 6px', fontSize: 10, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              style={inputStyle}
              value={query}
              placeholder={`Add ${collection.replace(/-/g, ' ')}…`}
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            />
            {open && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', maxHeight: 180, overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>
                {filtered.map((opt) => (
                  <button
                    key={opt.slug}
                    onMouseDown={() => { toggle(opt.slug); setQuery(''); setOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none',
                      borderLeft: '2px solid transparent',
                      color: 'var(--color-text-muted)', padding: '5px 8px', fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {opt.title}
                    <span style={{ color: 'var(--color-text-faint)', fontSize: 9, marginLeft: 6 }}>
                      {opt.slug}
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--color-text-faint)' }}>
                    {query ? 'No results' : 'All selected'}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setAdding(true)}
            title="Add new entry"
            style={{
              background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-faint)',
              borderRadius: 'var(--radius-sm)', padding: '4px 6px', fontSize: 10, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
