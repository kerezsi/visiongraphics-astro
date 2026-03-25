import type { Meta } from '@storybook/react';

export default {
  title: 'Design System / Tokens',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
} satisfies Meta;

// ─── Shared wrapper style ─────────────────────────────────────────
const wrap = (content: string) => `
  <div style="
    padding: 2.5rem;
    background: #1a1a1a;
    font-family: 'Work Sans', system-ui, sans-serif;
    color: #f0f0f1;
    min-height: 100vh;
  ">
    ${content}
  </div>
`;

const sectionTitle = (title: string) => `
  <h2 style="
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #f0f0f1;
    margin: 0 0 0.35rem 0;
    line-height: 1.2;
  ">${title}</h2>
  <div style="height: 1px; background: #2a2a2a; margin-bottom: 1.75rem;"></div>
`;

// ─── Colors ───────────────────────────────────────────────────────
export const Colors = () => {
  const swatches = [
    { variable: '--color-bg',         hex: '#1a1a1a', label: 'Background',   dark: false },
    { variable: '--color-surface',    hex: '#121212', label: 'Surface',      dark: false },
    { variable: '--color-surface-2',  hex: '#0f0f0f', label: 'Surface 2',    dark: false },
    { variable: '--color-border',     hex: '#2a2a2a', label: 'Border',       dark: false },
    { variable: '--color-accent',     hex: '#da1313', label: 'Accent',       dark: false },
    { variable: '--color-accent-2',   hex: '#da1313', label: 'Accent 2',     dark: false },
    { variable: '--color-text',       hex: '#f0f0f1', label: 'Text',         dark: true  },
    { variable: '--color-text-muted', hex: '#bbbbbb', label: 'Text Muted',   dark: true  },
    { variable: '--color-text-faint', hex: '#7a7a7a', label: 'Text Faint',   dark: true  },
  ];

  const swatchCards = swatches.map(s => `
    <div style="display:flex;flex-direction:column;gap:0;">
      <div style="
        width: 100%;
        height: 80px;
        background: ${s.hex};
        border-radius: 2px 2px 0 0;
        border: 1px solid ${s.dark ? '#2a2a2a' : 'rgba(255,255,255,0.08)'};
        border-bottom: none;
      "></div>
      <div style="
        background: #121212;
        border: 1px solid #2a2a2a;
        border-top: none;
        border-radius: 0 0 2px 2px;
        padding: 0.6rem 0.75rem;
      ">
        <p style="
          font-size: 0.7rem;
          font-weight: 600;
          color: #f0f0f1;
          margin: 0 0 0.2rem 0;
          max-width: none;
          line-height: 1.3;
        ">${s.label}</p>
        <code style="
          font-size: 0.6rem;
          color: #da1313;
          font-family: 'DM Mono', monospace;
          display:block;
          margin-bottom: 0.15rem;
        ">${s.variable}</code>
        <code style="
          font-size: 0.6rem;
          color: #7a7a7a;
          font-family: 'DM Mono', monospace;
        ">${s.hex}</code>
      </div>
    </div>
  `).join('');

  return wrap(`
    ${sectionTitle('Colour Tokens')}
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 3rem;
    ">
      ${swatchCards}
    </div>

    ${sectionTitle('Usage Examples')}
    <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:2rem;">
      <div style="padding:1rem 1.25rem;background:#121212;border:1px solid #2a2a2a;border-radius:2px;">
        <span style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#da1313;font-weight:500;">Section Label — accent</span>
      </div>
      <div style="padding:1rem 1.25rem;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:2px;">
        <p style="color:#bbbbbb;font-size:0.9rem;margin:0;max-width:none;">Body text in muted — supporting content, captions, descriptions</p>
      </div>
      <div style="padding:1rem 1.25rem;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:2px;">
        <p style="color:#7a7a7a;font-size:0.85rem;margin:0;max-width:none;">Faint text — disabled states, placeholders, meta information</p>
      </div>
      <div style="padding:1rem 1.25rem;background:#1a1a1a;border:1px solid rgba(255,255,255,0.12);border-radius:2px;">
        <p style="color:#f0f0f1;font-size:0.85rem;margin:0;max-width:none;">Portfolio card — white border at rgba(255,255,255,0.12) → hover rgba(255,255,255,0.35)</p>
      </div>
      <div style="padding:1rem 1.25rem;background:#1a1a1a;border:1px solid #da1313;border-radius:2px;">
        <p style="color:#f0f0f1;font-size:0.85rem;margin:0;max-width:none;">Tech card — accent border always visible</p>
      </div>
    </div>
  `);
};

