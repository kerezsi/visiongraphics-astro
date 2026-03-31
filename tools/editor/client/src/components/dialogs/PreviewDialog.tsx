import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';
import * as api from '../../lib/api-client.ts';
import type { DocumentState } from '../../types/document.ts';

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
  width: 720,
  maxHeight: '85vh',
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

const codeArea: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 16,
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  lineHeight: 1.6,
  color: 'var(--color-text-muted)',
  background: 'var(--color-surface-2)',
  whiteSpace: 'pre',
};

const footer: React.CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

export function PreviewDialog() {
  const togglePreview = useUIStore((s) => s.togglePreview);
  const setError = useUIStore((s) => s.setError);
  const docState = useDocumentStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.previewCode(docState as unknown as DocumentState);
        setCode(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Preview failed');
        togglePreview();
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function copyToClipboard() {
    navigator.clipboard.writeText(code).catch(() => {});
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) togglePreview(); }}>
      <div style={modal}>
        <div style={header}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Generated Code Preview</span>
          <button
            onClick={togglePreview}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', fontSize: 16, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-faint)' }}>
            Generating code…
          </div>
        ) : (
          <pre style={codeArea}>{code}</pre>
        )}
        <div style={footer}>
          <button
            onClick={copyToClipboard}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Copy
          </button>
          <button
            onClick={togglePreview}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 14px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
