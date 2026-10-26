// Assembles the site in dist/: copies the static files, then renders the blog
// from posts/*.md into pages, an RSS feed and entries in the sitemap and llms.txt.
// Run with --drafts to include posts marked `draft: true`.
import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';

const SITE = 'https://antoineoparin.pages.dev';
const OUT = 'dist';
const POSTS = 'posts';
const STATIC = [
  'index.html',
  'projects.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  '_headers',
  '.well-known',
  'output.css',
  'main.js',
  'field.js',
  'AntoineOparin_CV.pdf',
  'assets',
];
const includeDrafts = process.argv.includes('--drafts');

const ICONS = {
  arrowLeft:
    'M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z',
  arrowUpRight:
    'M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z',
  list: 'M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z',
  x: 'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
  rss: 'M106.91,149.09A71.53,71.53,0,0,1,128,200a8,8,0,0,1-16,0,56,56,0,0,0-56-56,8,8,0,0,1,0-16A71.53,71.53,0,0,1,106.91,149.09ZM56,80a8,8,0,0,0,0,16A104,104,0,0,1,160,200a8,8,0,0,0,16,0A120,120,0,0,0,56,80Zm118.79,1.21A166.9,166.9,0,0,0,56,32a8,8,0,0,0,0,16A151,151,0,0,1,163.48,92.52,151,151,0,0,1,208,200a8,8,0,0,0,16,0A166.9,166.9,0,0,0,174.79,81.21ZM60,184a12,12,0,1,0,12,12A12,12,0,0,0,60,184Z',
};
const icon = (name, cls, extra = '') =>
  `<svg class="ph ${cls}" aria-hidden="true"${extra} viewBox="0 0 256 256" fill="currentColor"><path d="${ICONS[name]}"/></svg>`;

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

// Front matter is a flat list of `key: value` lines between `---` fences.
function parsePost(file) {
  const src = fs.readFileSync(file, 'utf8');
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter`);

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) throw new Error(`${file}: bad front matter line "${line}"`);
    let value = line.slice(i + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    data[line.slice(0, i).trim()] = value;
  }

  for (const key of ['title', 'description', 'date']) {
    if (!data[key]) throw new Error(`${file}: missing "${key}"`);
  }
  for (const key of ['date', 'updated']) {
    if (data[key] && !/^\d{4}-\d{2}-\d{2}$/.test(data[key])) {
      throw new Error(`${file}: "${key}" must be YYYY-MM-DD`);
    }
  }
  const slug = path.basename(file, '.md');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${file}: file name must be lowercase-words-with-dashes`);
  }

  const words = match[2].split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated || data.date,
    image: data.image,
    draft: data.draft === 'true',
    tags: (data.tags || '')
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    minutes: Math.max(1, Math.round(words / 200)),
    markdown: match[2],
    url: `${SITE}/blog/${slug}/`,
  };
}

// Headings get ids so sections can be linked; images load lazily.
function renderMarkdown(markdown) {
  const seen = new Map();
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(html) || 'section';
        const count = seen.get(id) || 0;
        seen.set(id, count + 1);
        if (count) id += `-${count}`;
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      image({ href, title, text }) {
        const t = title ? ` title="${esc(title)}"` : '';
        return `<img src="${esc(href)}" alt="${esc(text)}"${t} loading="lazy" decoding="async" />`;
      },
    },
  });
  return marked.parse(markdown);
}

