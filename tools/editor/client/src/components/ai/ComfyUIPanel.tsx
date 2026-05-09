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
  openSwarmOutputFolder,
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
  const aiBlockSelectMode = useUIStore((s) => s.aiBlockSelectMode);
  const aiSelectedBlockIds = useUIStore((s) => s.aiSelectedBlockIds);
  const setAiBlockSelectMode = useUIStore((s) => s.setAiBlockSelectMode);
  const clearAiSelectedBlocks = useUIStore((s) => s.clearAiSelectedBlocks);

  const swarmAvailable   = useAIStore((s) => s.swarmAvailable);
  const ollamaAvailable  = useAIStore((s) => s.ollamaAvailable);
  const selectedModel    = useAIStore((s) => s.selectedModel);
  const swarmModel      = useAIStore((s) => s.swarmModel);
  const swarmSize       = useAIStore((s) => s.swarmSize);
  const swarmFormat     = useAIStore((s) => s.swarmFormat);
  const swarmSteps      = useAIStore((s) => s.swarmSteps);
  const swarmCfg        = useAIStore((s) => s.swarmCfg);
  const swarmSampler    = useAIStore((s) => s.swarmSampler);
  const swarmScheduler  = useAIStore((s) => s.swarmScheduler);
  const swarmStyleName  = useAIStore((s) => s.swarmStyleName);
  const swarmPrompt     = useAIStore((s) => s.swarmPrompt);
  const swarmImageCount = useAIStore((s) => s.swarmImageCount);
  const setSwarmForm    = useAIStore((s) => s.setSwarmForm);
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

  // Form state — backed by AI store so it survives tab/page switches
  const model      = swarmModel;
  const size       = swarmSize as Size;
  const format     = swarmFormat as Format;
  const steps      = swarmSteps;
  const cfg        = swarmCfg;
  const sampler    = swarmSampler;
  const scheduler  = swarmScheduler;
  const styleName  = swarmStyleName;
  const prompt     = swarmPrompt;
  const imageCount = swarmImageCount;

  const setModel      = (v: string)  => setSwarmForm({ swarmModel: v });
  const setSize       = (v: Size)    => setSwarmForm({ swarmSize: v });
  const setFormat     = (v: Format)  => setSwarmForm({ swarmFormat: v });
  const setSteps      = (v: number)  => setSwarmForm({ swarmSteps: v });
  const setCfg        = (v: number)  => setSwarmForm({ swarmCfg: v });
  const setSampler    = (v: string)  => setSwarmForm({ swarmSampler: v });
  const setScheduler  = (v: string)  => setSwarmForm({ swarmScheduler: v });
  const setStyleName  = (v: string)  => setSwarmForm({ swarmStyleName: v });
  const setPrompt     = (v: string)  => setSwarmForm({ swarmPrompt: v });
  const setImageCount = (v: number)  => setSwarmForm({ swarmImageCount: v });

  // (block selection state lives in UIStore — aiBlockSelectMode / aiSelectedBlockIds)

  // Generation state — track concurrent in-flight generations so the user can
  // queue more work while a previous one is still running. Each in-flight
  // request has its own ID so the UI can show "Generating: 3" etc.
  const [inflight, setInflight] = useState<string[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [lastSubject, setLastSubject] = useState<string | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<string | null>(null); // text being sent
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<Array<{ filename: string; url: string }>>([]);
  const [gallery, setGallery] = useState<Array<{ filename: string; url: string }>>([]);

  // Lightbox state — clicking a generated image or gallery thumb opens it full-screen
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const generating = inflight.length > 0;

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
    // Plain string (e.g. items in results-list)
    if (typeof b === 'string') return b.trim();
    const p = b.props ?? b ?? {};
    const parts: string[] = [];
    if (typeof p.text === 'string' && p.text) parts.push(p.text);
    if (typeof p.html === 'string') parts.push(p.html.replace(/<[^>]+>/g, ' ').trim());
    if (typeof p.label === 'string' && p.label) parts.push(p.label);
    if (typeof p.title === 'string' && p.title) parts.push(p.title);
    if (typeof p.heading === 'string' && p.heading) parts.push(p.heading);
    if (typeof p.content === 'string' && p.content) parts.push(p.content);
    if (typeof p.desc === 'string' && p.desc) parts.push(p.desc);
    if (typeof p.caption === 'string' && p.caption) parts.push(p.caption);
    for (const key of ['children', 'left', 'right', 'items', 'rows', 'blocks'] as const) {
      if (Array.isArray(p[key])) parts.push(...p[key].map((c: any) => extractText(c)));
    }
    return parts.filter(Boolean).join(' ').trim();
  }


  // --- Banner subject from page/section content via Ollama ---
  async function handleSubjectFromContent() {
    const hasBlocks = aiSelectedBlockIds.length > 0;
    const hasPageMeta = !!(meta.title || meta.description || (Array.isArray(meta.tags) && (meta.tags as string[]).length));
    if (!hasBlocks && !hasPageMeta) {
      setSubjectError('Open a page in the editor or select blocks first');
      return;
    }

    setSubjectLoading(true);
    setLastSubject(null);
    setSubjectPreview(null);
    setSubjectError(null);
    try {
      let bodyText: string | undefined;
      let sectionLabel: string | undefined;
      let sectionTitle: string | undefined;
      // When blocks are selected, send ONLY block text — no page meta.
      // This forces the LLM to derive from the selected content, not generic title/tags.
      let useMetaFallback = true;

      if (aiSelectedBlockIds.length > 0) {
        useMetaFallback = false;
        const pickedBlocks = (blocks as any[]).filter((b) => aiSelectedBlockIds.includes(b.id));
        const sectionBanner = pickedBlocks.find((b) => b.type === 'section-banner');
        if (sectionBanner) {
          sectionLabel = sectionBanner.props?.label;
          sectionTitle = sectionBanner.props?.title;
        }
        bodyText = pickedBlocks.map((b) => extractText(b)).filter(Boolean).join('\n\n');
        if (!bodyText && !sectionLabel && !sectionTitle) {
          setSubjectError('No text found in selected blocks — select blocks with text content');
          return;
        }
        setSubjectPreview((bodyText ?? `${sectionLabel ?? ''} ${sectionTitle ?? ''}`).trim().slice(0, 200));
      } else {
        const sel = selectedBlockId ? (blocks as any[]).find((b) => b.id === selectedBlockId) : null;
        if (sel?.type === 'section-banner') {
          sectionLabel = sel.props?.label;
          sectionTitle = sel.props?.title;
          useMetaFallback = false;
        }
      }

      const subject = await generateBannerSubject({
        title:       useMetaFallback ? ((meta.title as string) ?? '') : undefined,
        description: useMetaFallback ? ((meta.description as string) ?? '') : undefined,
        tags:        useMetaFallback && Array.isArray(meta.tags) ? (meta.tags as string[]) : undefined,
        sectionLabel,
        sectionTitle,
        bodyText,
        model:       selectedModel || undefined,
      });

      if (subject) {
        setPrompt(subject);
        setLastSubject(subject);
        clearAiSelectedBlocks();
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
    if (!effectivePrompt) return;
    // Allow queuing multiple generations: track each in-flight job by id.
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setInflight((prev) => [...prev, jobId]);
    try {
      const result = await swarmGenerate({
        prompt: effectivePrompt,
        model: model.trim() || undefined,
        width,
        height,
        steps,
        cfgscale: cfg,
        sampler: sampler.trim() || undefined,
        scheduler: scheduler.trim() || undefined,
        images: imageCount,
        pageType,
        slug,
      });
      // Append new images to the end so older results stay visible.
      // (User can still click "Clear" to reset.)
      setOutputImages((prev) => [...prev, ...(result.images ?? [])]);
      refreshGallery();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SwarmUI generation failed');
    } finally {
      setInflight((prev) => prev.filter((id) => id !== jobId));
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

          {/* ── Steps / CFG / Sampler / Scheduler ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 44px' }}>
                <label style={lbl}>Steps</label>
                <input
                  type="number"
                  value={steps}
                  min={1} max={150}
                  onChange={(e) => setSteps(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', fontSize: 11 }}
                />
              </div>
              <div style={{ flex: '0 0 44px' }}>
                <label style={lbl}>CFG</label>
                <input
                  type="number"
                  value={cfg}
                  min={0} max={30} step={0.5}
                  onChange={(e) => setCfg(Math.max(0, Number(e.target.value)))}
                  style={{ width: '100%', fontSize: 11 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Sampler</label>
                <input
                  list="swarm-sampler-list"
                  value={sampler}
                  onChange={(e) => setSampler(e.target.value)}
                  style={{ width: '100%', fontSize: 11 }}
                />
                <datalist id="swarm-sampler-list">
                  {['euler', 'euler_cfg_pp', 'euler_ancestral', 'dpmpp_2m', 'dpmpp_2m_sde', 'dpmpp_3m_sde', 'lcm', 'heun', 'ddim'].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Scheduler</label>
                <input
                  list="swarm-scheduler-list"
                  value={scheduler}
                  onChange={(e) => setScheduler(e.target.value)}
                  style={{ width: '100%', fontSize: 11 }}
                />
                <datalist id="swarm-scheduler-list">
                  {['simple', 'normal', 'karras', 'exponential', 'sgm_uniform', 'ddim_uniform', 'beta'].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
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
                    style={miniBtn(aiBlockSelectMode || aiSelectedBlockIds.length > 0)}
                    onClick={() => setAiBlockSelectMode(!aiBlockSelectMode)}
                    title={aiBlockSelectMode ? 'Exit block selection mode' : 'Select blocks in the canvas for AI generation'}
                  >
                    ☰ {aiSelectedBlockIds.length > 0 ? `${aiSelectedBlockIds.length} block${aiSelectedBlockIds.length > 1 ? 's' : ''}` : 'Blocks'}
                  </button>
                  <button
                    style={miniBtn()}
                    onClick={handleSubjectFromContent}
                    disabled={subjectLoading}
                    title={aiSelectedBlockIds.length > 0 ? 'Generate subject from selected blocks' : 'Generate subject from page meta'}
                  >
                    {subjectLoading ? '…' : '✦ Generate'}
                  </button>
                </>
              )}
            </div>

            {subjectLoading && (
              <div style={{ fontSize: 10, color: 'var(--color-text-faint)', fontStyle: 'italic', marginBottom: 4 }}>
                Asking Ollama…
                {subjectPreview && (
                  <div style={{
                    marginTop: 3, fontStyle: 'normal', fontFamily: 'monospace',
                    color: 'var(--color-text-faint)', wordBreak: 'break-word', lineHeight: 1.4,
                  }}>
                    {subjectPreview.length > 120 ? subjectPreview.slice(0, 120) + '…' : subjectPreview}
                  </div>
                )}
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
          <div style={{ ...row, marginBottom: 8 }}>
            <select
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              style={{ width: 44, flexShrink: 0, fontSize: 11, textAlign: 'center' }}
              title="Number of images"
            >
              {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              onClick={handleGenerate}
              disabled={!effectivePrompt}
              style={{
                flex: 1,
                background: 'var(--color-accent)',
                border: 'none',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 0',
                fontSize: 11,
                fontWeight: 600,
                cursor: !effectivePrompt ? 'default' : 'pointer',
                opacity: !effectivePrompt ? 0.6 : 1,
              }}
              title={generating
                ? `${inflight.length} generation${inflight.length > 1 ? 's' : ''} in progress — click to queue another`
                : 'Generate images'}
            >
              {generating
                ? `Generate · ${inflight.length} running…`
                : `Generate  ${width}×${height}`}
            </button>
          </div>
          {generating && (
            <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 8, fontStyle: 'italic' }}>
              {inflight.length} generation{inflight.length > 1 ? 's' : ''} running in background — UI is async, click Generate to queue more
            </div>
          )}

          {/* ── Output ── */}
          {outputImages.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {outputImages.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt="Generated"
                  style={{
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    display: 'block',
                    marginBottom: 4,
                    cursor: 'zoom-in',
                  }}
                  title="Click to view full size"
                  onClick={() => setLightboxUrl(img.url)}
                />
              ))}
              <div style={{ ...row }}>
                <button
                  onClick={() => setOutputImages([])}
                  style={{ ...miniBtn(), flex: 1, textAlign: 'center' }}
                >
                  Clear
                </button>
                <button
                  onClick={() => openSwarmOutputFolder().catch(() => {})}
                  style={miniBtn()}
                  title="Open output folder in Explorer"
                >
                  📁
                </button>
              </div>
            </div>
          )}

          {/* ── Gallery ── */}
          {gallery.length > 0 && (
            <div>
              <div style={{ ...row, marginBottom: 4 }}>
                <span style={{ ...lbl, marginBottom: 0, flex: 1 }}>Recent</span>
                <button
                  onClick={() => openSwarmOutputFolder().catch(() => {})}
                  style={miniBtn()}
                  title="Open output folder in Explorer"
                >
                  📁
                </button>
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {gallery.slice(0, 12).map((img) => (
                  <img
                    key={img.filename}
                    src={img.url}
                    alt={img.filename}
                    title={`${img.filename} — click to view full size, shift-click to load into the panel above`}
                    style={{
                      width: 48, height: 48, objectFit: 'cover',
                      borderRadius: 3, cursor: 'zoom-in',
                      border: outputImages.some(o => o.filename === img.filename)
                        ? '2px solid var(--color-accent)' : '2px solid transparent',
                    }}
                    onClick={(e) => {
                      // Shift-click → keep old behaviour (load into output panel)
                      if (e.shiftKey) {
                        setOutputImages([img]);
                      } else {
                        setLightboxUrl(img.url);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Lightbox overlay ── */}
          {lightboxUrl && (
            <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightbox — full-window overlay for clicked images.
// Click the backdrop or press ESC to close.
// ---------------------------------------------------------------------------
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    // Prevent the page from scrolling while the lightbox is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
        padding: 24,
      }}
      title="Click anywhere or press Esc to close"
    >
      <img
        src={url}
        alt="Full size"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          cursor: 'zoom-out',
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          borderRadius: 'var(--radius-sm)',
          width: 32,
          height: 32,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Close (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
