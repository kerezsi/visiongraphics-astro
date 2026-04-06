import React from 'react';
import { useUIStore } from '../../store/ui.ts';
import { FileBrowser } from '../file-browser/FileBrowser.tsx';
import { BlockPalette } from '../palette/BlockPalette.tsx';
import { OllamaPanel } from '../ai/OllamaPanel.tsx';
import { ComfyUIPanel } from '../ai/ComfyUIPanel.tsx';
import { AISettingsPanel } from '../ai/AISettingsPanel.tsx';

const panelStyle: React.CSSProperties = {
  width: 240,
  background: 'var(--color-surface)',
  borderRight: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const tabBar: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--color-border)',
  flexShrink: 0,
};

type Tab = 'files' | 'palette' | 'ai';

const tabs: { id: Tab; label: string }[] = [
  { id: 'files', label: 'Files' },
  { id: 'palette', label: 'Blocks' },
  { id: 'ai', label: 'AI' },
];

function TabButton({ id, label, active, onClick }: { id: Tab; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text-faint)',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        padding: '8px 4px',
        cursor: 'pointer',
        letterSpacing: '0.03em',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

export function LeftPanel() {
  const tab = useUIStore((s) => s.leftPanelTab);
  const setTab = useUIStore((s) => s.setTab);

  return (
    <div style={panelStyle}>
      <div style={tabBar}>
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            id={t.id}
            label={t.label}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'files' && <FileBrowser />}
        {tab === 'palette' && <BlockPalette />}
        {tab === 'ai' && (
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <OllamaPanel />
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <ComfyUIPanel />
            <AISettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
