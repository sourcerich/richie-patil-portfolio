/*
 * The Arabian Sea past the Marine Drive wall, painted rather than simulated:
 * flat teal water whose cel ripples and foam flecks roll in toward the wall,
 * darker toward the horizon, a glitter path under the sun or moon that breaks
 * into flat sparkles, and surf churning among the tetrapods. On it: concrete
 * tetrapods piled along the wall, Koli fishing boats bobbing with their flags
 * (a lantern each at night), and two ships on the horizon.
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, fx, glow, toon } from './style'
import { glowTexture } from './textures'

type V3 = [number, number, number]

const SEA_Y = -0.6
/** The Contact camera (scene.ts): the ripples are laid out to read at an even size from here. */
const VIEW = { x: 238, z: 5 }
/** Where env hangs the sun and moon relative to the camera, flattened onto the water. */
const SUN = new THREE.Vector2(70, 480).normalize()

/** Koli boats around the Contact view: bearing (degrees from +z toward +x) and distance from the camera. */
const BOATS = [
  { az: 7, d: 105, turn: 0.2 }, // in the glitter path: a silhouette at night
  { az: -12, d: 84, turn: -0.35 },
  { az: 24, d: 125, turn: 0.4 },
  { az: -20, d: 102, turn: 3 },
  { az: -4, d: 240, turn: 0.1 }, // beyond the Sea Link
  { az: 17, d: 262, turn: 2.9 }
]
/** Two ships on the horizon, clear of the moon, the Sea Link towers and the station board. */
const SHIPS = [
  { az: -6, d: 620, turn: 0 },
  { az: 18, d: 590, turn: Math.PI }
]

/** Two Koli paint jobs: upper hull, waterline band, bottom, wheelhouse, roof, and the flags. */
const PAINTS = [
  { top: '#2f6fb3', band: '#f2efe4', low: '#7c2a24', cabin: '#e9e4d6', roof: '#c8202f', flags: ['#f08a24', '#d6312b', '#2f9e5a', '#f4cf36', '#e8558f'] },
  { top: '#2f8a5a', band: '#f4cf36', low: '#232226', cabin: '#9cc3dd', roof: '#f08a24', flags: ['#d6312b', '#f4cf36', '#2f6fb3', '#f08a24', '#f2efe4'] }
]
type Paint = typeof PAINTS[number]

/** Where each boat hangs its lantern, in the boat's own frame. */
const LANTERN = new THREE.Vector3(0.62, 3.5, 0)

const at = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)

/** Collects coloured parts into one non-indexed geometry, so a whole object is one draw call. */
const kit = () => {
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  const e1 = new THREE.Vector3()
  const e2 = new THREE.Vector3()
  const n = new THREE.Vector3()
  const out = new THREE.Vector3()
  return {
    add(src: THREE.BufferGeometry, color: THREE.ColorRepresentation, m?: THREE.Matrix4) {
      const g = src.index ? src.toNonIndexed() : src
      if (m) g.applyMatrix4(m)
      const p = g.getAttribute('position')
      const nn = g.getAttribute('normal')
      c.set(color)
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i))
        nor.push(nn.getX(i), nn.getY(i), nn.getZ(i))
        col.push(c.r, c.g, c.b)
      }
      g.dispose()
      src.dispose()
    },
    /** One flat triangle, turned so it faces away from `inside`. */
    tri(a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3, color: THREE.ColorRepresentation, inside: THREE.Vector3) {
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(d, a))
      if (n.lengthSq() < 1e-10) return
      n.normalize()
      out.set((a.x + b.x + d.x) / 3, (a.y + b.y + d.y) / 3, (a.z + b.z + d.z) / 3).sub(inside)
      const flip = n.dot(out) < 0
      if (flip) n.negate()
      c.set(color)
      for (const v of flip ? [a, d, b] : [a, b, d]) {
        pos.push(v.x, v.y, v.z)
        nor.push(n.x, n.y, n.z)
        col.push(c.r, c.g, c.b)
      }
    },
    build() {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
      g.computeBoundingSphere()
      return g
    }
  }
}

