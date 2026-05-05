import { defineConfig } from 'vite'

export default defineConfig({
  // Serve from root so absolute asset paths (/src/css/global.css) resolve
  // correctly in both dev server and production build.
  base: '/',

  build: {
    outDir: 'dist',

    // Multi-page setup: additional HTML entry points (portfolio, about, contact,
    // project detail) will be added here as their tickets are implemented.
    // Vite handles each HTML file as a separate entry and emits separate chunks.
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    }
  }
})
