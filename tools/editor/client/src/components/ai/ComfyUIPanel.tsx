import React, { useCallback, useEffect, useState } from 'react';
import { useAIStore } from '../../store/ai.ts';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';
import {
  swarmGenerate,
  getSwarmModels,
  getSwarmGallery,
  getEditorConfig,
  saveEditorConfig,
  generateBannerSubject,
} from '../../lib/api-client.ts';
import type { SwarmStyle, SwarmPromptItem } from '../../lib/api-client.ts';

// ---------------------------------------------------------------------------
// Dimension helpers
// ---------------------------------------------------------------------------

const SIZES = [1024, 1328, 1536, 2048] as const;
type Size = (typeof SIZES)[number];

const FORMATS = ['21:9', '2:1', '16:9', '1:1', '9:16'] as const;
type Format = (typeof FORMATS)[number];

const FORMAT_RATIOS: Record<Format, [number, number]> = {
  '21:9': [21, 9],
  '2:1':  [2, 1],
  '16:9': [16, 9],
  '1:1':  [1, 1],
  '9:16': [9, 16],
};

function calcDimensions(base: Size, fmt: Format): { width: number; height: number } {
  const [rw, rh] = FORMAT_RATIOS[fmt];
  const area = base * base;
  return {
    width:  Math.round(Math.sqrt(area * rw / rh) / 8) * 8,
    height: Math.round(Math.sqrt(area * rh / rw) / 8) * 8,
  };
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const lbl: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 3,
};

const row: React.CSSProperties = { display: 'flex', gap: 4, alignItems: 'center' };

const miniBtn = (accent?: boolean): React.CSSProperties => ({
  flexShrink: 0,
  background: accent ? 'var(--color-accent)' : 'none',
  border: '1px solid ' + (accent ? 'var(--color-accent)' : 'var(--color-border)'),
  color: accent ? '#fff' : 'var(--color-text-faint)',
  borderRadius: 'var(--radius-sm)',
  padding: '3px 7px',
  fontSize: 10,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

function StatusDot({ available }: { available: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: available ? '#22c55e' : '#6b7280', marginRight: 5, flexShrink: 0,
    }} />
  );
}