/** A concrete tetrapod: four tapered legs out of a hub, about 1.7 m tall standing. */
const tetrapodGeometry = () => {
  const k = kit()
  const up = new THREE.Vector3(0, 1, 0)
  const q = new THREE.Quaternion()
  const legs: V3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]
  for (const v of legs) {
    q.setFromUnitVectors(up, new THREE.Vector3(...v).normalize())
    k.add(new THREE.CylinderGeometry(0.24, 0.44, 1.3, 7), '#ffffff', new THREE.Matrix4().makeRotationFromQuaternion(q).multiply(new THREE.Matrix4().makeTranslation(0, 0.65, 0)))
  }
  k.add(new THREE.IcosahedronGeometry(0.5, 0), '#ffffff')
  return k.build()
}

/**
 * A Koli fishing boat, 10.5 m, origin at the waterline: a hull lofted from
 * stations with the tall pointed prow, a wheelhouse aft, nets on deck, a
 * bamboo mast and bow pole strung with flags and pennants.
 */
const boatGeometry = (paint: Paint) => {
  const k = kit()
  const L = 10.5
  const B = 3.1
  const N = 12
  const DECK = '#9a7a52'
  const beam = (u: number) => u < 0.45
    ? B / 2 * (0.8 + 0.2 * Math.sin(u / 0.45 * Math.PI / 2))
    : B / 2 * Math.pow(Math.max(0, Math.cos((u - 0.45) / 0.55 * Math.PI / 2)), 0.75)
  const sheer = (u: number) => 1 + 0.25 * Math.max(0, 1 - u / 0.2) + 1.5 * Math.pow(Math.max(0, (u - 0.55) / 0.45), 2.2)
  const keel = (u: number) => -0.5 + 0.3 * Math.pow(Math.max(0, (u - 0.8) / 0.2), 2)

  type Section = { S: THREE.Vector3, M: THREE.Vector3, C: THREE.Vector3, K: THREE.Vector3, Sl: THREE.Vector3, Ml: THREE.Vector3, Cl: THREE.Vector3 }
  const secs: Section[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const x = (u - 0.5) * L
    const h = beam(u)
    const s = sheer(u)
    secs.push({
      S: new THREE.Vector3(x, s, h),
      M: new THREE.Vector3(x, 0.42, 0.97 * h),
      C: new THREE.Vector3(x, -0.12, 0.8 * h),
      K: new THREE.Vector3(x, keel(u), 0),
      Sl: new THREE.Vector3(x, s, -h),
      Ml: new THREE.Vector3(x, 0.42, -0.97 * h),
      Cl: new THREE.Vector3(x, -0.12, -0.8 * h)
    })
  }
  const inside = new THREE.Vector3()
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, color: string) => {
    k.tri(a, b, c, color, inside)
    k.tri(a, c, d, color, inside)
  }
  for (let i = 0; i < N; i++) {
    const a = secs[i]!
    const b = secs[i + 1]!
    inside.set(THREE.MathUtils.clamp((a.S.x + b.S.x) / 2, -L / 2 + 1.2, L / 2 - 1.2), 0.45, 0)
    quad(a.S, b.S, b.M, a.M, paint.top)
    quad(a.M, b.M, b.C, a.C, paint.band)
    quad(a.C, b.C, b.K, a.K, paint.low)
    quad(a.Sl, b.Sl, b.Ml, a.Ml, paint.top)
    quad(a.Ml, b.Ml, b.Cl, a.Cl, paint.band)
    quad(a.Cl, b.Cl, b.K, a.K, paint.low)
    quad(a.S, b.S, b.Sl, a.Sl, DECK)
  }
  // the transom
  const st = secs[0]!
  const ring = [st.S, st.M, st.C, st.K, st.Cl, st.Ml, st.Sl]
  const hub = new THREE.Vector3(st.S.x, 0.45, 0)
  inside.set(st.S.x + 1.2, 0.45, 0)
  for (let i = 0; i < ring.length; i++) k.tri(hub, ring[i]!, ring[(i + 1) % ring.length]!, paint.top, inside)

  // wheelhouse with its window band and roof
  const cx = -L / 2 + 0.24 * L
  k.add(box(2, 1.5, 1.9), paint.cabin, at([cx, 1.6, 0]))
  k.add(box(2.04, 0.32, 1.94), '#26303a', at([cx, 1.95, 0]))
  k.add(box(2.4, 0.12, 2.2), paint.roof, at([cx, 2.41, 0]))
  // nets heaped on deck
  k.add(box(1.6, 0.35, 1.5), '#2c5d7a', at([1.6, 1.22, 0]))
  k.add(box(0.9, 0.25, 0.9), '#c8202f', at([1.4, 1.48, 0.2], [0, 0.4, 0]))
  // bamboo mast and bow pole
  const BAMBOO = '#c9a86a'
  const mx = 0.4
  const bx = L / 2 - 0.75
  k.add(box(0.12, 5.4, 0.12), BAMBOO, at([mx, 3.7, 0]))
  k.add(box(0.08, 2, 0.08), BAMBOO, at([bx, 3, 0]))
  // flags fly aft
  paint.flags.slice(0, 3).forEach((f, i) => k.add(box(0.85, 0.48, 0.03), f, at([mx - 0.47, 6.1 - i * 0.55, 0])))
  paint.flags.slice(3).forEach((f, i) => k.add(box(0.6, 0.4, 0.03), f, at([bx - 0.33, 3.75 - i * 0.5, 0])))
  // pennant strings from the masthead to the bow pole and the stern
  const pennantLine = (from: V3, to: V3, pennants: number) => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const len = a.distanceTo(b)
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    const mid = a.clone().lerp(b, 0.5)
    k.add(box(len, 0.03, 0.03), '#3a3226', at([mid.x, mid.y, mid.z], [0, 0, ang]))
    for (let i = 1; i <= pennants; i++) {
      const p = a.clone().lerp(b, i / (pennants + 1))
      k.add(box(0.24, 0.3, 0.02), paint.flags[i % paint.flags.length]!, at([p.x, p.y - 0.17, p.z]))
    }
  }
  pennantLine([mx, 6.35, 0], [bx, 3.95, 0], 4)
  pennantLine([-L / 2 + 0.2, 2.15, 0], [mx, 6.35, 0], 5)
  // the lantern's hook
  k.add(box(0.3, 0.04, 0.04), '#3a3226', at([mx + 0.2, LANTERN.y + 0.2, 0]))
  return k.build()
}

