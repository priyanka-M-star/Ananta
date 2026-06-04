import type { Config } from 'tailwindcss';
import { anantaPreset } from '@ananta/config/tailwind.preset';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@ananta/ui/**/*.{ts,tsx}',
  ],
  presets: [anantaPreset as Config],
  theme: { extend: {} },
  plugins: [],
};

export default config;
