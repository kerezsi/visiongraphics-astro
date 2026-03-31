import React, { useEffect, useRef, useState } from 'react';
import { useAIStore } from '../../store/ai.ts';
import { useDocumentStore } from '../../store/document.ts';
import { useUIStore } from '../../store/ui.ts';

type WorkflowPreset = 'exterior' | 'interior' | 'abstract';

const WORKFLOW_PRESETS: Array<{ id: WorkflowPreset; label: string }> = [
  { id: 'exterior', label: 'Exterior Concept' },
  { id: 'interior', label: 'Interior Concept' },
  { id: 'abstract', label: 'Abstract Background' },
];

function buildWorkflow(preset: WorkflowPreset, prompt: string): Record<string, unknown> {
  // Simplified workflow stubs — real ComfyUI workflows are JSON node graphs
  return {
    preset,
    prompt,
    nodes: {
      '1': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['2', 1] } },
      '2': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'v1-5-pruned.safetensors' } },
      '3': { class_type: 'KSampler', inputs: { seed: Math.floor(Math.random() * 9999999), steps: 20, cfg: 7, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['2', 0], positive: ['1', 0], negative: ['4', 0], latent_image: ['5', 0] } },
      '4': { class_type: 'CLIPTextEncode', inputs: { text: 'blurry, ugly, bad quality', clip: ['2', 1] } },
      '5': { class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 768, batch_size: 1 } },
      '6': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['2', 2] } },
      '7': { class_type: 'SaveImage', inputs: { images: ['6', 0], filename_prefix: `vg-${preset}` } },
    },
  };
}

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

export function ComfyUIPanel() {
  const { comfyAvailable, activeJob, startComfyJob, updateJob, clearJob } = useAIStore();
  const pageType = useDocumentStore((s) => s.pageType);
  const slug = useDocumentStore((s) => s.slug);
  const setError = useUIStore((s) => s.setError);

  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset>('exterior');
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket for progress
  useEffect(() => {
    if (!comfyAvailable) return;

    const ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}/ws/comfyui`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          jobId: string;
          progress?: number;
          outputUrl?: string;
          error?: string;
        };
        if (data.type === 'progress') {
          updateJob({ progress: data.progress ?? 0 });
        } else if (data.type === 'complete') {
          updateJob({ status: 'complete', outputUrl: data.outputUrl, progress: 100 });
        } else if (data.type === 'error') {
          updateJob({ status: 'error' });
          setError(data.error ?? 'ComfyUI job failed');
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // silent — ws may not be available
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [comfyAvailable]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    try {
      const workflow = buildWorkflow(selectedPreset, prompt);
      await startComfyJob(workflow, pageType, slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ComfyUI generation failed');
    }
  }

  const label: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 3,
  };

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <StatusDot available={comfyAvailable} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>ComfyUI</span>
        {!comfyAvailable && (
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>— not available</span>
        )}
      </div>

      {comfyAvailable && (
        <>
          {/* Workflow preset */}
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Workflow</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {WORKFLOW_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  style={{
                    flex: 1,
                    background: selectedPreset === preset.id ? 'var(--color-accent)' : 'none',
                    border: '1px solid ' + (selectedPreset === preset.id ? 'var(--color-accent)' : 'var(--color-border)'),
                    color: selectedPreset === preset.id ? '#fff' : 'var(--color-text-faint)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 4px',
                    fontSize: 9,
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 8 }}>
            <label style={label}>Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Modern glass office building, daylight, photorealistic..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!!activeJob || !prompt.trim()}
            style={{
              width: '100%',
              background: 'var(--color-accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 0',
              fontSize: 11,
              fontWeight: 600,
              cursor: activeJob || !prompt.trim() ? 'default' : 'pointer',
              opacity: activeJob || !prompt.trim() ? 0.6 : 1,
              marginBottom: 8,
            }}
          >
            Generate Image
          </button>

          {/* Active job progress */}
          {activeJob && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>
                  {activeJob.status === 'complete' ? 'Complete' : activeJob.status === 'error' ? 'Error' : 'Generating…'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>{activeJob.progress}%</span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: 4,
                  background: 'var(--color-border)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${activeJob.progress}%`,
                    height: '100%',
                    background: activeJob.status === 'error' ? 'var(--color-accent)' : '#22c55e',
                    borderRadius: 2,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          {/* Output image */}
          {activeJob?.status === 'complete' && activeJob.outputUrl && (
            <div>
              <img
                src={activeJob.outputUrl}
                alt="Generated image"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-sm)',
                  display: 'block',
                  marginBottom: 6,
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={clearJob}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-faint)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 0',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {activeJob?.status === 'error' && (
            <button
              onClick={clearJob}
              style={{
                width: '100%',
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-faint)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 0',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          )}
        </>
      )}
    </div>
  );
}
