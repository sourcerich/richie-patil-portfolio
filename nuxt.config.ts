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
        { name: 'theme-color', content: '#f6efe3' },
        { property: 'og:site_name', content: 'Richie Patil' }
      ],
      // Runs before first paint. Flags that JS is on (so CSS hides
      // not-yet-revealed elements only when JS will reveal them), and picks
      // day or night from the saved choice, falling back to the OS setting.
      script: [
        {
          innerHTML: [
            'var d=document.documentElement;d.classList.add(\'js\');',
            'try{var t=localStorage.getItem(\'theme\')}catch(e){}',
            'if(t!==\'light\'&&t!==\'dark\')t=matchMedia(\'(prefers-color-scheme: dark)\').matches?\'dark\':\'light\';',
            'd.dataset.mode=t;',
            'if(t===\'dark\'){var m=document.querySelector(\'meta[name=theme-color]\');if(m)m.content=\'#1a1411\'}'
          ].join('')
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/kalnia-latin.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/instrument-sans-latin.woff2', crossorigin: '' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // Use Node's built-in SQLite (22.5+) rather than compiling better-sqlite3.
  content: {
    experimental: { sqliteConnector: 'native' }
  },

  // Old addresses: /projects and the /works pages became the single /work
  // page. Each project still has an anchor on it (/work#<slug>), but a
  // static redirect can't carry a fragment, so these land on the page top.
  routeRules: {
    '/projects': { redirect: { to: '/work', statusCode: 301 } },
    '/works': { redirect: { to: '/work', statusCode: 301 } },
    '/works/**': { redirect: { to: '/work', statusCode: 301 } }
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    // Always emit plain static files. Without this, Nitro detects Cloudflare's
    // build environment, switches to its Workers preset and redirects
    // `wrangler deploy` to a server entry that `generate` never builds.
    preset: 'static',
    prerender: {
      routes: ['/', '/about', '/service', '/work', '/contact'],
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
