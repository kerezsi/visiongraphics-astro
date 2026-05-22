import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import * as api from '../../lib/api-client.ts';
import type { PageType } from '../../types/blocks.ts';

// Decide whether a page from the server's listing should be hidden in the UI.
// Excludes:
//   1. Dynamic-route templates whose *filename* itself is bracketed
//      (e.g. [slug].astro, [category].astro) — those are templates, not editable pages.
//   2. Private/underscore-prefixed segments (e.g. /_redirects).
//   3. The bare root redirect src/pages/index.astro — it just 308s to /en/
//      and has no editable content; the real home page is src/pages/[lang]/index.astro.
// IMPORTANT: a bracketed *directory* like [lang] in the path is fine — we keep
// those entries because they are the locale-prefixed real pages.
function isPageHidden(path: string): boolean {
  const np = path.replace(/\\/g, '/');
  const last = np.split('/').pop() ?? '';
  if (last.startsWith('[')) return true;
  if (/(^|\/)_/.test(np)) return true;
  if (np === 'src/pages/index.astro') return true;
  return false;
}

// Build a readable label from the page path.
// Examples:
//   src/pages/[lang]/index.astro              → "home"
//   src/pages/[lang]/about/index.astro        → "about"
//   src/pages/[lang]/portfolio/index.astro    → "portfolio"
//   src/pages/[lang]/some/nested/index.astro  → "some/nested"
function pageLabel(path: string, fallback: string): string {
  const cleaned = path
    .replace(/\\/g, '/')
    .replace(/^src\/pages\//, '')
    .replace(/^\[lang\]\//, '')
    .replace(/\/index\.astro$/, '')
    .replace(/\.astro$/, '');
  if (cleaned === '' || cleaned === '[lang]' || cleaned === 'index') return 'home';
  return cleaned || fallback;
}

interface FileEntry {
  path: string;
  name: string;
}

interface Section {
  label: string;
  collection: string;
  pageType: PageType;
  isPages?: boolean;  // uses listPages() instead of listContent()
}

const SECTIONS: Section[] = [
  { label: 'Pages', collection: 'pages', pageType: 'page', isPages: true },
  { label: 'Articles', collection: 'articles', pageType: 'article' },
  { label: 'Projects', collection: 'projects', pageType: 'project' },
  { label: 'Services', collection: 'services', pageType: 'service' },
  { label: 'Vision-Tech', collection: 'vision-tech', pageType: 'vision-tech' },
];

function FileEntry({ entry, onClick, isActive }: { entry: FileEntry; onClick: () => void; isActive: boolean }) {
  const label = entry.name;
  return (
    <button
      onClick={onClick}
      title={entry.path}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: isActive ? 'var(--color-surface-2)' : 'none',
        border: 'none',
        borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
        color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
        padding: '4px 10px 4px 10px',
        fontSize: 11,
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export function FileBrowser() {
  const [sections, setSections] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ articles: true, pages: false });
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newPageType, setNewPageType] = useState<PageType>('article');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const loadFile = useDocumentStore((s) => s.loadFile);
  const newDocument = useDocumentStore((s) => s.newDocument);
  const setSlug = useDocumentStore((s) => s.setSlug);
  const setPageType = useDocumentStore((s) => s.setPageType);
  const currentFilePath = useDocumentStore((s) => s.filePath);
  const setError = useUIStore((s) => s.setError);

  async function fetchSection(section: Section) {
    setLoading((l) => ({ ...l, [section.collection]: true }));
    try {
      if (section.isPages) {
        const items = await api.listPages();
        const entries = (items as Array<{ path: string; name: string }>)
          .filter((item) => !isPageHidden(item.path))
          .map((item) => ({ path: item.path, name: pageLabel(item.path, item.name) }));
        setSections((s) => ({ ...s, [section.collection]: entries }));
      } else {
        const items = await api.listContent(section.collection);
        const entries = (items as Array<Record<string, unknown>>).map((item) => ({
          path: item.path as string,
          name: (item.slug ?? item.title ?? item.path) as string,
        }));
        setSections((s) => ({ ...s, [section.collection]: entries }));
      }
    } catch (e) {
      setError(`Could not load ${section.label}`);
    } finally {
      setLoading((l) => ({ ...l, [section.collection]: false }));
    }
  }

  useEffect(() => {
    SECTIONS.forEach(fetchSection);
  }, []);

  function toggleSection(key: string) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  async function handleOpenFile(path: string) {
    try {
      await loadFile(path);
    } catch (e) {
      setError(`Could not load file: ${path}`);
    }
  }

  function handleNew() {
    if (!newSlug.trim()) return;
    newDocument(newPageType);
    setSlug(newSlug.trim());
    setPageType(newPageType);
    setIsNewDialogOpen(false);
    setNewSlug('');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* New button + search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => setIsNewDialogOpen(true)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: 11,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + New Document
        </button>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            style={{
              width: '100%',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              padding: '4px 22px 4px 8px',
              fontSize: 11,
              boxSizing: 'border-box',
            }}
          />
          {isSearching && (
            <button
              onClick={() => setQuery('')}
              title="Clear search"
              aria-label="Clear search"
              style={{
                position: 'absolute',
                top: '50%',
                right: 4,
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-faint)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* New document dialog (inline) */}
      {isNewDialogOpen && (
        <div style={{ padding: 10, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 10, color: 'var(--color-text-faint)', display: 'block', marginBottom: 3 }}>Type</label>
            <select
              value={newPageType}
              onChange={(e) => setNewPageType(e.target.value as PageType)}
              style={{ width: '100%' }}
            >
              <option value="article">Article</option>
              <option value="project">Project</option>
              <option value="service">Service</option>
              <option value="vision-tech">Vision-Tech</option>
              <option value="page">Page (.astro)</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: 'var(--color-text-faint)', display: 'block', marginBottom: 3 }}>Slug</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="my-new-page"
              onKeyDown={(e) => e.key === 'Enter' && handleNew()}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleNew}
              disabled={!newSlug.trim()}
              style={{
                flex: 1,
                background: 'var(--color-accent)',
                border: 'none',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 0',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setIsNewDialogOpen(false)}
              style={{
                flex: 1,
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-faint)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 0',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* File tree */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isSearching && SECTIONS.every((s) => {
          const all = sections[s.collection] ?? [];
          return all.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)).length === 0;
        }) && (
          <div style={{ padding: '14px 12px', fontSize: 11, color: 'var(--color-text-faint)', fontStyle: 'italic', textAlign: 'center' }}>
            No matching files
          </div>
        )}
        {SECTIONS.map((section) => {
          const allFiles = sections[section.collection] ?? [];
          const files = isSearching
            ? allFiles.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
            : allFiles;
          // When searching: skip sections with zero matches entirely; force-expand sections that do match.
          if (isSearching && files.length === 0) return null;
          const isExpanded = isSearching ? true : (expanded[section.collection] ?? false);
          const isLoading = loading[section.collection] ?? false;

          return (
            <div key={section.collection}>
              {/* Section header */}
              <button
                onClick={() => {
                  toggleSection(section.collection);
                  if (!sections[section.collection]) fetchSection(section);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  padding: '6px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 8 }}>{isExpanded ? '▾' : '▸'}</span>
                <span style={{ flex: 1 }}>{section.label}</span>
                {isLoading && <span style={{ fontSize: 9 }}>…</span>}
                {!isLoading && (
                  <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>
                    {isSearching ? `${files.length}/${allFiles.length}` : files.length}
                  </span>
                )}
              </button>

              {/* Files */}
              {isExpanded && (
                <div>
                  {files.length === 0 && !isLoading && (
                    <div style={{ padding: '6px 14px', fontSize: 10, color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                      No files
                    </div>
                  )}
                  {files.map((f) => (
                    <FileEntry
                      key={f.path}
                      entry={f}
                      onClick={() => handleOpenFile(f.path)}
                      isActive={currentFilePath === f.path}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
