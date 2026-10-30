/*
 * The garden, in three.js: a big flower opening behind the name in the
 * hero, and leaves and petals drifting through the whole page on a swirling
 * current, all in flat toon colour with boiling ink outlines (ink.ts).
 *
 * The canvas sits fixed behind the page; the flower follows the hero box
 * ([data-bloom]) as it scrolls. The bloom springs open ring by ring; the
 * flower turns toward the pointer, petals near it bend away, and the leaves
 * are carried in its wake. burst() shakes a handful of petals loose;
 * scrolling stirs the air.
 */
import * as THREE from 'three'
import { createInk } from './ink'
import { leafGeometry, petalGeometry } from './shapes'

export interface GardenOptions {
  canvas: HTMLCanvasElement
  /** The hero box the flower is drawn behind. */
  anchor: HTMLElement
  reduced: boolean
  compact: boolean
}

// Three flat bands of light: the cartoon look.
const ramp = (() => {
  // light enough in the shade that colours stay bright, like a painted cel
  const data = new Uint8Array([185, 185, 185, 255, 228, 228, 228, 255, 255, 255, 255, 255])
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  t.minFilter = THREE.NearestFilter
  t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()
const toon = (color: THREE.ColorRepresentation) =>
  new THREE.MeshToonMaterial({ color, gradientMap: ramp, side: THREE.DoubleSide, vertexColors: true })

/**
 * The flower, outer ring to inner, at a radius of about 1. `open` is how far
 * each ring tips back. Colours sampled from abeto.co's flower: deep orange
 * outside, warming to gold in the middle.
 */
const RINGS = [
  { n: 11, len: 0.74, width: 0.62, base: 0.2, open: 0.3, color: '#d8682b', cup: 0.45, curl: -0.14 },
  { n: 10, len: 0.64, width: 0.56, base: 0.16, open: 0.52, color: '#dd7a31', cup: 0.6, curl: -0.05 },
  { n: 9, len: 0.52, width: 0.5, base: 0.11, open: 0.78, color: '#de8a38', cup: 0.75, curl: 0.05 },
  { n: 8, len: 0.4, width: 0.42, base: 0.07, open: 1.02, color: '#de9c40', cup: 0.9, curl: 0.12 },
  { n: 6, len: 0.28, width: 0.34, base: 0.03, open: 1.22, color: '#deaa46', cup: 1, curl: 0.18 }
]
/** How upright a petal stands in the closed bud. */
const CLOSED = 1.48

/** Abeto's leaves: warm khaki and tan, not green. */
const LEAF_TINTS = ['#a8834e', '#b08c55', '#9c7a46', '#c4a068', '#8f7042']
const PETAL_TINTS = ['#da7321', '#de8a38', '#d8682b', '#de9f43']

/** An elastic ease-out: overshoots and settles, like a petal springing open. */
const spring = (x: number) => {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return 2 ** (-9 * x) * Math.sin((x * 9 - 0.75) * (Math.PI * 2 / 3)) + 1
}

const FOV = 30
const CAM_Z = 22

export const createGarden = (opts: GardenOptions) => {
  const { canvas, anchor, reduced, compact } = opts
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
  const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2)
  renderer.setPixelRatio(dpr)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 60)
  camera.position.set(0, 0, CAM_Z)
  scene.add(new THREE.HemisphereLight('#fffaf0', '#ffd9a8', 1.9))
  const sun = new THREE.DirectionalLight('#fff6e4', 2.4)
  sun.position.set(-5, 8, 10)
  scene.add(sun)

  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)]!

  // ——— the flower ———
  const flower = new THREE.Group()
  const head = new THREE.Group()
  flower.add(head)
  scene.add(flower)
  const petals = RINGS.flatMap((ring, k) => {
    const mat = toon(ring.color)
    const shapes = [2, 3].map(lobes => petalGeometry({ len: ring.len, width: ring.width, cup: ring.cup, curl: ring.curl, lobes }))
    return Array.from({ length: ring.n }, (_, i) => {
      const pivot = new THREE.Group()
      const angle = (i / ring.n) * Math.PI * 2 + k * 0.33 + (rand() - 0.5) * 0.2
      pivot.rotation.z = angle
      const mesh = new THREE.Mesh(pick(shapes), mat)
      mesh.position.y = ring.base
      mesh.scale.setScalar(0.92 + rand() * 0.16)
      pivot.add(mesh)
      head.add(pivot)
      return { k, angle, mesh, bend: 0, phase: rand() * Math.PI * 2 }
    })
  })
  // the heart: a knot of stamens
  const heart = new THREE.Group()
  heart.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12).scale(1, 1, 0.55), toon('#e8b54e')))
  const stamen = new THREE.SphereGeometry(0.026, 8, 6)
  const stamenMat = toon('#b8602a')
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4
    const d = 0.075 * Math.sqrt((i + 1) / 9)
    const s = new THREE.Mesh(stamen, stamenMat)
    s.position.set(Math.cos(a) * d, Math.sin(a) * d, 0.05)
    heart.add(s)
  }
  heart.position.z = 0.04
  head.add(heart)
  // how open each ring is: outer rings spring open first
  const openness = (k: number) => (reduced ? 1 : spring((t - 0.25 - k * 0.16) / 2.4))
  // a tap makes the flower flinch: a short damped wobble
  let flinch = 9
  const flinchAt = () => (flinch > 1.6 ? 0 : Math.exp(-flinch * 3.5) * Math.cos(flinch * 13))

  // ——— leaves and petals in the air ———
  const nLeaves = compact ? 30 : 70
  const nPetals = compact ? 14 : 32
  const leafMesh = new THREE.InstancedMesh(leafGeometry(1, 0.42, 0.32, 0.35), toon('#ffffff'), nLeaves)
  const petalMesh = new THREE.InstancedMesh(petalGeometry({ len: 0.62, width: 0.52, cup: 0.8, curl: 0.08, lobes: 2 }, 8), toon('#ffffff'), nPetals)
  for (const m of [leafMesh, petalMesh]) {
    m.frustumCulled = false
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(m)
  }
  interface Bit {
    mesh: THREE.InstancedMesh
    i: number
    pos: THREE.Vector3
    vel: THREE.Vector3
    rot: THREE.Euler
    spin: THREE.Vector3
    rock: boolean
    freq: number
    amp: number
    phase: number
    scale: number
  }
  const color = new THREE.Color()
  const halfAt = (z: number) => {
    const hh = (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    return { hw: hh * camera.aspect, hh }
  }
  const bits: Bit[] = []
  const place = (b: Bit, anywhere: boolean) => {
    b.pos.z = -5 + rand() * 9
    const { hw, hh } = halfAt(b.pos.z)
    b.pos.x = anywhere ? (rand() * 2 - 1) * hw : -hw - 1
    b.pos.y = (rand() * 2 - 1) * hh
    b.vel.set(0, 0, 0)
  }
  const addBits = (mesh: THREE.InstancedMesh, n: number, tints: string[], size: [number, number]) => {
    for (let i = 0; i < n; i++) {
      mesh.setColorAt(i, color.set(pick(tints)))
      const b: Bit = {
        mesh,
        i,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
        spin: new THREE.Vector3((rand() - 0.5) * 3, (rand() - 0.5) * 2, (rand() - 0.5) * 1.2),
        rock: rand() < 0.55,
        freq: 0.7 + rand() * 0.9,
        amp: 0.7 + rand() * 0.6,
        phase: rand() * Math.PI * 2,
        scale: size[0] + rand() ** 1.6 * (size[1] - size[0])
      }
      place(b, true)
      bits.push(b)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  const ink = createInk(renderer, scene, camera)

  // ——— layout: pixels to world units on the flower's plane (z = 0) ———
  let w = 1
  let h = 1
  let upp = 0.01
  const R = { v: 1 }
  const placeFlower = () => {
    const r = anchor.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const rpx = Math.min(r.height * 0.5, w * (compact ? 0.46 : 0.3), 360)
    R.v = rpx * upp * 1.05
    flower.position.set((cx - w / 2) * upp, (h / 2 - cy) * upp, 0)
    flower.scale.setScalar(R.v)
    flower.visible = cy + rpx * 1.5 > 0 && cy - rpx * 1.5 < h
  }
  const resize = () => {
    w = Math.max(1, window.innerWidth)
    h = Math.max(1, window.innerHeight)
    renderer.setSize(w, h, false)
    ink.setSize(w, h, dpr)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    upp = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h
    placeFlower()
  }
  resize()
  addBits(leafMesh, nLeaves, LEAF_TINTS, [0.3, 0.85])
  addBits(petalMesh, nPetals, PETAL_TINTS, [0.35, 0.7])

  // ——— input: where the pointer is, and how fast it's moving (px/s) ———
  const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, on: false, at: 0 }
  const lean = { x: 0, y: 0 }
  const onMove = (e: PointerEvent) => {
    const now = performance.now()
    const dts = Math.max(8, now - ptr.at) / 1000
    if (ptr.on) {
      ptr.vx = (e.clientX - ptr.x) / dts
      ptr.vy = (e.clientY - ptr.y) / dts
    }
    ptr.x = e.clientX
    ptr.y = e.clientY
    ptr.at = now
    ptr.on = true
  }
  const onLeave = () => {
    ptr.on = false
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)

  // ——— the air ———
  const toWorld = (x: number, y: number) => new THREE.Vector2((x - w / 2) * upp, (h / 2 - y) * upp)
  const wind = (b: Bit, t: number) => {
    const { x, y } = b.pos
    let vx = 0.55 + 0.45 * Math.sin(y * 0.35 + t * 0.35) + 0.2 * Math.sin((x + y) * 0.25 - t * 0.2)
    let vy = -0.12 + 0.35 * Math.cos(x * 0.3 - t * 0.3) + 0.15 * Math.sin(y * 0.5 + t * 0.5)
    if (b.rock) {
      // a falling leaf glides side to side as it rocks
      const g = Math.cos(t * b.freq + b.phase) * 0.5
      vx += g * 0.3
      vy += g
    }
    if (flower.visible) {
      const fx = x - flower.position.x
      const fy = y - flower.position.y
      const r = Math.hypot(fx, fy) || 1
      const near = Math.exp(-((r / (R.v * 2.3)) ** 2))
      vx += (-fy / r * 1.4 + fx / r * 0.3) * near
      vy += (fx / r * 1.4 + fy / r * 0.3) * near
    }
    return [vx, vy] as const
  }

  /** Shake some petals loose from the flower. */
  const shed = (count: number, speed: number) => {
    if (!flower.visible) return
    const pool = bits.filter(b => b.mesh === petalMesh).sort((a, b) => b.pos.x - a.pos.x)
    for (const b of pool.slice(0, count)) {
      const a = rand() * Math.PI * 2
      b.pos.set(flower.position.x + Math.cos(a) * R.v * 0.8, flower.position.y + Math.sin(a) * R.v * 0.8, 0.6 + rand())
      b.vel.set(Math.cos(a) * speed, Math.sin(a) * speed, rand() * 0.5)
      b.spin.set((rand() - 0.5) * 6, (rand() - 0.5) * 4, (rand() - 0.5) * 2)
    }
  }

  // ——— loop ———
  const dummy = new THREE.Object3D()
  const hit = new THREE.Vector2()
  let t = 0
  let shedIn = 2.5
  let lastScroll = window.scrollY
  let visible = !document.hidden
  let running = false
  let last = performance.now()
  const tick = (now: number) => {
    if (!running) return
    requestAnimationFrame(tick)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!visible) return
    if (!reduced) t += dt
    flinch += dt
    placeFlower()

    // scrolling: the air moves with the page, nearer things further
    const scrolled = window.scrollY - lastScroll
    lastScroll = window.scrollY
    ptr.vx *= Math.exp(-dt * 6)
    ptr.vy *= Math.exp(-dt * 6)
    if (ptr.on) hit.copy(toWorld(ptr.x, ptr.y))

    // the flower turns toward the pointer and breathes
    const lx = ptr.on ? (ptr.x / w) * 2 - 1 : 0
    const ly = ptr.on ? (ptr.y / h) * 2 - 1 : 0
    lean.x += (lx - lean.x) * (1 - Math.exp(-dt * 2.5))
    lean.y += (ly - lean.y) * (1 - Math.exp(-dt * 2.5))
    flower.rotation.set(lean.y * 0.32, lean.x * 0.38, 0)
    head.rotation.z = t * 0.03
    for (const p of petals) {
      const ring = RINGS[p.k]!
      // petals near the pointer bend back out of its way
      let want = 0
      if (ptr.on && flower.visible) {
        const a = p.angle + head.rotation.z
        const reach = (ring.base + ring.len * 0.7) * R.v
        const tx = flower.position.x - Math.sin(a) * reach
        const ty = flower.position.y + Math.cos(a) * reach
        const d = Math.hypot(tx - hit.x, ty - hit.y) / R.v
        if (d < 0.5) want = (1 - d / 0.5) * 0.55
      }
      p.bend += (want - p.bend) * (1 - Math.exp(-dt * 6))
      const open = openness(p.k)
      const breathe = 0.04 * Math.sin(t * 0.8 + p.phase)
      p.mesh.rotation.x = CLOSED + (ring.open - CLOSED) * open + breathe - p.bend - flinchAt() * 0.35
    }

    shedIn -= dt
    if (shedIn < 0 && !reduced) {
      shed(1, 0.9)
      shedIn = 1.6 + rand() * 1.8
    }

    const k = 1 - Math.exp(-dt * 1.1)
    for (const b of bits) {
      if (!reduced) {
        const [fx, fy] = wind(b, t)
        b.vel.x += (fx - b.vel.x) * k
        b.vel.y += (fy - b.vel.y) * k
        b.vel.z *= Math.exp(-dt)
        // the pointer's wake carries them along
        if (ptr.on) {
          const d = Math.hypot(b.pos.x - hit.x, b.pos.y - hit.y)
          if (d < 2.2) {
            const f = (1 - d / 2.2) ** 2
            b.vel.x += ptr.vx * upp * f * dt * 3
            b.vel.y -= ptr.vy * upp * f * dt * 3
          }
        }
        b.pos.addScaledVector(b.vel, dt)
        b.pos.y += scrolled * upp * (0.25 + 0.06 * (b.pos.z + 5))
        // turning: rockers sway, the rest tumble; all lean into the wind
        if (b.rock) {
          b.rot.x = 0.4 + b.amp * Math.sin(t * b.freq + b.phase)
          b.rot.y = 0.5 * Math.sin(t * b.freq * 0.5 + b.phase)
        } else {
          b.rot.x += b.spin.x * dt
          b.rot.y += b.spin.y * dt
        }
        const heading = Math.atan2(b.vel.y, b.vel.x) - Math.PI / 2
        let dr = heading - b.rot.z
        dr = Math.atan2(Math.sin(dr), Math.cos(dr))
        b.rot.z += dr * (1 - Math.exp(-dt * 1.2)) + b.spin.z * dt * 0.2

        const { hw, hh } = halfAt(b.pos.z)
        const m = 1.2
        if (b.pos.x > hw + m) {
          b.pos.x = -hw - m
          b.pos.y = (rand() * 2 - 1) * hh
        } else if (b.pos.x < -hw - m) b.pos.x = hw + m
        if (b.pos.y > hh + m) b.pos.y = -hh - m
        else if (b.pos.y < -hh - m) b.pos.y = hh + m
      }
      dummy.position.copy(b.pos)
      dummy.rotation.copy(b.rot)
      dummy.scale.setScalar(b.scale)
      dummy.updateMatrix()
      b.mesh.setMatrixAt(b.i, dummy.matrix)
    }
    leafMesh.instanceMatrix.needsUpdate = true
    petalMesh.instanceMatrix.needsUpdate = true

    // the outlines boil about eight times a second
    ink.render(reduced ? 0 : Math.floor(t * 8) * 1.37 % 97)
  }

  return {
    resize,
    /** A tap on the flower: it flinches open and lets go of a handful of petals. */
    burst() {
      flinch = 0
      shed(compact ? 5 : 9, 2.6)
    },
    setVisible(v: boolean) {
      visible = v
    },
    start() {
      if (running) return
      running = true
      last = performance.now()
      requestAnimationFrame(tick)
    },
    stop() {
      running = false
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }
}
