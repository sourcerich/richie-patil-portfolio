// @ts-check
import { defineConfig } from 'astro/config'

// Fully static: `astro build` prerenders every page to dist/, which
// Cloudflare serves as Workers static assets (wrangler.jsonc).
export default defineConfig({
  site: 'https://richiepatil.com',
  output: 'static',
  // /about is served from about/index.html; links and the sitemap never use
  // a trailing slash (wrangler's html_handling drops it).
  trailingSlash: 'never',
  // Keep normal HTML whitespace rules, so "Richie</span> <span>Patil" keeps
  // its space (Astro 7 defaults to JSX-style stripping).
  compressHTML: true,
  // Fetch a page while the pointer is on its link, so the page wipe lands on
  // a page that is already loaded.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Old addresses: /projects and the /works pages became the single /work
  // page. In production public/_redirects answers these with a real 301
  // (including every /works/<slug>); these cover `astro dev` and preview.
  redirects: {
    '/projects': '/work',
    '/works': '/work'
  }
})
