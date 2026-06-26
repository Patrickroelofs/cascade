import type { Preview } from '@storybook/tanstack-react'

import "../src/styles.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: '#2b2d33' },
        light: { name: 'Light', value: '#f9e4d6' },
      },
    },
  },
  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;