function page({ title, description, canonical, head = '', main }) {
  const navLink = (href, label, current) =>
    `<li><a class="nav-link" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  const menuLink = (href, label) =>
    `<li><a class="block py-2" href="${href}">${label}</a></li>`;
  const links = [
    ['/#about', 'About'],
    ['/#experience', 'Experience'],
    ['/projects', 'Projects'],
    ['/blog/', 'Blog'],
    ['/#skills', 'Skills'],
    ['/#contact', 'Contact'],
  ];

  return `<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="Antoine Oparin" />
    <meta property="og:locale" content="en_CA" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta name="twitter:card" content="summary" />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="Antoine Oparin's blog"
      href="/blog/feed.xml"
    />
${head}
    <meta name="theme-color" content="#090b0e" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f2f4f6" media="(prefers-color-scheme: light)" />
    <link rel="preload" href="/assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/assets/fonts/geist-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link href="/output.css" rel="stylesheet" />
    <link rel="icon" type="image/webp" href="/assets/antoine-oparin-pfp.webp" />
    <script>
      document.documentElement.classList.add('js');
    </script>
    <script src="/main.js" defer></script>
  </head>
  <body>
    <a
      href="#main"
      class="sr-only rounded-full bg-raised px-4 py-2 text-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >Skip to content</a
    >

    <header class="site-nav" data-nav>
      <nav
        aria-label="Primary"
        class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8"
      >
        <a href="/" class="monogram" aria-label="Antoine Oparin, home">
          <span aria-hidden="true">A</span><span aria-hidden="true">O</span>
        </a>
        <ul class="hidden items-center gap-1 text-sm md:flex">
          ${links.map(([href, label]) => navLink(href, label, label === 'Blog')).join('\n          ')}
        </ul>
        <div class="flex items-center gap-2">
          <a
            href="/AntoineOparin_CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost h-9 px-4"
            >Resume ${icon('arrowUpRight', 'ph-arrow-up-right')}</a
          >
          <button
            type="button"
            class="btn btn-ghost h-9 w-9 px-0 md:hidden"
            aria-expanded="false"
            aria-controls="mobile-menu"
            data-menu-toggle
          >
            ${icon('list', 'ph-list')}
            ${icon('x', 'ph-x', ' hidden')}
            <span class="sr-only">Menu</span>
          </button>
        </div>
      </nav>
      <div id="mobile-menu" class="border-t border-line md:hidden" hidden>
        <ul class="flex flex-col px-4 py-4 text-2xl font-medium tracking-tight">
          ${links.map(([href, label]) => menuLink(href, label)).join('\n          ')}
        </ul>
      </div>
    </header>

    <main id="main">
${main}
    </main>

    <footer
      class="mx-auto flex max-w-7xl flex-col justify-between gap-4 border-t border-line px-4 py-10 text-sm text-muted md:flex-row md:px-8"
    >
      <p>© <span data-year></span> Antoine Oparin</p>
      <a href="/blog/feed.xml" class="transition-colors hover:text-fg"
        >${icon('rss', 'ph-rss')} RSS feed</a
      >
    </footer>
  </body>
</html>
`;
}

function postPage(post) {
  const image = post.image ? new URL(post.image, SITE).href : `${SITE}/assets/antoine-oparin.jpg`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    image,
    url: post.url,
    mainEntityOfPage: post.url,
    keywords: post.tags.join(', ') || undefined,
    author: { '@type': 'Person', name: 'Antoine Oparin', url: `${SITE}/` },
  };
  const updated =
    post.updated !== post.date
      ? ` · Updated <time datetime="${post.updated}">${formatDate(post.updated)}</time>`
      : '';
  const tags = post.tags.length
    ? `<ul class="mt-6 flex flex-wrap gap-2">${post.tags.map((tag) => `<li class="chip">${esc(tag)}</li>`).join('')}</ul>`
    : '';

  return page({
    title: `${post.title} | Antoine Oparin`,
    description: post.description,
    canonical: post.url,
    head: `    <meta property="og:type" content="article" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="article:published_time" content="${post.date}" />
    <meta property="article:modified_time" content="${post.updated}" />
    <meta property="article:author" content="${SITE}/" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    main: `      <div class="mx-auto max-w-3xl px-4 pt-32 pb-20 md:px-8 md:pt-40 md:pb-28">
        <a href="/blog/" class="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
          >${icon('arrowLeft', 'ph-arrow-left')} All posts</a
        >
        <article class="mt-10">
          <header>
            <p class="font-mono text-sm text-muted">
              <time datetime="${post.date}">${formatDate(post.date)}</time>${updated} · ${post.minutes} min read
            </p>
            <h1 class="mt-4 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance md:text-6xl">
              ${esc(post.title)}
            </h1>
            <p class="mt-6 text-lg leading-relaxed text-muted md:text-xl">${esc(post.description)}</p>
            ${tags}
          </header>
          <div class="prose mt-12 border-t border-line pt-12">
${renderMarkdown(post.markdown)}
          </div>
        </article>
      </div>`,
  });
}