// ─── Type Scale ───────────────────────────────────────────────────
export const TypeScale = () => {
  const scale = [
    { var: '--fs-h1',    rem: '2.986rem',  label: 'h1',    range: '47.8px → 95.6px',  weight: 700 },
    { var: '--fs-h2',    rem: '2.488rem',  label: 'h2',    range: '39.8px → 79.6px',  weight: 700 },
    { var: '--fs-h3',    rem: '2.074rem',  label: 'h3',    range: '33.2px → 66.4px',  weight: 700 },
    { var: '--fs-h4',    rem: '1.728rem',  label: 'h4',    range: '27.6px → 55.3px',  weight: 700 },
    { var: '--fs-h5',    rem: '1.44rem',   label: 'h5',    range: '23.0px → 46.1px',  weight: 700 },
    { var: '--fs-h6',    rem: '1.2rem',    label: 'h6',    range: '19.2px → 38.4px',  weight: 700 },
    { var: '--fs-body',  rem: '1rem',      label: 'body',  range: '16.0px → 32.0px',  weight: 300 },
    { var: '--fs-small', rem: '0.833rem',  label: 'small', range: '13.3px → 26.7px',  weight: 400 },
    { var: '--fs-xs',    rem: '0.694rem',  label: 'xs',    range: '11.1px → 22.2px',  weight: 400 },
  ];

  const rows = scale.map(s => `
    <div style="
      display: grid;
      grid-template-columns: 80px 1fr 180px;
      align-items: baseline;
      gap: 1.5rem;
      padding: 1rem 0;
      border-bottom: 1px solid #2a2a2a;
    ">
      <div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">${s.label}</code>
        <br>
        <code style="font-size:0.58rem;color:#7a7a7a;font-family:'DM Mono',monospace;">${s.rem}</code>
      </div>
      <div style="
        font-size: var(${s.var});
        font-weight: ${s.weight};
        color: #f0f0f1;
        line-height: 1.15;
        letter-spacing: -0.01em;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      ">The quick brown fox</div>
      <div style="
        font-size: 0.65rem;
        color: #7a7a7a;
        font-family: 'DM Mono', monospace;
        white-space: nowrap;
        align-self: center;
      ">${s.range}</div>
    </div>
  `).join('');

  return wrap(`
    ${sectionTitle('Fluid Type Scale — 1.2 ratio')}
    <p style="font-size:0.8rem;color:#7a7a7a;margin:0 0 1.5rem;max-width:none;">
      Scale is fluid: <code style="color:#da1313;font-family:'DM Mono',monospace;">html { font-size: clamp(1rem, 0.7368rem + 0.8421vw, 2rem) }</code>
      — resize the viewport to see all sizes scale proportionally.
    </p>
    <div style="margin-bottom:3rem;">
      ${rows}
    </div>

    ${sectionTitle('Text Colour Hierarchy')}
    <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:2rem;">
      <p style="color:#f0f0f1;font-size:1rem;margin:0;max-width:none;font-weight:700;">Primary — #f0f0f1 — Headings, key content</p>
      <p style="color:#bbbbbb;font-size:1rem;margin:0;max-width:none;">Muted — #bbbbbb — Body copy, supporting text</p>
      <p style="color:#7a7a7a;font-size:1rem;margin:0;max-width:none;">Faint — #7a7a7a — Meta, captions, disabled</p>
      <p style="color:#da1313;font-size:1rem;margin:0;max-width:none;font-weight:500;">Accent — #da1313 — Labels, CTAs, highlights</p>
    </div>

    ${sectionTitle('Utility Classes')}
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div class="section-label">section-label — xs, 500 weight, accent, 0.2em tracking</div>
      <div class="display-xl" style="font-size:var(--fs-h1);font-weight:800;line-height:1.05;letter-spacing:-0.01em;">display-xl</div>
      <div class="display-lg" style="font-size:var(--fs-h2);font-weight:700;line-height:1.1;letter-spacing:-0.01em;">display-lg</div>
      <div class="display-md" style="font-size:var(--fs-h3);font-weight:700;line-height:1.15;">display-md</div>
    </div>
  `);
};

