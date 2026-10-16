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
      // Embedded builds exist only to be framed by /compare/; they are noindex too.
      filter: (page) => !/\/embed\//.test(new URL(page).pathname),
      // hreflang alternates in the sitemap, matching <link rel="alternate"> in pages.
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es', ar: 'ar' } },
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