/** A coastal container ship, 92 m, origin at the waterline, bow toward +x. */
const shipParts = (k: ReturnType<typeof kit>, base: THREE.Matrix4) => {
  const part = (g: THREE.BufferGeometry, color: string, p: V3) => k.add(g, color, base.clone().multiply(at(p)))
  const HULL = '#2c323d'
  part(box(92, 7.5, 15), HULL, [0, 2.25, 0])
  part(box(92.3, 1, 15.3), '#8a2f2a', [0, 0.3, 0])
  part(box(10, 2, 15), HULL, [41, 7, 0])
  const boxes = ['#b5523a', '#3f6f8f', '#c79a3a', '#4f7a4f']
  boxes.forEach((c, i) => part(box(13.5, 4.6, 13), c, [-20 + i * 14.5, 8.3, 0]))
  part(box(11, 9, 13), '#e3dccb', [-37, 10.5, 0])
  part(box(13, 1.6, 15.6), '#e3dccb', [-35, 15.8, 0])
  part(box(4, 6, 4.2), '#b8452e', [-42.5, 18, 0])
  part(box(0.6, 10, 0.6), '#3a3f48', [40, 11, 0])
}
/** Masthead, bridge and stern lights, in the ship's frame. */
const SHIP_LIGHTS: { p: V3, c: string }[] = [
  { p: [40, 16.2, 0], c: '#ffffff' },
  { p: [-35, 17, 0], c: '#fff2c8' },
  { p: [-46, 7, 0], c: '#ff5a4a' }
]

const vertexShader = /* glsl */`
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

const fragmentShader = /* glsl */`
uniform float uTime;
uniform vec2 uView;
uniform vec2 uSun;
uniform float uWall;
uniform vec3 uNear;
uniform vec3 uDeep;
uniform vec3 uLight;
uniform vec3 uFoam;
uniform vec3 uGlint;
varying vec3 vWorld;
#include <fog_pars_fragment>

float seaHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float seaNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(seaHash(i), seaHash(i + vec2(1.0, 0.0)), u.x), mix(seaHash(i + vec2(0.0, 1.0)), seaHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// A hard cel edge, softened by about a pixel so it does not crawl.
float cut(float e, float v) {
  float w = fwidth(v) * 0.7 + 1e-4;
  return smoothstep(e - w, e + w, v);
}

void main() {
  float t = uTime;
  vec2 r = vWorld.xz - uView;
  float d = max(length(r), 12.0);
  // Ripple space: across in metres (7 m a unit), outward in log distance, so
  // rows of ripples shrink toward the horizon the way a painter draws them.
  vec2 q = vec2(atan(r.x, r.y) * d / 7.0, log(d) * 4.2);
  float n = seaNoise(q + vec2(t * 0.05, t * 0.16));
#ifndef SEA_SIMPLE
  n = n * 0.62 + seaNoise(q * vec2(2.1, 1.9) + vec2(-t * 0.09, t * 0.3) + 7.3) * 0.38;
#endif
  float detail = 1.0 - smoothstep(260.0, 560.0, d);

  // flat teal, darker toward the horizon, with two hard ripple tones
  vec3 col = mix(uNear, uDeep, smoothstep(40.0, 420.0, d));
  col = mix(col, col * 0.76, (1.0 - cut(0.36, n)) * detail);
  col = mix(col, uLight, cut(0.66, n) * detail);
#ifndef SEA_SIMPLE
  float fleck = seaNoise(q * vec2(2.6, 3.4) + vec2(t * 0.04, t * 0.5) + 3.1);
  col = mix(col, uFoam, cut(0.78, fleck) * cut(0.58, n) * detail);
#endif

  // surf churning among the tetrapods along the wall
  float zw = vWorld.z - uWall;
  float reach = 4.0 + seaNoise(vec2(vWorld.x * 0.12, t * 0.3)) * 3.5 + sin(t * 0.7 + vWorld.x * 0.05) * 0.8;
  float churn = seaNoise(vWorld.xz * vec2(0.5, 0.9) + vec2(t * 0.15, -t * 0.7)) + (1.0 - zw / reach) * 0.35;
  col = mix(col, uFoam, (1.0 - cut(reach, zw)) * cut(0.55, churn));

  // the glitter path under the sun or moon, seen from wherever the camera is,
  // a solid streak near the horizon breaking into flat sparkles nearer in
  vec2 rc = vWorld.xz - cameraPosition.xz;
  float dc = length(rc);
  vec2 dir = rc / max(dc, 1e-3);
  float off = abs(dir.x * uSun.y - dir.y * uSun.x);
  float halfW = mix(0.03, 0.065, smoothstep(80.0, 600.0, dc));
  float path = (1.0 - smoothstep(halfW * 0.35, halfW, off)) * step(0.0, dot(dir, uSun));
  vec2 g = q * vec2(3.0, 1.6);
  float h = seaHash(floor(g));
  vec2 fc = abs(fract(g) - 0.5);
  float dash = (1.0 - cut(0.16 + 0.22 * h, fc.x)) * (1.0 - cut(0.3, fc.y));
  float twinkle = step(0.3, sin(t * (1.2 + h * 2.4) + h * 40.0));
  float sparkle = dash * twinkle * step(0.25, h) * (1.0 - smoothstep(320.0, 520.0, dc));
  float streak = smoothstep(260.0, 640.0, dc) * 0.85;
  col = mix(col, uLight, path * 0.35);
  col = mix(col, uGlint, path * max(sparkle, streak));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`

export const buildSea = (ctx: Ctx) => {
  const { scene, compact, reduced } = ctx
  const rand = ctx.rng(4242)
  // The sea face of the parapet promenade.ts builds on the wall.
  const seaFace = LAYOUT.promenade.wallZ + 0.8
  const m = new THREE.Matrix4()
  const c = new THREE.Color()

  // ——— water ———
  const water = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 },
      uView: { value: new THREE.Vector2(VIEW.x, VIEW.z) },
      uSun: { value: SUN.clone() },
      uWall: { value: seaFace },
      uNear: { value: new THREE.Color() },
      uDeep: { value: new THREE.Color() },
      uLight: { value: new THREE.Color() },
      uFoam: { value: new THREE.Color() },
      uGlint: { value: new THREE.Color() }
    }]),
    vertexShader,
    fragmentShader,
    fog: true,
    defines: compact ? { SEA_SIMPLE: 1 } : {}
  })
  const u = water.uniforms
  // From under the wall out past where the fog closes in.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 1060).rotateX(-Math.PI / 2), water)
  sea.position.set(100, SEA_Y, 45 + 530)
  scene.add(fx(sea))

  // ——— tetrapods piled along the outside of the wall ———
  const rows = compact ? 2 : 3
  const stepX = compact ? 3 : 2.3
  const maxT = Math.ceil(134 / (stepX * 0.85)) * rows
  const tetra = new THREE.InstancedMesh(tetrapodGeometry(), toon('#ffffff'), maxT)
  const p = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const s = new THREE.Vector3()
  const algae = new THREE.Color('#6f7f66')
  let nT = 0
  for (let row = 0; row < rows; row++) {
    for (let x = 184 + row * stepX * 0.5; x < 316 && nT < maxT; x += stepX * (0.85 + rand() * 0.3)) {
      // The front row sits just below the parapet top; the outer rows stand in the surf.
      p.set(x + (rand() - 0.5) * 0.6, -0.2 - row * 0.5 + (rand() - 0.5) * 0.3, seaFace + 0.7 + row * 1.9 + (rand() - 0.5) * 0.5)
      q.setFromEuler(e.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2))
      s.setScalar(0.88 + rand() * 0.24)
      tetra.setMatrixAt(nT, m.compose(p, q, s))
      tetra.setColorAt(nT, c.set(PAL.concrete).multiplyScalar(0.78 + rand() * 0.2).lerp(algae, row * 0.22))
      nT++
    }
  }
  tetra.count = nT
  scene.add(tetra)

  // ——— Koli boats ———
  const spots = compact ? BOATS.filter((_, i) => i < 3 || i === 4) : BOATS
  const vertexPaint = toon('#ffffff', { vertexColors: true })
  const fleets = PAINTS.map(pt => new THREE.InstancedMesh(boatGeometry(pt), vertexPaint, spots.length))
  const boats = spots.map((b, i) => {
    const a = THREE.MathUtils.degToRad(b.az)
    return {
      x: VIEW.x + Math.sin(a) * b.d,
      z: VIEW.z + Math.cos(a) * b.d,
      // turned roughly broadside to the camera, so the prow and flags read
      yaw: a + b.turn,
      ph: rand() * Math.PI * 2,
      mesh: fleets[i % 2]!,
      slot: Math.floor(i / 2)
    }
  })
  fleets.forEach((f, v) => {
    f.count = boats.filter((_, i) => i % 2 === v).length
    f.frustumCulled = false
    scene.add(f)
  })

  const lanternMat = glow('#ffc46a', 3)
  const lanternNight = lanternMat.color.clone()
  const lanternDay = new THREE.Color('#6d6250')
  const lanterns = new THREE.InstancedMesh(box(0.22, 0.3, 0.22), lanternMat, boats.length)
  lanterns.frustumCulled = false
  scene.add(fx(lanterns))

  // ——— ships on the horizon ———
  const shipKit = kit()
  const shipLights: number[] = []
  const shipCols: number[] = []
  const v = new THREE.Vector3()
  // Phones skip them: a hazy silhouette on the horizon is the first thing to go.
  for (const sh of compact ? [] : SHIPS) {
    const a = THREE.MathUtils.degToRad(sh.az)
    const base = at([VIEW.x + Math.sin(a) * sh.d, SEA_Y, VIEW.z + Math.cos(a) * sh.d], [0, a + sh.turn, 0])
    shipParts(shipKit, base)
    for (const l of SHIP_LIGHTS) {
      v.set(...l.p).applyMatrix4(base)
      shipLights.push(v.x, v.y, v.z)
      c.set(l.c)
      shipCols.push(c.r, c.g, c.b)
    }
  }
  if (!compact) scene.add(new THREE.Mesh(shipKit.build(), vertexPaint))

  // ——— lights on the water: boat lanterns and ship lights, one draw ———
  const nL = boats.length + shipLights.length / 3
  const lightPos = new Float32Array(nL * 3)
  lightPos.set(shipLights, boats.length * 3)
  const lightBase = new Float32Array(nL * 3)
  c.set('#ffc46a')
  for (let i = 0; i < boats.length; i++) lightBase.set([c.r, c.g, c.b], i * 3)
  lightBase.set(shipCols, boats.length * 3)
  const lightCol = new Float32Array(nL * 3)
  const lightPosAttr = new THREE.BufferAttribute(lightPos, 3)
  const lightColAttr = new THREE.BufferAttribute(lightCol, 3)
  const lightGeo = new THREE.BufferGeometry()
  lightGeo.setAttribute('position', lightPosAttr)
  lightGeo.setAttribute('color', lightColAttr)
  const lights = new THREE.Points(lightGeo, new THREE.PointsMaterial({
    map: glowTexture(),
    size: compact ? 11 : 14,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  }))
  lights.frustumCulled = false
  scene.add(fx(lights))

  // ——— bobbing ———
  const bp = new THREE.Vector3()
  const bq = new THREE.Quaternion()
  const be = new THREE.Euler()
  const one = new THREE.Vector3(1, 1, 1)
  const bm = new THREE.Matrix4()
  const lamp = new THREE.Vector3()
  const bob = (t: number) => {
    boats.forEach((b, i) => {
      bp.set(b.x, SEA_Y + Math.sin(t * 0.9 + b.ph) * 0.07, b.z)
      // yaw, then roll about the keel, then a little pitch
      be.set(Math.sin(t * 0.75 + b.ph * 1.7) * 0.05, b.yaw, Math.sin(t * 0.55 + b.ph) * 0.03, 'YXZ')
      bm.compose(bp, bq.setFromEuler(be), one)
      b.mesh.setMatrixAt(b.slot, bm)
      lamp.copy(LANTERN).applyMatrix4(bm)
      lanterns.setMatrixAt(i, m.makeTranslation(lamp.x, lamp.y, lamp.z))
      lightPos[i * 3] = lamp.x
      lightPos[i * 3 + 1] = lamp.y
      lightPos[i * 3 + 2] = lamp.z
    })
    for (const f of fleets) f.instanceMatrix.needsUpdate = true
    lanterns.instanceMatrix.needsUpdate = true
    lightPosAttr.needsUpdate = true
  }
  bob(0)

  // ——— day / night ———
  const day = {
    uNear: new THREE.Color(PAL.sea),
    uDeep: new THREE.Color(PAL.seaDeep),
    uLight: new THREE.Color('#8fd8cf'),
    uFoam: new THREE.Color('#f3fbf5'),
    uGlint: new THREE.Color('#fff1cf').multiplyScalar(1.25)
  }
  const night: typeof day = {
    uNear: new THREE.Color('#17465a'),
    uDeep: new THREE.Color('#0a2233'),
    uLight: new THREE.Color('#2e6e80'),
    uFoam: new THREE.Color('#9fc3cc'),
    uGlint: new THREE.Color('#ffefc0').multiplyScalar(2.2)
  }
  const keys = Object.keys(day) as (keyof typeof day)[]
  ctx.onMode((mix) => {
    for (const k of keys) (u[k]!.value as THREE.Color).copy(day[k]).lerp(night[k], mix)
    lanternMat.color.copy(lanternDay).lerp(lanternNight, mix)
    // Lanterns and ship lights only burn after dark; above 1 so the bloom takes them.
    const lit = mix * 1.8
    for (let i = 0; i < lightCol.length; i++) lightCol[i] = lightBase[i]! * lit
    lightColAttr.needsUpdate = true
  })

  ctx.onFrame(({ t }) => {
    if (reduced) return
    // Wrapped, so the noise keeps its float precision in a long session.
    u.uTime!.value = t % 900
    bob(t)
  })
}