// ─── Spacing Scale ────────────────────────────────────────────────
export const SpacingScale = () => {
  const spaces = [
    { var: '--space-1',  rem: '0.25rem',  label: 'space-1',  px: '4px → 8px'    },
    { var: '--space-2',  rem: '0.5rem',   label: 'space-2',  px: '8px → 16px'   },
    { var: '--space-3',  rem: '0.75rem',  label: 'space-3',  px: '12px → 24px'  },
    { var: '--space-4',  rem: '1rem',     label: 'space-4',  px: '16px → 32px'  },
    { var: '--space-5',  rem: '1.25rem',  label: 'space-5',  px: '20px → 40px'  },
    { var: '--space-6',  rem: '1.5rem',   label: 'space-6',  px: '24px → 48px'  },
    { var: '--space-7',  rem: '1.75rem',  label: 'space-7',  px: '28px → 56px'  },
    { var: '--space-8',  rem: '2rem',     label: 'space-8',  px: '32px → 64px'  },
    { var: '--space-10', rem: '2.5rem',   label: 'space-10', px: '40px → 80px'  },
    { var: '--space-12', rem: '3rem',     label: 'space-12', px: '48px → 96px'  },
    { var: '--space-16', rem: '4rem',     label: 'space-16', px: '64px → 128px' },
    { var: '--space-20', rem: '5rem',     label: 'space-20', px: '80px → 160px' },
    { var: '--space-24', rem: '6rem',     label: 'space-24', px: '96px → 192px' },
  ];

  const uiSizes = [
    { var: '--size-icon',    rem: '2.5rem',   label: 'size-icon',    desc: 'Icons, pain point icons'  },
    { var: '--size-avatar',  rem: '4.5rem',   label: 'size-avatar',  desc: 'Portrait photo'           },
    { var: '--size-logo',    rem: '2.25rem',  label: 'size-logo',    desc: 'Header logo'              },
    { var: '--size-logo-sm', rem: '1.875rem', label: 'size-logo-sm', desc: 'Footer logo'              },
    { var: '--size-header',  rem: '4.5rem',   label: 'size-header',  desc: 'Header bar height'        },
  ];

  const bars = spaces.map(s => `
    <div style="
      display: grid;
      grid-template-columns: 100px 1fr 160px;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    ">
      <div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">${s.label}</code>
        <br>
        <code style="font-size:0.58rem;color:#7a7a7a;font-family:'DM Mono',monospace;">${s.rem}</code>
      </div>
      <div style="
        height: var(${s.var});
        background: linear-gradient(90deg, #da1313 0%, rgba(218,19,19,0.4) 100%);
        border-radius: 1px;
        min-height: 4px;
      "></div>
      <code style="font-size:0.6rem;color:#7a7a7a;font-family:'DM Mono',monospace;">${s.px}</code>
    </div>
  `).join('');

  const sizeRows = uiSizes.map(s => `
    <div style="
      display: grid;
      grid-template-columns: 120px var(${s.var}) 1fr;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    ">
      <div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">${s.label}</code>
        <br>
        <code style="font-size:0.58rem;color:#7a7a7a;font-family:'DM Mono',monospace;">${s.rem}</code>
      </div>
      <div style="
        width: var(${s.var});
        height: var(${s.var});
        background: rgba(218,19,19,0.15);
        border: 1px solid #da1313;
        border-radius: 2px;
        flex-shrink: 0;
      "></div>
      <code style="font-size:0.65rem;color:#7a7a7a;font-family:'DM Mono',monospace;">${s.desc}</code>
    </div>
  `).join('');

  return wrap(`
    ${sectionTitle('Spacing Scale')}
    <p style="font-size:0.8rem;color:#7a7a7a;margin:0 0 1.5rem;max-width:none;">
      All values are fluid via the single <code style="color:#da1313;font-family:'DM Mono',monospace;">html { font-size: clamp(...) }</code>. Never hardcode px/rem values in components.
    </p>
    <div style="margin-bottom:3rem;">
      ${bars}
    </div>

    ${sectionTitle('UI Element Sizes')}
    <div style="margin-bottom:3rem;">
      ${sizeRows}
    </div>

    ${sectionTitle('Border Radius')}
    <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:2rem;">
      <div style="text-align:center;">
        <div style="width:80px;height:80px;background:#121212;border:1px solid #2a2a2a;border-radius:2px;margin-bottom:0.5rem;"></div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">--radius-sm: 2px</code>
        <br><code style="font-size:0.6rem;color:#7a7a7a;font-family:'DM Mono',monospace;">Cards, buttons, inputs</code>
      </div>
      <div style="text-align:center;">
        <div style="width:80px;height:80px;background:#121212;border:1px solid #2a2a2a;border-radius:4px;margin-bottom:0.5rem;"></div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">--radius-md: 4px</code>
        <br><code style="font-size:0.6rem;color:#7a7a7a;font-family:'DM Mono',monospace;">Medium radius</code>
      </div>
      <div style="text-align:center;">
        <div style="width:80px;height:80px;background:#121212;border:1px solid #2a2a2a;border-radius:8px;margin-bottom:0.5rem;"></div>
        <code style="font-size:0.65rem;color:#da1313;font-family:'DM Mono',monospace;">--radius-lg: 8px</code>
        <br><code style="font-size:0.6rem;color:#7a7a7a;font-family:'DM Mono',monospace;">Large radius</code>
      </div>
    </div>
  `);
};

