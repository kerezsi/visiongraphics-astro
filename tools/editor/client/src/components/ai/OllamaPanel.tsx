import React, { useState } from 'react';
import { useAIStore } from '../../store/ai.ts';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';

const label: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 3,
};

function StatusDot({ available }: { available: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: available ? '#22c55e' : '#6b7280',
        marginRight: 5,
        flexShrink: 0,
      }}
    />
  );
}

export function OllamaPanel() {
  const { ollamaAvailable, ollamaModels, selectedModel, setSelectedModel, generateText, generateExcerpt } = useAIStore();
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);
  const updateBlock = useDocumentStore((s) => s.updateBlock);
  const blocks = useDocumentStore((s) => s.blocks);
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;

  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [excerptLoading, setExcerptLoading] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim() || !selectedModel) return;
    setIsGenerating(true);
    setResult('');
    try {
      const text = await generateText(prompt, 'You are a professional copywriter for an architectural visualization studio. Be concise and direct.');
      setResult(text);
    } catch (e) {
      setResult('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGenerating(false);
    }
  }

  function applyResult() {
    if (!result || !selectedBlockId) return;
    // Try to apply to the selected block's text/html field
    updateBlock(selectedBlockId, { text: result });
  }

  async function handleGenerateExcerpt() {
    const title = (meta.title as string) ?? '';
    // Collect body text from blocks
    const bodyParts: string[] = [];
    function collectText(list: typeof blocks) {
      for (const b of list) {
        const p = b.props as Record<string, unknown>;
        if ('text' in p && typeof p.text === 'string') bodyParts.push(p.text);
        if ('html' in p && typeof p.html === 'string') bodyParts.push(p.html.replace(/<[^>]+>/g, ' '));
        if ('children' in p && Array.isArray(p.children)) collectText(p.children as typeof blocks);
        if ('left' in p && Array.isArray(p.left)) collectText(p.left as typeof blocks);
        if ('right' in p && Array.isArray(p.right)) collectText(p.right as typeof blocks);
      }
    }
    collectText(blocks);
    const body = bodyParts.join(' ').slice(0, 2000);

    setExcerptLoading(true);
    try {
      const excerpt = await generateExcerpt(title, body);
      setResult(excerpt);
    } catch (e) {
      setResult('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExcerptLoading(false);
    }
  }

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <StatusDot available={ollamaAvailable} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ollama</span>
        {!ollamaAvailable && (
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>— not available</span>
        )}
      </div>

      {ollamaAvailable && (
        <>
          {/* Model selector */}
          <div style={{ marginBottom: 10 }}>
            <label style={label}>Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ width: '100%' }}
            >
              {ollamaModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Prompt area */}
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Write a 2-sentence description for..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            style={{
              width: '100%',
              background: 'var(--color-accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 0',
              fontSize: 11,
              fontWeight: 600,
              cursor: isGenerating ? 'default' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
              marginBottom: 8,
            }}
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>

          {/* Result */}
          {result && (
            <div style={{ marginBottom: 8 }}>
              <label style={label}>Result</label>
              <div
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 8px',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                  overflowY: 'auto',
                  marginBottom: 6,
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result}
              </div>
              {selectedBlockId && (
                <button
                  onClick={applyResult}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 0',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  Apply to selected block
                </button>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 2 }}>Quick actions</div>
            <button
              onClick={handleGenerateExcerpt}
              disabled={excerptLoading}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: 10,
                cursor: excerptLoading ? 'default' : 'pointer',
                textAlign: 'left',
              }}
            >
              {excerptLoading ? 'Generating…' : 'Generate excerpt from content'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
