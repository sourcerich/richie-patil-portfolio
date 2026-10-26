/*
 * The kaali-peeli taxi at the Start stop: a Premier Padmini at true size
 * (1 unit = 1 m, front along local +x), black below the windows and yellow
 * above, with chrome bumpers and overriders, round headlamps, a slim grille,
 * fender mirrors, a roof carrier with a tied bundle, the flag meter on the
 * kerb side and the cabbie resting his elbow on the open window. Opaque
 * parts share one vertex-coloured toon mesh and the lamps one glow mesh, so
 * the whole car costs a handful of draw calls. It turns a little toward the
 * pointer, and honks (bounces, flashes its lamps) when clicked.
 */
import * as THREE from 'three'
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { LAYOUT, type Ctx } from './context'
import { PAL, fx, glow, toon } from './style'
import { glowSprite, glowTexture } from './textures'

type V3 = [number, number, number]

const CHROME = '#c9ced6'
const RUBBER = '#151517'
const INKC = '#121117'
const RACK = '#9aa1aa'
const ROPE = '#d6bf8a'
const SEAT = '#8e2f2a'
const SKIN = '#94603f'
const KHAKI = '#b49a64'
const HEAD = '#fff3d6'
const AMBER = '#ffa62b'
const RED = '#e3262a'

const KEEP = ['position', 'normal', 'uv']
const m4 = new THREE.Matrix4()
const qt = new THREE.Quaternion()
const eu = new THREE.Euler()
const pv = new THREE.Vector3()
const sv = new THREE.Vector3()
const cl = new THREE.Color()

/** Gathers pieces for one merged mesh; each piece carries its colour as vertex colours. */
const collector = () => {
  const list: THREE.BufferGeometry[] = []
  const add = (geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    geo.dispose()
    for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k)
    g.applyMatrix4(m4.compose(pv.set(...p), qt.setFromEuler(eu.set(...r)), sv.set(...s)))
    cl.set(color)
    const n = g.attributes.position.count
    const c = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) c.set([cl.r, cl.g, cl.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    list.push(g)
  }
  const build = () => {
    const merged = mergeGeometries(list) ?? new THREE.BufferGeometry()
    list.forEach(g => g.dispose())
    return merged
  }
  return { add, build }
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 2, r)
const cyl = (r: number, h: number, n = 10) => new THREE.CylinderGeometry(r, r, h, n)
const ball = (r: number, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h)
const v2 = (x: number, y: number) => new THREE.Vector2(x, y)

/** A flat panel: the side outline `pts` (x, y) extruded across z from z0 to z1. */
const slab = (pts: [number, number][], z0: number, z1: number) => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => v2(x, y))), { depth: z1 - z0, bevelEnabled: false })
  return g.translate(0, 0, z0)
}

/*
 * The side profile of the lower body. The extrude bevel grows it by 0.06
 * all round, so the finished car runs x ±1.92, sits 0.20 off the road and
 * has its beltline at 0.98, with 0.40 m wheel arches round the axles.
 */
const bodyShape = () => {
  const s = new THREE.Shape()
  s.moveTo(-1.8, 0.26)
  s.lineTo(-1.64, 0.26)
  s.absarc(-1.18, 0.26, 0.46, Math.PI, 0, true)
  s.lineTo(0.74, 0.26)
  s.absarc(1.2, 0.26, 0.46, Math.PI, 0, true)
  s.lineTo(1.78, 0.26)
  s.quadraticCurveTo(1.86, 0.26, 1.86, 0.36)
  s.lineTo(1.86, 0.72)
  s.quadraticCurveTo(1.86, 0.82, 1.74, 0.83)
  s.lineTo(1.2, 0.86)
  s.quadraticCurveTo(0.95, 0.88, 0.8, 0.92)
  s.lineTo(-1.06, 0.92)
  s.quadraticCurveTo(-1.3, 0.92, -1.55, 0.89)
  s.quadraticCurveTo(-1.86, 0.86, -1.86, 0.7)
  s.lineTo(-1.86, 0.36)
  s.quadraticCurveTo(-1.86, 0.27, -1.83, 0.26)
  return s
}