// ─── Buttons ─────────────────────────────────────────────────────
export const Buttons = () => wrap(`
  ${sectionTitle('Button Variants')}
  <div style="display:flex;flex-direction:column;gap:2rem;">

    <div>
      <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin:0 0 1rem;max-width:none;">Primary — .btn .btn-primary</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
        <a href="#" class="btn btn-primary" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0.75rem 1.75rem;border-radius:2px;
          background:#da1313;color:#fff;border:1px solid #da1313;
          text-decoration:none;white-space:nowrap;
        ">See Our Work</a>
        <a href="#" class="btn btn-primary" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0.75rem 1.75rem;border-radius:2px;
          background:transparent;color:#da1313;border:1px solid #da1313;
          text-decoration:none;white-space:nowrap;
        ">Hover State</a>
      </div>
    </div>

    <div>
      <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin:0 0 1rem;max-width:none;">Secondary — .btn .btn-secondary</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
        <a href="#" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0.75rem 1.75rem;border-radius:2px;
          background:transparent;color:#f0f0f1;border:1px solid #2a2a2a;
          text-decoration:none;white-space:nowrap;
        ">Talk to Us</a>
        <a href="#" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0.75rem 1.75rem;border-radius:2px;
          background:transparent;color:#f0f0f1;border:1px solid #f0f0f1;
          text-decoration:none;white-space:nowrap;
        ">Hover State</a>
      </div>
    </div>

    <div>
      <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin:0 0 1rem;max-width:none;">Ghost — .btn .btn-ghost</p>
      <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:center;">
        <a href="#" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0;border-radius:2px;
          background:transparent;color:#da1313;border:1px solid transparent;
          text-decoration:none;white-space:nowrap;
        ">View Portfolio →</a>
        <a href="#" style="
          display:inline-flex;align-items:center;gap:0.5rem;
          font-family:'Work Sans',sans-serif;font-size:0.833rem;font-weight:500;
          letter-spacing:0.05em;padding:0;
          background:transparent;color:#f0f0f1;border:1px solid transparent;
          text-decoration:none;white-space:nowrap;
        ">Hover State →</a>
      </div>
    </div>

  </div>
`);

