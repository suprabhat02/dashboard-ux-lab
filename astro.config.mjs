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
    sitemap({
      // hreflang alternates in the sitemap, matching <link rel="alternate"> in pages.
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es', ar: 'ar' } },
      // The vanilla lab page is noindex until that implementation ships.
      filter: (page) => !page.includes('/lab/vanilla/'),
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