// ---------------------------------------------------------------------------
// Inline save-with-name widget
// ---------------------------------------------------------------------------
function SaveAsWidget({
  onSave,
  placeholder,
}: {
  onSave: (name: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  function commit() {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    setOpen(false);
  }

  if (!open) {
    return <button style={miniBtn()} onClick={() => setOpen(true)}>Save…</button>;
  }
  return (
    <div style={{ display: 'flex', gap: 3, flex: 1 }}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder={placeholder}
        style={{ flex: 1, fontSize: 10, padding: '2px 5px' }}
      />
      <button style={miniBtn(true)} onClick={commit}>OK</button>
      <button style={miniBtn()} onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
export function ComfyUIPanel() {
  const swarmAvailable = useAIStore((s) => s.swarmAvailable);
  const ollamaAvailable = useAIStore((s) => s.ollamaAvailable);
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const blocks = useDocumentStore((s) => s.blocks);
  const selectedBlockId = useUIStore((s) => s.selectedBlockId);
  const setError = useUIStore((s) => s.setError);

  // Config-backed state
  const [savedModels, setSavedModels] = useState<string[]>([]);
  const [swarmModels, setSwarmModels] = useState<string[]>([]); // from SwarmUI
  const [savedStyles, setSavedStyles] = useState<SwarmStyle[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SwarmPromptItem[]>([]);

  // Form state
  const [model, setModel] = useState('');
  const [size, setSize] = useState<Size>(1024);
  const [format, setFormat] = useState<Format>('16:9');
  const [styleName, setStyleName] = useState('');
  const [prompt, setPrompt] = useState('');

  // Block picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [lastSubject, setLastSubject] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<Array<{ filename: string; url: string }>>([]);
  const [gallery, setGallery] = useState<Array<{ filename: string; url: string }>>([]);

  const { width, height } = calcDimensions(size, format);

  // Load config + gallery on mount
  useEffect(() => {
    getEditorConfig().then((cfg) => {
      setSavedModels(cfg.swarmModels ?? []);
      setSavedStyles(cfg.swarmStyles ?? []);
      setSavedPrompts(cfg.swarmPrompts ?? []);
    }).catch(() => {});
    getSwarmGallery().then(setGallery).catch(() => {});
  }, []);

  // Fetch models from SwarmUI when it becomes available
  useEffect(() => {
    if (!swarmAvailable) return;
    getSwarmModels().then(setSwarmModels).catch(() => {});
  }, [swarmAvailable]);

  const refreshGallery = useCallback(() => {
    getSwarmGallery().then(setGallery).catch(() => {});
  }, []);

  async function persistConfig(updates: {
    swarmModels?: string[];
    swarmStyles?: SwarmStyle[];
    swarmPrompts?: SwarmPromptItem[];
  }) {
    const cfg = await saveEditorConfig(updates);
    if (updates.swarmModels) setSavedModels(cfg.swarmModels ?? []);
    if (updates.swarmStyles) setSavedStyles(cfg.swarmStyles ?? []);
    if (updates.swarmPrompts) setSavedPrompts(cfg.swarmPrompts ?? []);
  }

  // Compute all models: swarm-fetched + saved extras (deduped)
  const allModels = [...new Set([...swarmModels, ...savedModels])];

  // --- Model actions ---
  function handleSaveModel() {
    const m = model.trim();
    if (!m || savedModels.includes(m)) return;
    persistConfig({ swarmModels: [...savedModels, m] });
  }
  function handleDeleteModel(m: string) {
    persistConfig({ swarmModels: savedModels.filter((x) => x !== m) });
    if (model === m) setModel('');
  }

  // --- Style actions ---
  function handleSaveStyle(name: string) {
    if (!prompt.trim()) return;
    const updated = [...savedStyles.filter((s) => s.name !== name), { name, text: prompt.trim() }];
    persistConfig({ swarmStyles: updated });
  }
  function handleDeleteStyle(name: string) {
    persistConfig({ swarmStyles: savedStyles.filter((s) => s.name !== name) });
    if (styleName === name) setStyleName('');
  }
  function handleLoadStyle(name: string) {
    const s = savedStyles.find((x) => x.name === name);
    if (s) setPrompt(s.text);
  }

  // --- Prompt actions ---
  function handleSavePrompt(name: string) {
    if (!prompt.trim()) return;
    const updated = [...savedPrompts.filter((p) => p.name !== name), { name, text: prompt.trim() }];
    persistConfig({ swarmPrompts: updated });
  }
  function handleLoadPrompt(name: string) {
    const p = savedPrompts.find((x) => x.name === name);
    if (p) setPrompt(p.text);
  }
  function handleDeletePrompt(name: string) {
    persistConfig({ swarmPrompts: savedPrompts.filter((p) => p.name !== name) });
  }

  // --- Block text extraction ---
  function extractText(b: any): string {
    const p = b.props ?? {};
    const parts: string[] = [];
    if (typeof p.text === 'string' && p.text) parts.push(p.text);
    if (typeof p.html === 'string') parts.push(p.html.replace(/<[^>]+>/g, ' ').trim());
    if (typeof p.label === 'string' && p.label) parts.push(p.label);
    if (typeof p.title === 'string' && p.title) parts.push(p.title);
    for (const key of ['children', 'left', 'right', 'items'] as const) {
      if (Array.isArray(p[key])) parts.push(...p[key].map((c: any) => extractText(c)));
    }
    return parts.filter(Boolean).join(' ').trim();
  }

  const textBlocks = blocks
    .map((b: any) => ({ id: b.id, type: b.type as string, text: extractText(b) }))
    .filter((b) => b.text.length > 3);

  function toggleBlock(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // --- Banner subject from page/section content via Ollama ---
  async function handleSubjectFromContent() {
    const hasBlocks = checkedIds.size > 0;
    const hasPageMeta = !!(meta.title || meta.description || (Array.isArray(meta.tags) && (meta.tags as string[]).length));
    if (!hasBlocks && !hasPageMeta) {
      setSubjectError('Open a page in the editor or select blocks first');
      return;
    }

    setSubjectLoading(true);
    setLastSubject(null);
    setSubjectError(null);
    setPickerOpen(false);
    try {
      let bodyText: string | undefined;
      let sectionLabel: string | undefined;
      let sectionTitle: string | undefined;

      if (checkedIds.size > 0) {
        const pickedBlocks = (blocks as any[]).filter((b) => checkedIds.has(b.id));
        const sectionBanner = pickedBlocks.find((b) => b.type === 'section-banner');
        if (sectionBanner) {
          sectionLabel = sectionBanner.props?.label;
          sectionTitle = sectionBanner.props?.title;
        }
        bodyText = pickedBlocks.map((b) => extractText(b)).filter(Boolean).join('\n');
      } else {
        const sel = selectedBlockId ? (blocks as any[]).find((b) => b.id === selectedBlockId) : null;
        if (sel?.type === 'section-banner') {
          sectionLabel = sel.props?.label;
          sectionTitle = sel.props?.title;
        }
      }

      const subject = await generateBannerSubject({
        title:       (meta.title as string) ?? '',
        description: (meta.description as string) ?? '',
        tags:        Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
        sectionLabel,
        sectionTitle,
        bodyText,
      });

      if (subject) {
        setPrompt(subject);
        setLastSubject(subject);
        setCheckedIds(new Set());
      } else {
        setSubjectError('Ollama returned an empty response — try a different model or select more content');
      }
    } catch (e) {
      setSubjectError(e instanceof Error ? e.message : 'Failed to generate subject');
    } finally {
      setSubjectLoading(false);
    }
  }

  // --- Generate ---
  const selectedStyle = savedStyles.find((s) => s.name === styleName);
  const effectivePrompt = selectedStyle
    ? `${prompt.trim()}, ${selectedStyle.text}`.replace(/^, |, $/, '')
    : prompt.trim();

  async function handleGenerate() {
    if (!effectivePrompt || generating) return;
    setGenerating(true);
    setOutputImages([]);
    try {
      const result = await swarmGenerate({
        prompt: effectivePrompt,
        model: model.trim() || undefined,
        width,
        height,
        pageType,
        slug,
      });
      setOutputImages(result.images ?? []);
      refreshGallery();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SwarmUI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  const sep = <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />;

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <StatusDot available={swarmAvailable} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>SwarmUI</span>
        {!swarmAvailable && (
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>— not available</span>
        )}
      </div>

      {swarmAvailable && (
        <>
          {/* ── Model ── */}
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Model</label>
            <div style={row}>
              <input
                list="swarm-model-list"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="(use current)"
                style={{ flex: 1, fontSize: 11 }}
              />
              <datalist id="swarm-model-list">
                {allModels.map((m) => <option key={m} value={m} />)}
              </datalist>
              {model.trim() && !savedModels.includes(model.trim()) && (
                <button style={miniBtn()} onClick={handleSaveModel} title="Save to list">+</button>
              )}
              {model.trim() && savedModels.includes(model.trim()) && (
                <button style={miniBtn()} onClick={() => handleDeleteModel(model.trim())} title="Remove from saved">✕</button>
              )}
            </div>
            {swarmModels.length === 0 && (
              <button
                style={{ ...miniBtn(), marginTop: 4, fontSize: 9 }}
                onClick={() => getSwarmModels().then(setSwarmModels).catch(() => {})}
              >
                ↻ Fetch models from SwarmUI
              </button>
            )}
          </div>

          {sep}

          {/* ── Size & Format ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ ...row, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Size</label>
                <select value={size} onChange={(e) => setSize(Number(e.target.value) as Size)} style={{ width: '100%' }}>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as Format)} style={{ width: '100%' }}>
                  {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-faint)', textAlign: 'right' }}>
              {width} × {height} px
            </div>
          </div>

          {sep}

          {/* ── Style ── */}
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Style</label>
            <div style={row}>
              <select
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                style={{ flex: 1, fontSize: 11 }}
              >
                <option value="">— none —</option>
                {savedStyles.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              {styleName && (
                <>
                  <button style={miniBtn()} onClick={() => handleLoadStyle(styleName)} title="Load into prompt">↓</button>
                  <button style={miniBtn()} onClick={() => handleDeleteStyle(styleName)} title="Delete style">✕</button>
                </>
              )}
            </div>
            {styleName && savedStyles.find(s => s.name === styleName) && (
              <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginTop: 3, fontStyle: 'italic', wordBreak: 'break-word' }}>
                +{savedStyles.find(s => s.name === styleName)!.text}
              </div>
            )}
            <div style={{ ...row, marginTop: 4 }}>
              <SaveAsWidget onSave={handleSaveStyle} placeholder="Style name…" />
              <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>saves current prompt as style</span>
            </div>
          </div>

          {sep}

          {/* ── Prompt ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ ...row, marginBottom: 4 }}>
              <label style={{ ...lbl, marginBottom: 0, flex: 1 }}>Prompt</label>
              {ollamaAvailable && (
                <>
                  <button
                    style={miniBtn(pickerOpen)}
                    onClick={() => setPickerOpen((v) => !v)}
                    title="Select blocks to generate subject from"
                  >
                    ☰ {checkedIds.size > 0 ? `${checkedIds.size} block${checkedIds.size > 1 ? 's' : ''}` : 'Blocks'}
                  </button>
                  <button
                    style={miniBtn()}
                    onClick={handleSubjectFromContent}
                    disabled={subjectLoading}
                    title={checkedIds.size > 0 ? 'Generate subject from selected blocks' : 'Generate subject from page meta'}
                  >
                    {subjectLoading ? '…' : '✦ Generate'}
                  </button>
                </>
              )}
            </div>

            {/* Block picker */}
            {pickerOpen && textBlocks.length > 0 && (
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 6,
                maxHeight: 160,
                overflowY: 'auto',
              }}>
                {textBlocks.map((b) => (
                  <label
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      background: checkedIds.has(b.id) ? 'var(--color-surface-2)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(b.id)}
                      onChange={() => toggleBlock(b.id)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 1 }}>
                        {b.type}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.text.slice(0, 70)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {subjectLoading && (
              <div style={{ fontSize: 10, color: 'var(--color-text-faint)', fontStyle: 'italic', marginBottom: 4 }}>
                Asking Ollama…
              </div>
            )}
            {subjectError && !subjectLoading && (
              <div style={{ fontSize: 10, color: 'var(--color-accent)', marginBottom: 4, wordBreak: 'break-word' }}>
                ✕ {subjectError}
              </div>
            )}
            {lastSubject && !subjectLoading && (
              <div style={{
                fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '4px 8px', marginBottom: 4, fontStyle: 'italic',
              }}>
                ✦ {lastSubject}
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Modern glass office building, daylight, photorealistic…"
              style={{ width: '100%', resize: 'vertical', fontSize: 11 }}
            />
            <div style={{ ...row, marginTop: 4 }}>
              {savedPrompts.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) handleLoadPrompt(e.target.value); e.target.value = ''; }}
                  style={{ flex: 1, fontSize: 10 }}
                >
                  <option value="">Load prompt…</option>
                  {savedPrompts.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              )}
              <SaveAsWidget onSave={handleSavePrompt} placeholder="Prompt name…" />
            </div>
            {savedPrompts.length > 0 && (
              <div style={{ ...row, flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                {savedPrompts.map((p) => (
                  <button
                    key={p.name}
                    style={{ ...miniBtn(), display: 'flex', alignItems: 'center', gap: 3 }}
                    onClick={() => handleDeletePrompt(p.name)}
                    title={`Delete "${p.name}"`}
                  >
                    {p.name} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Generate ── */}
          <button
            onClick={handleGenerate}
            disabled={generating || !effectivePrompt}
            style={{
              width: '100%',
              background: 'var(--color-accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 0',
              fontSize: 11,
              fontWeight: 600,
              cursor: generating || !effectivePrompt ? 'default' : 'pointer',
              opacity: generating || !effectivePrompt ? 0.6 : 1,
              marginBottom: 8,
            }}
          >
            {generating ? 'Generating…' : `Generate  ${width}×${height}`}
          </button>

          {/* ── Output ── */}
          {outputImages.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {outputImages.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt="Generated"
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', display: 'block', marginBottom: 4 }}
                />
              ))}
              <button
                onClick={() => setOutputImages([])}
                style={{ ...miniBtn(), width: '100%', textAlign: 'center' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* ── Gallery ── */}
          {gallery.length > 0 && (
            <div>
              <div style={{ ...lbl, marginBottom: 4 }}>Recent</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {gallery.slice(0, 12).map((img) => (
                  <img
                    key={img.filename}
                    src={img.url}
                    alt={img.filename}
                    title={img.filename}
                    style={{
                      width: 48, height: 48, objectFit: 'cover',
                      borderRadius: 3, cursor: 'pointer',
                      border: outputImages.some(o => o.filename === img.filename)
                        ? '2px solid var(--color-accent)' : '2px solid transparent',
                    }}
                    onClick={() => setOutputImages([img])}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
