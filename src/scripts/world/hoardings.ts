/*
 * The Work stop: one hoarding per project, in two tiers on an arc over a
 * paved plaza, built like the ones along Mumbai's roads: a steel lattice
 * behind each face, a catwalk with railing along the bottom, floodlights on
 * brackets that wash the face at night, legs on concrete footings and a
 * weathered frame. The plaza has a chai stall, planters of bougainvillea, a
 * bench, a dabbawala's cycle, a sleeping dog and crows on the steel.
 *
 * Hovering lifts a board and rims it in taxi yellow; clicking opens that
 * project (scene.ts routes the click through userData.pick). Each face is
 * one canvas (frame, cover-fitted screenshot, title tag), so a board is one
 * draw; the steel, concrete and props share one merged mesh, the lamp
 * lenses another, and every wash, halo and light pool one additive mesh.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { LAYOUT, type Ctx } from './context'
import { fx, glow, PAL, toon } from './style'
import { signMesh } from './textures'

const W = 4.4
const H = 2.9
const D = 0.22
const BORDER = 0.1
const TAG = 0.42
const Y_LO = 3.6
const Y_UP = 7.6
/** Columns stand this far behind the faces they carry. */
const COL_OUT = 0.42

const STEEL = '#6a5548'
const STEEL_DARK = '#3a3633'
const RAIL = '#d6a73a'
const DECK = '#46413b'
const INK_C = '#26252b'
const BAMBOO = '#c9a86a'

type Col = THREE.ColorRepresentation
type Rect = [number, number, number, number]

const ONE = new THREE.Vector3(1, 1, 1)
const UP = new THREE.Vector3(0, 1, 0)
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), ONE)
const mul = (a: THREE.Matrix4, b: THREE.Matrix4) => new THREE.Matrix4().multiplyMatrices(a, b)

/** Pieces of one merged mesh, each painted a flat vertex colour. */
const batch = () => {
  const parts: THREE.BufferGeometry[] = []
  const add = (geo: THREE.BufferGeometry, color: Col, m: THREE.Matrix4) => {
    // Everything non-indexed, uv dropped, so boxes, cylinders and blobs merge.
    const g = geo.index ? geo.toNonIndexed() : geo
    g.deleteAttribute('uv')
    g.applyMatrix4(m)
    const c = new THREE.Color(color)
    const n = g.getAttribute('position').count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    parts.push(g)
  }
  return {
    add,
    box: (f: THREE.Matrix4, w: number, h: number, d: number, color: Col, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
      add(new THREE.BoxGeometry(w, h, d), color, mul(f, at(x, y, z, rx, ry, rz))),
    cyl: (f: THREE.Matrix4, rt: number, rb: number, h: number, seg: number, color: Col, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
      add(new THREE.CylinderGeometry(rt, rb, h, seg), color, mul(f, at(x, y, z, rx, ry, rz))),
    /** A square bar from a to b. */
    beam: (f: THREE.Matrix4, a: THREE.Vector3, b: THREE.Vector3, t: number, color: Col) => {
      const d = b.clone().sub(a)
      const len = d.length()
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())
      add(new THREE.BoxGeometry(t, len, t), color, mul(f, new THREE.Matrix4().compose(a.clone().lerp(b, 0.5), q, ONE)))
    },
    /** A squashed low-poly ball: shrubs, crows, the dog. */
    blob: (f: THREE.Matrix4, r: number, detail: number, color: Col, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) =>
      add(new THREE.IcosahedronGeometry(r, detail), color, mul(f, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(sx, sy, sz)))),
    mesh: (mat: THREE.Material) => new THREE.Mesh(mergeGeometries(parts) ?? new THREE.BufferGeometry(), mat)
  }
}

/** Flat quads for the additive layer, each mapped to a region of the fx atlas. */
const quads = () => {
  const parts: THREE.BufferGeometry[] = []
  return {
    parts,
    quad: (f: THREE.Matrix4, w: number, h: number, r: Rect, color: THREE.Color, m: THREE.Matrix4) => {
      const g = new THREE.PlaneGeometry(w, h)
      const uv = g.getAttribute('uv') as THREE.BufferAttribute
      const col = new Float32Array(uv.count * 3)
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, r[0] + uv.getX(i) * (r[2] - r[0]), r[1] + uv.getY(i) * (r[3] - r[1]))
        col.set([color.r, color.g, color.b], i * 3)
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3))
      g.applyMatrix4(mul(f, m))
      parts.push(g)
    }
  }
}

const canvas2d = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, g: c.getContext('2d')! }
}

/* The fx atlas: the top half is the floodlight wash for a face (lamps along
 * the bottom), the bottom-left quarter a round glow for halos and pools. */
const WASH: Rect = [0.004, 0.504, 0.996, 0.996]
const GLOW: Rect = [0.006, 0.006, 0.494, 0.494]
const fxAtlas = (lampXs: number[]) => {
  const { c, g } = canvas2d(256, 256)
  g.save()
  g.beginPath()
  g.rect(0, 0, 256, 128)
  g.clip()
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = 'rgba(255,255,255,.1)'
  g.fillRect(0, 0, 256, 128)
  for (const x of lampXs) {
    g.save()
    g.translate((0.5 + x / W) * 256, 130)
    g.scale(1, 1.4)
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 100)
    gr.addColorStop(0, 'rgba(255,255,255,.85)')
    gr.addColorStop(0.35, 'rgba(255,255,255,.38)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(-110, -110, 220, 220)
    g.restore()
  }
  // Ease off over the title tag so it stays crisp under the lamps.
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = 'rgba(0,0,0,.65)'
  g.fillRect(0, 128 * (1 - (BORDER + TAG) / H), 256, 128 * TAG / H)
  g.restore()
  const gr = g.createRadialGradient(64, 192, 0, 64, 192, 62)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.25, 'rgba(255,255,255,.45)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 128, 128, 128)
  return new THREE.CanvasTexture(c)
}