function indexPage(posts) {
  const list = posts.length
    ? `<ol class="mt-12 border-t border-line md:mt-16">
${posts
  .map(
    (post) => `          <li class="border-b border-line">
            <a href="/blog/${post.slug}/" class="group grid gap-2 py-8 md:grid-cols-12 md:gap-8">
              <p class="font-mono text-sm text-muted md:col-span-3 md:pt-1.5">
                <time datetime="${post.date}">${formatDate(post.date)}</time>${post.draft ? ' · Draft' : ''}
              </p>
              <div class="md:col-span-9">
                <h2 class="text-2xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-accent md:text-3xl">
                  ${esc(post.title)}
                </h2>
                <p class="mt-2 max-w-[60ch] leading-relaxed text-muted">${esc(post.description)}</p>
                <p class="mt-3 font-mono text-xs text-muted">${post.minutes} min read</p>
              </div>
            </a>
          </li>`,
  )
  .join('\n')}
        </ol>`
    : `<p class="mt-12 text-lg text-muted md:mt-16">No posts yet.</p>`;

  return page({
    title: 'Blog | Antoine Oparin',
    description:
      'Posts by Antoine Oparin on building software: full-stack web development, real-time systems and the projects he works on.',
    canonical: `${SITE}/blog/`,
    head: `    <meta property="og:type" content="website" />
    <meta property="og:image" content="${SITE}/assets/antoine-oparin.jpg" />`,
    main: `      <div class="mx-auto max-w-7xl px-4 pt-32 pb-20 md:px-8 md:pt-40 md:pb-28">
        <h1 class="h2">Blog</h1>
        <p class="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted md:text-xl">
          Writing about the software I build and what I learn along the way.
        </p>
        ${list}
      </div>`,
  });
}

function feed(posts) {
  const pubDate = (iso) => new Date(`${iso}T12:00:00Z`).toUTCString();
  const items = posts
    .map(
      (post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${post.url}</link>
      <guid isPermaLink="true">${post.url}</guid>
      <pubDate>${pubDate(post.date)}</pubDate>
      <description>${esc(post.description)}</description>
${post.tags.map((tag) => `      <category>${esc(tag)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');
  const lastBuild = posts.length ? `\n    <lastBuildDate>${pubDate(posts[0].updated)}</lastBuildDate>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Antoine Oparin's blog</title>
    <link>${SITE}/blog/</link>
    <description>Writing about the software I build and what I learn along the way.</description>
    <language>en-ca</language>${lastBuild}
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

fs.rmSync(OUT, { recursive: true, force: true });
for (const file of STATIC) {
  fs.cpSync(file, path.join(OUT, file), { recursive: true });
}

// Files starting with an underscore, like _template.md, are never published.
const posts = (fs.existsSync(POSTS) ? fs.readdirSync(POSTS) : [])
  .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
  .map((file) => parsePost(path.join(POSTS, file)))
  .filter((post) => includeDrafts || !post.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

write(path.join(OUT, 'blog/index.html'), indexPage(posts));
write(path.join(OUT, 'blog/feed.xml'), feed(posts));
for (const post of posts) {
  write(path.join(OUT, 'blog', post.slug, 'index.html'), postPage(post));
}

const edit = (file, fn) => {
  const target = path.join(OUT, file);
  fs.writeFileSync(target, fn(fs.readFileSync(target, 'utf8')));
};

if (posts.length) {
  edit('sitemap.xml', (xml) =>
    xml.replace(
      '</urlset>',
      [{ url: `${SITE}/blog/`, updated: posts[0].updated }, ...posts]
        .map((p) => `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${p.updated}</lastmod>\n  </url>\n`)
        .join('') + '</urlset>',
    ),
  );
  edit('llms.txt', (text) =>
    text.replace(
      '## Optional',
      `## Blog\n\n- [Blog](${SITE}/blog/): All posts, newest first\n${posts
        .map((post) => `- [${post.title}](${post.url}): ${post.description}`)
        .join('\n')}\n\n## Optional`,
    ),
  );
} else {
  // Keep the nav free of a link to an empty blog until the first post is out.
  for (const file of ['index.html', 'projects.html']) {
    edit(file, (html) => html.replace(/\s*<li[^>]*data-blog-link[^>]*>[\s\S]*?<\/li>/g, ''));
  }
}

console.log(
  `Built ${OUT}/ with ${posts.length} post${posts.length === 1 ? '' : 's'}${includeDrafts ? ' (drafts included)' : ''}`,
);
