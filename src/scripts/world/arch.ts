/*
 * The Service stop: a Gateway-of-India-style memorial arch in yellow basalt
 * (a tall pointed central archway you can see through, four corner towers
 * with chhatri tops, a dome behind, cornices and string courses, jali
 * screens, carved bands, a stepped plinth and lower side wings with smaller
 * arches), floodlit warm at night. One lantern per service hangs in front
 * of it from a festoon wire, its name painted on a board below. Pigeons peck
 * about the plaza, steps and ledges and now and then take off; bollards and
 * a chain line the road.
 *
 * Nearly everything static shares one vertex-coloured toon material and is
 * merged into a single mesh; lanterns, boards, halos and pigeons are
 * instanced, so the whole stop costs about a dozen draw calls.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { LAYOUT, type Ctx } from './context'
import { fx, glow, PAL, toon } from './style'
import { glowTexture, signMesh } from './textures'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const C = (c: THREE.ColorRepresentation) => new THREE.Color(c)

/** A transform from position, rotation (radians, XYZ) and scale. */
const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz))

/** Collects coloured pieces and merges them into one geometry, so they draw in one call. */
class Batch {
  private parts: THREE.BufferGeometry[] = []

  add(geo: THREE.BufferGeometry, color: THREE.Color, m?: THREE.Matrix4, flat = false) {
    const src = geo.index ? geo.toNonIndexed() : geo
    const pos = src.getAttribute('position') as THREE.BufferAttribute
    const nor = src.getAttribute('normal') as THREE.BufferAttribute | undefined
    const uv = src.getAttribute('uv') as THREE.BufferAttribute | undefined
    const count = pos.count
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', pos.clone())
    if (nor) g.setAttribute('normal', nor.clone())
    g.setAttribute('uv', uv ? uv.clone() : new THREE.BufferAttribute(new Float32Array(count * 2), 2))
    if (m) g.applyMatrix4(m)
    // Non-indexed, so recomputed normals are per face: crisp facets for the ink pass.
    if (flat || !nor) g.computeVertexNormals()
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) col.set([color.r, color.g, color.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    this.parts.push(g)
    if (src !== geo) src.dispose()
    geo.dispose()
  }

  get empty() {
    return this.parts.length === 0
  }

  build() {
    const g = mergeGeometries(this.parts) ?? new THREE.BufferGeometry()
    for (const p of this.parts) p.dispose()
    this.parts = []
    return g
  }
}

/** A box from its extents (either order). */
const slab = (b: Batch, col: THREE.Color, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  b.add(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), col, at((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))

/** An upright polygonal prism (octagonal by default) with a flat face toward +z. */
const prism = (b: Batch, col: THREE.Color, x: number, z: number, r: number, y0: number, y1: number, seg = 8, rTop = r) =>
  b.add(new THREE.CylinderGeometry(rTop, r, y1 - y0, seg, 1, false, Math.PI / seg), col, at(x, (y0 + y1) / 2, z), true)

/** A thin cylinder from a to b. */
const rodGeo = (a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 5) => {
  const d = b.clone().sub(a)
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()))
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
  return g
}

/** A slightly pointed Indo-Saracenic dome of radius R, open at the base, `k` × R tall. */
const domeGeo = (R: number, seg: number, k = 1.2) => {
  const prof = [[1, 0], [1.03, 0.16], [0.98, 0.4], [0.85, 0.64], [0.64, 0.84], [0.38, 0.97], [0.14, 1.04], [0, 1.07]]
  return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * R, (y * R * k) / 1.07)), seg)
}

/*
 * Pointed (two-centred) arches. The left arc is centred cx right of the axis
 * with radius R, so it springs at x = cx − R and the two arcs meet on the
 * axis. Points run from the left springing over the apex to the right.
 */
const arc = (cx: number, R: number, ys: number, seg: number) => {
  const ta = Math.acos(-cx / R)
  const left: THREE.Vector2[] = []
  for (let i = 0; i <= seg; i++) {
    const a = Math.PI + (ta - Math.PI) * (i / seg)
    left.push(new THREE.Vector2(cx + R * Math.cos(a), ys + R * Math.sin(a)))
  }
  const right = left.slice(0, seg).reverse().map(p => new THREE.Vector2(-p.x, p.y))
  return [...left, ...right]
}

/** A W×H wall standing on y = 0 with a pointed archway cut up from the floor. */
const wallWithArch = (W: number, H: number, half: number, r: number, ys: number, seg: number) => {
  const s = new THREE.Shape()
  s.moveTo(-W / 2, 0)
  s.lineTo(-half, 0)
  for (const p of arc(r - half, r, ys, seg)) s.lineTo(p.x, p.y)
  s.lineTo(half, 0)
  s.lineTo(W / 2, 0)
  s.lineTo(W / 2, H)
  s.lineTo(-W / 2, H)
  s.closePath()
  return s
}

/** The moulded band (archivolt) of width t around an archway, jambs included. */
const ringShape = (half: number, r: number, ys: number, t: number, seg: number) => {
  const cx = r - half
  const s = new THREE.Shape()
  s.moveTo(-half - t, 0)
  for (const p of arc(cx, r + t, ys, seg)) s.lineTo(p.x, p.y)
  s.lineTo(half + t, 0)
  s.lineTo(half, 0)
  for (const p of arc(cx, r, ys, seg).reverse()) s.lineTo(p.x, p.y)
  s.lineTo(-half, 0)
  s.closePath()
  return s
}

/** A pointed-arch panel standing on y = 0. */
const archPanel = (half: number, r: number, ys: number, seg: number) => {
  const s = new THREE.Shape()
  s.moveTo(-half, 0)
  for (const p of arc(r - half, r, ys, seg)) s.lineTo(p.x, p.y)
  s.lineTo(half, 0)
  s.closePath()
  return s
}

const extrude = (shape: THREE.Shape, depth: number) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1, steps: 1 })

