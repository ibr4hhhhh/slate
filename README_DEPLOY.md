# Slate Arcade — Deploy

This project uses Vite. To deploy on Netlify:

1. Push the folder to a GitHub repo.
2. On Netlify, click "New site from Git" and connect the repo.
3. Build command: `npm run build` (or leave default with `npm ci && npm run build` from `netlify.toml`)
4. Publish directory: `dist`

The `_redirects`/redirect rules are set in `netlify.toml` so SPA routes won't 404.
For Vercel, `vercel.json` is included to rewrite all routes to `/index.html`.

Drag-and-drop **won't** build Vite projects; use the Git integration to build.