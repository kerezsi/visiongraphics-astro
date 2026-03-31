import React, { useEffect, useState, useRef } from 'react';
import * as api from '../../../lib/api-client.ts';

interface Option {
  slug: string;
  title: string;
}

interface Props {
  label: string;
  collection: string;  // e.g. 'clients', 'cities', 'countries'
  value: string | undefined;
  onChange: (slug: string | undefined) => void;
  optional?: boolean;
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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ReferenceField({ label, collection, value, onChange, optional = true }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load options from reference collection
  useEffect(() => {
    api.listReferenceCollection(collection).then((items) => {
      setOptions(items);
    }).catch(() => {/* ignore */});
  }, [collection]);

  // Close dropdown on outside click
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

  const currentTitle = options.find((o) => o.slug === value)?.title ?? value ?? '';
  const filtered = query
    ? options.filter((o) =>
        o.title.toLowerCase().includes(query.toLowerCase()) ||
        o.slug.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const slug = slugify(newTitle.trim());
    setCreating(true);
    try {
      await api.createCollectionEntry(collection, slug, newTitle.trim());
      const newOpt = { slug, title: newTitle.trim() };
      setOptions((prev) => [...prev, newOpt].sort((a, b) => a.title.localeCompare(b.title)));
      onChange(slug);
      setAdding(false);
      setNewTitle('');
      setOpen(false);
    } catch (err: any) {
      alert(err.message ?? 'Failed to create entry');
    } finally {
      setCreating(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-faint)',
    display: 'block',
    marginBottom: 3,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={labelStyle}>{label}</label>

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
              borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 10,
              cursor: 'pointer',
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
              value={open ? query : currentTitle}
              placeholder={optional ? '— none —' : 'Select…'}
              onFocus={() => { setOpen(true); setQuery(''); }}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              readOnly={!open}
            />
            {/* Dropdown */}
            {open && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', maxHeight: 180, overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>
                {optional && (
                  <button
                    onMouseDown={() => { onChange(undefined); setOpen(false); setQuery(''); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-faint)', padding: '5px 8px', fontSize: 10, cursor: 'pointer',
                    }}
                  >
                    — none —
                  </button>
                )}
                {filtered.map((opt) => (
                  <button
                    key={opt.slug}
                    onMouseDown={() => { onChange(opt.slug); setOpen(false); setQuery(''); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: opt.slug === value ? 'var(--color-surface-2)' : 'none',
                      border: 'none',
                      borderLeft: opt.slug === value ? '2px solid var(--color-accent)' : '2px solid transparent',
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
                    No results
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
