import type { DevToolbarApp } from 'astro';

// ─── Viewport simulator formula ───────────────────────────────────────────
// html font-size = clamp(1rem, 0.7368rem + 0.8421vw, 2rem)
// In px at a given viewport width vw_px:
//   computed = clamp(16, 0.7368*16 + 0.8421*(vw_px/100), 32)
function computeFontSizePx(vwPx: number): number {
  return Math.min(Math.max(16, 0.7368 * 16 + 0.8421 * (vwPx / 100)), 32);
}

// ─── Token definitions ─────────────────────────────────────────────────────
const COLOR_TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-surface-2',
  '--color-border',
  '--color-accent',
  '--color-text',
  '--color-text-muted',
  '--color-text-faint',
];

const RADIUS_TOKENS = [
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
];

const TYPE_TOKENS = [
  '--fs-h1',
  '--fs-h2',
  '--fs-h3',
  '--fs-h4',
  '--fs-h5',
  '--fs-h6',
  '--fs-body',
  '--fs-small',
  '--fs-xs',
];

const SPACING_TOKENS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-7',
  '--space-8',
  '--space-10',
  '--space-12',
  '--space-16',
  '--space-20',
  '--space-24',
];

// ─── CSS for the panel (injected into shadow DOM) ─────────────────────────
const PANEL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  #te-panel {
    position: fixed;
    top: 56px;
    right: 12px;
    width: 360px;
    max-height: calc(100vh - 72px);
    display: flex;
    flex-direction: column;
    background: #0f0f0f;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    color: #f0f0f1;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    z-index: 9999999;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  }

  #te-panel.hidden { display: none; }

  /* ── Header ── */
  .te-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #2a2a2a;
    background: #0a0a0a;
    flex-shrink: 0;
    gap: 8px;
  }

  .te-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #f0f0f1;
  }

  .te-header-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-left: auto;
  }

  /* ── Viewport Simulator ── */
  .te-viewport {
    padding: 10px 12px;
    border-bottom: 1px solid #2a2a2a;
    flex-shrink: 0;
    background: #0d0d0d;
  }

  .te-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7a7a7a;
    margin-bottom: 6px;
  }

  .te-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .te-slider-min, .te-slider-max {
    font-size: 10px;
    color: #7a7a7a;
    flex-shrink: 0;
    width: 28px;
  }
  .te-slider-max { text-align: right; }

  #te-vp-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 3px;
    background: #2a2a2a;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  #te-vp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #da1313;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #0f0f0f;
    box-shadow: 0 0 0 1px #da1313;
  }

  #te-vp-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #da1313;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #0f0f0f;
    box-shadow: 0 0 0 1px #da1313;
  }

  .te-vp-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
  }

  .te-vp-px {
    font-size: 11px;
    font-weight: 600;
    color: #da1313;
  }

  .te-vp-rem {
    font-size: 10px;
    color: #7a7a7a;
  }

  /* ── Tabs ── */
  .te-tabs {
    display: flex;
    border-bottom: 1px solid #2a2a2a;
    flex-shrink: 0;
    background: #0a0a0a;
  }

  .te-tab {
    flex: 1;
    padding: 7px 4px;
    background: none;
    border: none;
    color: #7a7a7a;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 150ms, border-color 150ms;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .te-tab:hover { color: #bbbbbb; }
  .te-tab.active { color: #da1313; border-bottom-color: #da1313; }

  /* ── Tab content ── */
  .te-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    scrollbar-width: thin;
    scrollbar-color: #2a2a2a transparent;
  }

  .te-content::-webkit-scrollbar { width: 4px; }
  .te-content::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

  .te-tab-panel { display: none; }
  .te-tab-panel.active { display: block; }

  /* ── Color rows ── */
  .te-color-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid #1a1a1a;
  }
  .te-color-row:last-child { border-bottom: none; }

  .te-color-swatch {
    position: relative;
    width: 28px;
    height: 20px;
    border-radius: 2px;
    border: 1px solid #2a2a2a;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
  }

  .te-color-swatch input[type="color"] {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border: none;
    padding: 0;
    cursor: pointer;
    opacity: 0;
  }

  .te-color-preview {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 1px;
  }

  .te-token-name {
    flex: 1;
    font-size: 11px;
    color: #bbbbbb;
    font-family: 'DM Mono', 'Fira Code', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .te-token-value {
    font-size: 10px;
    color: #7a7a7a;
    font-family: 'DM Mono', 'Fira Code', monospace;
    flex-shrink: 0;
  }

  .te-changed .te-token-name {
    color: #da1313;
  }

  /* ── Radius rows ── */
  .te-radius-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid #1a1a1a;
  }
  .te-radius-row:last-child { border-bottom: none; }

  .te-radius-input {
    width: 80px;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    color: #f0f0f1;
    font-size: 11px;
    padding: 3px 6px;
    font-family: 'DM Mono', 'Fira Code', monospace;
    outline: none;
    flex-shrink: 0;
  }

  .te-radius-input:focus {
    border-color: #da1313;
  }

  /* ── Read-only tables ── */
  .te-readonly-table {
    width: 100%;
    border-collapse: collapse;
  }

  .te-readonly-table tr {
    border-bottom: 1px solid #1a1a1a;
  }
  .te-readonly-table tr:last-child { border-bottom: none; }

  .te-readonly-table td {
    padding: 4px 0;
    font-size: 11px;
  }

  .te-readonly-table td:first-child {
    color: #bbbbbb;
    font-family: 'DM Mono', 'Fira Code', monospace;
    width: 60%;
  }

  .te-readonly-table td:last-child {
    color: #7a7a7a;
    text-align: right;
    font-family: 'DM Mono', 'Fira Code', monospace;
  }

  /* ── Footer buttons ── */
  .te-footer {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid #2a2a2a;
    background: #0a0a0a;
    flex-shrink: 0;
  }

  .te-btn {
    flex: 1;
    padding: 6px 8px;
    border-radius: 2px;
    border: 1px solid #2a2a2a;
    background: transparent;
    color: #bbbbbb;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms;
    font-family: system-ui, -apple-system, sans-serif;
    white-space: nowrap;
    text-align: center;
  }

  .te-btn:hover {
    border-color: #da1313;
    color: #da1313;
  }

  .te-btn-icon {
    padding: 5px 8px;
    flex: 0 0 auto;
    border-radius: 2px;
    border: 1px solid #2a2a2a;
    background: transparent;
    color: #7a7a7a;
    font-size: 11px;
    cursor: pointer;
    transition: all 150ms;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1;
  }

  .te-btn-icon:hover {
    color: #f0f0f1;
    border-color: #7a7a7a;
  }

  .te-save-btn {
    border-color: #da1313;
    color: #da1313;
  }

  .te-save-btn:hover {
    background: rgba(218,19,19,0.12);
  }

  /* ── Toast notification ── */
  .te-toast {
    position: absolute;
    bottom: 54px;
    left: 12px;
    right: 12px;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 2px;
    padding: 7px 10px;
    font-size: 11px;
    color: #bbbbbb;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 200ms, transform 200ms;
    pointer-events: none;
  }

  .te-toast.show {
    opacity: 1;
    transform: translateY(0);
  }

  .te-toast.success { border-color: #22c55e; color: #22c55e; }
  .te-toast.error   { border-color: #ef4444; color: #ef4444; }
`;

// ─── Toolbar App ───────────────────────────────────────────────────────────
// DevToolbarApp shape: { init(canvas: ShadowRoot, app: ToolbarAppEventTarget, server): void }
const tokenEditorApp: DevToolbarApp = {
  init(canvas, app) {
    // ── State ──────────────────────────────────────────────────────────────
    const changes = new Map<string, string>();
    let activeTab = 'colors';
    let vpWidth = 1440;

    // ── Shadow DOM setup ───────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    canvas.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'te-panel';
    panel.classList.add('hidden');
    canvas.appendChild(panel);

    // ── Helpers ────────────────────────────────────────────────────────────
    function getCSSVar(name: string): string {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function setCSSVar(name: string, value: string) {
      document.documentElement.style.setProperty(name, value);
    }

    function removeCSSVar(name: string) {
      document.documentElement.style.removeProperty(name);
    }

    // Convert any CSS color value to a #rrggbb hex string for <input type="color">
    function toHex(cssValue: string): string {
      if (!cssValue) return '#000000';
      const trimmed = cssValue.trim();
      if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
      if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
        return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
      }
      // Resolve via canvas 2d
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return '#000000';
      ctx.fillStyle = trimmed;
      const resolved = ctx.fillStyle;
      // ctx.fillStyle returns hex or rgb(...)
      if (/^#/.test(resolved)) return resolved.toLowerCase();
      // Parse rgb(r, g, b)
      const m = resolved.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
      }
      return '#000000';
    }

    function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
      const toast = panel.querySelector<HTMLDivElement>('.te-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.className = `te-toast ${type} show`;
      setTimeout(() => { toast.classList.remove('show'); }, 2200);
    }

    function computeRemPx(remVal: string, fontSizePx: number): string {
      const rem = parseFloat(remVal);
      if (isNaN(rem)) return remVal;
      return `${(rem * fontSizePx).toFixed(1)}px`;
    }

    // ── Viewport slider logic ──────────────────────────────────────────────
    function applyViewport(vwPx: number) {
      vpWidth = vwPx;
      const fsPx = computeFontSizePx(vwPx);
      document.documentElement.style.fontSize = `${fsPx}px`;

      const slider = panel.querySelector<HTMLInputElement>('#te-vp-slider');
      const vpPxLabel = panel.querySelector<HTMLSpanElement>('#te-vp-px');
      const vpRemLabel = panel.querySelector<HTMLSpanElement>('#te-vp-rem');

      if (slider) slider.value = String(vwPx);
      if (vpPxLabel) vpPxLabel.textContent = `${vwPx}px`;
      if (vpRemLabel) {
        const scale = (fsPx / 16).toFixed(2);
        vpRemLabel.textContent = `1rem = ${fsPx.toFixed(2)}px (${scale}×)`;
      }

      updateComputedTables(fsPx);
    }

    function updateComputedTables(fsPx: number) {
      panel.querySelectorAll<HTMLTableRowElement>('tr[data-token]').forEach(row => {
        const token = row.dataset.token!;
        const remVal = getCSSVar(token);
        const valCell = row.querySelector<HTMLTableCellElement>('.te-computed-val');
        if (valCell) valCell.textContent = computeRemPx(remVal, fsPx);
      });
    }

    // ── Build the panel HTML ───────────────────────────────────────────────
    function buildPanel() {
      const fsPx = computeFontSizePx(vpWidth);
      const scale = (fsPx / 16).toFixed(2);

      panel.innerHTML = `
        <div class="te-header">
          <span class="te-title">🎨 Design Tokens</span>
          <div class="te-header-actions">
            <button class="te-btn-icon" id="te-reset-btn" title="Reset all changes">Reset</button>
            <button class="te-btn-icon" id="te-close-btn" title="Close panel">✕</button>
          </div>
        </div>

        <div class="te-viewport">
          <div class="te-section-label">Viewport Simulator</div>
          <div class="te-slider-row">
            <span class="te-slider-min">500</span>
            <input type="range" id="te-vp-slider" min="500" max="2400" step="10" value="${vpWidth}" />
            <span class="te-slider-max">2400</span>
          </div>
          <div class="te-vp-info">
            <span class="te-vp-px" id="te-vp-px">${vpWidth}px</span>
            <span class="te-vp-rem" id="te-vp-rem">1rem = ${fsPx.toFixed(2)}px (${scale}×)</span>
          </div>
        </div>

        <div class="te-tabs">
          <button class="te-tab ${activeTab === 'colors' ? 'active' : ''}" data-tab="colors">Colors</button>
          <button class="te-tab ${activeTab === 'radii' ? 'active' : ''}" data-tab="radii">Radii</button>
          <button class="te-tab ${activeTab === 'type' ? 'active' : ''}" data-tab="type">Type Scale</button>
          <button class="te-tab ${activeTab === 'spacing' ? 'active' : ''}" data-tab="spacing">Spacing</button>
        </div>

        <div class="te-content">
          <!-- Colors tab -->
          <div class="te-tab-panel ${activeTab === 'colors' ? 'active' : ''}" id="te-tab-colors">
            ${COLOR_TOKENS.map(token => {
              const rawVal = getCSSVar(token);
              const hexVal = toHex(rawVal);
              const isChanged = changes.has(token);
              return `
                <div class="te-color-row ${isChanged ? 'te-changed' : ''}" data-token="${token}">
                  <div class="te-color-swatch">
                    <div class="te-color-preview" style="background:${hexVal}"></div>
                    <input type="color" value="${hexVal}" data-token="${token}" />
                  </div>
                  <span class="te-token-name">${token}</span>
                  <span class="te-token-value">${rawVal || hexVal}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Radii tab -->
          <div class="te-tab-panel ${activeTab === 'radii' ? 'active' : ''}" id="te-tab-radii">
            ${RADIUS_TOKENS.map(token => {
              const val = getCSSVar(token);
              const isChanged = changes.has(token);
              return `
                <div class="te-radius-row ${isChanged ? 'te-changed' : ''}" data-token="${token}">
                  <span class="te-token-name">${token}</span>
                  <input class="te-radius-input" type="text" value="${val}" data-token="${token}" />
                </div>
              `;
            }).join('')}
          </div>

          <!-- Type Scale tab -->
          <div class="te-tab-panel ${activeTab === 'type' ? 'active' : ''}" id="te-tab-type">
            <table class="te-readonly-table">
              ${TYPE_TOKENS.map(token => {
                const remVal = getCSSVar(token);
                return `
                  <tr data-token="${token}">
                    <td>${token}</td>
                    <td class="te-computed-val">${computeRemPx(remVal, fsPx)}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <!-- Spacing tab -->
          <div class="te-tab-panel ${activeTab === 'spacing' ? 'active' : ''}" id="te-tab-spacing">
            <table class="te-readonly-table">
              ${SPACING_TOKENS.map(token => {
                const remVal = getCSSVar(token);
                return `
                  <tr data-token="${token}">
                    <td>${token}</td>
                    <td class="te-computed-val">${computeRemPx(remVal, fsPx)}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>
        </div>

        <div class="te-footer">
          <button class="te-btn" id="te-copy-btn">📋 Copy Changes CSS</button>
          <button class="te-btn te-save-btn" id="te-save-btn">💾 Save to file</button>
        </div>

        <div class="te-toast"></div>
      `;

      attachEvents();
    }

    // ── Attach event listeners ─────────────────────────────────────────────
    function attachEvents() {
      // Close button — call app.toggleState to properly deactivate the toolbar app
      panel.querySelector('#te-close-btn')?.addEventListener('click', () => {
        hidePanel();
        app.toggleState({ state: false });
      });

      // Reset button
      panel.querySelector('#te-reset-btn')?.addEventListener('click', () => {
        changes.forEach((_, name) => removeCSSVar(name));
        changes.clear();
        document.documentElement.style.fontSize = '';
        vpWidth = 1440;
        buildPanel();
        applyViewport(vpWidth);
        showToast('All changes reset.', 'info');
      });

      // Viewport slider
      panel.querySelector('#te-vp-slider')?.addEventListener('input', (e) => {
        const v = parseInt((e.target as HTMLInputElement).value, 10);
        applyViewport(v);
      });

      // Tab buttons
      panel.querySelectorAll<HTMLButtonElement>('.te-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab!;
          panel.querySelectorAll('.te-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.te-tab-panel').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          panel.querySelector(`#te-tab-${activeTab}`)?.classList.add('active');
        });
      });

      // Color inputs
      panel.querySelectorAll<HTMLInputElement>('input[type="color"]').forEach(input => {
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          const name = target.dataset.token!;
          const value = target.value;
          setCSSVar(name, value);
          changes.set(name, value);

          const row = panel.querySelector<HTMLDivElement>(`.te-color-row[data-token="${name}"]`);
          if (row) {
            row.classList.add('te-changed');
            const preview = row.querySelector<HTMLDivElement>('.te-color-preview');
            if (preview) preview.style.background = value;
            const valSpan = row.querySelector<HTMLSpanElement>('.te-token-value');
            if (valSpan) valSpan.textContent = value;
          }
        });
      });

      // Radius inputs
      panel.querySelectorAll<HTMLInputElement>('.te-radius-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const name = target.dataset.token!;
          const value = target.value.trim();
          if (!value) return;
          setCSSVar(name, value);
          changes.set(name, value);

          const row = panel.querySelector<HTMLDivElement>(`.te-radius-row[data-token="${name}"]`);
          if (row) row.classList.add('te-changed');
        });
      });

      // Copy CSS button
      panel.querySelector('#te-copy-btn')?.addEventListener('click', async () => {
        if (changes.size === 0) {
          showToast('No changes to copy.', 'info');
          return;
        }
        const lines = [':root {'];
        changes.forEach((value, name) => {
          lines.push(`  ${name}: ${value};`);
        });
        lines.push('}');
        const css = lines.join('\n');
        try {
          await navigator.clipboard.writeText(css);
          showToast('Copied to clipboard!', 'success');
        } catch {
          showToast('Copy failed — check clipboard permissions.', 'error');
        }
      });

      // Save to file button
      panel.querySelector('#te-save-btn')?.addEventListener('click', async () => {
        if (changes.size === 0) {
          showToast('No changes to save.', 'info');
          return;
        }
        const tokens: Record<string, string> = {};
        changes.forEach((value, name) => { tokens[name] = value; });
        try {
          const res = await fetch('/__tokens/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens }),
          });
          if (res.ok) {
            showToast('Saved to global.css!', 'success');
          } else {
            const txt = await res.text();
            showToast(`Save failed: ${res.status} — ${txt.slice(0, 60)}`, 'error');
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          showToast(`Save error: ${msg}`, 'error');
        }
      });
    }

    // ── Show / hide ────────────────────────────────────────────────────────
    function showPanel() {
      panel.classList.remove('hidden');
      buildPanel();
      applyViewport(vpWidth);
    }

    function hidePanel() {
      panel.classList.add('hidden');
      // Restore natural clamp-based font-size
      document.documentElement.style.fontSize = '';
    }

    // ── Listen to Astro toolbar toggle events ─────────────────────────────
    app.onToggled(({ state }) => {
      if (state) {
        showPanel();
      } else {
        hidePanel();
      }
    });
  },
};

export default tokenEditorApp;
