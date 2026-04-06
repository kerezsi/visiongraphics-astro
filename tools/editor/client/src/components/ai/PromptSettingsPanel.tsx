import React, { useEffect, useState } from 'react';
import { getEditorConfig, saveEditorConfig } from '../../lib/api-client.ts';
import type { OllamaSystemPrompt } from '../../lib/api-client.ts';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const lbl: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 3,
};

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

const row: React.CSSProperties = { display: 'flex', gap: 4, alignItems: 'center' };

function SaveAsWidget({ onSave, placeholder }: { onSave: (name: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  function commit() {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    setOpen(false);
  }
  if (!open) return <button style={miniBtn()} onClick={() => setOpen(true)}>Save as…</button>;
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
// Task prompt definitions
// ---------------------------------------------------------------------------

interface TaskPromptDef {
  key: string;
  label: string;
  description: string;
  default: string;
}

const TASK_PROMPTS: TaskPromptDef[] = [
  {
    key: 'bannerSubject',
    label: 'Banner Subject',
    description: 'System prompt for deriving a cinematic image subject from page content (used by ✦ Generate)',
    default:
      'Extract the essence of the following text, and synthetize it as an image. ' +
      'Describe the subject of this image in 3-4 sentences. ' +
      'Only write about the subject, and nothing about the style and the composition.',
  },
  {
    key: 'chat',
    label: 'Chat',
    description: 'System context for the free-form Ollama chat panel',
    default:
      'You are a professional copywriter for an architectural visualization studio. Be concise and direct.',
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    description: 'Instruction for excerpt generation — page title and content are provided as the user message',
    default:
      'Write a 1-2 sentence excerpt (under 200 characters total) for an article or page. ' +
      'Respond with ONLY the excerpt text. No preamble, no quotes, no explanation.',
  },
  {
    key: 'caption',
    label: 'Caption',
    description: 'Instruction for SectionBanner label + title suggestions — page context is provided as the user message. Must include LABEL: / TITLE: format.',
    default:
      'You are writing section headings for an architectural visualization studio website. ' +
      'Given the context, suggest a short banner label (2-4 words, ALL CAPS style) and a section title (4-8 words, title case). ' +
      'Respond in this exact format:\nLABEL: <label text>\nTITLE: <title text>\nNothing else.',
  },
  {
    key: 'paragraph',
    label: 'Paragraph',
    description: 'System context for paragraph writing / rewriting',
    default:
      'You are a professional copywriter for an architectural visualization studio (Vision Graphics Kft, Budapest). ' +
      'Write in a clear, confident, professional tone. No fluff. No clichés. ' +
      'Respond with ONLY the paragraph text. No preamble, no quotes, no explanation.',
  },
  {
    key: 'summaryDescription',
    label: 'Description',
    description: 'Instruction for project description generation',
    default:
      'Write a 1-2 sentence project description (under 200 characters) suitable for card listings and meta tags. Respond with ONLY the text.',
  },
  {
    key: 'summaryStory',
    label: 'Project Story',
    description: 'Instruction for project story/background writing',
    default:
      "Write a 2-3 paragraph project background story describing the client's situation, goals, and challenges. Respond with ONLY the text.",
  },
  {
    key: 'summaryTasks',
    label: 'Project Tasks',
    description: 'Instruction for project tasks writing (what Vision Graphics did)',
    default:
      'Write 2-3 paragraphs describing what Vision Graphics specifically did on this project (techniques used, process, deliverables). Respond with ONLY the text.',
  },
];

// ---------------------------------------------------------------------------
// TaskPromptRow — single expandable row
// ---------------------------------------------------------------------------

function TaskPromptRow({
  def,
  savedValue,
  onSave,
}: {
  def: TaskPromptDef;
  savedValue: string;
  onSave: (key: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const isCustom = !!savedValue;

  useEffect(() => {
    if (open) setText(savedValue || def.default);
  }, [open]);

  function handleSave() {
    onSave(def.key, text);
    setOpen(false);
  }

  function handleReset() {
    onSave(def.key, '');
    setText(def.default);
    setOpen(false);
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6,
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 9,
          width: 38, flexShrink: 0,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          color: isCustom ? 'var(--color-accent)' : 'var(--color-text-faint)',
          fontWeight: isCustom ? 600 : 400,
        }}>
          {isCustom ? '✎ custom' : 'default'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flex: 1 }}>{def.label}</span>
        <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ paddingBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 5, lineHeight: 1.4 }}>
            {def.description}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            style={{ width: '100%', resize: 'vertical', fontSize: 11, fontFamily: 'monospace', marginBottom: 5 }}
          />
          <div style={{ ...row, flexWrap: 'wrap' }}>
            <button style={miniBtn(true)} onClick={handleSave}>Save</button>
            {isCustom && (
              <button style={miniBtn()} onClick={handleReset} title="Revert to built-in default">
                Reset to default
              </button>
            )}
            <button style={miniBtn()} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PromptSettingsPanel
// ---------------------------------------------------------------------------

export function PromptSettingsPanel() {
  const [open, setOpen] = useState(false);

  // System prompts state
  const [systemPrompts, setSystemPrompts] = useState<OllamaSystemPrompt[]>([]);
  const [activeName, setActiveName] = useState('');
  const [editText, setEditText] = useState('');

  // Task prompts state
  const [taskPrompts, setTaskPrompts] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!open) return;
    getEditorConfig().then((cfg) => {
      setSystemPrompts(cfg.ollamaSystemPrompts ?? []);
      setActiveName(cfg.activeSystemPromptName ?? '');
      const found = (cfg.ollamaSystemPrompts ?? []).find((p) => p.name === (cfg.activeSystemPromptName ?? ''));
      setEditText(found?.text ?? '');
      setTaskPrompts(cfg.ollamaTaskPrompts ?? {});
    }).catch(() => {});
  }, [open]);

  // --- System prompt actions ---
  async function persistSystemPrompts(prompts: OllamaSystemPrompt[], name: string) {
    await saveEditorConfig({ ollamaSystemPrompts: prompts, activeSystemPromptName: name });
    setSystemPrompts(prompts);
    setActiveName(name);
  }

  function handleSelectPrompt(name: string) {
    setActiveName(name);
    const found = systemPrompts.find((p) => p.name === name);
    setEditText(found?.text ?? '');
    saveEditorConfig({ activeSystemPromptName: name }).catch(() => {});
  }

  function handleUpdateSystem() {
    if (!activeName) return;
    const updated = systemPrompts.map((p) => p.name === activeName ? { ...p, text: editText } : p);
    persistSystemPrompts(updated, activeName);
  }

  function handleSaveAsSystem(name: string) {
    const updated = [...systemPrompts.filter((p) => p.name !== name), { name, text: editText }];
    persistSystemPrompts(updated, name);
  }

  function handleDeleteSystem() {
    if (!activeName) return;
    const updated = systemPrompts.filter((p) => p.name !== activeName);
    persistSystemPrompts(updated, '');
    setEditText('');
  }

  // --- Task prompt actions ---
  async function handleSaveTask(key: string, text: string) {
    const updated = { ...taskPrompts, [key]: text };
    if (!text) delete updated[key];
    await saveEditorConfig({ ollamaTaskPrompts: updated });
    setTaskPrompts(updated);
  }

  const sep = <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0' }} />;

  return (
    <div style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', cursor: 'pointer',
          color: 'var(--color-text-faint)', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}
      >
        <span>Prompt Settings</span>
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>

          {/* ── System Prompts ── */}
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>System Prompts</label>
            <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 6, lineHeight: 1.4 }}>
              Applied to banner-subject generation and chat. Overrides the task prompt when active.
            </div>
            <div style={{ ...row, marginBottom: 6 }}>
              <select
                value={activeName}
                onChange={(e) => handleSelectPrompt(e.target.value)}
                style={{ flex: 1, fontSize: 11 }}
              >
                <option value="">— none —</option>
                {systemPrompts.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              {activeName && (
                <button style={miniBtn()} onClick={handleDeleteSystem} title="Delete">✕</button>
              )}
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              placeholder="Write a system prompt, then save it with a name…"
              style={{ width: '100%', resize: 'vertical', fontSize: 11, fontFamily: 'monospace', marginBottom: 5 }}
            />
            <div style={{ ...row, flexWrap: 'wrap' }}>
              {activeName && (
                <button style={miniBtn(true)} onClick={handleUpdateSystem} disabled={!editText.trim()}>
                  Update
                </button>
              )}
              <SaveAsWidget onSave={handleSaveAsSystem} placeholder="Name…" />
            </div>
            {activeName && (
              <div style={{ marginTop: 5, fontSize: 9, color: 'var(--color-text-faint)' }}>
                Active: <strong style={{ color: 'var(--color-text-muted)' }}>{activeName}</strong>
              </div>
            )}
          </div>

          {sep}

          {/* ── Task Prompts ── */}
          <div>
            <label style={lbl}>Task Prompts</label>
            <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 6, lineHeight: 1.4 }}>
              Per-endpoint system instructions. ✎ custom = overridden from default.
            </div>
            {TASK_PROMPTS.map((def) => (
              <TaskPromptRow
                key={def.key}
                def={def}
                savedValue={taskPrompts[def.key] ?? ''}
                onSave={handleSaveTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
