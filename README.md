# Portfolio

Antoine Oparin's single-page portfolio, in English (`/`) and French (`/fr/`).
Astro + Tailwind CSS v4. Ships static HTML plus a little JavaScript for the story scroll, theme toggle and menu. The résumé viewer (pdf.js) only loads when you scroll near it.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321, live reload
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

## Where things are

- All copy, both languages: `src/i18n/content.ts`
- Sections: `src/components/` (one file each)
- Colors, fonts, theme tokens: `src/styles/global.css`
- Résumé shown in the viewer and offered for download: `public/Antoine_Oparin_CV.pdf` (replace this file to update it)
