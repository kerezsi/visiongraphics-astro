import React from 'react';
import { useUIStore } from '../../store/ui.ts';
import { useDocumentStore } from '../../store/document.ts';
import { Inspector } from '../inspector/Inspector.tsx';
import { MetaPanel } from '../inspector/MetaPanel.tsx';
import { blockRegistry } from '../../lib/block-registry.ts';

const panelStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--color-surface)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const panelHeader: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  flexShrink: 0,
};

const placeholder: React.CSSProperties = {
  padding: 16,
  color: 'var(--color-text-faint)',
  fontSize: 12,
  textAlign: 'center',
  marginTop: 24,
};

export function RightPanel() {
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);
  const blocks = useDocumentStore((s) => s.blocks);
  const filePath = useDocumentStore((s) => s.filePath);

  // Find selected block (may be nested)
  function findBlock(id: string): import('../../types/blocks.ts').BlockData | undefined {
    function walk(list: import('../../types/blocks.ts').BlockData[]): import('../../types/blocks.ts').BlockData | undefined {
      for (const b of list) {
        if (b.id === id) return b;
        if (b.type === 'section-container') {
          const found = walk(b.props.children);
          if (found) return found;
        }
        if (b.type === 'two-col') {
          const found = walk(b.props.left) ?? walk(b.props.right);
          if (found) return found;
        }
        if (b.type === 'service-body-grid') {
          const found = walk(b.props.main) ?? walk(b.props.sidebar);
          if (found) return found;
        }
      }
      return undefined;
    }
    return walk(blocks);
  }

  const selectedBlock = selectedBlockId ? findBlock(selectedBlockId) : null;
  const entry = selectedBlock ? blockRegistry.get(selectedBlock.type) : null;

  // Tab state: 'meta' or 'block'
  const [tab, setTab] = React.useState<'meta' | 'block'>('meta');

  // Switch to block tab when a block is selected
  React.useEffect(() => {
    if (selectedBlock) setTab('block');
  }, [selectedBlock?.id]);

  // Switch to meta tab when file changes (new file opened)
  React.useEffect(() => {
    setTab('meta');
  }, [filePath]);

  return (
    <div style={panelStyle}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button
          onClick={() => setTab('meta')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'meta' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: tab === 'meta' ? 'var(--color-text)' : 'var(--color-text-faint)',
            fontSize: 10,
            fontWeight: tab === 'meta' ? 600 : 400,
            padding: '7px 4px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Meta
        </button>
        <button
          onClick={() => setTab('block')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'block' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: tab === 'block' ? 'var(--color-text)' : 'var(--color-text-faint)',
            fontSize: 10,
            fontWeight: tab === 'block' ? 600 : 400,
            padding: '7px 4px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {entry ? entry.label : 'Block'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'meta' && <MetaPanel />}
        {tab === 'block' && (
          selectedBlock ? (
            <Inspector block={selectedBlock} />
          ) : (
            <div style={placeholder}>
              <p>Select a block to edit its properties.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
