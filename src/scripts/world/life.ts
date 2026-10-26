/*
 * The street life that fills the route between and around the stops:
 * utility poles with sagging wires and crows on them, rain trees, palms and
 * a gulmohar, people walking the footpaths, waiting on the platform and
 * sitting on the sea wall, traffic (autos, kaali-peeli taxis, a BEST
 * double-decker, cars and scooters) on the far lanes, a bus stop, a chai
 * stall, a vada-pav cart, cones, a sleeping dog, bunting across the road,
 * and kites circling high overhead.
 *
 * Everything is instanced or merged; things stay out of the cameras' way
 * (the zones below are kept clear so each stop's subject stays in view).
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, glow, toon } from './style'

type V3 = [number, number, number]
const at = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (rt: number, rb: number, h: number, n = 8) => new THREE.CylinderGeometry(rt, rb, h, n)
const blob = (r: number) => new THREE.IcosahedronGeometry(r, 1)

/** Coloured parts merged into one non-indexed, vertex-coloured geometry. */
const kit = () => {
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  const k = {
    add(src: THREE.BufferGeometry, color: THREE.ColorRepresentation, m: THREE.Matrix4) {
      const g = (src.index ? src.toNonIndexed() : src).applyMatrix4(m)
      const p = g.getAttribute('position')
      const n = g.getAttribute('normal')
      c.set(color)
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i))
        nor.push(n.getX(i), n.getY(i), n.getZ(i))
        col.push(c.r, c.g, c.b)
      }
      return k
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
  return k
}
const paint = () => toon('#ffffff', { vertexColors: true })

/** Places the cameras look through; nothing tall goes in these (x0, x1, z0, z1). */
const KEEP_OUT: [number, number, number, number][] = [
  [-8, 12, 0, 13], // Start: camera to taxi
  [44, 66, -15, -5], // About: camera to the standing train
  [98, 142, -18, 40], // Service: the arch and the view of it
  [150, 210, 0, 34], // Work: the hoardings and plaza
  [228, 256, 2, 50] // Contact: camera to the sea
]
const clear = (x: number, z: number, pad = 0) => !KEEP_OUT.some(([a, b, c, d]) => x > a - pad && x < b + pad && z > c - pad && z < d + pad)

/* ——— the things themselves, each built facing +x (vehicles) or +z (people) ——— */

const personGeo = (shirt: string, skin: string, lower: string, sitting = false) => {
  const k = kit()
  if (sitting) {
    k.add(box(0.16, 0.16, 0.5), lower, at([-0.1, 0.08, 0.2])).add(box(0.16, 0.16, 0.5), lower, at([0.1, 0.08, 0.2]))
    k.add(box(0.15, 0.45, 0.15), lower, at([-0.1, -0.15, 0.45])).add(box(0.15, 0.45, 0.15), lower, at([0.1, -0.15, 0.45]))
    k.add(box(0.44, 0.6, 0.26), shirt, at([0, 0.45, 0]))
  } else {
    k.add(box(0.16, 0.85, 0.18), lower, at([-0.1, 0.43, 0])).add(box(0.16, 0.85, 0.18), lower, at([0.1, 0.43, 0]))
    k.add(box(0.44, 0.62, 0.26), shirt, at([0, 1.17, 0]))
  }
  const y = sitting ? -0.4 : 0
  k.add(box(0.12, 0.58, 0.13), shirt, at([-0.29, 1.2 + y, 0])).add(box(0.12, 0.58, 0.13), shirt, at([0.29, 1.2 + y, 0]))
  k.add(blob(0.14), skin, at([0, 1.65 + y, 0]))
  k.add(box(0.3, 0.1, 0.3), '#1b1818', at([0, 1.78 + y, -0.02]))
  return k.build()
}

