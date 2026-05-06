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
        portfolio: resolve(__dirname, 'src/portfolio.html')
      }
    }
  }
})
