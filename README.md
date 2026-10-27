# Richie Patil – portfolio

The source for [richiepatil.com](https://richiepatil.com): one page built with [Astro](https://astro.build), with little client-side JavaScript beyond the hero's three.js scene. Everything is on it: what I do, the work (each case opens in place), about and contact.

Warm paper after abeto.co: butter-yellow paper in an ochre frame, brown ink, one warm colour per skill, and a little 3D desk on a floating island in the hero, drawn in three.js as a cartoon with boiling ink outlines (`src/scripts/desk/`). Hand-lettered type: Shantell Sans, and Kalam for the name in Devanagari, both SIL Open Font License, self-hosted from `public/fonts`.

## Layout

```
content/              Page copy and projects, as YAML
  index.yml           Hero, stats, skills and contact
  about.yml           Profile, approach, experience, stack
  projects/*.yml      One file per project, sorted by `order`
src/
  content.config.ts   Schemas for everything in content/
  site.ts             Name, email, section links, socials
  pages/              index (the whole site) and 404
  layouts/Base.astro  <head> and shared scripts
  scripts/            reveal.ts (scroll reveals), smooth-scroll.ts (Lenis),
                      open-case.ts (project links open their case)
  styles/main.css     Fonts, colour tokens, shared classes
public/               Fonts, images, _redirects, sitemap.xml
```

To change copy, edit the YAML in `content/`. A project's `skills` lists the keys of the skills in `index.yml` it used: it shows up under those skills, in the colour of the first. A project with a live site gets `link`; one with public code gets `repo`; client work under NDA gets `confidential: true`.

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

Hosted on Cloudflare Workers (free plan) as static assets. Workers Builds is connected to this GitHub repo: every push to `main` runs the build command (`pnpm run generate`, an alias of `astro build`) and then `wrangler deploy`, which uploads `dist/` using `wrangler.jsonc`. Unknown paths get `404.html`. The old page addresses (`/about`, `/work`, `/contact`, `/service`, `/works`, `/projects`) 301 to their sections through `public/_redirects`.