const autoGeo = () => {
  const k = kit()
  k.add(box(2.4, 0.5, 1.3), '#2a2b2f', at([0, 0.55, 0]))
  k.add(box(1.4, 0.9, 1.3), PAL.autoGreen, at([-0.3, 1.2, 0]))
  k.add(box(2.5, 0.1, 1.4), PAL.autoYellow, at([0, 1.82, 0]))
  k.add(box(0.7, 0.9, 1.0), PAL.autoGreen, at([0.85, 1.1, 0]))
  k.add(box(0.05, 0.55, 0.9), '#2d3640', at([1.2, 1.45, 0]))
  for (const [x, z] of [[1, 0], [-0.9, 0.55], [-0.9, -0.55]] as const) k.add(cyl(0.25, 0.25, 0.14, 10), '#151517', at([x, 0.27, z], [Math.PI / 2, 0, 0]))
  return k.build()
}
const carGeo = (color: string, roof: string) => {
  const k = kit()
  k.add(box(4, 0.7, 1.7), color, at([0, 0.65, 0]))
  k.add(box(2.1, 0.6, 1.55), roof, at([-0.2, 1.3, 0]))
  k.add(box(2.15, 0.45, 1.58), '#26303a', at([-0.2, 1.28, 0]))
  for (const x of [1.3, -1.3]) for (const z of [0.78, -0.78]) k.add(cyl(0.32, 0.32, 0.2, 10), '#151517', at([x, 0.32, z], [Math.PI / 2, 0, 0]))
  return k.build()
}
const busGeo = () => {
  const k = kit()
  k.add(box(10.5, 4, 2.5), PAL.bestRed, at([0, 2.4, 0]))
  k.add(box(10.52, 0.6, 2.52), '#f2efe4', at([0, 2.3, 0]))
  for (const y of [1.75, 3.5]) k.add(box(9.6, 0.7, 2.54), '#2a3440', at([-0.2, y, 0]))
  k.add(box(0.06, 0.9, 2.2), '#2a3440', at([5.26, 1.8, 0]))
  for (const x of [3.6, -3.4]) for (const z of [1.1, -1.1]) k.add(cyl(0.5, 0.5, 0.3, 12), '#151517', at([x, 0.5, z], [Math.PI / 2, 0, 0]))
  return k.build()
}
const scooterGeo = () => {
  const k = kit()
  k.add(box(1.5, 0.35, 0.4), '#c9ced6', at([0, 0.55, 0]))
  k.add(box(0.12, 0.8, 0.12), '#2a2b2f', at([0.6, 0.9, 0]))
  for (const x of [0.6, -0.6]) k.add(cyl(0.25, 0.25, 0.1, 10), '#151517', at([x, 0.25, 0], [Math.PI / 2, 0, 0]))
  k.add(box(0.3, 0.6, 0.35), '#3f74c8', at([-0.2, 1.05, 0]))
  k.add(blob(0.16), '#c8202f', at([-0.15, 1.5, 0]))
  return k.build()
}
/** Headlights (+x end) and tail lights (−x end) for a vehicle of length `l` and lamp spread `w`. */
const lampsGeo = (l: number, w: number, y: number) => {
  const k = kit()
  for (const z of [-w, w]) {
    k.add(box(0.06, 0.16, 0.22), '#fff3d0', at([l / 2 + 0.02, y, z]))
    k.add(box(0.06, 0.14, 0.2), '#ff2a20', at([-l / 2 - 0.02, y, z]))
  }
  return k.build()
}

