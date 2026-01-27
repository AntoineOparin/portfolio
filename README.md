# Portfolio

Static portfolio for Antoine Oparin.

## Develop

- Install dependencies:

```bash
npm install
```

- Build Tailwind CSS to `output.css`:

```bash
npm run build
```

Open `index.html` locally to preview.

## Deploy (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: use the repository root (.) or leave blank if your provider supports root deploys. If required, set to `.` and ensure `index.html` and `output.css` are at the root.
- No `wrangler.toml` is needed for Pages.

If the build step fails, ensure the platform uses Node 18+ and that `@tailwindcss/cli` is installed and accessible. This project’s `package.json` is configured to invoke the v4 CLI via `npx` for portability.
