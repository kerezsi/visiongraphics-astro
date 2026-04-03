import React, { useEffect, useState, useRef } from 'react';
import {
  listReferenceCollection,
  createCollectionEntry,
  renameCollectionEntry,
  deleteCollectionEntry,
} from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';

interface Entry { slug: string; title: string }

const COLLECTIONS: { key: string; label: string }[] = [
  { key: 'clients',      label: 'Clients' },
  { key: 'designers',    label: 'Architects / Designers' },
  { key: 'client-types', label: 'Client Types' },
  { key: 'categories',   label: 'Categories' },
  { key: 'cities',       label: 'Cities' },
  { key: 'countries',    label: 'Countries' },
];

// ─── Styles ────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '24px 32px',
  background: 'var(--color-bg)',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
};

const sectionBox: React.CSSProperties = {
  maxWidth: 560,
};

const sectionHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 6,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  flex: 1,
};

const entryRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 0',
  borderBottom: '1px solid var(--color-border)',
};

const entrySlug: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  fontFamily: 'monospace',
  width: 140,
  flexShrink: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const btn = (accent = false, danger = false): React.CSSProperties => ({
  background: accent ? 'var(--color-accent)' : danger ? 'transparent' : 'none',
  color: accent ? '#fff' : danger ? '#ef4444' : 'var(--color-text-muted)',
  border: accent ? 'none' : danger ? '1px solid #ef444466' : '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '2px 8px',
  fontSize: 10,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

// ─── Single collection panel ────────────────────────────────────────────────

function CollectionPanel({ collKey, label }: { collKey: string; label: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);
  const setError = useUIStore((s) => s.setError);

  function load() {
    setLoading(true);
    listReferenceCollection(collKey)
      .then(setEntries)
      .catch(() => setError(`Could not load ${label}`))
      .finally(() => setLoading(false));
  }

  useEffect(load, [collKey]);

  useEffect(() => {
    if (editingSlug && editRef.current) editRef.current.focus();
  }, [editingSlug]);

  async function handleRename(slug: string) {
    if (!editValue.trim()) { setEditingSlug(null); return; }
    setBusy(true);
    try {
      await renameCollectionEntry(collKey, slug, editValue.trim());
      setEntries(entries.map((e) => e.slug === slug ? { ...e, title: editValue.trim() } : e));
    } catch {
      setError(`Failed to rename ${slug}`);
    } finally {
      setEditingSlug(null);
      setBusy(false);
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}" (${slug}) from ${label}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteCollectionEntry(collKey, slug);
      setEntries(entries.filter((e) => e.slug !== slug));
    } catch {
      setError(`Failed to delete ${slug}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    const s = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    const t = newTitle.trim();
    if (!s || !t) return;
    setBusy(true);
    try {
      await createCollectionEntry(collKey, s, t);
      setEntries([...entries, { slug: s, title: t }].sort((a, b) => a.title.localeCompare(b.title)));
      setNewSlug('');
      setNewTitle('');
      setAddMode(false);
    } catch (e: any) {
      setError(e.message ?? `Failed to add ${s}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={sectionBox}>
      <div style={sectionHead}>
        <span style={sectionTitle}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>{entries.length}</span>
        <button style={btn(true)} onClick={() => { setAddMode(true); setNewSlug(''); setNewTitle(''); }}>
          + Add
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: 'var(--color-text-faint)', padding: '6px 0' }}>Loading…</div>
      )}

      {/* Add form */}
      {addMode && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
          <input
            autoFocus
            placeholder="slug (e.g. my-client)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddMode(false); }}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 7px',
              fontSize: 11,
              width: 140,
            }}
          />
          <input
            placeholder="Display name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddMode(false); }}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 7px',
              fontSize: 11,
              flex: 1,
            }}
          />
          <button style={btn(true)} onClick={handleAdd} disabled={busy || !newSlug.trim() || !newTitle.trim()}>
            Save
          </button>
          <button style={btn()} onClick={() => setAddMode(false)}>Cancel</button>
        </div>
      )}

      {/* Entry list */}
      {entries.map((entry) => (
        <div key={entry.slug} style={entryRow}>
          <span style={entrySlug} title={entry.slug}>{entry.slug}</span>

          {editingSlug === entry.slug ? (
            <input
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRename(entry.slug)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(entry.slug);
                if (e.key === 'Escape') setEditingSlug(null);
              }}
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
                fontSize: 12,
                flex: 1,
              }}
            />
          ) : (
            <span
              style={{ flex: 1, fontSize: 12, color: 'var(--color-text)', cursor: 'text' }}
              onDoubleClick={() => { setEditingSlug(entry.slug); setEditValue(entry.title); }}
              title="Double-click to rename"
            >
              {entry.title}
            </span>
          )}

          <button
            style={btn()}
            onClick={() => { setEditingSlug(entry.slug); setEditValue(entry.title); }}
            title="Rename"
          >
            Rename
          </button>
          <button
            style={btn(false, true)}
            onClick={() => handleDelete(entry.slug, entry.title)}
            title="Delete"
            disabled={busy}
          >
            Delete
          </button>
        </div>
      ))}

      {!loading && entries.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-faint)', padding: '6px 0', fontStyle: 'italic' }}>
          No entries yet.
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CollectionsOverview() {
  return (
    <div style={wrap}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
          Reference Collections
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginBottom: 0 }}>
          Add, rename, or delete entries. Double-click a name to rename inline.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 32 }}>
        {COLLECTIONS.map((c) => (
          <CollectionPanel key={c.key} collKey={c.key} label={c.label} />
        ))}
      </div>
    </div>
  );
}
