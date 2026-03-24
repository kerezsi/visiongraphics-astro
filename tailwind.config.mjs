/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Work Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg:       '#1a1a1a',
        surface:  '#121212',
        surface2: '#0f0f0f',
        border:   '#2a2a2a',
        accent:   '#da1313',
        accent2:  '#da1313',
        muted:    '#bbbbbb',
        faint:    '#7a7a7a',
      },
      fontSize: {
        'display-xl': ['clamp(3.2rem, 1.75rem + 2.33vw, 6.4rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 1.36rem + 1.82vw, 5rem)',  { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 0.95rem + 1.27vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        'section': '6rem',
        'section-sm': '3rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