// ─── Cards ────────────────────────────────────────────────────────
export const Cards = () => wrap(`
  ${sectionTitle('Card Variants')}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;">

    <div style="
      background:#121212;border:1px solid #2a2a2a;border-radius:2px;
      overflow:hidden;
    ">
      <div style="aspect-ratio:16/9;background:#0f0f0f;display:flex;align-items:center;justify-content:center;">
        <span style="color:#2a2a2a;font-size:0.7rem;font-family:'DM Mono',monospace;">16:9 image</span>
      </div>
      <div style="padding:1rem 1.1rem 1.2rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.45rem;">
          <span style="font-size:0.64rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#bbbbbb;">Architectural</span>
          <span style="font-size:0.75rem;color:#7a7a7a;font-family:'DM Mono',monospace;">2024</span>
        </div>
        <h3 style="font-size:1rem;font-weight:700;color:#f0f0f1;line-height:1.2;margin:0 0 0.45rem;">Project Title Here</h3>
        <p style="font-size:0.78rem;color:#bbbbbb;line-height:1.5;margin:0;max-width:none;">Client Name · Budapest</p>
      </div>
    </div>

    <div style="
      background:#121212;border:1px solid rgba(255,255,255,0.35);border-radius:2px;
      overflow:hidden;transform:translateY(-2px);
    ">
      <div style="aspect-ratio:16/9;background:#0f0f0f;display:flex;align-items:center;justify-content:center;">
        <span style="color:#2a2a2a;font-size:0.7rem;font-family:'DM Mono',monospace;">Portfolio card — hover state</span>
      </div>
      <div style="padding:1rem 1.1rem 1.2rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.45rem;">
          <span style="font-size:0.64rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#bbbbbb;">Airport</span>
          <span style="font-size:0.75rem;color:#7a7a7a;font-family:'DM Mono',monospace;">2023</span>
        </div>
        <h3 style="font-size:1rem;font-weight:700;color:#f0f0f1;line-height:1.2;margin:0 0 0.45rem;">Antalya Airport T2</h3>
        <p style="font-size:0.78rem;color:#bbbbbb;line-height:1.5;margin:0;max-width:none;">Fraport TAV · Antalya, Turkey</p>
      </div>
    </div>

    <div style="
      background:#121212;border:1px solid #da1313;border-radius:2px;
      overflow:hidden;
    ">
      <div style="aspect-ratio:16/9;background:#0f0f0f;display:flex;align-items:center;justify-content:center;">
        <span style="color:#2a2a2a;font-size:0.7rem;font-family:'DM Mono',monospace;">Tech card — accent border</span>
      </div>
      <div style="padding:1rem 1.1rem 1.2rem;">
        <span style="font-size:0.64rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#da1313;">Technology</span>
        <h3 style="font-size:1rem;font-weight:700;color:#f0f0f1;line-height:1.2;margin:0.35rem 0 0.45rem;">Unreal Engine VR</h3>
        <p style="font-size:0.78rem;color:#bbbbbb;line-height:1.5;margin:0;max-width:none;">Real-time walkthroughs for architecture</p>
      </div>
    </div>

  </div>
`);

// ─── Tags & Pills ─────────────────────────────────────────────────
export const TagsAndPills = () => wrap(`
  ${sectionTitle('Tags / Pills')}
  <div style="margin-bottom:2.5rem;">
    <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin:0 0 0.75rem;max-width:none;">Default state — .tag</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;">
      ${['Architectural', 'Airport', 'Commercial', 'VR Experience', 'Animation', 'Product', 'Residential', 'Urban', 'Exhibition'].map(t => `
        <span style="
          display:inline-flex;align-items:center;
          font-family:'Work Sans',sans-serif;font-size:0.694rem;font-weight:500;
          letter-spacing:0.1em;text-transform:uppercase;
          padding:0.25rem 0.5rem;border:1px solid #2a2a2a;border-radius:2px;
          color:#bbbbbb;
        ">${t}</span>
      `).join('')}
    </div>
    <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin:0 0 0.75rem;max-width:none;">Active state — .tag.active</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;">
      ${['360° Tour', '4K Animation', 'Interior', 'Exterior', 'AI-Enhanced', 'Real-time'].map(t => `
        <span style="
          display:inline-flex;align-items:center;
          font-family:'Work Sans',sans-serif;font-size:0.694rem;font-weight:500;
          letter-spacing:0.1em;text-transform:uppercase;
          padding:0.25rem 0.5rem;border:1px solid #da1313;border-radius:2px;
          color:#da1313;background:rgba(218,19,19,0.08);
        ">${t}</span>
      `).join('')}
    </div>
  </div>

  ${sectionTitle('Section Label')}
  <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:2rem;">
    <span style="font-family:'Work Sans',sans-serif;font-size:0.694rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#da1313;">Our Work</span>
    <span style="font-family:'Work Sans',sans-serif;font-size:0.694rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#da1313;">Services</span>
    <span style="font-family:'Work Sans',sans-serif;font-size:0.694rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#da1313;">30 Years · 500+ Projects · Budapest</span>
  </div>
`);
