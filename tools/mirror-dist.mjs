// Cloudflare Pages still builds this repo with the old Nuxt command
// (`pnpm run generate`, output directory `.output/public`). `generate` now
// runs Astro, which writes `dist/`; this copies that to the old path so the
// existing Pages build configuration keeps working unchanged. The clean fix
// is to set the Pages build command to `pnpm build` and output to `dist`,
// after which this script can be deleted.
import { cpSync, rmSync } from 'node:fs'

rmSync('.output/public', { recursive: true, force: true })
cpSync('dist', '.output/public', { recursive: true })
