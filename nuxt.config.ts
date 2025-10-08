// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxt/content",
    "@vueuse/nuxt",
    "nuxt-og-image",
    "motion-v/nuxt",
  ],

  // Enable static site generation for GitHub Pages
  ssr: false,
  nitro: {
    prerender: {
      routes: ["/", "/projects", "/about"],
      crawlLinks: true,
    },
  },

  // Configure for GitHub Pages deployment
  app: {
    baseURL: "/", // Use "/" since it's your main GitHub Pages site
    head: {
      link: [
        { rel: "icon", type: "image/png", href: "/logo.png" },
        { rel: "apple-touch-icon", href: "/logo.png" },
      ],
    },
  },

  image: {
    quality: 95,
    format: ["avif", "webp", "jpg"],
    densities: [1, 2],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2024-11-01",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
