// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/content',
    '@vueuse/nuxt'
  ],

  // Server-rendered at build time: `nuxt generate` prerenders every page to
  // full HTML, served as static assets on Cloudflare Workers (wrangler.jsonc).
  ssr: true,

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
      // Lets CSS hide not-yet-revealed elements only when JS will reveal
      // them; without JS, the prerendered content simply shows.
      // Runs before first paint: flags that JS is on, and picks day or night
      // from the visitor's saved choice, falling back to their OS setting.
      script: [
        {
          innerHTML: [
            'var d=document.documentElement;d.classList.add(\'js\');',
            'try{var t=localStorage.getItem(\'theme\')}catch(e){}',
            'if(t!==\'light\'&&t!==\'dark\')t=matchMedia(\'(prefers-color-scheme: dark)\').matches?\'dark\':\'light\';',
            'd.dataset.mode=t;',
            'if(t===\'dark\'){var m=document.querySelector(\'meta[name=theme-color]\');if(m)m.content=\'#1b1a18\'}'
          ].join('')
        }
      ],
      noscript: [
        { innerHTML: '<style>.site-intro{display:none}</style>' }
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
    // Always emit plain static files. Without this, Nitro detects Cloudflare's
    // build environment, switches to its Workers preset and redirects
    // `wrangler deploy` to a server entry that `generate` never builds.
    preset: 'static',
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
