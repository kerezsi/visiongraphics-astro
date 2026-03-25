import type { Meta, StoryObj } from '@storybook/react';
import ImageLightbox from '../components/media/ImageLightbox';

// Placeholder image URLs — use aspect-ratio-correct solid-color SVGs
const placeholder = (label: string, bg = '1a1a1a', fg = '2a2a2a') =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23${bg}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%23${fg}'%3E${encodeURIComponent(label)}%3C/text%3E%3C/svg%3E`;

const sampleImages = [
  { src: placeholder('Antalya Airport T2 — Exterior', '121212', '7a7a7a'), alt: 'Antalya Airport T2 exterior render' },
  { src: placeholder('Antalya Airport T2 — Departures Hall', '0f0f0f', '7a7a7a'), alt: 'Departures hall interior render' },
  { src: placeholder('Antalya Airport T2 — Check-in Area', '1a1a1a', '7a7a7a'), alt: 'Check-in area render' },
  { src: placeholder('Antalya Airport T2 — Gates', '121212', '7a7a7a'), alt: 'Gates area render' },
  { src: placeholder('Antalya Airport T2 — Aerial', '0f0f0f', '7a7a7a'), alt: 'Aerial view render' },
];

const meta: Meta<typeof ImageLightbox> = {
  title: 'Components / Media / ImageLightbox',
  component: ImageLightbox,
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'padded',
    docs: {
      description: {
        component: 'React island — carousel viewer with large image, thumbnail strip, and fullscreen lightbox. Keyboard navigable (Arrow keys, Escape). Touch swipe supported.',
      },
    },
  },
  argTypes: {
    images: {
      description: 'Array of { src: string, alt: string } image objects',
      control: false,
    },
    title: {
      description: 'Optional gallery title label shown above the viewer',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageLightbox>;

export const MultipleImages: Story = {
  name: 'Multiple Images (with thumbnails)',
  args: {
    images: sampleImages,
    title: 'Antalya Airport T2',
  },
};

export const SingleImage: Story = {
  name: 'Single Image (no thumbnails)',
  args: {
    images: [sampleImages[0]],
    title: 'BUD Airport T2B',
  },
};

export const NoTitle: Story = {
  name: 'No Title',
  args: {
    images: sampleImages.slice(0, 3),
  },
};

export const ManyImages: Story = {
  name: 'Many Images (scrollable thumbnails)',
  args: {
    images: [
      ...sampleImages,
      { src: placeholder('Image 6', '121212', '7a7a7a'), alt: 'Image 6' },
      { src: placeholder('Image 7', '0f0f0f', '7a7a7a'), alt: 'Image 7' },
      { src: placeholder('Image 8', '1a1a1a', '7a7a7a'), alt: 'Image 8' },
      { src: placeholder('Image 9', '121212', '7a7a7a'), alt: 'Image 9' },
      { src: placeholder('Image 10', '0f0f0f', '7a7a7a'), alt: 'Image 10' },
      { src: placeholder('Image 11', '1a1a1a', '7a7a7a'), alt: 'Image 11' },
      { src: placeholder('Image 12', '121212', '7a7a7a'), alt: 'Image 12' },
    ],
    title: 'Mol Campus — Full Gallery',
  },
};
