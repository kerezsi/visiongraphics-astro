import type { Meta, StoryObj } from '@storybook/react';
import ImageCompare from '../components/ui/ImageCompare';

// ── SVG placeholder helper ───────────────────────────────────────────
// Generates a solid-colour 16:9 SVG with a centred label.
const placeholder = (label: string, bg = '121212', fg = '7a7a7a') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">` +
    `<rect width="1600" height="900" fill="#${bg}"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ` +
    `font-family="system-ui,sans-serif" font-size="48" fill="#${fg}">${label}</text>` +
    `</svg>`
  )}`;

// ── Sample pairs ─────────────────────────────────────────────────────
const archVizPair = {
  before: {
    src: placeholder('Site Photo — Before', '0f0f0f', '5a5a5a'),
    alt: 'Existing site — before visualization',
    label: 'Before',
  },
  after: {
    src: placeholder('CGI Render — After', '1a1a1a', 'da1313'),
    alt: 'Architectural visualization — after',
    label: 'After',
  },
};

const interiorPair = {
  before: {
    src: placeholder('Floor Plan / Schematic', '0a0a0a', '444444'),
    alt: 'Schematic drawing',
    label: 'Plan',
  },
  after: {
    src: placeholder('Interior Render', '181818', 'bbbbbb'),
    alt: 'Finished interior render',
    label: 'Render',
  },
};

// ── Meta ─────────────────────────────────────────────────────────────
const meta: Meta<typeof ImageCompare> = {
  title: 'Components / UI / ImageCompare',
  component: ImageCompare,
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'padded',
    docs: {
      description: {
        component:
          'React island — drag the handle (or click anywhere) to reveal before/after images. ' +
          'Keyboard: ← → to nudge, Home/End to jump. Touch-friendly. ' +
          'CSS is global (`.image-compare` in `global.css`). ' +
          'Use with `client:load` in Astro.',
      },
    },
  },
  argTypes: {
    initialPosition: {
      description: 'Starting position of the divider (0–100)',
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    aspectRatio: {
      description: 'CSS aspect-ratio value',
      control: 'text',
    },
    before: { control: false },
    after:  { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ImageCompare>;

// ── Stories ──────────────────────────────────────────────────────────

export const ArchVizDefault: Story = {
  name: 'Arch Viz — Before / After (50%)',
  args: {
    ...archVizPair,
    initialPosition: 50,
    aspectRatio: '16 / 9',
  },
};

export const StartLeft: Story = {
  name: 'Starting left (20%) — emphasise the After',
  args: {
    ...archVizPair,
    initialPosition: 20,
  },
};

export const StartRight: Story = {
  name: 'Starting right (80%) — emphasise the Before',
  args: {
    ...archVizPair,
    initialPosition: 80,
  },
};

export const Interior: Story = {
  name: 'Interior — Plan vs. Render',
  args: {
    ...interiorPair,
    initialPosition: 50,
  },
};

export const NoLabels: Story = {
  name: 'No Labels',
  args: {
    before: { src: archVizPair.before.src, alt: archVizPair.before.alt },
    after:  { src: archVizPair.after.src,  alt: archVizPair.after.alt },
    initialPosition: 50,
  },
};

export const SquareAspect: Story = {
  name: 'Square aspect ratio (1 / 1)',
  args: {
    ...archVizPair,
    initialPosition: 50,
    aspectRatio: '1 / 1',
  },
};
