/*
 * The skyline behind the tracks, the Bandra-Worli Sea Link out on the water,
 * and the far shore across the bay. Three bands of buildings, near to far:
 * old chawls with long verandas and pastel paint, mid-rise blocks with
 * balconies, and slim towers with stepped crowns. Roofs carry the black
 * water tanks every Mumbai roof has; chawl fronts carry AC units; one tower
 * is still going up under a crane whose red lamp blinks at night. Windows
 * are painted (dark by day, randomly lit at night, a few TV-blue).
 *
 * Every band is one InstancedMesh, so the whole skyline is a dozen draws.
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, glow, toon } from './style'

type Rng = () => number

/** Facade textures for one archetype: `map` (walls with dark windows) and `emissive` (only the lit ones). */
const facade = (rand: Rng, opts: { cols: number, rows: number, kind: 'chawl' | 'block' | 'tower' }) => {
  const cw = 16
  const rh = opts.kind === 'tower' ? 12 : 16
  const W = opts.cols * cw
  const H = opts.rows * rh
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }
  const wall = mk()
  const lit = mk()
  const g = wall.getContext('2d')!
  const e = lit.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)
  e.fillStyle = '#000000'
  e.fillRect(0, 0, W, H)
  // damp streaks under the sills: Mumbai monsoon stains
  for (let i = 0; i < opts.cols * 0.6; i++) {
    g.fillStyle = `rgba(60,70,60,${0.05 + rand() * 0.08})`
    g.fillRect(rand() * W, rand() * H * 0.5, 2 + rand() * 4, H * (0.2 + rand() * 0.6))
  }
  for (let r = 0; r < opts.rows; r++) {
    const y = r * rh
    if (opts.kind === 'chawl') {
      // veranda: a dark recess, doors, and a railing across the front
      g.fillStyle = '#4a4440'
      g.fillRect(0, y + 3, W, rh - 6)
      g.fillStyle = '#f2ece0'
      for (let x = 0; x < W; x += 4) g.fillRect(x, y + rh - 7, 1, 4)
      g.fillRect(0, y + rh - 8, W, 1)
    } else {
      g.fillStyle = 'rgba(0,0,0,.08)'
      g.fillRect(0, y + rh - 2, W, 2)
    }
    for (let k = 0; k < opts.cols; k++) {
      const x = k * cw
      const on = rand() < (opts.kind === 'tower' ? 0.45 : 0.55)
      const tv = rand() < 0.08
      const ww = opts.kind === 'tower' ? cw - 4 : cw - 7
      const wh = opts.kind === 'chawl' ? rh - 9 : rh - 7
      const wx = x + (cw - ww) / 2
      const wy = y + 3
      g.fillStyle = opts.kind === 'tower' ? '#3d4a5c' : '#2d2a2e'
      g.fillRect(wx, wy, ww, wh)
      if (opts.kind === 'block') {
        // grille and a balcony slab with a clothesline
        g.fillStyle = '#d9d2c4'
        for (let gx = wx; gx < wx + ww; gx += 3) g.fillRect(gx, wy, 1, wh)
        g.fillStyle = '#efe9dc'
        g.fillRect(x + 1, y + rh - 4, cw - 2, 2)
        if (rand() < 0.3) {
          g.fillStyle = ['#c8202f', '#2f6fb3', '#f4cf36', '#2f8a5a'][Math.floor(rand() * 4)]!
          g.fillRect(wx + 1, wy + wh - 4, 3, 3)
        }
      }
      if (on) {
        e.fillStyle = tv ? '#7fb2ff' : rand() < 0.2 ? '#fff0c8' : '#ffc062'
        e.fillRect(wx + 1, wy + 1, ww - 2, wh - 2)
      }
    }
  }
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.magFilter = THREE.NearestFilter
    t.anisotropy = 4
    return t
  }
  return { map: tex(wall), emissive: tex(lit) }
}

