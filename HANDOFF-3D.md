# Handoff: 3D Mumbai Start page (Messenger-style polish)

Written mid-task so another model or session can pick this up. Nothing is committed yet.

## What the user wants

- The Start page (`/`) is a 3D Mumbai built with three.js. The camera glides between five stops, one per page:
  - Start, x=0: a kaali-peeli taxi
  - About, x=60: a local-train platform
  - Service, x=120: a Gateway-of-India arch with lanterns
  - Work, x=180: project hoardings
  - Contact, x=240: the sea promenade and a post box
- **Goal:** "a lot more granular polish to look lifelike". The user chose a style modelled on Abeto's Messenger (https://messenger.abeto.co/):
  - cel shading in flat bands
  - dark ink outlines from a post-processing pass
  - a painted sky with flat clouds
  - every view **densely packed with believable, specific Mumbai detail** at true scale (1 unit = 1 m)
  - not photoreal
- **Permanent rule:** never remove the Marathi (Devanagari) text or the station chime/announcement sounds.
- The user is close to their usage limit. Work frugally: don't spawn many agents at once and don't do long exploration.

## Architecture (`src/scripts/world/`)

**Shared files.** Keep these stable.

| File | What it does |
|---|---|
| `context.ts` | The `Ctx` contract every module is built against (`scene`, `renderer`, `camera`, `compact`, `reduced`, `opts`, `pickables`, `rng(seed)`, `onMode(mix)`, `onFrame(info)`). Also the `FrameInfo` type and the `LAYOUT` anchors; don't move anchors. |
| `style.ts` | The shared look: `toon()` (MeshToonMaterial on a 3-band ramp), `glow(color, strength)` for light sources that should bloom, `fx(obj)` to put an object on layer 1 so it gets no outline and isn't raycast, `INK`, and the `PAL` palette. The header comment holds the rules, including the light budget (max 9 real lights besides hemi + sun). |
| `textures.ts` | `glowTexture`, `glowSprite` (already on layer 1), and the station signs: `signTexture`, `labelTexture`, `signMesh`. The signs carry the Marathi names. |
| `scene.ts` | The orchestrator: camera `POSES`, glide, day/night crossfade, picking, render loop. The camera has layer 1 enabled. |
| `stage.ts` | DOM, input and sound. It dynamic-imports `scene.ts`. |
| `src/pages/index.astro` | The HTML panels, which double as the no-WebGL fallback. |

**Modules.** Each exports `buildX(ctx)`.

| Module | Owns |
|---|---|
| `env.ts` | Sky, light, fog, stars, dust |
| `post.ts` | Outline, bloom and grade passes |
| `city.ts` | Skyline and the Sea Link |
| `ground.ts` | Road, kerbs, tracks, street lamps, sea wall |
| `sea.ts` | The water and everything on it |
| `promenade.ts` | Marine Drive and the post box |
| `taxi.ts` | The hero taxi |
| `train.ts` | The local train and the platform |
| `arch.ts` | The arch and its lanterns |
| `hoardings.ts` | The project hoardings |
| `life.ts` | Street life (currently an empty stub) |

A backup of every world file from before the polish is in `C:\Users\Richie\AppData\Local\Temp\claude\C--Users-Richie-Code-Personal-sourcerich-github-io\e65dc105-c999-4ca2-9290-9ca779d2c08e\scratchpad\world-backup-pre-polish`.

## Status

**Done in the new style.** These compile, lint clean and build, but have only been briefly looked at in a browser:
- `env.ts` + `post.ts`: painted sky with clouds, sun/moon, shadows, NeutralToneMapping, ink outline pass, bloom, paper grade, fallbacks.
- `sea.ts` + `promenade.ts`: Messenger water, tetrapods, Koli boats, Queen's Necklace lamps, Indian pillar box.
- `taxi.ts`: a true-size (3.9 m) Premier Padmini. The Start camera pose in `scene.ts` has **not** been updated for the smaller taxi yet, so it looks small and far away.
- `arch.ts`: the Gateway of India, lanterns and pigeons.
- `hoardings.ts`: lattice hoardings, catwalks, floodlights and a plaza.

**Not started.** These are still the old toy versions:
- `city.ts`
- `ground.ts`
- `train.ts`
- `life.ts` (empty)

**Being investigated when work stopped.** In the first browser test the composer output looked all black, and disabling `bloom` made the image appear. A later on-frame `readPixels` sample showed non-black output with bloom on (avg ~264/765), so it may have been transient (the first frames, or the hidden browser pane).
- Verify this.
- If it's still black, suspect NaN/Inf in the HDR scene target feeding UnrealBloomPass. Add a small clamp/NaN-scrub ShaderPass before bloom, e.g. `c = clamp(c, 0.0, 64.0)` and zero any NaN.
- Even with bloom off, the image looked dark and washed out. Tune exposure, the grade and the night levels.

