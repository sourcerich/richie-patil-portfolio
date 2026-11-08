# diwali.richiepatil.com

A separate Cloudflare Worker (static assets only) for the Diwali page. It reuses the portfolio's flower scene with the
`?palette=diwali` night palette, and has its own title, diyas and deploy.

- `site/`: the page (`index.html`, `diwali.css`, `diwali.js`) plus the scene build, fonts and scene assets it needs.
- `wrangler.jsonc`: Worker `richie-patil-diwali`, served on `diwali.richiepatil.com` as a custom domain.

## Preview

```bash
npx wrangler dev --config diwali/wrangler.jsonc
```

## Deploy

```bash
npx wrangler deploy --config diwali/wrangler.jsonc
```

Or create a second Workers Builds project in Cloudflare for this repo with root directory `diwali` and deploy command
`npx wrangler deploy`, so pushes to `main` publish it too.

## Updating the scene

The scene source lives in the animation project. After changing it, run `npm run build:scene` there and copy its
`public/scene-build` into `site/scene-build`.