/** A board face: weathered steel frame, the screenshot cover-fitted, and the title tag. */
const paintFace = (title: string, index: number, cw: number, rng: () => number) => {
  const ch = Math.round((cw * H) / W)
  const px = cw / W
  const b = Math.round(BORDER * px)
  const tagH = Math.round(TAG * px)
  const pic = { x: b, y: b, w: cw - 2 * b, h: ch - 2 * b - tagH }
  const { c, g } = canvas2d(cw, ch)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  // Weathering is rolled once, so the repaint after the screenshot loads matches.
  const streaks = Array.from({ length: 10 }, () => ({ x: rng() * cw, w: 2 + rng() * 6, len: 0.25 + rng() * 0.75, a: 0.2 + rng() * 0.35 }))
  const blotches = Array.from({ length: 16 }, () => ({ x: rng() * cw, y: rng() * ch, r: 2 + rng() * 6 }))

  const paint = (img?: HTMLImageElement) => {
    g.fillStyle = '#4a423a'
    g.fillRect(0, 0, cw, ch)
    if (img) {
      const iw = img.naturalWidth || img.width || 1
      const ih = img.naturalHeight || img.height || 1
      const want = pic.w / pic.h
      let sx = 0
      let sy = 0
      let sw = iw
      let sh = ih
      if (iw / ih > want) {
        sw = ih * want
        sx = (iw - sw) / 2
      } else {
        sh = iw / want
        sy = (ih - sh) / 2
      }
      g.drawImage(img, sx, sy, sw, sh, pic.x, pic.y, pic.w, pic.h)
    } else {
      g.fillStyle = '#2a2822'
      g.fillRect(pic.x, pic.y, pic.w, pic.h)
      g.strokeStyle = 'rgba(242,194,27,.07)'
      g.lineWidth = 8
      for (let x = -pic.h; x < pic.w; x += 46) {
        g.beginPath()
        g.moveTo(pic.x + x, pic.y + pic.h)
        g.lineTo(pic.x + x + pic.h, pic.y)
        g.stroke()
      }
    }
    // Flex sheets are printed in panels: faint seams, and a shadow under the frame lip.
    g.fillStyle = 'rgba(0,0,0,.07)'
    for (const f of [1 / 3, 2 / 3]) g.fillRect(pic.x + pic.w * f - 1, pic.y, 2, pic.h)
    const lip = g.createLinearGradient(0, pic.y, 0, pic.y + pic.h * 0.07)
    lip.addColorStop(0, 'rgba(0,0,0,.35)')
    lip.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = lip
    g.fillRect(pic.x, pic.y, pic.w, pic.h * 0.07)

    // The title tag: number, then the title in sign-painter yellow.
    const ty = ch - b - tagH
    g.fillStyle = '#16140f'
    g.fillRect(b, ty, cw - 2 * b, tagH)
    g.fillStyle = '#f2c21b'
    g.fillRect(b, ty, cw - 2 * b, Math.max(2, tagH * 0.04))
    g.textBaseline = 'middle'
    const num = String(index + 1).padStart(2, '0')
    g.font = `${tagH * 0.36}px "Yatra One", Georgia, serif`
    g.textAlign = 'left'
    g.fillStyle = 'rgba(233,223,196,.7)'
    g.fillText(num, b + tagH * 0.3, ty + tagH * 0.55)
    const pad = b + tagH * 0.6 + g.measureText(num).width
    g.font = `${tagH * 0.54}px "Yatra One", Georgia, serif`
    g.textAlign = 'center'
    g.fillStyle = '#f2c21b'
    let s = title
    while (g.measureText(s).width > cw - 2 * pad && s.length > 4) s = s.slice(0, -2)
    g.fillText(s === title ? s : `${s.trimEnd()}…`, cw / 2, ty + tagH * 0.56)

    // Rust and bolts, on the frame only.
    g.save()
    g.beginPath()
    g.rect(0, 0, cw, ch)
    g.rect(b, b, cw - 2 * b, ch - 2 * b)
    g.clip('evenodd')
    for (const k of streaks) {
      const gr = g.createLinearGradient(0, 0, 0, ch * k.len)
      gr.addColorStop(0, `rgba(164,87,47,${k.a})`)
      gr.addColorStop(1, 'rgba(164,87,47,0)')
      g.fillStyle = gr
      g.fillRect(k.x, 0, k.w, ch * k.len)
    }
    g.fillStyle = 'rgba(150,80,44,.45)'
    for (const k of blotches) {
      g.beginPath()
      g.arc(k.x, k.y, k.r, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#2b2622'
    const bolt = (x: number, y: number) => {
      g.beginPath()
      g.arc(x, y, Math.max(1.5, b * 0.14), 0, Math.PI * 2)
      g.fill()
    }
    for (let x = b * 2; x < cw - b; x += px * 0.45) {
      bolt(x, b / 2)
      bolt(x, ch - b / 2)
    }
    for (let y = b * 2; y < ch - b; y += px * 0.45) {
      bolt(b / 2, y)
      bolt(cw - b / 2, y)
    }
    g.restore()
    g.strokeStyle = '#1b1a24'
    g.lineWidth = Math.max(2, b * 0.12)
    g.strokeRect(b, b, cw - 2 * b, ch - 2 * b)
    // The agency's licence plate, bolted to the bottom rail.
    const pw = px * 0.5
    const plx = cw - b - pw - px * 0.15
    g.fillStyle = '#e9e4d6'
    g.fillRect(plx, ch - b * 0.8, pw, b * 0.6)
    g.fillStyle = '#3a3633'
    g.fillRect(plx + 4, ch - b * 0.68, pw * 0.7, Math.max(1, b * 0.1))
    g.fillRect(plx + 4, ch - b * 0.45, pw * 0.45, Math.max(1, b * 0.1))
    tex.needsUpdate = true
  }
  paint()
  return { tex, paint }
}

/** The face block: the canvas on the front, the sides and back sampling plain frame steel. */
const faceGeometry = () => {
  const geo = new THREE.BoxGeometry(W, H, D)
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute
  const u = (BORDER / W) * 0.5
  // BoxGeometry writes faces +x, -x, +y, -y, +z, -z, four vertices each.
  for (let i = 0; i < uv.count; i++) {
    if (i < 16 || i >= 20) uv.setXY(i, u, 0.5)
  }
  return geo
}

/** Interlocking I-shaped paver blocks, grey with bands of red, and the stains of a busy footpath. */
const paverTexture = (rng: () => number) => {
  const S = 512
  const pw = 64
  const ph = 32
  const cols = S / pw
  const rows = S / ph
  const grout = '#77716a'
  const { c, g } = canvas2d(S, S)
  g.fillStyle = grout
  g.fillRect(0, 0, S, S)
  const tone: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const v = rng()
      if (r % 8 === 3) tone.push(`hsl(10, ${30 + v * 12}%, ${42 + v * 8}%)`)
      else if (rng() < 0.07) tone.push(`hsl(40, 9%, ${52 + v * 6}%)`)
      else tone.push(`hsl(38, ${6 + v * 8}%, ${66 + v * 9}%)`)
    }
  }
  const notch = (x: number, y: number) => {
    g.beginPath()
    g.ellipse(x, y, 7, 5, 0, 0, Math.PI * 2)
    g.fill()
  }
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? pw / 2 : 0
    for (let k = -1; k < cols; k++) {
      const x = k * pw + off
      const y = r * ph
      g.fillStyle = tone[r * cols + ((k + cols) % cols)]!
      g.fillRect(x + 2, y + 2, pw - 4, ph - 4)
      g.fillStyle = 'rgba(255,255,255,.13)'
      g.fillRect(x + 2, y + 2, pw - 4, 2)
      g.fillStyle = 'rgba(0,0,0,.12)'
      g.fillRect(x + 2, y + ph - 4, pw - 4, 2)
      // the waist of the I
      g.fillStyle = grout
      notch(x + pw / 2, y + 1)
      notch(x + pw / 2, y + ph - 1)
    }
  }
  const blot = (rx: number, ry: number, color: string) => {
    const x = rng() * S
    const y = rng() * S
    g.fillStyle = color
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        g.beginPath()
        g.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
  }
  for (let i = 0; i < 14; i++) blot(6 + rng() * 22, 4 + rng() * 14, 'rgba(50,42,34,.1)')
  for (let i = 0; i < 4; i++) blot(3 + rng() * 6, 2 + rng() * 5, 'rgba(140,36,30,.22)')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** The chai stall's board: Marathi and English, lit from inside at night. */
