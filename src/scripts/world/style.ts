/*
 * The look every part of the city shares, after Abeto's Messenger: cel
 * shading in a few flat bands, dark ink outlines (drawn by post.ts from
 * depth and normals), a painted sky, and streets packed with clutter.
 *
 * Rules for every part:
 * - Surfaces use toon() (MeshToonMaterial on the shared band ramp), not
 *   MeshStandardMaterial. Flat colour plus 2–3 light bands, no gloss.
 * - Colours come from PAL where one fits, so the stops read as one city.
 * - Light sources (lamp heads, lit windows, headlights, LEDs, signs that
 *   glow) use glow() or an emissive above 1, so the bloom in post.ts picks
 *   them up at night. Nothing that isn't a light should glow.
 * - Effects that must not get ink outlines (sprites, Points, additive
 *   glows and light pools, the sky dome, water sparkle) go through fx(),
 *   which moves them to layer 1. The camera renders layers 0 and 1; the
 *   outline pass only sees layer 0. Raycasting only sees layer 0 too.
 * - Light budget for the whole city: at most 9 real lights besides env's
 *   hemisphere + sun/moon. Owners: env 2, taxi 1, train 1, arch 1,
 *   hoardings 2, promenade 1, life 1. Fake the rest with additive pools
 *   (an fx() plane on the ground with glowTexture()).
 * - Big, close objects cast and receive shadows (mesh.castShadow /
 *   receiveShadow = true); distant fill does not.
 */
import * as THREE from 'three'

/** The cel ramp: three flat bands with a hard step between them. */
let ramp: THREE.DataTexture | null = null
export const toonRamp = () => {
  if (ramp) return ramp
  const steps = [72, 168, 255]
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
  ramp = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  ramp.minFilter = THREE.NearestFilter
  ramp.magFilter = THREE.NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

/** A cel-shaded surface. Pass extras (map, emissive, side, …) as usual. */
export const toon = (color: THREE.ColorRepresentation, extra: THREE.MeshToonMaterialParameters = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...extra })

/** An unlit light source (lamp head, lit window, LED) bright enough to bloom. `strength` above 1 blooms. */
export const glow = (color: THREE.ColorRepresentation, strength = 2.5) => {
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false })
  m.color.multiplyScalar(strength)
  return m
}

/** Move an object (and its children) to the no-outline effects layer. */
export const fx = <T extends THREE.Object3D>(obj: T): T => {
  obj.traverse(o => o.layers.set(1))
  return obj
}

/** Ink: the outline colour, and the colour for drawn dark details (seams, wires, grilles). */
export const INK = new THREE.Color('#1b1a24')

/** Mumbai, in paint. */
export const PAL = {
  taxiYellow: '#f2c21b',
  kaali: '#1f1d1b',
  autoGreen: '#2f7d4f',
  autoYellow: '#f4cf36',
  bestRed: '#c8202f',
  localCream: '#e9dfc4',
  localMaroon: '#7a2430',
  localPurple: '#6e4c8f',
  basalt: '#b49a62',
  basaltShade: '#8c7448',
  laterite: '#a2553a',
  chawl: ['#a9d3c3', '#e8b8b0', '#9cc3dd', '#efe1b8', '#c7d59a', '#e6cfa3'],
  concrete: '#c9c3b6',
  concreteDark: '#8f897d',
  asphalt: '#4b4d55',
  asphaltNight: '#24262e',
  kerbBlack: '#232226',
  kerbYellow: '#f0c419',
  foliage: ['#3f7d4c', '#2f6b45', '#5c9a4f', '#7fb04f'],
  bark: '#6b4f3a',
  sea: '#4fb3ad',
  seaDeep: '#2b7f8a',
  rust: '#a4572f',
  signBlue: '#2f6fb3',
  sky: { dayTop: '#5fc4c8', dayHorizon: '#cdeee6', nightTop: '#0b1030', nightHorizon: '#3a2b4a' },
  window: '#ffcf7a'
} as const
