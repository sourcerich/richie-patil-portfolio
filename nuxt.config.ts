// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/content',
    '@vueuse/nuxt'
  ],

  // Static SPA, served from Cloudflare Workers static assets (wrangler.jsonc)
  ssr: false,

  devtools: {
    enabled: true
  },

  app: {
    baseURL: '/',
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#f3f2f2' },
        { property: 'og:site_name', content: 'Richie Patil' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/cormorant-garamond-latin.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/lora-latin.woff2', crossorigin: '' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // Use Node's built-in SQLite (22.5+) rather than compiling better-sqlite3.
  content: {
    experimental: { sqliteConnector: 'native' }
  },

  // The old projects page moved to /works.
  routeRules: {
    '/projects': { redirect: '/works' }
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      routes: [
        '/',
        '/about',
        '/works',
        '/projects',
        '/works/sankalp',
        '/works/rag',
        '/works/sunspots',
        '/works/scraper',
        '/works/amizone',
        '/works/jotr',
        '/works/72street',
        '/works/tavcogrowth',
        '/works/ladm-ncl'
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