const rainTreeGeo = (rand: () => number) => {
  const k = kit()
  k.add(cyl(0.3, 0.5, 4.5), PAL.bark, at([0, 2.25, 0]))
  k.add(cyl(0.18, 0.25, 3, 6), PAL.bark, at([1, 4.6, 0], [0, 0, -0.6]))
  k.add(cyl(0.18, 0.25, 3, 6), PAL.bark, at([-0.9, 4.6, 0.3], [0.2, 0, 0.6]))
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const r = i === 0 ? 0 : 2.6 + rand()
    k.add(new THREE.IcosahedronGeometry(2 + rand() * 0.8, 0), PAL.foliage[i % PAL.foliage.length]!, at([Math.cos(a) * r, 6.6 + rand() * 1.4, Math.sin(a) * r], [rand(), rand(), rand()], [1, 0.75, 1]))
  }
  return k.build()
}
const palmGeo = () => {
  const k = kit()
  for (let i = 0; i < 6; i++) k.add(cyl(0.2 - i * 0.015, 0.22 - i * 0.015, 1.6, 6), PAL.bark, at([i * 0.12, 0.8 + i * 1.55, 0], [0, 0, -0.08]))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    k.add(box(3.2, 0.06, 0.6), i % 2 ? '#3f7d4c' : '#5c9a4f', at([0.7 + Math.cos(a) * 1.4, 9.4, Math.sin(a) * 1.4], [0, -a, -0.45]))
  }
  return k.build()
}
const gulmoharGeo = (rand: () => number) => {
  const k = kit()
  k.add(cyl(0.25, 0.4, 4), PAL.bark, at([0, 2, 0]))
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    k.add(new THREE.IcosahedronGeometry(1.8 + rand() * 0.5, 0), i % 3 ? '#e2462e' : '#4f8a45', at([Math.cos(a) * 2.2, 5.2 + rand(), Math.sin(a) * 2.2], [rand(), rand(), 0], [1, 0.6, 1]))
  }
  return k.build()
}

/* ——— a sagging wire, as points along a catenary ——— */
const sag = (a: THREE.Vector3, b: THREE.Vector3, dip: number, out: number[], seg = 8) => {
  let prev = a.clone()
  for (let i = 1; i <= seg; i++) {
    const t = i / seg
    const p = a.clone().lerp(b, t)
    p.y -= dip * 4 * t * (1 - t)
    out.push(prev.x, prev.y, prev.z, p.x, p.y, p.z)
    prev = p
  }
}

