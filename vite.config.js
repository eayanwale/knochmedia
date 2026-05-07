import { defineConfig } from 'vite'
import { resolve } from 'path'

/* KNOCH-043: dev-server middleware that rewrites /project/<slug>
   requests to /project.html?id=<slug>. In production, Vercel serves
   the per-slug static files emitted by scripts/render-projects.mjs
   (dist/project/<slug>.html) directly, so the URL path works as-is.
   In dev, those static files don't exist (Vite serves src/ on the
   fly), so without this rewrite a tile click → /project/<slug> would
   404. The rewrite preserves the URL in the browser address bar
   (visitor's perspective: /project/<slug>) but Vite resolves the
   request as /project.html?id=<slug>. project-page.js already
   handles both URL shapes via its _slugFromUrl() helper. */
const projectPathRewritePlugin = {
  name: 'project-path-rewrite',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const m = req.url?.match(/^\/project\/([^/?#]+)(\?.*)?$/);
      if (m) {
        const slug = decodeURIComponent(m[1]);
        const existingQuery = m[2]?.slice(1) ?? '';
        const newQuery = existingQuery
          ? `id=${encodeURIComponent(slug)}&${existingQuery}`
          : `id=${encodeURIComponent(slug)}`;
        req.url = `/project.html?${newQuery}`;
      }
      next();
    });
  },
};

export default defineConfig({
  // root: 'src' makes index.html the entry at the Vite root so the build
  // outputs dist/index.html (not dist/src/index.html). Asset paths in HTML
  // use /css/... and /js/... (relative to src root, no /src/ prefix needed).
  root: 'src',
  base: '/',
  plugins: [projectPathRewritePlugin],

  build: {
    outDir: '../dist',
    emptyOutDir: true,

    // Multi-page setup: additional HTML entry points (portfolio, about, contact,
    // project detail) will be added here as their tickets are implemented.
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'src/index.html'),
        about:     resolve(__dirname, 'src/about.html'),
        portfolio: resolve(__dirname, 'src/portfolio.html'),
        project:   resolve(__dirname, 'src/project.html'),
        contact:   resolve(__dirname, 'src/contact.html'),
        /* KNOCH-038: error pages. 404.html lands at dist root and is
           auto-served by Vercel for any 404 response (preserves the
           404 HTTP status — important for crawler signal). 500.html
           is staged for KNOCH-039 — currently unwired since no
           serverless function emits 5xx yet. */
        notFound:  resolve(__dirname, 'src/404.html'),
        serverErr: resolve(__dirname, 'src/500.html'),
        /* Pre-launch holding page — visitors hitting any route on
           knoch.media get bounced here via vercel.json redirects
           until the new site is launch-ready. Standalone HTML, no
           JS deps, no /assets/ refs — ships independent of build
           state. To launch: remove the redirects in vercel.json.  */
        comingSoon: resolve(__dirname, 'src/coming-soon.html')
      }
    }
  }
})
