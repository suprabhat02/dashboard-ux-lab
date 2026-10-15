// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lab.suprabhat-dev.com',
  trailingSlash: 'always',
  integrations: [
    // React is only hydrated on /lab/react/. Every other page ships zero React.
    react({ include: ['src/impl-react/**'] }),
    sitemap(),
  ],
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
