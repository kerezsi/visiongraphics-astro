import React, { useRef, useState, useEffect } from 'react';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import type { EditorView } from '../../store/ui.ts';
import type { PageType } from '../../types/blocks.ts';
import { generateThumbs, gitPush, pushAllToR2 } from '../../lib/api-client.ts';

const toolbarStyle: React.CSSProperties = {
  height: 44,
  background: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 12px',
  flexShrink: 0,
  overflow: 'hidden',
};

const logo: React.CSSProperties = {
  color: 'var(--color-accent)',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  marginRight: 4,
};

const divider: React.CSSProperties = {
  width: 1,
  height: 20,
  background: 'var(--color-border)',
  flexShrink: 0,
};

const centerGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  overflow: 'hidden',
};

const pageTypeSelect: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 6px',
  fontSize: 11,
  width: 90,
  flexShrink: 0,
};

const slugInput: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 8px',
  fontSize: 11,
  width: 160,
  flexShrink: 0,
};

const titleDisplay: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
};

const rightGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
};

function ToolbarBtn({
  children,
  onClick,
  accent,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: accent ? 'var(--color-accent)' : 'none',
        color: accent ? '#fff' : 'var(--color-text-muted)',
        border: accent ? 'none' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: accent ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

const VIEW_TABS: { key: EditorView; label: string }[] = [
  { key: 'editor',      label: 'Editor' },
  { key: 'pages',       label: 'Pages' },
  { key: 'projects',    label: 'Projects' },
  { key: 'articles',    label: 'Articles' },
  { key: 'services',    label: 'Services' },
  { key: 'vtech',       label: 'Vision-Tech' },
  { key: 'collections', label: 'Collections' },
];

export function Toolbar() {
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const meta = useDocumentStore((s) => s.meta);
  const isDirty = useDocumentStore((s) => s.isDirty);
  const setPageType = useDocumentStore((s) => s.setPageType);
  const setSlug = useDocumentStore((s) => s.setSlug);
  const saveFile = useDocumentStore((s) => s.saveFile);

  const togglePreview = useUIStore((s) => s.togglePreview);
  const isSaving = useUIStore((s) => s.isSaving);
  const lastSavedPath = useUIStore((s) => s.lastSavedPath);
  const setSaving = useUIStore((s) => s.setSaving);
  const setLastSavedPath = useUIStore((s) => s.setLastSavedPath);
  const setError = useUIStore((s) => s.setError);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  const [savedFlash, setSavedFlash] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllStatus, setSyncAllStatus] = useState<string | null>(null);
  const [isThumbing, setIsThumbing] = useState(false);
  const [thumbStatus, setThumbStatus] = useState<string | null>(null);
  const [isThumbingAll, setIsThumbingAll] = useState(false);
  const [thumbAllStatus, setThumbAllStatus] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = (meta as Record<string, unknown>).title as string | undefined;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving) handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveFile();
      setLastSavedPath(result.path);
      setSavedFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setSavedFlash(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncToR2() {
    if (!slug) { setError('No slug set'); return; }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/images/push-to-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageType, slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus('Synced to R2');
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setSyncStatus(null), 5000);
      } else {
        setError(data.error ?? 'Sync failed');
      }
    } catch (e) {
      setError('Sync failed — is rclone installed?');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncAllToR2() {
    setIsSyncingAll(true);
    setSyncAllStatus(null);
    try {
      const data = await pushAllToR2();
      if (data.ok) {
        setSyncAllStatus('All → R2');
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setSyncAllStatus(null), 5000);
      } else {
        setError('Sync all failed');
      }
    } catch (e) {
      setError('Sync all failed — is rclone installed?');
    } finally {
      setIsSyncingAll(false);
    }
  }

  async function handleGenerateThumbs() {
    setIsThumbing(true);
    setThumbStatus(null);
    try {
      await generateThumbs(slug || undefined, pageType || undefined);
      setThumbStatus('Thumbs done');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setThumbStatus(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thumbs failed');
    } finally {
      setIsThumbing(false);
    }
  }

  async function handleGenerateAllThumbs() {
    setIsThumbingAll(true);
    setThumbAllStatus(null);
    try {
      await generateThumbs(undefined, undefined);
      setThumbAllStatus('All thumbs done');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setThumbAllStatus(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thumbs all failed');
    } finally {
      setIsThumbingAll(false);
    }
  }

  async function handleGitPush() {
    setIsPushing(true);
    setPushStatus(null);
    const msg = slug ? `editor: update ${slug}` : 'editor: update content';
    try {
      await gitPush(msg);
      setPushStatus('Pushed');
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setPushStatus(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Git push failed');
    } finally {
      setIsPushing(false);
    }
  }

  return (
    <div style={toolbarStyle}>
      <span style={logo}>VG EDITOR</span>

      <div style={divider} />

      {/* View tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              background: view === tab.key ? 'var(--color-accent)' : 'none',
              color: view === tab.key ? '#fff' : 'var(--color-text-muted)',
              border: view === tab.key ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: view === tab.key ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={divider} />

      {view === 'editor' && (
        <div style={centerGroup}>
          <select
            style={pageTypeSelect}
            value={pageType}
            onChange={(e) => setPageType(e.target.value as PageType)}
          >
            <option value="article">Article</option>
            <option value="project">Project</option>
            <option value="service">Service</option>
            <option value="vision-tech">Vision-Tech</option>
            <option value="page">Page</option>
          </select>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              style={{ ...slugInput, paddingRight: isDirty ? 20 : 8 }}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug"
            />
            {isDirty && (
              <span title="Unsaved changes" style={{ position: 'absolute', right: 6, width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            )}
          </div>

          {title && <span style={titleDisplay}>{title}</span>}
        </div>
      )}

      {view !== 'editor' && <div style={{ flex: 1 }} />}

      <div style={rightGroup}>
        {view === 'editor' && (
          <>
            {(savedFlash && lastSavedPath) && (
              <span style={{ color: 'var(--color-text-faint)', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Saved: {lastSavedPath}
              </span>
            )}
            {syncStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{syncStatus}</span>
            )}
            {syncAllStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{syncAllStatus}</span>
            )}
            {thumbStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{thumbStatus}</span>
            )}
            {thumbAllStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{thumbAllStatus}</span>
            )}
            {pushStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{pushStatus}</span>
            )}
            <ToolbarBtn onClick={handleSyncToR2} disabled={isSyncing || isSyncingAll}>
              {isSyncing ? 'Syncing…' : '↑ R2'}
            </ToolbarBtn>
            <ToolbarBtn onClick={handleSyncAllToR2} disabled={isSyncing || isSyncingAll}>
              {isSyncingAll ? 'Syncing all…' : '↑ R2 all'}
            </ToolbarBtn>
            <ToolbarBtn onClick={handleGenerateThumbs} disabled={isThumbing || isThumbingAll}>
              {isThumbing ? 'Thumbing…' : '⟳ Thumbs'}
            </ToolbarBtn>
            <ToolbarBtn onClick={handleGenerateAllThumbs} disabled={isThumbing || isThumbingAll}>
              {isThumbingAll ? 'Thumbing all…' : '⟳ Thumbs all'}
            </ToolbarBtn>
            <ToolbarBtn onClick={handleGitPush} disabled={isPushing}>
              {isPushing ? 'Pushing…' : '↑ Git'}
            </ToolbarBtn>
            <ToolbarBtn onClick={togglePreview}>Preview MDX</ToolbarBtn>
            <ToolbarBtn accent onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </ToolbarBtn>
          </>
        )}
        {view !== 'editor' && (
          <>
            {pushStatus && (
              <span style={{ color: '#22c55e', fontSize: 11 }}>{pushStatus}</span>
            )}
            <ToolbarBtn onClick={handleGitPush} disabled={isPushing}>
              {isPushing ? 'Pushing…' : '↑ Git'}
            </ToolbarBtn>
          </>
        )}
      </div>
    </div>
  );
}