/** Scale and shift a geometry's UVs in place. */
const remapUV = <T extends THREE.BufferGeometry>(g: T, su: number, sv: number, ou = 0, ov = 0) => {
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov)
  return g
}

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = true) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Jali: pierced stone lattice of eight-point stars and roundels (alpha cut-out). */
const JALI_TILE = 0.55
const jaliTexture = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 128, 128)
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = '#000000'
  for (const cx of [32, 96]) {
    for (const cy of [32, 96]) {
      g.beginPath()
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8
        const rr = k % 2 ? 16 : 25
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
      }
      g.closePath()
      g.fill()
    }
  }
  for (const cx of [0, 64, 128]) {
    for (const cy of [0, 64, 128]) {
      g.beginPath()
      g.arc(cx, cy, 8, 0, Math.PI * 2)
      g.fill()
    }
  }
})

/** A carved frieze: fillets top and bottom, a row of incised rosettes. 4:1 tile. */
const bandTexture = () => canvasTex(256, 64, (g) => {
  g.fillStyle = '#b39a64'
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = '#dbc590'
  g.fillRect(0, 0, 256, 7)
  g.fillRect(0, 57, 256, 7)
  g.fillStyle = '#7b6440'
  g.fillRect(0, 7, 256, 3)
  g.fillRect(0, 54, 256, 3)
  for (let i = 0; i < 4; i++) {
    const cx = 32 + i * 64
    for (const [d, col] of [[2, '#6f5938'], [0, '#dcc794']] as const) {
      g.fillStyle = col
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4
        g.beginPath()
        g.ellipse(cx + d + Math.cos(a) * 10, 32 + d + Math.sin(a) * 10, 8, 4, a, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.fillStyle = '#7b6440'
    g.beginPath()
    g.arc(cx, 32, 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#8f7849'
    g.beginPath()
    g.moveTo(cx + 32, 25)
    g.lineTo(cx + 39, 32)
    g.lineTo(cx + 32, 39)
    g.lineTo(cx + 25, 32)
    g.closePath()
    g.fill()
  }
})

/** Grey-beige basalt flagstones in staggered courses; one tile is 4 m square. */
const pavingTexture = (rand: () => number) => canvasTex(512, 512, (g) => {
  g.fillStyle = '#8a8273'
  g.fillRect(0, 0, 512, 512)
  const rows = 6
  const rh = 512 / rows
  for (let r = 0; r < rows; r++) {
    let x = rand() * 120
    const end = x + 512
    while (x < end) {
      const w = Math.min(90 + rand() * 90, end - x)
      const t = 186 + rand() * 26
      g.fillStyle = `rgb(${t | 0},${(t - 7) | 0},${(t - 20) | 0})`
      // Drawn twice so the tile wraps seamlessly.
      for (const ox of [0, -512]) g.fillRect(x + ox + 2, r * rh + 2, w - 4, rh - 4)
      x += w
    }
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rand() < 0.5 ? 'rgba(60,50,40,.18)' : 'rgba(255,250,235,.16)'
    g.fillRect(rand() * 512, rand() * 512, 2, 2)
  }
})

/** Left half: a round light pool. Right half: an uplight scallop, brightest at the bottom. */
const poolTexture = () => canvasTex(256, 128, (g) => {
  const p = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  p.addColorStop(0, 'rgba(255,255,255,1)')
  p.addColorStop(0.35, 'rgba(255,255,255,.5)')
  p.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = p
  g.fillRect(0, 0, 128, 128)
  g.save()
  g.beginPath()
  g.rect(128, 0, 128, 128)
  g.clip()
  g.translate(192, 128)
  g.scale(1, 2.2)
  const s = g.createRadialGradient(0, 0, 0, 0, 0, 62)
  s.addColorStop(0, 'rgba(255,255,255,1)')
  s.addColorStop(0.3, 'rgba(255,255,255,.55)')
  s.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = s
  g.fillRect(-64, -60, 128, 60)
  g.restore()
}, false)

/** One painted board per service, stacked in rows: yellow sign-painter text on dark wood. */
const BOARD_W = 3.9
const BOARD_H = 0.95
const boardAtlas = (names: string[]) => {
  const W = 1024
  const H = 250
  const t = canvasTex(W, H * names.length, (g) => {
    names.forEach((name, i) => {
      const y0 = i * H
      g.fillStyle = '#1d1a16'
      g.fillRect(0, y0, W, H)
      g.fillStyle = 'rgba(255,240,210,.035)'
      for (let k = 0; k < 9; k++) g.fillRect(0, y0 + 20 + k * 24, W, 3)
      g.strokeStyle = '#c9a227'
      g.lineWidth = 7
      g.strokeRect(16, y0 + 16, W - 32, H - 32)
      g.lineWidth = 2
      g.strokeRect(30, y0 + 30, W - 60, H - 60)
      g.fillStyle = '#c9a227'
      for (const [x, y] of [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]]) {
        g.beginPath()
        g.arc(x, y0 + y, 6, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = '#f2c21b'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      let size = H * 0.52
      g.font = `${size}px "Yatra One", Georgia, serif`
      while (g.measureText(name).width > W - 130 && size > 40) {
        size -= 4
        g.font = `${size}px "Yatra One", Georgia, serif`
      }
      g.fillText(name, W / 2, y0 + H / 2 + size * 0.04)
    })
  }, false)
  t.anisotropy = 8
  return t
}

export const buildArch = (ctx: Ctx) => {
  const { scene, compact, reduced } = ctx
  const rand = ctx.rng(31)
  const root = new THREE.Group()
  root.position.set(LAYOUT.arch.x, 0, LAYOUT.arch.z)
  scene.add(root)

  // Local frame: origin at the anchor, +z toward the road and camera, y up from the ground.
  const FRONT = 3.0 // main facade plane
  const BACK = -2.5 // kept clear of the near track at local z ≈ −4.5
  const BASE = 1.0 // top of the plinth
  const ROOF = 20.9
  const ARCH = { half: 3.5, r: 5.95, spring: 9.8 }
  const TW = 9 // corner towers at x = ±TW
  const TZF = 2.6
  const TZB = -1.15
  const TR = 1.2
  const towerFace = TZF + TR * Math.cos(Math.PI / 8)
  const WING = { x: 10.75, half: 1.1, r: 1.76, spring: 7.0, front: 2.4, back: -2.2, top: 13.0 }
  const seg = compact ? 6 : 10
  const domeSeg = compact ? 10 : 16

  const K = {
    stone: C(PAL.basalt),
    light: C('#cdb47c'),
    shade: C(PAL.basaltShade),
    step: C('#a68e5c'),
    dark: C('#2a2018'),
    dome: C('#bea46a'),
    iron: C('#26262b'),
    ironGreen: C('#22302a'),
    yellow: C(PAL.kerbYellow),
    kerb: C(PAL.kerbBlack),
    housing: C('#3a3d43'),
    brass: C('#b88a3c')
  }

  const S = new Batch() // stone, iron and everything else lit and static
  const J = new Batch() // jali screens
  const B = new Batch() // carved bands
  const P = new Batch() // light pools and uplight scallops
  const G = new Batch() // lamp globes

  const jaliRect = (w: number, h: number) => remapUV(new THREE.PlaneGeometry(w, h), w / JALI_TILE, h / JALI_TILE)
  const jaliShape = (s: THREE.Shape) => remapUV(new THREE.ShapeGeometry(s, 1), 1 / JALI_TILE, 1 / JALI_TILE)
  const band = (x0: number, x1: number, y0: number, y1: number, z: number) => {
    if (compact) return
    const w = Math.abs(x1 - x0)
    const h = y1 - y0
    const T = h / Math.max(1, Math.round(h / 0.5))
    B.add(remapUV(new THREE.PlaneGeometry(w, h), w / (4 * T), h / T), K.stone, at((x0 + x1) / 2, (y0 + y1) / 2, z))
  }

  // ——— plinth, plaza edge, kerb ———
  slab(S, K.step, -13.95, 13.95, 0.13, 0.42, BACK - 0.1, 4.8)
  slab(S, K.step, -13.6, 13.6, 0.42, 0.72, BACK - 0.08, 4.4)
  slab(S, K.step, -13.3, 13.3, 0.72, BASE, BACK - 0.06, 4.0)
  const kerbN = 36
  for (let k = 0; k < kerbN; k++) {
    const x0 = -18.05 + (k * 36.1) / kerbN
    slab(S, k % 2 ? K.yellow : K.kerb, x0, x0 + 36.1 / kerbN, 0, 0.2, 6.85, 7.12)
  }

  // ——— central block: the archway is cut through its full depth ———
  S.add(extrude(wallWithArch(2 * TW, ROOF - BASE, ARCH.half, ARCH.r, ARCH.spring - BASE, seg * 2), FRONT - BACK), K.stone, at(0, BASE, BACK), true)
  // archivolt, and a recessed inner order
  S.add(extrude(ringShape(ARCH.half, ARCH.r, ARCH.spring - BASE, 0.5, seg * 2), 0.3), K.light, at(0, BASE, FRONT), true)
  S.add(extrude(ringShape(3.2, 5.65, ARCH.spring - BASE, 0.32, seg * 2), 0.75), K.light, at(0, BASE, 2.0), true)
  // alfiz frame round the arch, roundels in the spandrels
  for (const s of [-1, 1]) slab(S, K.light, s * 4.6, s * 4.9, BASE, 16.25, FRONT, FRONT + 0.25)
  slab(S, K.light, -4.9, 4.9, 15.95, 16.25, FRONT, FRONT + 0.25)
  for (const s of [-1, 1]) {
    S.add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 14), K.light, at(s * 3.3, 14.75, FRONT + 0.06, Math.PI / 2))
    S.add(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), K.shade, at(s * 3.3, 14.75, FRONT + 0.15, Math.PI / 2))
  }

  // ——— the two piers either side of the arch ———
  for (const s of [-1, 1]) {
    const xc = s * 6.35
    // base moulding, string courses, carved dado
    slab(S, K.light, s * 4.0, s * 7.9, BASE, BASE + 0.25, FRONT, FRONT + 0.18)
    slab(S, K.light, s * 4.9, s * 7.9, 9.65, 9.95, FRONT, FRONT + 0.16)
    slab(S, K.light, s * 4.9, s * 7.9, 16.05, 16.3, FRONT, FRONT + 0.16)
    band(s * 4.9, s * 7.85, 1.3, 1.9, FRONT + 0.012)
    // lower blind arch filled with jali
    const niche = () => archPanel(0.95, 1.4, 4.6, seg)
    S.add(new THREE.ShapeGeometry(niche(), 1), K.dark, at(xc, 2.2, FRONT + 0.012))
    J.add(jaliShape(niche()), K.stone, at(xc, 2.2, FRONT + 0.09))
    S.add(extrude(ringShape(0.95, 1.4, 4.6, 0.2, seg), 0.18), K.light, at(xc, 2.2, FRONT), true)
    slab(S, K.light, xc - 1.25, xc + 1.25, 2.0, 2.2, FRONT, FRONT + 0.3)
    // jharokha: a corbelled balcony with a jali front and a curved bangaldar roof
    slab(S, K.light, xc - 1.15, xc + 1.15, 10.9, 11.25, FRONT, FRONT + 0.75)
    for (const dx of [-0.7, 0, 0.7]) slab(S, K.shade, xc + dx - 0.09, xc + dx + 0.09, 10.4, 10.9, FRONT, FRONT + 0.5)
    for (const sx of [-1, 1]) slab(S, K.stone, xc + sx * 0.8, xc + sx * 0.95, 11.25, 13.95, FRONT, FRONT + 0.7)
    S.add(new THREE.PlaneGeometry(1.6, 2.7), K.dark, at(xc, 12.6, FRONT + 0.012))
    J.add(jaliShape(archPanel(0.8, 1.2, 1.5, seg)), K.stone, at(xc, 11.25, FRONT + 0.62))
    S.add(new THREE.ShapeGeometry(wallWithArch(1.7, 2.7, 0.8, 1.2, 1.5, seg), 1), K.stone, at(xc, 11.25, FRONT + 0.63))
    slab(S, K.light, xc - 1.3, xc + 1.3, 13.95, 14.07, FRONT, FRONT + 1.1)
    S.add(new THREE.CylinderGeometry(0.55, 0.55, 2.4, seg, 1, false, 0, Math.PI), K.dome, at(xc, 14.07, FRONT + 0.55, 0, 0, Math.PI / 2, 0.6, 1, 1))
    S.add(new THREE.SphereGeometry(0.07, 8, 6), K.light, at(xc, 14.46, FRONT + 0.55))
    // framed roundel under the frieze
    S.add(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), K.light, at(xc, 15.3, FRONT + 0.05, Math.PI / 2))
    S.add(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), K.shade, at(xc, 15.3, FRONT + 0.12, Math.PI / 2))
    for (const sx of [-1, 1]) slab(S, K.light, xc + sx * 0.62 - 0.04, xc + sx * 0.62 + 0.04, 14.68, 15.92, FRONT, FRONT + 0.08)
    for (const y of [14.68, 15.84]) slab(S, K.light, xc - 0.66, xc + 0.66, y, y + 0.08, FRONT, FRONT + 0.08)
    // rosette panels flanking the station board
    band(s * 4.1, s * 7.75, 16.4, 18.6, FRONT + 0.012)
    // brackets under the cornice
    for (let k = 0; k < 5; k++) {
      const x = s * (4.4 + k * 0.75)
      slab(S, K.shade, x - 0.1, x + 0.1, 18.7, 19.0, FRONT, FRONT + 0.6)
    }
  }

  // ——— the station board in a moulded frame above the arch ———
  const sign = signMesh(ctx, 2, 7.6, 2.25)
  sign.position.set(0, 17.45, FRONT + 0.06)
  root.add(sign)
  for (const s of [-1, 1]) slab(S, K.light, s * 3.8, s * 3.95, 16.25, 18.72, FRONT, FRONT + 0.14)
  slab(S, K.light, -3.95, 3.95, 18.575, 18.72, FRONT, FRONT + 0.14)

  // ——— cornice, attic of jali panels, parapet of kanguras ———
  slab(S, K.light, -8.4, 8.4, 19.0, 19.35, 2.6, 3.75)
  for (let k = 0; k < 8; k++) {
    const x = -7 + k * 2
    S.add(new THREE.PlaneGeometry(1.5, 1.1), K.dark, at(x, 20.1, FRONT + 0.012))
    J.add(jaliRect(1.5, 1.1), K.stone, at(x, 20.1, FRONT + 0.06))
    if (k > 0) slab(S, K.light, x - 1.1, x - 0.9, 19.45, 20.75, FRONT, FRONT + 0.12)
  }
  slab(S, K.light, -8.6, 8.6, ROOF, ROOF + 0.2, BACK, FRONT + 0.15)
  for (let k = 0; k < 19; k++) {
    const x = -7.5 + (k * 15) / 18
    slab(S, K.stone, x - 0.26, x + 0.26, ROOF + 0.2, ROOF + 0.62, FRONT - 0.3, FRONT)
    slab(S, K.stone, x - 0.14, x + 0.14, ROOF + 0.62, ROOF + 0.9, FRONT - 0.27, FRONT - 0.03)
  }

  // ——— the dome behind, on a drum ———
  const DZ = -0.7
  S.add(new THREE.CylinderGeometry(3.3, 3.3, 0.95, domeSeg), K.stone, at(0, ROOF + 0.475, DZ), true)
  S.add(new THREE.CylinderGeometry(3.45, 3.45, 0.2, domeSeg), K.light, at(0, ROOF + 1.05, DZ), true)
  S.add(domeGeo(2.95, domeSeg + 6, 1.05), K.dome, at(0, ROOF + 1.15, DZ))
  S.add(new THREE.SphereGeometry(0.2, 10, 8), K.light, at(0, ROOF + 4.35, DZ))
  S.add(new THREE.ConeGeometry(0.08, 0.6, 6), K.light, at(0, ROOF + 4.8, DZ))

  // ——— four corner towers with open chhatri pavilions on top ———
  const tower = (x: number, z: number, front: boolean) => {
    prism(S, K.stone, x, z, TR, BASE, 22.6)
    const rings: [number, number, number][] = [[1.42, BASE, 1.5], [1.32, 9.65, 9.95], [1.32, 16.05, 16.3], [1.48, 19.0, 19.35], [1.4, ROOF, ROOF + 0.2], [1.36, 22.35, 22.6]]
    for (const [r, y0, y1] of rings) prism(S, K.light, x, z, r, y0, y1)
    if (front) {
      for (const [y0, y1] of [[5.0, 6.4], [12.2, 13.4], [17.2, 18.4]]) {
        S.add(new THREE.PlaneGeometry(0.3, y1 - y0), K.dark, at(x, (y0 + y1) / 2, towerFace + 0.012))
      }
    }
    prism(S, K.light, x, z, 1.55, 22.6, 22.85)
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4
      S.add(new THREE.CylinderGeometry(0.085, 0.085, 1.35, 6), K.stone, at(x + Math.sin(a) * 1.12, 23.525, z + Math.cos(a) * 1.12))
    }
    prism(S, K.light, x, z, 1.5, 24.2, 24.4, 8, 1.68)
    prism(S, K.stone, x, z, 1.1, 24.4, 24.58, 12)
    S.add(domeGeo(1.1, domeSeg, 1.25), K.dome, at(x, 24.58, z))
    S.add(new THREE.SphereGeometry(0.12, 8, 6), K.light, at(x, 26.05, z))
    S.add(new THREE.ConeGeometry(0.06, 0.45, 6), K.light, at(x, 26.35, z))
  }
  for (const s of [-1, 1]) {
    tower(s * TW, TZF, true)
    tower(s * TW, TZB, false)
  }

  // ——— lower side wings, each with a smaller archway, jali window and turret ———
  for (const s of [-1, 1]) {
    const wx = s * WING.x
    S.add(extrude(wallWithArch(3.5, WING.top - BASE, WING.half, WING.r, WING.spring - BASE, seg), WING.front - WING.back), K.stone, at(wx, BASE, WING.back), true)
    S.add(extrude(ringShape(WING.half, WING.r, WING.spring - BASE, 0.28, seg), 0.15), K.light, at(wx, BASE, WING.front), true)
    S.add(new THREE.PlaneGeometry(1.8, 1.3), K.dark, at(wx, 10.05, WING.front + 0.012))
    J.add(jaliRect(1.8, 1.3), K.stone, at(wx, 10.05, WING.front + 0.05))
    slab(S, K.light, wx - 1.0, wx + 1.0, 9.28, 9.4, WING.front, WING.front + 0.12)
    slab(S, K.light, wx - 1.0, wx + 1.0, 10.7, 10.82, WING.front, WING.front + 0.12)
    for (const sx of [-1, 1]) slab(S, K.light, wx + sx * 0.96 - 0.06, wx + sx * 0.96 + 0.06, 9.4, 10.7, WING.front, WING.front + 0.12)
    slab(S, K.light, s * 9.0, s * 12.2, 11.4, 11.65, WING.front - 0.3, WING.front + 0.5)
    band(s * 9.1, s * 11.85, 11.75, 12.85, WING.front + 0.012)
    slab(S, K.light, s * 9.0, s * 12.2, WING.top, WING.top + 0.15, WING.back, WING.front + 0.12)
    for (let k = 0; k < 5; k++) {
      const x = s * (9.5 + k * 0.6)
      slab(S, K.stone, x - 0.2, x + 0.2, WING.top + 0.15, WING.top + 0.5, WING.front - 0.3, WING.front)
      slab(S, K.stone, x - 0.1, x + 0.1, WING.top + 0.5, WING.top + 0.7, WING.front - 0.27, WING.front - 0.03)
    }
    // turret at the outer front corner
    const tx = s * 12.5
    const tz = 2.0
    prism(S, K.stone, tx, tz, 0.6, BASE, 14.5)
    const trings: [number, number, number][] = [[0.72, BASE, 1.35], [0.68, 6.9, 7.1], [0.75, 11.4, 11.65], [0.7, 12.95, 13.15]]
    for (const [r, y0, y1] of trings) prism(S, K.light, tx, tz, r, y0, y1)
    prism(S, K.light, tx, tz, 0.8, 14.5, 14.64)
    S.add(domeGeo(0.58, domeSeg, 1.25), K.dome, at(tx, 14.64, tz))
    S.add(new THREE.ConeGeometry(0.045, 0.4, 5), K.light, at(tx, 15.57, tz))
  }

  // ——— festoon wire for the lanterns, on iron brackets from the front towers ———
  const WIRE_Z = 4.6
  const WIRE_X = 8.7
  const wireY = (x: number) => 12.0 + 1.6 * (x / WIRE_X) ** 2
  const wirePts: THREE.Vector3[] = []
  for (let i = 0; i <= 16; i++) {
    const x = -WIRE_X + (i * 2 * WIRE_X) / 16
    wirePts.push(V(x, wireY(x), WIRE_Z))
  }
  S.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePts), 32, 0.02, 4), K.iron)
  for (const s of [-1, 1]) {
    S.add(rodGeo(V(s * TW, 13.6, towerFace - 0.05), V(s * WIRE_X, 13.6, WIRE_Z + 0.05), 0.04), K.iron)
    S.add(rodGeo(V(s * TW, 12.95, towerFace - 0.05), V(s * 8.78, 13.58, WIRE_Z - 0.15), 0.03), K.iron)
  }
  const n = Math.min(4, ctx.opts.services.length)
  const SPACING = 4.4
  const pivots = Array.from({ length: n }, (_, i) => {
    const x = (i - (n - 1) / 2) * SPACING
    return V(x, wireY(x), WIRE_Z)
  })
  // bunting between the lanterns
  const flagCols = ['#f28c28', '#f3efe6', '#2f8a4a', '#e2c13a', '#d6457a'].map(C)
  let fi = 0
  for (let x = -8.3; x <= 8.3; x += 0.42) {
    if (pivots.some(p => Math.abs(p.x - x) < 0.42)) continue
    const y = wireY(x) - 0.01
    const w = 0.13
    const h = 0.3
    const flag = new THREE.BufferGeometry()
    flag.setAttribute('position', new THREE.Float32BufferAttribute([
      x - w, y, WIRE_Z, x, y - h, WIRE_Z, x + w, y, WIRE_Z,
      x - w, y, WIRE_Z, x + w, y, WIRE_Z, x, y - h, WIRE_Z
    ], 3))
    flag.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1], 3))
    S.add(flag, flagCols[fi++ % flagCols.length]!)
  }

  // ——— bollards and chain along the road, a gap at the steps ———
  const bStep = compact ? 3.15 : 2.1
  const chain = (x0: number, x1: number) => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 8; i++) {
      const u = i / 8
      pts.push(V(x0 + (x1 - x0) * u, 0.78 - 0.2 * 4 * u * (1 - u), 6.45))
    }
    S.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.022, 4), K.iron)
  }
  for (const s of [-1, 1]) {
    let prev: number | null = null
    for (let x = 3.3; x <= 17.3; x += bStep) {
      const bx = s * x
      prism(S, K.iron, bx, 6.45, 0.16, 0.13, 0.23)
      S.add(new THREE.CylinderGeometry(0.09, 0.11, 0.6, 8), K.iron, at(bx, 0.53, 6.45))
      S.add(new THREE.CylinderGeometry(0.115, 0.115, 0.1, 8), K.yellow, at(bx, 0.45, 6.45))
      S.add(new THREE.SphereGeometry(0.12, 8, 6), K.iron, at(bx, 0.88, 6.45))
      if (prev !== null) chain(prev, bx)
      prev = bx
    }
  }

  // ——— floodlights on the plaza, aimed up at the facade ———
  const fixtures = [-10.75, -6.35, 6.35, 10.75]
  for (const x of fixtures) {
    slab(S, K.housing, x - 0.2, x + 0.2, 0.13, 0.22, 5.2, 5.5)
    for (const sx of [-1, 1]) slab(S, K.iron, x + sx * 0.3 - 0.02, x + sx * 0.3 + 0.02, 0.22, 0.5, 5.31, 5.39)
    S.add(new THREE.BoxGeometry(0.56, 0.36, 0.34), K.housing, at(x, 0.45, 5.35, 0.6))
  }

  // ——— two heritage lamp posts at the plaza ends ———
  const haloPos: THREE.Vector3[] = pivots.map(p => p.clone())
  const haloSize: number[] = pivots.map(() => 2.6)
  for (const s of [-1, 1]) {
    const x = s * 15.8
    const z = 5.6
    slab(S, K.light, x - 0.35, x + 0.35, 0.13, 0.88, z - 0.35, z + 0.35)
    slab(S, K.light, x - 0.42, x + 0.42, 0.88, 0.98, z - 0.42, z + 0.42)
    S.add(new THREE.CylinderGeometry(0.08, 0.13, 4.3, 8), K.ironGreen, at(x, 3.13, z))
    for (const y of [1.5, 4.7]) S.add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 8), K.ironGreen, at(x, y, z))
    slab(S, K.ironGreen, x - 0.75, x + 0.75, 4.82, 4.88, z - 0.035, z + 0.035)
    for (const sx of [-1, 1]) S.add(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), K.ironGreen, at(x + sx * 0.7, 4.97, z))
    S.add(new THREE.CylinderGeometry(0.13, 0.08, 0.12, 8), K.ironGreen, at(x, 5.34, z))
    G.add(new THREE.SphereGeometry(0.24, 12, 8), K.stone, at(x, 5.62, z))
    haloPos.push(V(x, 5.62, z))
    haloSize.push(1.7)
    for (const sx of [-1, 1]) {
      G.add(new THREE.SphereGeometry(0.19, 10, 8), K.stone, at(x + sx * 0.7, 5.24, z))
      haloPos.push(V(x + sx * 0.7, 5.24, z))
      haloSize.push(1.3)
    }
  }

  // ——— light pools, uplight scallops on the piers and wings, a glow inside the archway ———
  const pool = (x: number, y: number, z: number, w: number, d: number) =>
    P.add(remapUV(new THREE.PlaneGeometry(w, d), 0.5, 1), K.stone, at(x, y, z, -Math.PI / 2))
  const scallop = (x: number, y0: number, z: number, w: number, h: number) =>
    P.add(remapUV(new THREE.PlaneGeometry(w, h), 0.5, 1, 0.5), K.stone, at(x, y0 + h / 2, z))
  for (const x of fixtures) pool(x, 0.16, 5.75, 3.2, 2.2)
  for (const s of [-1, 1]) {
    pool(s * 15.8, 0.16, 5.6, 4.6, 4.6)
    scallop(s * 6.35, BASE, 3.8, 4.4, 12)
    scallop(s * WING.x, BASE, 2.75, 3.2, 9.5)
  }
  pool(0, BASE + 0.03, 0.2, 6.2, 4.6)
  scallop(0, BASE, -0.6, 6.6, 13)

  // ——— materials and meshes ———
  const stoneMat = toon('#ffffff', { vertexColors: true })
  const stone = new THREE.Mesh(S.build(), stoneMat)
  stone.castShadow = true
  stone.receiveShadow = true
  root.add(stone)

  const jali = new THREE.Mesh(J.build(), toon('#d2b984', { map: jaliTexture(), alphaTest: 0.5, side: THREE.DoubleSide }))
  jali.receiveShadow = true
  root.add(jali)

  if (!B.empty) {
    const bands = new THREE.Mesh(B.build(), toon('#ffffff', { map: bandTexture() }))
    bands.receiveShadow = true
    root.add(bands)
  }

  const pave = pavingTexture(rand)
  pave.repeat.set(36 / 4, 9.6 / 4)
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(36, 0.13, 9.6), toon('#ffffff', { map: pave }))
  plaza.position.set(0, 0.065, 2.2)
  plaza.receiveShadow = true
  root.add(plaza)

  const glassMat = glow('#ffc46b', 2.8)
  const glassDay = C('#efe2bb').multiplyScalar(0.95)
  const glassNight = glassMat.color.clone()
  root.add(new THREE.Mesh(G.build(), glassMat))

  const poolMat = new THREE.MeshBasicMaterial({ map: poolTexture(), color: '#ffb768', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide })
  const pools = fx(new THREE.Mesh(P.build(), poolMat))
  root.add(pools)

  // The one real light: a wide warm flood from across the road, falling off up the facade.
  const spot = new THREE.SpotLight(0xffc98a, 0, 60, 1.0, 0.45, 1.1)
  spot.position.set(0, 3, 15)
  spot.target.position.set(0, 8, FRONT)
  root.add(spot, spot.target)

  // ——— lanterns: one per service, swaying from the wire ———
  const L = new Batch()
  const black = K.iron
  L.add(new THREE.TorusGeometry(0.06, 0.015, 4, 10), black, at(0, -0.06, 0))
  L.add(rodGeo(V(0, -0.11, 0), V(0, -0.8, 0), 0.018, 4), black)
  L.add(new THREE.SphereGeometry(0.055, 8, 6), K.brass, at(0, -0.83, 0))
  L.add(new THREE.ConeGeometry(0.44, 0.36, 4, 1, false, Math.PI / 4), black, at(0, -1.03, 0), true)
  L.add(new THREE.CylinderGeometry(0.34, 0.32, 0.08, 4, 1, false, Math.PI / 4), K.brass, at(0, -1.25, 0), true)
  for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    L.add(rodGeo(V(cx * 0.223, -1.29, cz * 0.223), V(cx * 0.166, -2.01, cz * 0.166), 0.025, 4), black)
  }
  L.add(new THREE.CylinderGeometry(0.25, 0.13, 0.14, 4, 1, false, Math.PI / 4), black, at(0, -2.08, 0), true)
  L.add(new THREE.SphereGeometry(0.06, 8, 6), K.brass, at(0, -2.2, 0))
  L.add(new THREE.ConeGeometry(0.04, 0.15, 6), K.brass, at(0, -2.32, 0, Math.PI))
  L.add(rodGeo(V(0, -2.15, 0), V(0, -2.42, 0), 0.02, 4), black)
  L.add(rodGeo(V(-1.75, -2.42, 0), V(1.75, -2.42, 0), 0.03, 5), black)
  for (const sx of [-1, 1]) {
    L.add(new THREE.SphereGeometry(0.05, 6, 5), K.brass, at(sx * 1.8, -2.42, 0))
    L.add(rodGeo(V(sx * 1.6, -2.42, 0), V(sx * 1.6, -2.6, 0), 0.015, 4), black)
  }
  const metal = new THREE.InstancedMesh(L.build(), stoneMat, Math.max(1, n))
  const glass = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.22, 0.72, 4, 1, false, Math.PI / 4).translate(0, -1.65, 0), glassMat, Math.max(1, n))

  const boardGeo = new THREE.BoxGeometry(BOARD_W, BOARD_H, 0.05).translate(0, -2.6 - BOARD_H / 2, 0)
  const rows = new Float32Array(Math.max(1, n))
  for (let i = 0; i < n; i++) rows[i] = n - 1 - i
  boardGeo.setAttribute('aRow', new THREE.InstancedBufferAttribute(rows, 1))
  const names = ctx.opts.services.slice(0, n)
  const boardMat = new THREE.MeshBasicMaterial({ map: n ? boardAtlas(names) : null, fog: false })
  // Each instance reads its own row of the atlas.
  boardMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRow;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.y = (vMapUv.y + aRow) / ${Math.max(1, n)}.0;\n#endif`)
  }
  boardMat.customProgramCacheKey = () => `arch-board-${n}`
  const boards = new THREE.InstancedMesh(boardGeo, boardMat, Math.max(1, n))
  for (const m of [metal, glass, boards]) {
    m.count = n
    m.frustumCulled = false
    root.add(m)
  }
  metal.castShadow = true

  const haloMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ffbf70', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })
  const halos = fx(new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, haloPos.length))
  halos.frustumCulled = false
  root.add(halos)

  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const v = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const one = V(1, 1, 1)
  const camLocal = new THREE.Vector3()

  const swing = (t: number) => {
    for (let i = 0; i < n; i++) {
      const az = reduced ? 0 : Math.sin(t * 0.9 + i * 1.3) * 0.05
      const ax = reduced ? 0 : Math.sin(t * 0.7 + i * 2.1) * 0.02
      q.setFromEuler(e.set(ax, 0, az, 'XYZ'))
      m4.compose(pivots[i]!, q, one)
      metal.setMatrixAt(i, m4)
      glass.setMatrixAt(i, m4)
      boards.setMatrixAt(i, m4)
      haloPos[i]!.set(0, -1.65, 0).applyQuaternion(q).add(pivots[i]!)
    }
    metal.instanceMatrix.needsUpdate = true
    glass.instanceMatrix.needsUpdate = true
    boards.instanceMatrix.needsUpdate = true
  }

  // Halos face the camera and sit a little toward it, so they wash over the lantern rather than cut through its board.
  const billboard = (cam: THREE.Camera) => {
    camLocal.copy(cam.position).sub(root.position)
    haloPos.forEach((p, i) => {
      v.copy(camLocal).sub(p).normalize().multiplyScalar(0.35).add(p)
      m4.compose(v, cam.quaternion, sc.setScalar(haloSize[i]!))
      halos.setMatrixAt(i, m4)
    })
    halos.instanceMatrix.needsUpdate = true
  }
  swing(0)
  billboard(ctx.camera)

  // ——— pigeons ———
  const PG = new Batch()
  PG.add(new THREE.SphereGeometry(0.1, 8, 6), C('#7f8696'), at(0, 0.13, 0, 0, 0, 0, 0.95, 0.9, 1.6))
  PG.add(new THREE.SphereGeometry(0.07, 6, 5), C('#5f7a74'), at(0, 0.19, 0.08))
  PG.add(new THREE.SphereGeometry(0.048, 6, 5), C('#5d6372'), at(0, 0.245, 0.13))
  PG.add(new THREE.ConeGeometry(0.014, 0.045, 4), C('#3a3a40'), at(0, 0.24, 0.185, Math.PI / 2))
  PG.add(new THREE.BoxGeometry(0.1, 0.025, 0.15), C('#4f5563'), at(0, 0.13, -0.2, -0.25))
  for (const sx of [-1, 1]) {
    PG.add(new THREE.BoxGeometry(0.24, 0.018, 0.16), C('#959bab'), at(sx * 0.15, 0.17, -0.02, 0, 0, sx * 0.3))
    PG.add(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 3), C('#c46a5a'), at(sx * 0.03, 0.035, 0.01))
  }
  const N = compact ? 24 : 48
  const pigeons = new THREE.InstancedMesh(PG.build(), stoneMat, N)
  pigeons.frustumCulled = false
  root.add(pigeons)

  interface Spot { p: THREE.Vector3, yaw: number, wander: number, ledge: boolean }
  interface Flight { t0: number, dur: number, p0: THREE.Vector3, c: THREE.Vector3, to: Spot }
  interface Bird { spot: Spot, home: THREE.Vector3, w1: number, w2: number, f1: number, f2: number, peck: number, rate: number, size: number, flight: Flight | null }

  const groundSpot = (): Spot => {
    const u = rand()
    if (u < 0.6) {
      // the plaza strip between the steps and the bollards, clear of the floodlights
      let x = 0
      let z = 0
      for (let k = 0; k < 8; k++) {
        x = -11 + rand() * 22
        z = 5.05 + rand() * 0.9
        if (z > 5.8 || fixtures.every(f => Math.abs(f - x) > 0.95)) break
      }
      return { p: V(x, 0.13, z), yaw: rand() * Math.PI * 2, wander: 0.3, ledge: false }
    }
    if (u < 0.82) return { p: V(-2.8 + rand() * 5.6, BASE, -2.0 + rand() * 4.4), yaw: rand() * Math.PI * 2, wander: 0.35, ledge: false }
    const treads: [number, number][] = [[0.42, 4.6], [0.72, 4.2], [BASE, 3.86]]
    const [y, z] = treads[Math.floor(rand() * 3)]!
    return { p: V(-12.5 + rand() * 25, y, z), yaw: (rand() < 0.5 ? 1 : -1) * Math.PI / 2, wander: 0, ledge: false }
  }
  const ledgeSpot = (): Spot => {
    const u = rand()
    const s = rand() < 0.5 ? -1 : 1
    if (u < 0.5) return { p: V(-7.3 + rand() * 14.6, 19.35, 3.6), yaw: (rand() - 0.5) * 1.2, wander: 0, ledge: true }
    if (u < 0.75) return { p: V(s * 6.35 + (rand() - 0.5) * 1.8, 14.4, FRONT + 0.55), yaw: s * Math.PI / 2, wander: 0, ledge: true }
    return { p: V(s * (10.4 + rand() * 1.4), 11.65, 2.65), yaw: (rand() - 0.5) * 1.0, wander: 0, ledge: true }
  }

  const tint = [C('#ffffff'), C('#c8c4be'), C('#ffe0bc'), C('#8c8c94')]
  const birds: Bird[] = []
  for (let i = 0; i < N; i++) {
    const spot = i < N * 0.25 ? ledgeSpot() : groundSpot()
    birds.push({ spot, home: spot.p.clone(), w1: 0.23 + rand() * 0.2, w2: 0.19 + rand() * 0.2, f1: rand() * 6.3, f2: rand() * 6.3, peck: rand() * 6.3, rate: 2.2 + rand() * 1.4, size: 0.9 + rand() * 0.2, flight: null })
    const r = rand()
    pigeons.setColorAt(i, tint[r < 0.62 ? 0 : r < 0.82 ? 1 : r < 0.92 ? 2 : 3]!)
  }
  if (pigeons.instanceColor) pigeons.instanceColor.needsUpdate = true

  /** Where a grounded bird stands at time t (it potters about its home), and which way it faces. */
  const groundPos = (b: Bird, t: number, out: THREE.Vector3) => {
    const A = reduced ? 0 : b.spot.wander
    out.set(b.home.x + Math.sin(t * b.w1 + b.f1) * A, b.home.y, b.home.z + Math.sin(t * b.w2 + b.f2) * A * 0.5)
    if (A === 0) return b.spot.yaw + (reduced ? 0 : Math.sin(t * 0.4 + b.f1) * 0.5)
    return Math.atan2(Math.cos(t * b.w1 + b.f1) * b.w1, Math.cos(t * b.w2 + b.f2) * b.w2 * 0.5)
  }

  const launch = (b: Bird, t0: number, to: Spot) => {
    const p0 = new THREE.Vector3()
    groundPos(b, t0, p0)
    const p1 = to.p
    const d = p0.distanceTo(p1)
    let c: THREE.Vector3
    // Approach ledges from in front and above; drop off them forward; hop arcs bow out toward the road.
    if (to.ledge) c = V(p1.x + (p0.x - p1.x) * 0.2, p1.y + 1.6, p1.z + 2.6)
    else if (b.spot.ledge) c = V(p0.x + (p1.x - p0.x) * 0.2, p0.y + 1.0, p0.z + 2.6)
    else c = p0.clone().lerp(p1, 0.5).add(V((rand() - 0.5) * 2, 1.2 + d * 0.3, 1 + rand()))
    b.flight = { t0, dur: 1.2 + d * 0.09 + rand() * 0.5, p0, c, to }
  }

  const land = (b: Bird, t: number) => {
    b.spot = b.flight!.to
    b.home.copy(b.spot.p)
    // restart the potter so the bird stands exactly where it landed
    b.f1 = -t * b.w1
    b.f2 = -t * b.w2
    b.flight = null
  }

  const flutter = (t: number, count: number, scare: boolean) => {
    const idle = birds.filter(b => !b.flight)
    const ground = idle.filter(b => !b.spot.ledge)
    const ledge = idle.filter(b => b.spot.ledge)
    const perched = birds.filter(b => b.spot.ledge).length
    let group: Bird[]
    if ((!scare && ledge.length && rand() < 0.3) || !ground.length) {
      group = ledge.sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3))
    } else {
      const seed = ground[Math.floor(rand() * ground.length)]!.home
      group = ground.sort((a, b) => a.home.distanceTo(seed) - b.home.distanceTo(seed)).slice(0, count)
    }
    for (const b of group) {
      const up = b.spot.ledge ? rand() < 0.2 : perched < N * 0.45 && rand() < (scare ? 0.35 : 0.22)
      launch(b, t + rand() * 0.45, up ? ledgeSpot() : groundSpot())
    }
  }

  const bp = new THREE.Vector3()
  const bv = new THREE.Vector3()
  const updateBirds = (t: number) => {
    for (let i = 0; i < N; i++) {
      const b = birds[i]!
      let yaw: number
      let pitch = 0
      let roll = 0
      let sx = 0.62 // wings folded
      const f = b.flight
      const u = f ? (t - f.t0) / f.dur : -1
      if (f && u >= 1) land(b, t)
      if (f && u >= 0 && u < 1) {
        const k = 1 - u
        bp.set(0, 0, 0).addScaledVector(f.p0, k * k).addScaledVector(f.c, 2 * u * k).addScaledVector(f.to.p, u * u)
        bv.copy(f.c).sub(f.p0).multiplyScalar(2 * k).addScaledVector(v.copy(f.to.p).sub(f.c), 2 * u)
        yaw = Math.atan2(bv.x, bv.z)
        pitch = -Math.atan2(bv.y, Math.hypot(bv.x, bv.z)) * 0.5
        roll = Math.sin(t * 34 + i) * 0.35
        sx = 1
      } else {
        yaw = groundPos(b, t, bp)
        if (!reduced && !b.spot.ledge) pitch = 0.6 * Math.max(0, Math.sin(t * b.rate + b.peck)) ** 12
      }
      q.setFromEuler(e.set(pitch, yaw, roll, 'YXZ'))
      m4.compose(bp, q, sc.set(sx * b.size, b.size, b.size))
      pigeons.setMatrixAt(i, m4)
    }
    pigeons.instanceMatrix.needsUpdate = true
  }
  updateBirds(0)

  let nextFlutter = 4 + rand() * 4
  let armed = true
  ctx.onFrame((f) => {
    if (f.stop !== 2) armed = true
    // Nothing here is visible from the other stops.
    const dx = Math.abs(f.camera.position.x - LAYOUT.arch.x)
    if (dx > 110) return
    if (halos.visible) billboard(f.camera)
    if (reduced) return
    swing(f.t)
    // The camera pulling in scares up a good part of the flock, once per visit.
    if (armed && f.stop === 2 && dx < 16) {
      armed = false
      flutter(f.t, Math.round(N * 0.4), true)
    }
    if (f.t > nextFlutter) {
      flutter(f.t, 3 + Math.floor(rand() * 6), false)
      nextFlutter = f.t + 5 + rand() * 7
    }
    updateBirds(f.t)
  })

  ctx.onMode((mix) => {
    spot.intensity = mix * 45
    // a touch warmer at night, as if the floodlights tint the stone
    stoneMat.color.setRGB(1, 1 - 0.05 * mix, 1 - 0.12 * mix)
    glassMat.color.copy(glassDay).lerp(glassNight, mix)
    haloMat.opacity = mix * 0.85
    halos.visible = mix > 0.02
    poolMat.opacity = mix * 0.55
    pools.visible = mix > 0.02
  })
}
