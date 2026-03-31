import React, { useState } from 'react';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';
import type { PageType } from '../../types/blocks.ts';

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modal: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  width: 560,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
};

const body: React.CSSProperties = {
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  overflowY: 'auto',
  flex: 1,
};

const footer: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 500,
};

const btnGhost: React.CSSProperties = {
  background: 'none',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 14px',
  fontSize: 12,
};

export function ImportDialog() {
  const closeImportDialog = useUIStore((s) => s.closeImportDialog);
  const setError = useUIStore((s) => s.setError);
  const setBlocks = useDocumentStore((s) => s.setBlocks);
  const setMeta = useDocumentStore((s) => s.setMeta);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);

  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleImport() {
    if (!markdown.trim()) return;
    setIsLoading(true);
    try {
      const result = await api.importMarkdown(markdown, pageType as PageType, slug);
      setBlocks(result.blocks);
      setMeta(result.frontmatter as Record<string, unknown>);
      closeImportDialog();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) closeImportDialog(); }}>
      <div style={modal}>
        <div style={header}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Import Markdown</span>
          <button
            onClick={closeImportDialog}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', fontSize: 16, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div style={body}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
            Paste markdown or LLM-generated content below. Frontmatter will be parsed as page metadata.
          </p>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="---&#10;title: My Page&#10;---&#10;&#10;# Heading&#10;&#10;Body text..."
            style={{ height: 320, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }}
          />
        </div>
        <div style={footer}>
          <button style={btnGhost} onClick={closeImportDialog}>Cancel</button>
          <button style={btnPrimary} onClick={handleImport} disabled={isLoading || !markdown.trim()}>
            {isLoading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
