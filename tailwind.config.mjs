/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // ── Colors — all backed by CSS custom properties ──────────────────
      // Usage: bg-page · bg-surface · bg-surface-2 · bg-line
      //        text-content · text-muted · text-faint · text-accent
      //        border-line · border-accent · border-muted
      colors: {
        page:    'var(--color-bg)',
        surface: { DEFAULT: 'var(--color-surface)', '2': 'var(--color-surface-2)' },
        line:    'var(--color-border)',
        accent:  'var(--color-accent)',
        content: 'var(--color-text)',
        muted:   'var(--color-text-muted)',
        faint:   'var(--color-text-faint)',
      },

      // ── Font families ─────────────────────────────────────────────────
      // Usage: font-display · font-body · font-mono
      fontFamily: {
        display: ['"Work Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },

      // ── Font sizes — CSS var backed, so they scale with fluid html rem ─
      // Usage: text-h1 · text-h2 · text-h3 · text-h4 · text-h5 · text-h6
      //        text-body · text-small · text-tiny
      fontSize: {
        h1:    ['var(--fs-h1)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h2:    ['var(--fs-h2)', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        h3:    ['var(--fs-h3)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h4:    ['var(--fs-h4)', { lineHeight: '1.1'  }],
        h5:    ['var(--fs-h5)', { lineHeight: '1.1'  }],
        h6:    ['var(--fs-h6)', { lineHeight: '1.1'  }],
        body:  ['var(--fs-body)',  { lineHeight: '1.7' }],
        small: ['var(--fs-small)', { lineHeight: '1.7' }],
        tiny:  ['var(--fs-xs)',    { lineHeight: '1.5' }],
      },

      // ── Letter spacing extras (Tailwind defaults don't cover these) ───
      // Usage: tracking-tight-1 · tracking-wide-5 · tracking-caps
      letterSpacing: {
        'tight-2': '-0.02em',
        'tight-1': '-0.01em',
        'wide-4':  '0.04em',
        'wide-5':  '0.05em',
        'wide-8':  '0.08em',
        'wide-10': '0.1em',
        'wide-12': '0.12em',
        'wide-14': '0.14em',
        'wide-15': '0.15em',
        'wide-18': '0.18em',
        'caps':    '0.2em',
      },

      // ── Border radius — backed by CSS vars ───────────────────────────
      // Usage: rounded-token-sm · rounded-token-md · rounded-token-lg
      borderRadius: {
        'token-sm': 'var(--radius-sm)',
        'token-md': 'var(--radius-md)',
        'token-lg': 'var(--radius-lg)',
      },

      // ── Transition ───────────────────────────────────────────────────
      // Usage: ease-smooth  (combined with Tailwind's duration-300)
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
