# Portfolio

https://antoineoparin.pages.dev

## Writing a blog post

1. Copy `posts/_template.md` to `posts/your-post-title.md`. The file name
   becomes the URL: `/blog/your-post-title/`.
2. Fill in the front matter (`title`, `description`, `date`) and write the post
   in Markdown below it. Put images in `assets/blog/` and link them as
   `/assets/blog/name.jpg`.
3. Run `npm run preview` and open http://localhost:4173/blog/ to check it.
   Posts with `draft: true` show up here but are never published.
4. Remove `draft: true` (or set it to `false`), then commit and push.

The build adds each post to the blog page, the RSS feed (`/blog/feed.xml`),
`sitemap.xml` and `llms.txt`. The Blog link in the nav only appears once at
least one post is published.
