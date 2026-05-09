import React, { useEffect, useState } from 'react';
import { useAIStore } from '../../store/ai.ts';
import { getEditorConfig, saveEditorConfig } from '../../lib/api-client.ts';

const lbl: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 3,
};

const miniBtn: React.CSSProperties = {
  flexShrink: 0,
  background: 'none',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-faint)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 7px',
  fontSize: 10,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function AISettingsPanel() {
  const checkServices = useAIStore((s) => s.checkServices);

  const [ollamaBase, setOllamaBase] = useState('');
  const [swarmBases, setSwarmBases] = useState<string[]>(['']);
  const [translationEngine, setTranslationEngine] = useState<'ollama' | 'claude'>('ollama');
  const [translationOllamaModel, setTranslationOllamaModel] = useState('');
  const [translationClaudeModel, setTranslationClaudeModel] = useState('claude-sonnet-4-5');
  const [translationPrompt, setTranslationPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    getEditorConfig()
      .then((cfg) => {
        setOllamaBase(cfg.ollamaBase);
        // Prefer the new array; fall back to a single-entry list using the
        // legacy swarmBase if the array is empty.
        const list = (cfg.swarmBases ?? []).filter((s) => typeof s === 'string');
        if (list.length > 0) setSwarmBases(list);
        else setSwarmBases(cfg.swarmBase ? [cfg.swarmBase] : ['']);
        setTranslationEngine((cfg as any).translationEngine ?? 'ollama');
        setTranslationOllamaModel((cfg as any).translationOllamaModel ?? '');
        setTranslationClaudeModel((cfg as any).translationClaudeModel ?? 'claude-sonnet-4-5');
        setTranslationPrompt((cfg as any).translationPrompt ?? '');
      })
      .catch(() => {});
  }, [open]);

  function updateBase(index: number, value: string) {
    setSwarmBases((prev) => prev.map((b, i) => (i === index ? value : b)));
  }
  function addBase() {
    setSwarmBases((prev) => [...prev, '']);
  }
  function removeBase(index: number) {
    setSwarmBases((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      // Trim and drop empty entries before persisting
      const cleaned = swarmBases.map((b) => b.trim()).filter((b) => b.length > 0);
      await saveEditorConfig({
        ollamaBase,
        swarmBases: cleaned,
        translationEngine,
        translationOllamaModel: translationOllamaModel.trim() || undefined,
        translationClaudeModel: translationClaudeModel.trim() || undefined,
        translationPrompt: translationPrompt.trim() || undefined,
      } as any);
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
            <label style={lbl}>Ollama address</label>
            <input
              type="text"
              value={ollamaBase}
              onChange={(e) => setOllamaBase(e.target.value)}
              placeholder="http://localhost:11434"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>
              SwarmUI addresses ({swarmBases.length})
            </label>
            {swarmBases.map((base, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-faint)', width: 14, textAlign: 'right' }}>
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={base}
                  onChange={(e) => updateBase(i, e.target.value)}
                  placeholder={i === 0 ? 'http://localhost:7801' : 'http://second-machine:7801'}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => removeBase(i)}
                  style={miniBtn}
                  title="Remove this backend"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addBase}
              style={{ ...miniBtn, marginTop: 2 }}
              title="Add another SwarmUI backend"
            >
              + Add backend
            </button>
            <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginTop: 4, lineHeight: 1.5 }}>
              When generating multiple images, requests are split across backends in
              parallel (round-robin). Useful if you have a second GPU machine running SwarmUI.
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, marginBottom: 10 }}>
            <div style={{ ...lbl, color: 'var(--color-text-muted)', marginBottom: 6 }}>Translation (✦ buttons)</div>

            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Engine</label>
              <select
                value={translationEngine}
                onChange={(e) => setTranslationEngine(e.target.value as 'ollama' | 'claude')}
                style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '4px 8px', fontSize: 11 }}
              >
                <option value="ollama">Ollama (local)</option>
                <option value="claude">Claude (Anthropic API)</option>
              </select>
            </div>

            {translationEngine === 'ollama' && (
              <div style={{ marginBottom: 8 }}>
                <label style={lbl}>Ollama model (optional override)</label>
                <input
                  type="text"
                  value={translationOllamaModel}
                  onChange={(e) => setTranslationOllamaModel(e.target.value)}
                  placeholder="auto-pick (llama3 or first available)"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {translationEngine === 'claude' && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={lbl}>Claude model</label>
                  <input
                    type="text"
                    value={translationClaudeModel}
                    onChange={(e) => setTranslationClaudeModel(e.target.value)}
                    placeholder="claude-sonnet-4-5"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 8, lineHeight: 1.5 }}>
                  Set <code>ANTHROPIC_API_KEY</code> in your shell or a <code>.env</code> file
                  read by the editor server. Not stored in <code>editor-config.json</code>.
                </div>
              </>
            )}

            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>System prompt (optional)</label>
              <textarea
                value={translationPrompt}
                onChange={(e) => setTranslationPrompt(e.target.value)}
                placeholder={`Default: "You are a professional translator… Translate from {{from}} to {{to}}…"`}
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
              />
              <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginTop: 2 }}>
                <code>{'{{from}}'}</code> / <code>{'{{to}}'}</code> are replaced with the locale names.
              </div>
            </div>
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
