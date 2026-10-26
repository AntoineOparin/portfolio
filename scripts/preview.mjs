// Serves dist/ the way Cloudflare Pages does: /blog/post/ maps to
// blog/post/index.html, /projects to projects.html, and misses get 404.html.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = path.resolve('dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

const resolve = (urlPath) => {
  const base = path.join(ROOT, path.normalize(decodeURIComponent(urlPath)));
  if (!base.startsWith(ROOT)) return null;
  for (const file of [base, path.join(base, 'index.html'), `${base}.html`]) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
};

http
  .createServer((req, res) => {
    const file = resolve(new URL(req.url, 'http://localhost').pathname);
    const target = file || path.join(ROOT, '404.html');
    res.writeHead(file ? 200 : 404, {
      'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream',
    });
    fs.createReadStream(target).pipe(res);
  })
  .listen(PORT, () => console.log(`Previewing dist/ at http://localhost:${PORT}`));
