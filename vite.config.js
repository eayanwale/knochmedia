import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // root: 'src' makes index.html the entry at the Vite root so the build
  // outputs dist/index.html (not dist/src/index.html). Asset paths in HTML
  // use /css/... and /js/... (relative to src root, no /src/ prefix needed).
  root: 'src',
  base: '/',

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
        serverErr: resolve(__dirname, 'src/500.html')
      }
    }
  }
})