export const buildCity = (ctx: Ctx) => {
  const { scene, compact } = ctx
  const rand = ctx.rng(1337)
  const range = (a: number, b: number) => a + (b - a) * rand()
  const pick = <T>(a: readonly T[]) => a[Math.floor(rand() * a.length)]!
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const v = new THREE.Vector3()
  const s = new THREE.Vector3()
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)

  const windowMats: THREE.MeshToonMaterial[] = []
  const band = (count: number, tex: ReturnType<typeof facade>) => {
    const mat = toon('#ffffff', { map: tex.map, emissive: 0xffffff, emissiveMap: tex.emissive, emissiveIntensity: 1 })
    windowMats.push(mat)
    const mesh = new THREE.InstancedMesh(box, mat, count)
    mesh.castShadow = false
    mesh.receiveShadow = false
    scene.add(mesh)
    return mesh
  }

  // Roof props gathered as we place buildings, instanced afterwards.
  const tanks: THREE.Matrix4[] = []
  const acs: THREE.Matrix4[] = []
  const roofs: { x: number, y: number, z: number, w: number, d: number }[] = []
  const place = (mesh: THREE.InstancedMesh, i: number, x: number, z: number, w: number, h: number, d: number, color: THREE.ColorRepresentation) => {
    m4.compose(v.set(x, 0, z), q.identity(), s.set(w, h, d))
    mesh.setMatrixAt(i, m4)
    mesh.setColorAt(i, new THREE.Color(color))
    roofs.push({ x, y: h, z, w, d })
  }
  const addTanks = (x: number, y: number, z: number, w: number, d: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const r = range(0.7, 1.1)
      tanks.push(new THREE.Matrix4().compose(
        v.set(x + range(-w / 2 + 1.2, w / 2 - 1.2), y, z + range(-d / 2 + 1.2, d / 2 - 1.2)),
        q.identity(),
        s.set(r, range(1.4, 2), r)
      ))
    }
  }

  // ——— near band: chawls, shoulder to shoulder along the tracks ———
  const chawlTex = facade(rand, { cols: 12, rows: 4, kind: 'chawl' })
  const chawlSpecs: { x: number, z: number, w: number, h: number, d: number }[] = []
  for (let x = -130; x < 400;) {
    const w = range(16, 28)
    chawlSpecs.push({ x: x + w / 2, z: range(-40, -46), w, h: pick([10, 13, 13, 16]), d: range(9, 12) })
    x += w + range(1.5, 6)
    if (compact) x += 8
  }
  const chawls = band(chawlSpecs.length, chawlTex)
  chawlSpecs.forEach((b, i) => {
    place(chawls, i, b.x, b.z, b.w, b.h, b.d, pick(PAL.chawl))
    addTanks(b.x, b.h, b.z, b.w, b.d, 1 + Math.floor(rand() * 3))
    // AC units hung on the street face (+z), a few per floor
    const front = b.z + b.d / 2 + 0.3
    for (let k = 0; k < (compact ? 2 : 5); k++) {
      acs.push(new THREE.Matrix4().compose(v.set(b.x + range(-b.w / 2 + 1, b.w / 2 - 1), Math.floor(range(1, b.h / 3.2)) * 3.2 + 0.6, front), q.identity(), s.set(1, 1, 1)))
    }
  })

  // ——— middle band: 6–12 storey blocks ———
  const blockTex = facade(rand, { cols: 8, rows: 10, kind: 'block' })
  const blockN = compact ? 45 : 85
  const blocks = band(blockN, blockTex)
  for (let i = 0; i < blockN; i++) {
    const w = range(14, 24)
    const d = range(12, 18)
    const h = Math.round(range(6, 12)) * 3.1
    const x = range(-130, 400)
    const z = range(-56, -100)
    place(blocks, i, x, z, w, h, d, pick(['#e8e1d0', '#d8cdb8', '#c9d4cf', '#e3c9b8', '#d0c7b0']))
    addTanks(x, h, z, w, d, 1 + Math.floor(rand() * 2))
  }

  // ——— back band: towers, with a stepped crown on each ———
  const towerTex = facade(rand, { cols: 6, rows: 30, kind: 'tower' })
  const towerN = compact ? 22 : 40
  const towers = band(towerN * 2, towerTex)
  for (let i = 0; i < towerN; i++) {
    const w = range(16, 24)
    const d = range(16, 22)
    const h = range(60, 160)
    const x = range(-120, 390)
    const z = range(-110, LAYOUT.skyline.zFar)
    const col = pick(['#dfe3e6', '#cfd6dc', '#e6dccb', '#bfc9d1'])
    place(towers, i * 2, x, z, w, h, d, col)
    // crown: a narrower box set on top
    m4.compose(v.set(x, h, z), q.identity(), s.set(w * 0.62, range(5, 12), d * 0.62))
    towers.setMatrixAt(i * 2 + 1, m4)
    towers.setColorAt(i * 2 + 1, new THREE.Color(col).multiplyScalar(0.9))
  }

  // ——— roof clutter ———
  const tankMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0), toon('#1e1e22'), tanks.length)
  tanks.forEach((m, i) => tankMesh.setMatrixAt(i, m))
  scene.add(tankMesh)
  const acMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.6, 0.5), toon('#e6e3dc'), acs.length)
  acs.forEach((m, i) => acMesh.setMatrixAt(i, m))
  scene.add(acMesh)
  // a few rooftop hoardings and blue tarps on the near roofs
  const roofSigns = roofs.slice(0, chawlSpecs.length).filter(() => rand() < 0.18)
  const signMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.15).translate(0, 0.5, 0), toon('#ffffff'), roofSigns.length * 2)
  roofSigns.forEach((r, i) => {
    m4.compose(v.set(r.x, r.y + 0.6, r.z + r.d / 2 - 1), q.identity(), s.set(Math.min(8, r.w * 0.5), 3, 1))
    signMesh.setMatrixAt(i * 2, m4)
    signMesh.setColorAt(i * 2, new THREE.Color(pick([PAL.bestRed, PAL.signBlue, '#f4cf36', '#2f8a5a'])))
    // the tarp
    m4.compose(v.set(r.x - r.w * 0.25, r.y, r.z - 1), q.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.05, 0, 0)), s.set(4, 3, 1))
    signMesh.setMatrixAt(i * 2 + 1, m4)
    signMesh.setColorAt(i * 2 + 1, new THREE.Color('#3f74c8'))
  })
  scene.add(signMesh)

  // ——— the construction crane over a half-built tower ———
  const blinkers: THREE.MeshBasicMaterial[] = []
  {
    const steel = toon('#e0a020')
    const g = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.BoxGeometry(20, 48, 18).translate(0, 24, 0), toon('#9a958c'))
    g.add(shell)
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2, 70, 2).translate(0, 35, 0), steel)
    mast.position.set(12, 0, 0)
    const jib = new THREE.Mesh(new THREE.BoxGeometry(46, 1.6, 1.6), steel)
    jib.position.set(20, 70, 0)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 3), toon('#5a5650'))
    counter.position.set(-1, 69, 0)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), toon('#f2efe4'))
    cab.position.set(12, 67.5, 1.8)
    const red = glow('#ff3020', 3)
    blinkers.push(red)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), red)
    lamp.position.set(12, 71.5, 0)
    g.add(mast, jib, counter, cab, lamp)
    g.position.set(150, 0, -88)
    scene.add(g)
  }

  // ——— the Bandra-Worli Sea Link ———
  const deckLights: THREE.MeshBasicMaterial[] = []
  {
    const link = new THREE.Group()
    const concrete = toon('#d8d0bf')
    const deck = new THREE.Mesh(new THREE.BoxGeometry(900, 1.2, 9), concrete)
    deck.position.set(120, 11, 0)
    link.add(deck)
    const pierN = compact ? 18 : 36
    const piers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 11, 4).translate(0, 5.5, 0), concrete, pierN)
    for (let i = 0; i < pierN; i++) piers.setMatrixAt(i, m4.makeTranslation(-330 + i * (900 / pierN), -1, 0))
    link.add(piers)
    // inverted-Y towers: two legs leaning in to a single spire
    const pts: number[] = []
    for (const tx of [60, 260]) {
      const top = 62
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 46, 2.2), concrete)
        leg.position.set(tx, 11 + 21, side * 4.2)
        leg.rotation.x = side * 0.17
        link.add(leg)
      }
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 22, 6).translate(0, 11, 0), concrete)
      spire.position.set(tx, 52, 0)
      link.add(spire)
      const red = glow('#ff3020', 3)
      blinkers.push(red)
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), red)
      lamp.position.set(tx, top + 12.5, 0)
      link.add(lamp)
      // cable fans in the central plane, both ways along the deck
      for (let k = 1; k <= 14; k++) {
        for (const dir of [-1, 1]) pts.push(tx, top - k * 0.9, 0, tx + dir * k * 6, 11.6, 0)
      }
    }
    const cables = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf2ece0, transparent: true, opacity: 0.85 }))
    cables.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    link.add(cables)
    // deck lamps
    const lampN = compact ? 40 : 90
    const lampMat = glow('#ffcf7a', 1)
    deckLights.push(lampMat)
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 6, 4), lampMat, lampN)
    for (let i = 0; i < lampN; i++) lamps.setMatrixAt(i, m4.makeTranslation(-330 + i * (900 / lampN), 12.6, 4.4))
    link.add(lamps)
    link.position.z = LAYOUT.seaLinkZ
    scene.add(link)
  }

  // ——— the far shore across the bay: a low lit line on the horizon ———
  const farMat = toon('#3a3c4a', { emissive: 0xffffff, emissiveMap: facade(rand, { cols: 6, rows: 6, kind: 'block' }).emissive, emissiveIntensity: 0.6, fog: false })
  windowMats.push(farMat)
  const farN = compact ? 30 : 60
  const far = new THREE.InstancedMesh(box, farMat, farN)
  for (let i = 0; i < farN; i++) {
    m4.compose(v.set(-220 + i * (760 / farN) + range(-4, 4), 0, range(540, 580)), q.identity(), s.set(range(9, 14), range(8, 30), 10))
    far.setMatrixAt(i, m4)
  }
  scene.add(far)

  let mixNow = 0
  ctx.onMode((mix) => {
    mixNow = mix
    for (const m of windowMats) m.emissiveIntensity = 0.04 + 1.25 * mix
    for (const m of deckLights) m.color.set('#ffcf7a').multiplyScalar(0.6 + 2.2 * mix)
    farMat.color.set('#c9c2b0').lerp(new THREE.Color('#1c1d28'), mix)
  })

  ctx.onFrame(({ t }) => {
    // aviation lamps blink once a second, brighter at night
    const on = ctx.reduced || Math.floor(t * 1.2) % 2 === 0
    for (const m of blinkers) m.color.set('#ff3020').multiplyScalar(on ? 1.2 + 2.5 * mixNow : 0.3)
  })
}
