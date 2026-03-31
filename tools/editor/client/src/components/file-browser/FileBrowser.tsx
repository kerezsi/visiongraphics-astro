import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import * as api from '../../lib/api-client.ts';
import type { PageType } from '../../types/blocks.ts';

// Template files that should not appear in the pages list
const PAGE_EXCLUDES = /\[.*\]|\/_/;

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
          .filter((item) => !PAGE_EXCLUDES.test(item.path))
          .map((item) => {
            // Make a readable label: src/pages/about/index.astro → about
            const parts = item.path.replace(/\\/g, '/').split('/');
            const filename = parts[parts.length - 1];
            const label = filename === 'index.astro'
              ? (parts[parts.length - 2] ?? item.name)
              : item.name;
            return { path: item.path, name: label };
          });
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
      {/* New button */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
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
        {SECTIONS.map((section) => {
          const files = sections[section.collection] ?? [];
          const isExpanded = expanded[section.collection] ?? false;
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
                {!isLoading && <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>{files.length}</span>}
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
