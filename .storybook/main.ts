import type { StorybookConfig } from '@storybook/react-vite';
import type { InlineConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|ts|tsx)',
    '../src/stories/**/*.stories.@(js|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Fix Windows FSWatcher UNKNOWN crash — use polling instead of native watchers
  async viteFinal(config: InlineConfig) {
    config.server = {
      ...config.server,
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/public/**',
          '**/src/content/projects/**',
        ],
      },
    };
    return config;
  },
};
export default config;
