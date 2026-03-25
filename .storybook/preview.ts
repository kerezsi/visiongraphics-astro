import type { Preview } from '@storybook/react';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark',    value: '#1a1a1a' },
        { name: 'surface', value: '#121212' },
        { name: 'light',   value: '#f0f0f1' },
      ],
    },
    layout: 'centered',
    viewport: {
      viewports: {
        mobile:  { name: 'Mobile (500px)',   styles: { width: '500px',  height: '800px'  } },
        tablet:  { name: 'Tablet (768px)',   styles: { width: '768px',  height: '1024px' } },
        desktop: { name: 'Desktop (1440px)', styles: { width: '1440px', height: '900px'  } },
        wide:    { name: 'Wide (2400px)',     styles: { width: '2400px', height: '1080px' } },
      },
      defaultViewport: 'desktop',
    },
  },
  globalTypes: {
    theme: { defaultValue: 'dark' },
  },
};
export default preview;
