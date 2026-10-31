// @ts-check
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://richiepatil.com',
  output: 'static',
  trailingSlash: 'never',
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  redirects: {
    '/projects': '/work',
    '/works': '/work'
  }
})
