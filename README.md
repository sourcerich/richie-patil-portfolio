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

Hosted on Cloudflare Workers (free plan) as static assets. Workers Builds is connected to this GitHub repo: every push to `main` runs the build command (`pnpm run generate`, an alias of `astro build`) and then `wrangler deploy`, which uploads `dist/` using `wrangler.jsonc`. Unknown paths get `404.html`. Old `/works` and `/projects` addresses 301 to `/work` through `public/_redirects`.

## Credits

Station sounds (off by default):

- The chime (`public/audio/station-chime.*`) is cut from "Indian Railway announcement" by egovind on Freesound (https://freesound.org/s/684835/), CC0.
- The "पुढील स्थानक" announcements (`public/audio/announce/`, built by `tools/announcements.py`) take their pronunciation from Google's Marathi text-to-speech and their voice, through Seed-VC voice conversion, from the Central Railway announcer in "Kurla local train station Mumbai (1)" and "(2)" by sankalp on Freesound (https://freesound.org/s/180429/, https://freesound.org/s/180430/), CC BY 4.0.

The footage inside the Start page name (`public/video/mumbai-reel.*`, built by `tools/mumbai-reel.sh`) is the "4K TIMELAPSE MUMBAI" night skyline timelapse.