export const buildLife = (ctx: Ctx) => {
  const { scene, compact, reduced } = ctx
  const rand = ctx.rng(9090)
  const range = (a: number, b: number) => a + (b - a) * rand()
  const pick = <T>(a: readonly T[]) => a[Math.floor(rand() * a.length)]!
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const v = new THREE.Vector3()
  const one = new THREE.Vector3(1, 1, 1)
  const thin = compact ? 2 : 1

  // ——— utility poles along the far footpath, with sagging wires and crows ———
  const poleZ = LAYOUT.road.z - LAYOUT.road.width / 2 - 1.2
  const poleXs: number[] = []
  for (let x = -40; x <= 300; x += 26) if (clear(x, poleZ)) poleXs.push(x)
  const poleKit = kit()
  poleXs.forEach((x) => {
    poleKit.add(cyl(0.13, 0.18, 9.5), '#9b968c', at([x, 4.75, poleZ]))
    poleKit.add(box(0.12, 0.12, 2.2), '#6b5a46', at([x, 8.9, poleZ]))
    for (const z of [-0.9, -0.3, 0.3, 0.9]) poleKit.add(cyl(0.05, 0.05, 0.18, 6), '#e8e2d4', at([x, 9.05, poleZ + z]))
    if (rand() < 0.35) poleKit.add(box(0.6, 0.9, 0.5), '#5a6066', at([x, 7.4, poleZ + 0.35]))
    // a tangle of cable boxes and loose coils lower down
    if (rand() < 0.5) poleKit.add(box(0.4, 0.5, 0.25), '#2f3236', at([x, 3.2, poleZ + 0.2]))
  })
  const poleMesh = new THREE.Mesh(poleKit.build(), paint())
  poleMesh.castShadow = true
  scene.add(poleMesh)
  const wirePts: number[] = []
  const crows: THREE.Matrix4[] = []
  for (let i = 0; i < poleXs.length - 1; i++) {
    const x0 = poleXs[i]!
    const x1 = poleXs[i + 1]!
    if (x1 - x0 > 30) continue
    for (const z of [-0.9, -0.3, 0.3, 0.9]) {
      const dip = range(0.5, 1.1)
      sag(new THREE.Vector3(x0, 9.1, poleZ + z), new THREE.Vector3(x1, 9.1, poleZ + z), dip, wirePts)
      if (rand() < 0.25) {
        const t = range(0.2, 0.8)
        crows.push(new THREE.Matrix4().compose(v.set(x0 + (x1 - x0) * t, 9.1 - dip * 4 * t * (1 - t) + 0.12, poleZ + z), q.setFromEuler(new THREE.Euler(0, rand() * 6, 0)), one))
      }
    }
    // a drop line back to the chawls
    if (rand() < 0.6) sag(new THREE.Vector3(x0, 8.6, poleZ), new THREE.Vector3(x0 + range(-6, 6), 11, -39), 1.2, wirePts, 10)
  }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1f2026 }))
  wires.geometry.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3))
  scene.add(wires)
  const crowGeo = kit().add(blob(0.13), '#1b1b20', at([0, 0, 0], [0, 0, 0], [1.6, 1, 1])).add(blob(0.08), '#1b1b20', at([0.18, 0.08, 0])).add(box(0.12, 0.03, 0.05), '#d6a73a', at([0.28, 0.07, 0])).build()
  const crowMesh = new THREE.InstancedMesh(crowGeo, paint(), Math.max(1, crows.length))
  crows.forEach((m, i) => crowMesh.setMatrixAt(i, m))
  crowMesh.count = crows.length
  scene.add(crowMesh)

  // ——— trees ———
  const treeSpots = (xs: number[], zs: [number, number]) => xs.filter(x => clear(x, (zs[0] + zs[1]) / 2, 3)).map(x => ({ x: x + range(-2, 2), z: range(zs[0], zs[1]) }))
  const rain = [
    ...treeSpots(Array.from({ length: Math.ceil(17 / thin) }, (_, i) => -40 + i * 20 * thin), [10.5, 12]),
    ...treeSpots(Array.from({ length: Math.ceil(22 / thin) }, (_, i) => -50 + i * 16 * thin), [-27, -31])
  ]
  interface Spot { x: number, z: number, yaw: number, k: number, phase: number }
  const trees: { mesh: THREE.InstancedMesh, spots: Spot[] }[] = []
  const tq = new THREE.Quaternion()
  const te = new THREE.Euler()
  const ts = new THREE.Vector3()
  const setTree = (mesh: THREE.InstancedMesh, i: number, s: Spot, rx = 0, rz = 0) =>
    mesh.setMatrixAt(i, m4.compose(v.set(s.x, 0, s.z), tq.setFromEuler(te.set(rx, s.yaw, rz)), ts.setScalar(s.k)))
  const plant = (geo: THREE.BufferGeometry, at0: { x: number, z: number }[]) => {
    const mesh = new THREE.InstancedMesh(geo, paint(), Math.max(1, at0.length))
    const spots = at0.map(s => ({ ...s, yaw: rand() * 6, k: range(0.85, 1.15), phase: rand() * 6 }))
    spots.forEach((s, i) => setTree(mesh, i, s))
    mesh.count = spots.length
    mesh.castShadow = true
    scene.add(mesh)
    trees.push({ mesh, spots })
  }
  plant(rainTreeGeo(rand), rain)
  plant(palmGeo(), [...[205, 214, 222, 262, 271, 284, 296].map(x => ({ x, z: range(33, 40) })), ...[-30, -18].map(x => ({ x, z: 12 }))])
  plant(gulmoharGeo(rand), [{ x: 92, z: 11.5 }, { x: 146, z: 11 }, { x: 218, z: 11.5 }])

  // ——— people ———
  const outfits = [
    { shirt: '#e8e2d4', lower: '#2d2f3a' }, { shirt: '#7fa7d6', lower: '#3a3530' },
    { shirt: '#d65a4a', lower: '#e8e2d4' }, { shirt: '#b07ad0', lower: '#b07ad0' }, // a saree, more or less
    { shirt: '#f2efe4', lower: '#1f3d6b' }, // school uniform
    { shirt: '#f0c94a', lower: '#2d2f3a' }, { shirt: '#5aa36a', lower: '#5aa36a' }
  ]
  const skins = ['#8a5a3c', '#a06a46', '#6e452e', '#b88257']
  const types = outfits.map((o, i) => ({ geo: personGeo(o.shirt, skins[i % skins.length]!, o.lower), sit: personGeo(o.shirt, skins[(i + 1) % skins.length]!, o.lower, true) }))
  interface Walker { type: number, x: number, z: number, dir: number, speed: number, x0: number, x1: number, phase: number }
  const walkers: Walker[] = []
  const nWalk = compact ? 20 : 44
  for (let i = 0; i < nWalk; i++) {
    const far = rand() < 0.55
    const z = far ? LAYOUT.road.z - LAYOUT.road.width / 2 - 1.4 + range(-0.4, 0.4) : LAYOUT.kerbZ + range(1.2, 2.8)
    // near-footpath walkers keep to stretches away from the cameras
    const [x0, x1] = far ? [-40, 300] : pick([[16, 40], [60, 96], [258, 296]] as const)
    walkers.push({ type: i % types.length, x: range(x0, x1), z, dir: rand() < 0.5 ? 1 : -1, speed: range(0.9, 1.5), x0, x1, phase: rand() * 6 })
  }
  // standing people: on the platform, at the bus stop, by the stalls
  const standers: { type: number, m: THREE.Matrix4 }[] = []
  const corridor = (x: number, z: number) => {
    // distance from the About camera's line to its train
    const a = new THREE.Vector2(51, -6.3)
    const b = new THREE.Vector2(62, -14.5)
    const p = new THREE.Vector2(x, z)
    const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(b.clone().sub(a)) / b.clone().sub(a).lengthSq(), 0, 1)
    return p.distanceTo(a.clone().lerp(b, t))
  }
  for (let i = 0, n = 0; n < (compact ? 10 : 22) && i < 200; i++) {
    const x = range(22, 100)
    const z = range(-11.2, -7.2)
    if (corridor(x, z) < 3 || Math.hypot(x - 51, z + 6.3) < 3) continue
    standers.push({ type: Math.floor(rand() * types.length), m: at([x, LAYOUT.platform.height, z], [0, range(-2.6, -0.6), 0]) })
    n++
  }
  for (const [x, z] of [[30, 10.4], [31, 10.6], [33, 10.2], [86, -4.6], [87.5, -4.9], [212, 10.8]] as const) standers.push({ type: Math.floor(rand() * types.length), m: at([x, 0.2, z], [0, range(-1, 1) + Math.PI, 0]) })
  // sitting on the sea wall, backs to the promenade, facing the water
  const sitters: { type: number, m: THREE.Matrix4 }[] = []
  for (let i = 0; i < (compact ? 8 : 18); i++) {
    const x = range(200, 300)
    if (Math.abs(x - 243) < 5) continue
    sitters.push({ type: Math.floor(rand() * types.length), m: at([x, 1.15, LAYOUT.promenade.wallZ - 0.2], [0, range(-0.3, 0.3), 0]) })
  }
  const crowds = types.map((t, i) => {
    const walk = walkers.filter(w => w.type === i)
    const stand = standers.filter(s => s.type === i)
    const mesh = new THREE.InstancedMesh(t.geo, paint(), Math.max(1, walk.length + stand.length))
    stand.forEach((s, k) => mesh.setMatrixAt(walk.length + k, s.m))
    mesh.count = walk.length + stand.length
    mesh.castShadow = true
    scene.add(mesh)
    const sit = sitters.filter(s => s.type === i)
    if (sit.length) {
      const sm = new THREE.InstancedMesh(t.sit, paint(), sit.length)
      sit.forEach((s, k) => sm.setMatrixAt(k, s.m))
      scene.add(sm)
    }
    return { mesh, walk }
  })

  // ——— traffic on the far lanes ———
  interface Car { kind: number, x: number, lane: number, speed: number }
  const kinds = [
    { geo: autoGeo(), lamps: lampsGeo(2.5, 0.45, 0.8), n: compact ? 4 : 8 },
    { geo: carGeo(PAL.kaali, PAL.taxiYellow), lamps: lampsGeo(4, 0.6, 0.7), n: compact ? 3 : 5 },
    { geo: carGeo('#e8e2d4', '#e8e2d4'), lamps: lampsGeo(4, 0.6, 0.7), n: compact ? 2 : 4 },
    { geo: busGeo(), lamps: lampsGeo(10.5, 0.9, 1.0), n: 1 },
    { geo: scooterGeo(), lamps: lampsGeo(1.5, 0.05, 0.75), n: compact ? 2 : 5 }
  ]
  const lanes = [{ z: -2, dir: 1 }, { z: -0.4, dir: -1 }]
  const cars: Car[] = []
  const lampMat = glow('#ffffff', 1)
  const fleets = kinds.map((k, ki) => {
    for (let i = 0; i < k.n; i++) cars.push({ kind: ki, x: range(-60, 320), lane: rand() < 0.5 ? 0 : 1, speed: ki === 3 ? 8 : range(7, 12) })
    const body = new THREE.InstancedMesh(k.geo, paint(), k.n)
    body.castShadow = true
    const lamps = new THREE.InstancedMesh(k.lamps, lampMat, k.n)
    scene.add(body, lamps)
    return { body, lamps }
  })
  const placeCars = () => {
    const idx = kinds.map(() => 0)
    for (const c of cars) {
      const lane = lanes[c.lane]!
      const i = idx[c.kind]!++
      m4.compose(v.set(c.x, 0, lane.z), q.setFromEuler(new THREE.Euler(0, lane.dir > 0 ? 0 : Math.PI, 0)), one)
      fleets[c.kind]!.body.setMatrixAt(i, m4)
      fleets[c.kind]!.lamps.setMatrixAt(i, m4)
    }
    for (const f of fleets) {
      f.body.instanceMatrix.needsUpdate = true
      f.lamps.instanceMatrix.needsUpdate = true
    }
  }
  placeCars()

  // ——— street furniture and stalls ———
  {
    const k = kit()
    // BEST bus stop shelter by the near footpath
    k.add(box(4, 0.08, 1.6), PAL.bestRed, at([31, 2.6, 10.4]))
    for (const x of [29.2, 32.8]) k.add(box(0.08, 2.5, 0.08), '#3a3a3e', at([x, 1.4, 11]))
    k.add(box(3.6, 0.06, 0.4), '#7a4a2c', at([31, 0.65, 10.9]))
    k.add(box(0.06, 0.7, 0.9), PAL.bestRed, at([33.4, 2.4, 10.4]))
    // chai stall on the far footpath
    k.add(box(2.2, 1, 1.2), '#2f6fb3', at([86.5, 0.7, -4.3]))
    k.add(box(2.6, 0.06, 1.6), '#f4cf36', at([86.5, 2.4, -4.3], [0.15, 0, 0]))
    for (const x of [85.4, 87.6]) k.add(box(0.05, 1.3, 0.05), '#3a3a3e', at([x, 1.75, -3.7]))
    k.add(cyl(0.18, 0.18, 0.3, 10), '#c9ced6', at([86, 1.35, -4.3]))
    // vada-pav cart by the promenade
    k.add(box(1.8, 0.8, 1), '#c8202f', at([213, 0.9, 10.2]))
    k.add(box(2, 0.05, 1.2), '#f2efe4', at([213, 2.2, 10.2]))
    for (const x of [212.4, 213.6]) k.add(cyl(0.25, 0.25, 0.1, 10), '#151517', at([x, 0.3, 10.7], [Math.PI / 2, 0, 0]))
    // cones by the zebra crossing, a sleeping dog, a fire hydrant, dustbins
    for (const x of [22.5, 23.3, 24.1]) k.add(cyl(0.04, 0.2, 0.6, 8), '#f08a24', at([x, 0.32, -2.6]))
    k.add(blob(0.3), '#b8834f', at([26, 0.42, 9.6], [0, 0, 0], [1.8, 0.7, 0.9]))
    k.add(blob(0.16), '#b8834f', at([26.55, 0.45, 9.7]))
    k.add(cyl(0.12, 0.14, 0.7, 8), '#c8202f', at([42, 0.55, 9.2]))
    for (const x of [76, 152]) k.add(cyl(0.3, 0.26, 0.9, 10), '#2f8a4a', at([x, 0.65, 10.8]))
    const furn = new THREE.Mesh(k.build(), paint())
    furn.castShadow = true
    furn.receiveShadow = true
    scene.add(furn)
  }

  // bunting strung across the road
  {
    const k = kit()
    const flags = ['#f08a24', '#f2efe4', '#2f9e5a', '#d6312b', '#f4cf36']
    const pts: number[] = []
    for (const x of [74, 226]) {
      const a = new THREE.Vector3(x, 7.6, poleZ)
      const b = new THREE.Vector3(x, 7.6, LAYOUT.kerbZ + 1)
      sag(a, b, 1.2, pts, 12)
      for (let i = 1; i < 14; i++) {
        const t = i / 14
        const p = a.clone().lerp(b, t)
        p.y -= 1.2 * 4 * t * (1 - t)
        const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.18), new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(0, -0.45, 0)])
        tri.computeVertexNormals()
        k.add(tri, flags[i % flags.length]!, at([p.x, p.y, p.z]))
      }
    }
    const mat = toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })
    scene.add(new THREE.Mesh(k.build(), mat))
    const line = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x2a2a30 }))
    line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    scene.add(line)
  }

  // kites (the birds) circling high overhead
  const kiteN = compact ? 4 : 8
  const kiteGeo = kit().add(box(0.5, 0.08, 1.8), '#3a2f28', at([0, 0, 0], [0.15, 0, 0])).add(box(0.6, 0.1, 0.25), '#3a2f28', at([-0.2, 0, 0])).build()
  const kites = new THREE.InstancedMesh(kiteGeo, paint(), kiteN)
  scene.add(kites)

  ctx.onMode((mix) => {
    lampMat.color.set('#ffffff').multiplyScalar(0.6 + 2.2 * mix)
  })

  ctx.onFrame(({ t, dt, target }) => {
    // walkers stroll back and forth along their stretch, with a little bob
    for (const c of crowds) {
      c.walk.forEach((w, i) => {
        if (!reduced) {
          w.x += w.dir * w.speed * dt
          if (w.x > w.x1 || w.x < w.x0) w.dir *= -1
        }
        const bob = reduced ? 0 : Math.abs(Math.sin(t * 6 * w.speed + w.phase)) * 0.05
        m4.compose(v.set(w.x, 0.2 + bob, w.z), q.setFromEuler(new THREE.Euler(0, w.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0)), one)
        c.mesh.setMatrixAt(i, m4)
      })
      if (c.walk.length) c.mesh.instanceMatrix.needsUpdate = true
    }
    // traffic loops along the lanes, keeping a gap to whoever is ahead
    if (!reduced) {
      for (const c of cars) {
        const dir = lanes[c.lane]!.dir
        c.x += dir * c.speed * dt
        if (c.x > 330) c.x = -70
        if (c.x < -70) c.x = 330
      }
      placeCars()
    }
    // trees sway a touch
    if (!reduced) {
      for (const tr of trees) {
        tr.spots.forEach((s, i) => setTree(tr.mesh, i, s, Math.sin(t * 0.7 + s.phase) * 0.012, Math.sin(t * 0.9 + s.phase) * 0.015))
        tr.mesh.instanceMatrix.needsUpdate = true
      }
    }
    // kites wheel slowly over wherever the camera is looking
    for (let i = 0; i < kiteN; i++) {
      const a = t * 0.12 * (i % 2 ? 1 : -1) + i * 1.7
      const r = 18 + i * 5
      m4.compose(v.set(target.x + Math.cos(a) * r, 34 + (i % 3) * 6, target.z - 30 + Math.sin(a) * r), q.setFromEuler(new THREE.Euler(0, -a + (i % 2 ? 0 : Math.PI), (i % 2 ? 1 : -1) * 0.3)), one)
      kites.setMatrixAt(i, m4)
    }
    kites.instanceMatrix.needsUpdate = true
  })
}