**Temporary debug code. Remove before shipping:**
- `scene.ts`: the `if (location.search.includes('debug')) window.__mumbai = {...}` block, marked `TEMP`.
- `post.ts`: `passes: {...}` in `makePipe`'s return value and `pipe: () => pipe` in `buildPost`'s return value, marked `TEMP`.

## Remaining work, in order

1. **Fix or confirm the post pipeline.** Check it in a browser at `http://localhost:4330/?debug`:

   ```bash
   npx -y pnpm@10.18.0 build
   ```

   Then start the preview server (`astro-preview` in `.claude/launch.json`, port 4330). The user's own dev server on 4321 predates the `three` install and serves stale deps, so use the build + preview instead.

2. **Write the four missing modules,** one at a time. Each module edits only its own file. Use `toon()`, `PAL`, `glow()` and `fx()`; handle `onMode` for day and night, and `compact`/`reduced`. Keep the station sign via `signMesh(ctx, i)`, with its Marathi readable. Merge geometry per material and instance repeats.
   - **city.ts** (budget ≤40 draw calls desktop, ≤22 compact):
     - Buildings: chawls with verandas and pastel `PAL.chawl` paint, 6–12 storey blocks with balconies, towers 20–60 storeys with stepped crowns, a tower crane with a blinking red lamp.
     - Roof clutter: black water tanks on most roofs, AC units, dish antennas.
     - Windows: an emissiveMap that's lit at night, with some TV-blue windows.
     - The Bandra-Worli Sea Link with inverted-Y towers, cable fans and deck lights.
     - A line of far-shore city lights beyond z=300.
   - **ground.ts** (≤30 / ≤16):
     - Asphalt texture with patches, cracks and faded dashes, plus a zebra crossing that stays clear of the taxi footprint (x 0–9, z 0–6.5).
     - Kerbs in black and yellow stripes; footpaths of paver blocks at near side z 8–11 and far side z −4 to −3.
     - Ballast beds and concrete sleepers for the tracks (z −14.5 and −20).
     - A compound wall at z≈−23 with posters and graffiti.
     - Curved-arm sodium street lamps: a `glow()` head and an `fx()` light pool. No real lights.
     - Keep the sea wall at z=46, wall top y=1.1.
   - **train.ts** (≤30 / ≤16):
     - Western Railway EMU: cream with a maroon band, open doorways with grab poles and people hanging out, barred lit windows, a pantograph.
     - Destination board reading "CHURCHGATE / चर्चगेट".
     - Keep `pass()` and the ambient passes every 18–34 s.
     - Catenary masts and wires.
     - Platform (x 15–105, z −9, 7 m deep, 1.1 m high): corrugated roof, fans, tube lights, LED indicator, clock, benches, a tea stall.
     - Keep the About camera's view of the train clear.
   - **life.ts** (≤40 / ≤20):
     - Utility poles every ~25 m with sagging wires, and crows on the wires.
     - Rain trees, palms near the sea, a gulmohar.
     - Stylised people: walking the footpaths, waiting on the platform top, sitting on the sea wall.
     - Traffic in lanes z −2 / −0.4: autos, taxis, a BEST double-decker, scooters. Parked when `reduced`.
     - Clutter: bus stop, chai and vada-pav stalls, cones, dogs, bunting.
     - Stay out of the camera corridors (`POSES` in `scene.ts`) and these footprints: taxi, platform, arch (x 105–135, z −16 to −3), hoardings (x 155–205, z 4–30), post box (x 240–252, z 15–22).

3. **Integrate.**
   - Enforce the light budget and fix overlaps between modules.
   - Update the Start pose in `scene.ts` for the true-size taxi. It should sit on the right half of the screen, because the text panel is on the left.
   - Remove `LAYOUT.taxi.scale` if it's unused.
   - Set `antialias: false` in `scene.ts`, since post does its own MSAA, and drop the ACES line there (env sets Neutral).

4. **Check visually** at every stop, day and night, desktop and a 375-px phone width.
   - In the browser pane, inject `.panels,.hud,.pager,.plain{display:none!important}` to see the bare scene.
   - Phone screenshots in the pane come back cropped, so use DOM measurements to check phone layouts.

5. **Before committing:**
   - Remove the debug code.
   - Run `npx -y pnpm@10.18.0 exec tsc --noEmit -p .`, `npx -y pnpm@10.18.0 lint` and `npx -y pnpm@10.18.0 build`.
   - Ask the user before committing.

## Repo facts

- tsconfig is Astro strict, with `verbatimModuleSyntax` (use `import type`).
- ESLint uses the stylistic preset: no semicolons, single quotes, 2-space indent, no trailing commas, 1tbs braces.
- three 0.186. Import addons from `three/examples/jsm/...`.
- Canvas text fonts: `"Yatra One"` for Latin, `Eczar` for Devanagari.
