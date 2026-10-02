# Richie Patil – portfolio

The source for [richiepatil.com](https://richiepatil.com): five static pages built with [Astro](https://astro.build), with almost no client-side JavaScript.

Copper type on warm paper. The titles are set in Kalnia, body text in Instrument Sans, and the faded Marathi word behind each page title in Eczar. All three are SIL Open Font License, self-hosted from `public/fonts`.

## Layout

```
content/              Page copy and projects, as YAML
  index.yml           Start page and Contact page text
  about.yml, service.yml, work.yml
  projects/*.yml      One file per project, sorted by `order`
src/
  content.config.ts   Schemas for everything in content/
  site.ts             Name, email, menu, socials
  pages/              index, about, service, work, contact, 404
  layouts/            Base (head, cursor, page wipe) and Page (adds header and footer)
  components/         Header, Footer, PageHead, Ticker, ThemeToggle, ...
  scripts/            reveal.ts (scroll reveals), page-wipe.ts (page transition)
  styles/main.css     Fonts, colour tokens, shared classes
public/               Fonts, images, _redirects, sitemap.xml
```

To change copy, edit the YAML in `content/`. A project with a live site gets `link`; one with public code gets `repo` ("Available on GitHub"); client work under NDA gets `confidential: true`.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static site in dist/
pnpm preview      # serve dist/
pnpm check        # astro check (types)
pnpm lint
pnpm deploy       # build, then wrangler deploy to Cloudflare
```

## Hosting

`dist/` is served as static assets on Cloudflare Workers (`wrangler.jsonc`), with `404.html` for unknown paths. Old `/works` and `/projects` addresses 301 to `/work` through `public/_redirects`. The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the same output for GitHub Pages.