/** The yellow commercial plate, front and back. */
const plateTexture = () => {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 116
  const g = c.getContext('2d')!
  g.fillStyle = '#f7d038'
  g.fillRect(0, 0, 512, 116)
  g.strokeStyle = '#14120d'
  g.lineWidth = 7
  g.strokeRect(8, 8, 496, 100)
  g.fillStyle = '#14120d'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 74px "Arial Narrow", Arial, Helvetica, sans-serif'
  g.fillText('MH 01 AB 1234', 256, 61, 470)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** A soft rounded-rectangle dark patch, so the car sits on the road even where shadows are soft. */
const shadowTexture = () => {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(0,0,0,0.09)'
  for (let i = 0; i < 12; i++) {
    const k = i * 5
    g.beginPath()
    g.roundRect(14 + k, 14 + k * 0.6, 228 - 2 * k, 100 - 1.2 * k, Math.max(4, 40 - k))
    g.fill()
  }
  return new THREE.CanvasTexture(c)
}

export const buildTaxi = (ctx: Ctx) => {
  const { scene, compact } = ctx
  const taxi = new THREE.Group()
  const car = collector()
  const glass = collector()
  const lamps = collector()
  const plates = collector()
  const Y = PAL.taxiYellow

  // ——— lower body: one bevelled extrude, smoothed across the bevel but creased at the arches ———
  const body = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: 1.34,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: compact ? 2 : 3,
    curveSegments: compact ? 6 : 10
  })
  body.translate(0, 0, -0.67)
  car.add(toCreasedNormals(body, 0.85), PAL.kaali)
  // Dark chassis inside, so the arches show wheel wells rather than sky.
  car.add(box(3.4, 0.6, 1.04), INKC, [0, 0.55, 0])

  // ——— wheels: rounded tyres, black steel rims, domed chrome hubcaps ———
  const seg = compact ? 14 : 22
  const tyre = new THREE.LatheGeometry([
    v2(0.17, -0.05), v2(0.19, -0.066), v2(0.24, -0.076), v2(0.28, -0.074), v2(0.297, -0.06), v2(0.303, -0.03),
    v2(0.303, 0.03), v2(0.297, 0.06), v2(0.28, 0.074), v2(0.24, 0.076), v2(0.19, 0.066), v2(0.175, 0.05)
  ], seg).rotateX(Math.PI / 2)
  const rim = new THREE.LatheGeometry([v2(0.178, 0.046), v2(0.15, 0.04)], seg).rotateX(Math.PI / 2)
  const hub = new THREE.LatheGeometry([v2(0.152, 0.04), v2(0.148, 0.056), v2(0.12, 0.07), v2(0.07, 0.08), v2(0.03, 0.087), v2(0.001, 0.09)], seg).rotateX(Math.PI / 2)
  for (const x of [1.2, -1.18]) {
    for (const s of [1, -1]) {
      const p: V3 = [x, 0.3, 0.62 * s]
      const r: V3 = [0, s > 0 ? 0 : Math.PI, 0]
      car.add(tyre.clone(), RUBBER, p, r)
      car.add(rim.clone(), '#2c2c30', p, r)
      car.add(hub.clone(), CHROME, p, r)
    }
  }
  tyre.dispose()
  rim.dispose()
  hub.dispose()

  // ——— glasshouse: yellow roof and A/B/C pillars on the beltline, dark glass between ———
  car.add(rbox(1.36, 0.11, 1.34, 0.045), Y, [-0.18, 1.395, 0])
  for (const s of [1, -1]) {
    const z0 = s > 0 ? 0.6 : -0.655
    const z1 = z0 + 0.055
    car.add(slab([[0.815, 0.97], [0.45, 1.35], [0.37, 1.35], [0.735, 0.97]], z0, z1), Y)
    car.add(slab([[-0.09, 0.97], [-0.09, 1.35], [-0.18, 1.35], [-0.18, 0.97]], z0, z1), Y)
    car.add(slab([[-1.075, 0.97], [-0.8, 1.35], [-0.6, 1.35], [-0.8, 0.97]], z0, z1), Y)
  }
  glass.add(slab([[0.8, 0.97], [0.43, 1.36], [0.4, 1.36], [0.77, 0.97]], -0.62, 0.62), '#fff')
  glass.add(slab([[-1.06, 0.97], [-0.79, 1.36], [-0.76, 1.36], [-1.03, 0.97]], -0.62, 0.62), '#fff')
  // Kerb-side front window; the driver's (+z) is wound down.
  glass.add(slab([[0.77, 0.97], [0.4, 1.36], [-0.12, 1.36], [-0.12, 0.97]], -0.625, -0.615), '#fff')
  for (const z0 of [0.615, -0.625]) glass.add(slab([[-0.12, 0.97], [-0.12, 1.36], [-0.78, 1.36], [-1.03, 0.97]], z0, z0 + 0.01), '#fff')
  if (!compact) {
    for (const z of [0.28, -0.22]) car.add(box(0.012, 0.012, 0.42), INKC, [0.79, 0.995, z])
  }

  // ——— interior: bench seats, dashboard, the cabbie with his elbow out of the window ———
  car.add(box(1.72, 0.012, 1.2), '#3b2622', [-0.15, 0.986, 0])
  car.add(rbox(0.12, 0.42, 1.14, 0.04), SEAT, [-0.2, 0.93, 0])
  car.add(rbox(0.12, 0.42, 1.14, 0.04), SEAT, [-0.84, 0.91, 0])
  car.add(box(0.14, 0.11, 1.18), '#26252b', [0.63, 0.975, 0])
  car.add(ball(0.028, 8, 6), '#e8812a', [0.62, 1.058, -0.12])
  car.add(box(0.02, 0.05, 0.17), '#26252b', [0.4, 1.27, 0])
  car.add(box(0.01, 0.07, 0.01), '#26252b', [0.41, 1.31, 0])
  if (!compact) {
    car.add(box(0.004, 0.06, 0.004), '#d9d2c0', [0.4, 1.225, 0.05])
    car.add(ball(0.025, 8, 6), '#f29a1f', [0.4, 1.19, 0.05])
  }
  car.add(new THREE.TorusGeometry(0.17, 0.013, 5, 18).rotateY(Math.PI / 2).rotateZ(0.9), '#1d1c21', [0.36, 1.02, 0.3])
  car.add(rbox(0.22, 0.32, 0.4, 0.08), KHAKI, [-0.01, 0.95, 0.3])
  car.add(cyl(0.045, 0.08, 8), SKIN, [0, 1.13, 0.3])
  car.add(ball(0.095, 14, 10), SKIN, [0.01, 1.215, 0.3])
  car.add(ball(0.1, 14, 8), '#151311', [-0.01, 1.245, 0.3], [0, 0, 0], [1, 0.62, 1])
  car.add(box(0.02, 0.018, 0.075), '#151311', [0.098, 1.18, 0.3])
  car.add(rbox(0.09, 0.085, 0.24, 0.035), KHAKI, [-0.025, 1.035, 0.59])
  car.add(rbox(0.3, 0.07, 0.075, 0.03), SKIN, [0.11, 1.022, 0.7])
  car.add(ball(0.04, 8, 6), SKIN, [0.275, 1.02, 0.7])

  // ——— roof carrier with a tarp bundle and a bedding roll, roped down ———
  for (const z of [-0.56, 0.56]) car.add(cyl(0.014, 1.24, 6), RACK, [-0.19, 1.555, z], [0, 0, Math.PI / 2])
  for (const x of [-0.8, 0.42]) car.add(cyl(0.014, 1.14, 6), RACK, [x, 1.555, 0], [Math.PI / 2, 0, 0])
  for (const z of [-0.28, 0, 0.28]) car.add(box(1.22, 0.012, 0.035), RACK, [-0.19, 1.53, z])
  for (const x of [-0.78, 0.4]) for (const z of [-0.56, 0.56]) car.add(cyl(0.012, 0.12, 5), RACK, [x, 1.5, z])
  car.add(rbox(0.6, 0.26, 0.52, 0.08), '#8b7a52', [-0.32, 1.666, -0.05])
  car.add(cyl(0.12, 0.7, 12), '#3f6ea5', [0.2, 1.656, 0.05], [Math.PI / 2, 0, 0])
  if (!compact) {
    for (const x of [-0.47, -0.17]) car.add(box(0.025, 0.272, 0.532), ROPE, [x, 1.666, -0.05])
    car.add(box(0.612, 0.272, 0.025), ROPE, [-0.32, 1.666, -0.05])
    for (const z of [-0.17, 0.27]) car.add(cyl(0.124, 0.03, 12), ROPE, [0.2, 1.656, z], [Math.PI / 2, 0, 0])
  }

  // ——— the flag meter on its bracket, kerb side (-z), flag up for hire ———
  car.add(box(0.04, 0.03, 0.14), INKC, [0.66, 1.0, -0.8])
  car.add(rbox(0.13, 0.19, 0.11, 0.02), '#1a1a1d', [0.66, 1.09, -0.92])
  car.add(box(0.006, 0.08, 0.08), '#efe6cc', [0.593, 1.11, -0.92])
  car.add(cyl(0.006, 0.1, 5), CHROME, [0.66, 1.235, -0.92])
  car.add(box(0.14, 0.07, 0.008), PAL.bestRed, [0.7, 1.29, -0.92])

  // ——— front: headlamp pods with chrome rims, indicators, slim grille, bumper ———
  for (const s of [1, -1]) {
    car.add(cyl(0.105, 0.06, 18), PAL.kaali, [1.91, 0.68, 0.52 * s], [0, 0, Math.PI / 2])
    car.add(new THREE.TorusGeometry(0.088, 0.016, 6, 20), CHROME, [1.945, 0.68, 0.52 * s], [0, Math.PI / 2, 0])
    lamps.add(ball(0.08, 14, 8), HEAD, [1.94, 0.68, 0.52 * s], [0, 0, 0], [0.4, 1, 1])
    lamps.add(cyl(0.032, 0.03, 10), AMBER, [1.93, 0.5, 0.55 * s], [0, 0, Math.PI / 2])
  }
  car.add(box(0.02, 0.15, 0.62), INKC, [1.925, 0.585, 0])
  for (const y of [0.535, 0.57, 0.605, 0.64]) car.add(box(0.018, 0.012, 0.6), CHROME, [1.936, y, 0])
  for (const y of [0.505, 0.665]) car.add(box(0.026, 0.018, 0.66), CHROME, [1.935, y, 0])
  for (const s of [1, -1]) car.add(box(0.026, 0.178, 0.02), CHROME, [1.935, 0.585, 0.32 * s])
  car.add(rbox(0.12, 0.035, 0.035, 0.012), CHROME, [1.78, 0.9, 0])
  if (!compact) {
    // Nimbu-mirchi against the evil eye, hung under the bumper.
    car.add(box(0.004, 0.06, 0.004), '#d9d2c0', [2.0, 0.275, 0.16])
    car.add(ball(0.03, 8, 6), '#d4d64a', [2.0, 0.22, 0.16])
    for (let i = 0; i < 3; i++) car.add(new THREE.ConeGeometry(0.01, 0.075, 5), '#2f8a3a', [2.0, 0.155, 0.16 + (i - 1) * 0.018], [Math.PI + (i - 1) * 0.25, 0, 0])
    car.add(cyl(0.004, 0.9, 4), INKC, [0.89, 1.375, 0.66], [0, 0, 0.2])
  }

  // ——— both ends: wrap-round chrome bumpers with overriders ———
  for (const s of [1, -1]) {
    car.add(rbox(0.1, 0.11, 1.5, 0.035), CHROME, [1.97 * s, 0.36, 0])
    for (const z of [0.765, -0.765]) car.add(rbox(0.3, 0.1, 0.06, 0.025), CHROME, [1.84 * s, 0.36, z])
    for (const z of [0.33, -0.33]) car.add(rbox(0.07, 0.22, 0.06, 0.025), CHROME, [2.03 * s, 0.4, z])
  }

  // ——— rear: tail lamps in chrome bezels, trunk handle, plate lamp, exhaust ———
  for (const s of [1, -1]) {
    car.add(box(0.02, 0.26, 0.11), CHROME, [-1.922, 0.64, 0.58 * s])
    lamps.add(box(0.025, 0.17, 0.085), RED, [-1.93, 0.615, 0.58 * s])
    lamps.add(box(0.025, 0.06, 0.085), AMBER, [-1.93, 0.735, 0.58 * s])
  }
  car.add(rbox(0.03, 0.03, 0.16, 0.01), CHROME, [-1.93, 0.7, 0])
  car.add(box(0.04, 0.025, 0.12), CHROME, [-1.935, 0.645, 0])
  car.add(cyl(0.025, 0.22, 8), INKC, [-1.86, 0.17, -0.45], [0, 0, Math.PI / 2])
  plates.add(new THREE.PlaneGeometry(0.44, 0.1), '#fff', [2.024, 0.36, 0], [0, Math.PI / 2, 0])
  plates.add(new THREE.PlaneGeometry(0.44, 0.1), '#fff', [-1.926, 0.58, 0], [0, -Math.PI / 2, 0])

  // ——— sides: chrome strip, door handles and seams, fender mirrors, side repeaters, mudflaps ———
  for (const s of [1, -1]) {
    car.add(box(3.54, 0.018, 0.01), CHROME, [0, 0.8, 0.752 * s])
    for (const x of [-0.04, -0.62]) car.add(rbox(0.11, 0.024, 0.024, 0.008), CHROME, [x, 0.87, 0.76 * s])
    if (!compact) {
      car.add(box(0.01, 0.5, 0.004), INKC, [0.76, 0.67, 0.751 * s])
      car.add(box(0.01, 0.64, 0.004), INKC, [-0.13, 0.595, 0.751 * s])
      car.add(box(0.01, 0.64, 0.004), INKC, [-0.7, 0.595, 0.751 * s])
    }
    lamps.add(box(0.06, 0.025, 0.01), AMBER, [1.52, 0.72, 0.752 * s])
    car.add(cyl(0.009, 0.17, 6), CHROME, [1.3, 0.99, 0.6 * s])
    car.add(cyl(0.055, 0.03, 14), CHROME, [1.3, 1.09, 0.62 * s], [0, 0, Math.PI / 2])
    car.add(cyl(0.046, 0.006, 14), '#3b4a5c', [1.283, 1.09, 0.62 * s], [0, 0, Math.PI / 2])
    for (const x of [0.77, -1.62]) car.add(box(0.012, 0.22, 0.2), RUBBER, [x, 0.17, 0.6 * s])
    car.add(box(0.004, 0.04, 0.06), PAL.bestRed, [-1.628, 0.12, 0.6 * s])
  }

  // ——— meshes: one per material ———
  const shell = new THREE.Mesh(car.build(), toon('#ffffff', { vertexColors: true }))
  shell.castShadow = true
  shell.receiveShadow = true
  const panes = new THREE.Mesh(glass.build(), toon('#2b3b4d', { transparent: true, opacity: 0.58 }))
  panes.receiveShadow = true
  const lampMat = glow('#ffffff', 1)
  lampMat.vertexColors = true
  const lampMesh = new THREE.Mesh(lamps.build(), lampMat)
  const plateMesh = new THREE.Mesh(plates.build(), toon('#ffffff', { map: plateTexture() }))
  // Halos on the headlamps, for night and the honk flash.
  const halos = [1, -1].map((s) => {
    const h = glowSprite('#ffe9b8', 0.9)
    h.position.set(2.03, 0.68, 0.52 * s)
    return h
  })
  taxi.add(shell, panes, lampMesh, plateMesh, ...halos)
  taxi.position.set(LAYOUT.taxi.x, 0, LAYOUT.taxi.z)
  taxi.rotation.y = LAYOUT.taxi.rotY
  taxi.userData.pick = 'taxi'
  ctx.pickables.add(taxi)

  // On the road, outside the bouncing group: a contact shadow and the headlight pool.
  const under = new THREE.Group()
  under.position.set(LAYOUT.taxi.x, 0, LAYOUT.taxi.z)
  under.rotation.y = LAYOUT.taxi.rotY
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 2.2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false })
  )
  shadow.position.y = 0.03
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ffe2a6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2).rotateX(-Math.PI / 2), poolMat)
  pool.position.set(4.9, 0.04, 0)
  under.add(shadow, pool)
  scene.add(fx(under))

  // A warm key light so the taxi reads against the dark road.
  const key = new THREE.PointLight(0xffd9a0, 0, 22, 1.4)
  key.position.set(2.5, 5.5, 8.5)
  scene.add(key)

  let mode = 0
  ctx.onMode((mix) => {
    mode = mix
    key.intensity = 6 + 14 * mix
  })

  let honk = 0
  ctx.onFrame(({ dt, look }) => {
    taxi.rotation.y = LAYOUT.taxi.rotY + look.x * 0.12
    under.rotation.y = taxi.rotation.y
    honk = Math.max(0, honk - dt * 1.6)
    taxi.position.y = Math.sin(honk * Math.PI * 4) * 0.08 * honk
    // Off-white lenses by day, glowing at night, blinking on a honk.
    const flash = honk > 0.05 && Math.floor(honk * 8) % 2 ? 1 : 0
    lampMat.color.setScalar(1 + 1.6 * mode + flash * 2.2)
    const halo = Math.min(1, 0.85 * mode + flash * 0.7)
    for (const h of halos) {
      h.material.opacity = halo
      h.visible = halo > 0.01
    }
    poolMat.opacity = 0.5 * mode + flash * 0.25
    pool.visible = poolMat.opacity > 0.01
  })

  return {
    honk() {
      honk = 1
    }
  }
}
