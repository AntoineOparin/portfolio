// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://antoineoparin.github.io',
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