const kioskSignTexture = () => {
  const { c, g } = canvas2d(512, 128)
  g.fillStyle = PAL.bestRed
  g.fillRect(0, 0, 512, 128)
  g.strokeStyle = PAL.taxiYellow
  g.lineWidth = 6
  g.strokeRect(8, 8, 496, 112)
  g.textBaseline = 'middle'
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.font = '600 72px Eczar, "Noto Serif Devanagari", serif'
  g.fillText('चहा', 112, 72)
  g.fillStyle = PAL.taxiYellow
  g.font = '50px "Yatra One", Georgia, serif'
  g.fillText('Cutting Chai', 334, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export const buildHoardings = (ctx: Ctx) => {
  const { scene, compact, renderer } = ctx
  const { cx, cz, radius } = LAYOUT.hoardings
  // The lower tier stands a little forward, so the upper catwalk passes behind it.
  const R_UP = radius
  const R_LO = radius - 1.2
  const projects = ctx.opts.projects
  const n = projects.length
  const lower = Math.ceil(n / 2)
  const upper = n - lower
  const span = THREE.MathUtils.degToRad(compact ? 66 : 58)
  const minStep = 2 * Math.asin((W + 0.6) / (2 * R_LO))
  const step = lower > 1 ? Math.max(span / (lower - 1), minStep) : minStep
  const half = step / 2
  const aniso = Math.min(compact ? 4 : 8, renderer.capabilities.getMaxAnisotropy())
  const rnd = ctx.rng(4180)
  const lampXs = compact ? [-1.15, 1.15] : [-1.5, 0, 1.5]
  const frameAt = (a: number, r: number, y: number) => at(cx + Math.sin(a) * r, y, cz - Math.cos(a) * r, 0, -a, 0)
  const I = new THREE.Matrix4()

  const S = batch()
  const L = batch()
  const F = quads()
  const WASH_C = new THREE.Color(0.34, 0.24, 0.13)
  const POOL_C = new THREE.Color(0.6, 0.42, 0.22)
  const HALO_C = new THREE.Color(1.3, 1.0, 0.62)
  const TUBE_C = new THREE.Color(0.42, 0.52, 0.6)

  // Board positions in half-steps along the arc: the upper tier sits between the lower boards, like bricks.
  const lowPos = Array.from({ length: lower }, (_, i) => 2 * i - (lower - 1))
  const upPos = Array.from({ length: upper }, (_, k) => 2 * k - (upper - 1))
  const colsOf = (ps: number[]) => [...new Set(ps.flatMap(p => [p - 1, p + 1]))]

  /** A laced steel column on a footing, in the gap between two boards. */
  const column = (a: number, rc: number, h: number) => {
    const C = frameAt(a, rc, 0)
    S.box(C, 0.8, 0.4, 0.55, PAL.concrete, 0, 0.2, 0)
    S.box(C, 0.6, 0.03, 0.3, STEEL_DARK, 0, 0.415, 0)
    for (const sx of [-0.2, 0.2]) S.box(C, 0.11, h - 0.43, 0.11, STEEL, sx, 0.43 + (h - 0.43) / 2, 0)
    const lace = compact ? 1.1 : 0.55
    let flip = false
    for (let y = 0.6; y + lace < h - 0.1; y += lace) {
      S.beam(C, V(flip ? 0.2 : -0.2, y, 0), V(flip ? -0.2 : 0.2, y + lace, 0), 0.035, STEEL)
      flip = !flip
    }
    S.box(C, 0.56, 0.05, 0.26, STEEL_DARK, 0, h + 0.025, 0)
  }
  const lowCols = colsOf(lowPos)
  const upCols = colsOf(upPos)
  for (const j of lowCols) column(j * half, R_LO + COL_OUT, Y_LO + H / 2 + 0.03)
  for (const j of upCols) column(j * half, R_UP + COL_OUT, Y_UP + H / 2 + 0.15)

  /** A crow (grey nape and all) standing at the origin of m. */
  const crow = (m: THREE.Matrix4) => {
    S.blob(m, 0.12, 0, INK_C, 0, 0.11, 0, 0.8, 0.72, 1.55)
    S.blob(m, 0.075, 0, '#5d5c62', 0, 0.16, 0.12)
    S.blob(m, 0.065, 0, INK_C, 0, 0.2, 0.17)
    S.add(new THREE.ConeGeometry(0.022, 0.08, 4), INK_C, mul(m, at(0, 0.195, 0.255, Math.PI / 2)))
    S.box(m, 0.07, 0.02, 0.17, INK_C, 0, 0.09, -0.24, 0.25)
    for (const sx of [-0.03, 0.03]) S.box(m, 0.012, 0.05, 0.012, INK_C, sx, 0.025, 0)
  }

  /** Everything around a face that stays put on hover: lattice, catwalk, lamps, legs. */
  const boardStatic = (Fm: THREE.Matrix4, Y: number, r: number, up: boolean, i: number) => {
    const yb = -Y
    const xc = (r + COL_OUT) * Math.sin(half)
    const zc = -((r + COL_OUT) * Math.cos(half) - r)
    const hw = Math.min(W / 2 + 0.25, (r - 0.5) * Math.sin(half) - 0.08)
    const deckY = -H / 2 - 0.9
    const top = deckY + 0.03

    // the lattice the face is bolted to, tied into the columns either side
    for (const sx of [-1.1, 1.1]) S.box(Fm, 0.07, H - 0.1, 0.07, STEEL, sx, 0, -0.17)
    for (const cy of [H / 2 - 0.1, 0, -H / 2 + 0.1]) S.box(Fm, 2 * xc, 0.08, 0.08, STEEL, 0, cy, -0.27)
    S.beam(Fm, V(-xc, -H / 2 + 0.1, -0.27), V(-1.1, H / 2 - 0.1, -0.27), 0.05, STEEL)
    S.beam(Fm, V(xc, -H / 2 + 0.1, -0.27), V(1.1, H / 2 - 0.1, -0.27), 0.05, STEEL)
    if (!compact) S.beam(Fm, V(-1.1, -H / 2 + 0.1, -0.29), V(1.1, H / 2 - 0.1, -0.29), 0.04, STEEL)

    // catwalk: grating deck, railing, toe plate
    S.box(Fm, 2 * hw, 0.06, 0.75, DECK, 0, deckY, 0.495)
    if (!compact) {
      for (let k = 0; k < 5; k++) S.box(Fm, 2 * hw - 0.1, 0.012, 0.02, '#26231f', 0, top + 0.006, 0.2 + k * 0.14)
    }
    const posts = compact ? 3 : 5
    for (let k = 0; k < posts; k++) {
      const x = -hw + 0.04 + (k * (2 * hw - 0.08)) / (posts - 1)
      S.box(Fm, 0.045, 0.86, 0.045, RAIL, x, top + 0.43, 0.84)
    }
    S.box(Fm, 2 * hw, 0.05, 0.05, RAIL, 0, top + 0.86, 0.84)
    S.box(Fm, 2 * hw, 0.035, 0.035, RAIL, 0, top + 0.45, 0.84)
    S.box(Fm, 2 * hw, 0.1, 0.015, RAIL, 0, top + 0.05, 0.855)

    // floodlights on brackets off the rail, aimed up at the face
    for (const lx of lampXs) {
      S.beam(Fm, V(lx, top + 0.86, 0.84), V(lx, top + 0.86, 1.3), 0.04, STEEL_DARK)
      S.beam(Fm, V(lx, top + 0.86, 1.3), V(lx, top + 0.72, 1.3), 0.035, STEEL_DARK)
      const hm = mul(Fm, at(lx, top + 0.6, 1.3, 0.85))
      S.add(new THREE.BoxGeometry(0.34, 0.2, 0.26), '#2c2a28', hm)
      L.add(new THREE.BoxGeometry(0.28, 0.15, 0.02), '#ffffff', mul(hm, at(0, 0, -0.135)))
      F.quad(Fm, 0.75, 0.75, GLOW, HALO_C, at(lx, top + 0.62, 1.2))
    }
    F.quad(Fm, W, H, WASH, WASH_C, at(0, 0, 0.14))

    if (!up) {
      // legs on footings, X-braced, carrying the catwalk on joists
      for (const sx of [-1.25, 1.25]) {
        S.box(Fm, 0.45, 0.36, 0.45, PAL.concrete, sx, yb + 0.18, -0.27)
        S.box(Fm, 0.1, -H / 2 + 0.06 - (yb + 0.36), 0.1, STEEL, sx, (yb + 0.36 - H / 2 + 0.06) / 2, -0.27)
        S.beam(Fm, V(sx, deckY - 0.065, -0.27), V(sx, deckY - 0.065, 0.8), 0.07, STEEL)
        const fx0 = Math.sign(sx) * (hw - 0.25)
        S.box(Fm, 0.32, 0.3, 0.32, PAL.concrete, fx0, yb + 0.15, 0.8)
        S.box(Fm, 0.08, deckY - 0.105 - (yb + 0.3), 0.08, STEEL, fx0, (deckY - 0.105 + yb + 0.3) / 2, 0.8)
      }
      S.box(Fm, 2 * hw, 0.08, 0.08, STEEL, 0, deckY - 0.07, 0.8)
      S.beam(Fm, V(-1.25, yb + 0.45, -0.27), V(1.25, -H / 2 + 0.12, -0.27), 0.05, STEEL)
      S.beam(Fm, V(1.25, yb + 0.45, -0.27), V(-1.25, -H / 2 + 0.12, -0.27), 0.05, STEEL)
      // the floodlights' spill on the plaza
      F.quad(Fm, 5.4, 3.2, GLOW, POOL_C, at(0, yb + 0.07, 2.2, -Math.PI / 2))
    } else {
      // the upper catwalk hangs off the columns on cantilever brackets
      for (const bx of [-hw + 0.1, 0, hw - 0.1]) S.beam(Fm, V(bx, deckY - 0.065, -0.25), V(bx, deckY - 0.065, 0.86), 0.07, STEEL)
      for (const bx of [-hw + 0.1, hw - 0.1]) S.beam(Fm, V(bx, deckY - 0.85, zc), V(bx, deckY - 0.065, 0.6), 0.05, STEEL)
      S.box(Fm, 2 * hw, 0.07, 0.07, STEEL, 0, deckY - 0.065, 0.82)
      S.box(Fm, 2 * xc, 0.07, 0.07, STEEL, 0, deckY - 0.85, zc)
      if (!compact) {
        S.box(Fm, 2 * xc, 0.07, 0.07, STEEL, 0, yb + 2.6, zc)
        S.beam(Fm, V(-xc, yb + 0.5, zc), V(xc, yb + 2.6, zc), 0.05, STEEL)
        S.beam(Fm, V(xc, yb + 0.5, zc), V(-xc, yb + 2.6, zc), 0.05, STEEL)
      }
    }

    // the crew's leftovers: a bamboo ladder, paint tins, a rolled-up old flex
    if (i === 0) {
      const lo = V(0, yb, 1.95)
      const hi = V(0, top + 0.78, 0.9)
      for (const lx of [0.7, 1.12]) S.beam(Fm, V(lx, lo.y, lo.z), V(lx, hi.y, hi.z), 0.05, BAMBOO)
      for (let k = 1; k < 8; k++) {
        const p = lo.clone().lerp(hi, k / 8)
        S.box(Fm, 0.42, 0.03, 0.03, BAMBOO, 0.91, p.y, p.z)
      }
      S.cyl(Fm, 0.13, 0.11, 0.22, 8, '#e9e4d6', -0.9, top + 0.11, 0.45)
      S.cyl(Fm, 0.11, 0.1, 0.2, 8, PAL.signBlue, -0.6, top + 0.1, 0.5)
    }
    if (i === 2) S.cyl(Fm, 0.1, 0.1, 1.5, 8, '#e8e2d2', 0.6, top + 0.1, 0.4, 0, 0, Math.PI / 2)
  }

  // ——— the boards ———
  const faceGeo = faceGeometry()
  const rimGeo = new THREE.PlaneGeometry(W + 0.36, H + 0.36)
  const rimColor = new THREE.Color(PAL.taxiYellow).multiplyScalar(1.3)
  const boards: { g: THREE.Group, base: THREE.Vector3, rim: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> }[] = []
  const faceMats: THREE.MeshBasicMaterial[] = []
  const loader = new THREE.ImageLoader()
  projects.forEach((p, i) => {
    const up = i >= lower
    const a = (up ? upPos[i - lower]! : lowPos[i]!) * half
    const r = up ? R_UP : R_LO
    const y = up ? Y_UP : Y_LO
    boardStatic(frameAt(a, r, y), y, r, up, i)

    const face = paintFace(p.title, i, compact ? 768 : 1024, ctx.rng(31 + i * 7))
    face.tex.anisotropy = aniso
    const mat = new THREE.MeshBasicMaterial({ map: face.tex, toneMapped: false, fog: false })
    faceMats.push(mat)
    const mesh = new THREE.Mesh(faceGeo, mat)
    mesh.castShadow = true
    const rim = fx(new THREE.Mesh(rimGeo, new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0, toneMapped: false, fog: false, depthWrite: false })))
    rim.position.z = -0.13
    rim.visible = false
    const g = new THREE.Group()
    g.add(rim, mesh)
    const base = V(cx + Math.sin(a) * r, y, cz - Math.cos(a) * r)
    g.position.copy(base)
    g.rotation.y = -a
    g.userData.pick = `project:${p.slug}`
    ctx.pickables.add(g)
    boards.push({ g, base, rim })
    loader.load(p.image, img => face.paint(img))
  })

  // ——— the station board, on its own gantry above the arc ———
  const signY = Y_UP + H / 2 + 2.25
  const signTop = signY + 1.2
  const postZ = cz - R_UP - 0.5
  for (const sx of [-3.3, 3.3]) {
    S.box(I, 0.6, 0.4, 0.5, PAL.concrete, cx + sx, 0.2, postZ)
    S.box(I, 0.18, signTop + 0.1 - 0.4, 0.18, STEEL, cx + sx, (signTop + 0.1 + 0.4) / 2, postZ)
  }
  for (const dy of [-0.9, 0.9]) S.box(I, 6.8, 0.1, 0.1, STEEL, cx, signY + dy, postZ)
  S.box(I, 7.3, 2.4, 0.1, STEEL_DARK, cx, signY, postZ + 0.15)
  const head = signMesh(ctx, 3, 7, 2.1)
  head.position.set(cx, signY, postZ + 0.22)
  scene.add(head)
  for (const sx of [-2.2, 2.2]) {
    S.beam(I, V(cx + sx, signTop, postZ + 0.15), V(cx + sx, signTop + 0.35, postZ + 0.5), 0.04, STEEL_DARK)
    S.beam(I, V(cx + sx, signTop + 0.35, postZ + 0.5), V(cx + sx, signTop + 0.3, postZ + 0.85), 0.04, STEEL_DARK)
    const hm = at(cx + sx, signTop + 0.2, postZ + 0.9, -0.8)
    S.add(new THREE.BoxGeometry(0.3, 0.18, 0.22), '#2c2a28', hm)
    L.add(new THREE.BoxGeometry(0.24, 0.13, 0.02), '#ffffff', mul(hm, at(0, 0, -0.115)))
    F.quad(I, 0.8, 0.8, GLOW, HALO_C, at(cx + sx, signTop + 0.15, postZ + 0.95))
  }

  // crows on the sign and on the column caps
  crow(at(cx - 1.8, signTop, postZ + 0.15, 0, 0.5))
  if (!compact) crow(at(cx + 2.7, signTop, postZ + 0.15, 0, -2.4))
  if (upCols.length > 1) {
    const perch = [upCols[1]!, ...(compact ? [] : [upCols[upCols.length - 2]!])]
    perch.forEach((j, k) => crow(mul(frameAt(j * half, R_UP + COL_OUT, Y_UP + H / 2 + 0.2), at(0, 0, 0, 0, k ? -1.1 : 1.3))))
  }

  // ——— the plaza ———
  const pav = paverTexture(ctx.rng(77))
  pav.anisotropy = aniso
  const PW = 39
  const PD = 28.5
  const pz0 = 8
  pav.repeat.set(PW / 2.56, PD / 2.56)
  const plazaMat = toon('#ffffff', { map: pav, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), plazaMat)
  plaza.rotation.x = -Math.PI / 2
  plaza.position.set(cx, 0.04, pz0 + PD / 2)
  plaza.receiveShadow = true
  scene.add(plaza)
  // granite edging on the open sides
  for (const sx of [-PW / 2, PW / 2]) S.box(I, 0.25, 0.08, PD, PAL.concreteDark, cx + sx, 0.04, pz0 + PD / 2)
  S.box(I, PW + 0.25, 0.08, 0.25, PAL.concreteDark, cx, 0.04, pz0 + PD)

  // a painted kerb ring keeping feet off the hoarding site
  const kr = R_LO - 2.8
  const endA = (lower - 1) * half + Math.atan((W / 2 + 0.6) / R_LO)
  const blocks = Math.ceil((2 * endA * kr) / 0.6)
  for (let k = 0; k < blocks; k++) {
    const t = -endA + ((k + 0.5) * 2 * endA) / blocks
    S.box(frameAt(t, kr, 0), 0.54, 0.2, 0.24, k % 2 ? PAL.kerbBlack : PAL.kerbYellow, 0, 0.1, 0)
  }

  // planters of shrubs and bougainvillea
  const spots = compact ? [-16, 16] : [-25, -9, 9, 25]
  spots.forEach((deg, k) => {
    const P = frameAt(THREE.MathUtils.degToRad(deg), 15.5, 0)
    S.cyl(P, 0.58, 0.46, 0.55, 12, PAL.laterite, 0, 0.275, 0)
    S.cyl(P, 0.63, 0.63, 0.07, 12, PAL.localCream, 0, 0.585, 0)
    S.cyl(P, 0.56, 0.56, 0.03, 12, '#4a3626', 0, 0.61, 0)
    for (let s = 0; s < 3; s++) {
      const ang = s * 2.1 + k
      const ox = Math.cos(ang) * 0.2
      const oz = Math.sin(ang) * 0.2
      const rr = 0.3 + rnd() * 0.1
      const oy = 0.78 + rr * 0.5
      S.blob(P, rr, 1, PAL.foliage[(k + s) % 4]!, ox, oy, oz, 1, 0.85, 1)
      for (let f = 0; f < 3; f++) {
        const u = rnd() * Math.PI * 2
        const v = 0.2 + rnd() * 0.9
        S.blob(P, 0.07, 0, f % 2 ? '#e86aa6' : '#d13d86', ox + Math.cos(u) * Math.cos(v) * rr * 0.95, oy + Math.sin(v) * rr * 0.8, oz + Math.sin(u) * Math.cos(v) * rr * 0.95)
      }
    }
  })

  // the chai stall, turned to face the camera, on the open left of the plaza
  const K = at(167.6, 0, 16.6, 0, 0.75)
  const TEAL = '#3f8a8c'
  S.box(K, 1.9, 0.2, 1.4, PAL.concreteDark, 0, 0.1, 0)
  S.box(K, 1.7, 2.0, 0.06, TEAL, 0, 1.2, -0.57)
  for (const sx of [-0.82, 0.82]) S.box(K, 0.06, 2.0, 1.2, TEAL, sx, 1.2, 0)
  S.box(K, 1.84, 0.06, 1.32, STEEL_DARK, 0, 2.23, 0)
  S.box(K, 1.7, 0.86, 0.06, TEAL, 0, 0.63, 0.57)
  S.box(K, 1.7, 0.27, 0.06, TEAL, 0, 2.07, 0.57)
  S.box(K, 1.84, 0.05, 0.42, '#d9d2bf', 0, 1.085, 0.72)
  L.box(K, 1.58, 0.84, 0.02, TUBE_C, 0, 1.52, -0.53)
  L.box(K, 1.1, 0.035, 0.035, new THREE.Color(0.9, 0.97, 1), 0, 1.9, 0.5)
  for (const sy of [1.42, 1.72]) {
    S.box(K, 1.58, 0.03, 0.26, '#8b6a46', 0, sy, -0.42)
    for (let k = 0; k < 7; k++) S.cyl(K, 0.06, 0.06, 0.16, 6, PAL.chawl[(k + (sy > 1.5 ? 3 : 0)) % 6]!, -0.66 + k * 0.22, sy + 0.095, -0.42)
  }
  S.cyl(K, 0.09, 0.09, 1.66, 8, '#8d8a83', 0, 1.98, 0.68, 0, 0, Math.PI / 2)
  S.box(K, 2.0, 0.035, 0.95, PAL.signBlue, 0, 2.06, 1.05, 0.3)
  for (const sx of [-0.95, 0.95]) S.beam(K, V(sx, 0, 1.5), V(sx, 1.93, 1.5), 0.04, BAMBOO)
  S.box(K, 1.8, 0.01, 0.01, INK_C, 0, 1.885, 1.46)
  const packets = [PAL.autoYellow, PAL.bestRed, PAL.chawl[2], PAL.autoGreen, PAL.chawl[1], PAL.localPurple]
  for (let k = 0; k < 10; k++) S.box(K, 0.09, 0.15, 0.015, packets[k % packets.length]!, -0.81 + k * 0.18, 1.8, 1.46)
  S.box(K, 1.9, 0.5, 0.06, PAL.bestRed, 0, 2.52, 0.55)
  S.cyl(K, 0.1, 0.11, 0.22, 8, '#cfcac2', 0.55, 1.22, 0.72)
  S.cyl(K, 0.05, 0.07, 0.05, 8, '#9d9890', 0.55, 1.355, 0.72)
  for (const jx of [-0.65, -0.47, -0.29]) {
    S.cyl(K, 0.07, 0.07, 0.2, 8, '#e8e0c8', jx, 1.21, 0.78)
    S.cyl(K, 0.075, 0.075, 0.04, 8, PAL.bestRed, jx, 1.33, 0.78)
  }
  for (const [sx, sz] of [[-0.55, 1.6], [0.3, 1.95]]) {
    S.cyl(K, 0.16, 0.2, 0.42, 8, PAL.bestRed, sx!, 0.21, sz!)
    S.cyl(K, 0.19, 0.19, 0.04, 8, '#a8182a', sx!, 0.44, sz!)
  }
  S.box(K, 0.46, 0.28, 0.34, PAL.autoYellow, 1.25, 0.14, 0.75)
  S.box(K, 0.46, 0.28, 0.34, PAL.autoGreen, 1.25, 0.42, 0.75, 0, 0.2)
  F.quad(K, 4.4, 3.4, GLOW, TUBE_C, at(0, 0.07, 1.7, -Math.PI / 2))
  let kioskSignMat: THREE.MeshBasicMaterial | null = null
  if (!compact) {
    const sg = new THREE.PlaneGeometry(1.84, 0.44)
    sg.applyMatrix4(mul(K, at(0, 2.52, 0.585)))
    kioskSignMat = new THREE.MeshBasicMaterial({ map: kioskSignTexture(), toneMapped: false })
    scene.add(new THREE.Mesh(sg, kioskSignMat))
  }

  // a dabbawala's cycle on its stand, tiffins on the carrier
  const BK = at(172.3, 0, 17.6, 0, 0.75)
  const BLACK = '#24262c'
  for (const wx of [-0.52, 0.52]) {
    S.add(new THREE.TorusGeometry(0.33, 0.028, 4, 16), '#1d1d20', mul(BK, at(wx, 0.36, 0)))
    S.box(BK, 0.05, 0.05, 0.1, '#9a968e', wx, 0.36, 0)
  }
  const bb = V(0, 0.33, 0)
  const seat = V(-0.14, 0.86, 0)
  const headT = V(0.4, 0.86, 0)
  const headB = V(0.44, 0.66, 0)
  const rear = V(-0.52, 0.36, 0)
  const front = V(0.52, 0.36, 0)
  for (const [p, q] of [[bb, seat], [seat, headT], [bb, headB], [bb, rear], [seat, rear], [headB, front], [headB, headT]]) S.beam(BK, p!, q!, 0.035, BLACK)
  S.beam(BK, headT, V(0.36, 1.0, 0), 0.03, BLACK)
  S.box(BK, 0.03, 0.03, 0.56, BLACK, 0.36, 1.0, 0)
  S.box(BK, 0.24, 0.05, 0.13, '#3a2b22', -0.16, 0.9, 0)
  S.box(BK, 0.42, 0.025, 0.26, BLACK, -0.46, 0.72, 0)
  S.beam(BK, V(-0.62, 0.72, 0), rear, 0.025, BLACK)
  S.box(BK, 0.4, 0.2, 0.3, '#8a6a44', -0.46, 0.835, 0)
  for (const [tx, tz] of [[-0.56, -0.06], [-0.4, 0.06], [-0.4, -0.08]]) S.cyl(BK, 0.055, 0.055, 0.16, 8, '#cfcac2', tx!, 1.015, tz!)
  S.beam(BK, V(-0.18, 0.33, 0.03), V(-0.24, 0, 0.2), 0.025, BLACK)

  // a municipal bench facing the sea, and a bin
  const BN = at(184, 0, 17.8, 0, -0.317)
  const SLAT = '#3f6f4a'
  for (const sx of [-0.72, 0.72]) {
    S.box(BN, 0.14, 0.42, 0.46, PAL.concrete, sx, 0.21, 0)
    S.beam(BN, V(sx, 0.42, -0.2), V(sx, 0.9, -0.31), 0.06, PAL.concreteDark)
  }
  for (const sz of [-0.15, 0, 0.15]) S.box(BN, 1.8, 0.045, 0.13, SLAT, 0, 0.445, sz)
  S.box(BN, 1.8, 0.11, 0.035, SLAT, 0, 0.64, -0.25, -0.23)
  S.box(BN, 1.8, 0.11, 0.035, SLAT, 0, 0.82, -0.29, -0.23)
  S.cyl(I, 0.27, 0.23, 0.72, 10, PAL.autoGreen, 186.4, 0.36, 17)
  S.cyl(I, 0.275, 0.265, 0.08, 10, PAL.localCream, 186.4, 0.5, 17)
  S.cyl(I, 0.25, 0.29, 0.06, 10, '#24533a', 186.4, 0.75, 17)

  // a street dog asleep on the warm pavers
  const DG = at(177.2, 0, 17.2, 0, 0.4)
  const DOG = '#c4975d'
  S.blob(DG, 0.3, 1, DOG, 0, 0.17, 0, 1.25, 0.55, 0.62)
  S.blob(DG, 0.13, 1, DOG, 0.4, 0.14, 0.12, 1.2, 0.9, 1)
  S.blob(DG, 0.07, 0, '#8a6440', 0.53, 0.11, 0.16)
  for (const ez of [0.05, 0.19]) S.blob(DG, 0.05, 0, '#8a6440', 0.37, 0.25, ez, 0.6, 1, 0.6)
  S.beam(DG, V(-0.36, 0.1, 0), V(-0.45, 0.04, 0.22), 0.05, DOG)
  S.box(DG, 0.28, 0.06, 0.07, DOG, 0.35, 0.04, 0.24)

  // ——— materials, meshes, lights ———
  const steelMat = toon('#ffffff', { vertexColors: true })
  const steel = S.mesh(steelMat)
  steel.castShadow = true
  steel.receiveShadow = true
  scene.add(steel)
  const lensMat = glow('#ffffff', 1)
  lensMat.vertexColors = true
  scene.add(L.mesh(lensMat))
  const fxMat = new THREE.MeshBasicMaterial({
    map: fxAtlas(lampXs),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    side: THREE.DoubleSide
  })
  const fxMesh = fx(new THREE.Mesh(mergeGeometries(F.parts) ?? new THREE.BufferGeometry(), fxMat))
  fxMesh.renderOrder = 2
  scene.add(fxMesh)

  // The two real lights: warm flood spill over the lower catwalks, a tube light in the stall.
  const flood = new THREE.PointLight('#ffb35c', 0, 22, 2)
  flood.position.set(cx, 3.6, cz - R_LO + 3.6)
  const tube = new THREE.PointLight('#dceeff', 0, 8, 2)
  tube.position.copy(V(0, 1.9, 1.0).applyMatrix4(K))
  scene.add(flood, tube)

  const white = new THREE.Color('#ffffff')
  const nightTint = new THREE.Color('#8f91a6')
  ctx.onMode((mix) => {
    const lit = THREE.MathUtils.smoothstep(mix, 0.3, 0.85)
    for (const m of faceMats) m.color.setScalar(0.86 + 0.14 * mix)
    lensMat.color.setScalar(0.3 + 2.5 * lit)
    fxMat.opacity = lit
    fxMesh.visible = lit > 0.01
    steelMat.color.copy(white).lerp(nightTint, mix)
    plazaMat.color.copy(white).lerp(nightTint, mix)
    flood.intensity = 28 * lit
    tube.intensity = 5 * lit
    if (kioskSignMat) kioskSignMat.color.setScalar(0.9 + 0.7 * lit)
  })

  ctx.onFrame(({ hover }) => {
    for (const b of boards) {
      const on = hover === b.g
      const s = b.g.scale.x + ((on ? 1.07 : 1) - b.g.scale.x) * 0.18
      b.g.scale.set(s, s, 1)
      b.g.position.y += ((on ? b.base.y + 0.35 : b.base.y) - b.g.position.y) * 0.18
      const m = b.rim.material
      m.opacity += ((on ? 0.95 : 0) - m.opacity) * 0.2
      b.rim.visible = m.opacity > 0.01
    }
  })
}
