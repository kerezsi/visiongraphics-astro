import React, { useEffect, useState } from 'react';
import { useAIStore } from '../../store/ai.ts';
import { getEditorConfig, saveEditorConfig } from '../../lib/api-client.ts';

const label: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 3,
};

export function AISettingsPanel() {
  const checkServices = useAIStore((s) => s.checkServices);

  const [ollamaBase, setOllamaBase] = useState('');
  const [swarmBase, setSwarmBase] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getEditorConfig()
      .then((cfg) => {
        setOllamaBase(cfg.ollamaBase);
        setSwarmBase(cfg.swarmBase);
      })
      .catch(() => {});
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await saveEditorConfig({ ollamaBase, swarmBase });
      setSaved(true);
      await checkServices();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'pointer',
          color: 'var(--color-text-faint)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <span>AI Settings</span>
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Ollama address</label>
            <input
              type="text"
              value={ollamaBase}
              onChange={(e) => setOllamaBase(e.target.value)}
              placeholder="http://localhost:11434"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={label}>SwarmUI address</label>
            <input
              type="text"
              value={swarmBase}
              onChange={(e) => setSwarmBase(e.target.value)}
              placeholder="http://localhost:7801"
              style={{ width: '100%' }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              background: saved ? '#22c55e' : 'var(--color-accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 0',
              fontSize: 11,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save & reconnect'}
          </button>
        </div>
      )}
    </div>
  );
}
