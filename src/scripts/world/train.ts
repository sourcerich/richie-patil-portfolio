/*
 * The About stop: a Western Railway local standing at the platform, and a
 * second one that runs past on the far track now and then (and whenever the
 * camera moves to another stop). The locals are cream with a maroon band,
 * run with their doorways open, commuters hanging out of them, barred
 * windows lit warm inside, a pantograph on the motor coach and a cab whose
 * board reads CHURCHGATE / चर्चगेट. Overhead: catenary masts and wires.
 * The platform has a sloped corrugated roof on steel columns, ceiling fans,
 * tube lights, the station board, an LED indicator, a clock, benches, a
 * tea stall and posters.
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, fx, glow, toon } from './style'
import { signMesh } from './textures'

type V3 = [number, number, number]

const L = 20
const W = 3.66
const FLOOR = 1.1
const ROOF = 3.85

const at = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))

/** Coloured parts merged into one non-indexed geometry with vertex colours: one draw per kit. */
const kit = () => {
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  return {
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
type Kit = ReturnType<typeof kit>
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (r: number, h: number, n = 6) => new THREE.CylinderGeometry(r, r, h, n)

/** A commuter, standing at origin facing +z: legs, torso, arms, head, hair. */
const person = (k: Kit, m: THREE.Matrix4, shirt: string, skin: string, lean = 0) => {
  const put = (g: THREE.BufferGeometry, col: string, p: V3, r: V3 = [0, 0, 0]) => k.add(g, col, m.clone().multiply(at(p, r)))
  put(box(0.16, 0.85, 0.18), '#2d2f3a', [-0.1, 0.43, 0])
  put(box(0.16, 0.85, 0.18), '#2d2f3a', [0.1, 0.43, 0])
  put(box(0.44, 0.62, 0.26), shirt, [0, 1.17, 0.05 * lean], [lean * 0.25, 0, 0])
  put(box(0.12, 0.6, 0.12), shirt, [-0.28, 1.2, 0.05], [0, 0, 0.15])
  put(box(0.12, 0.62, 0.12), shirt, [0.28, 1.5, 0], [0, 0, -2.6])
  put(new THREE.IcosahedronGeometry(0.14, 1), skin, [0, 1.66, 0.1 * lean])
  put(box(0.29, 0.1, 0.29), '#1d1a1a', [0, 1.79, 0.1 * lean])
}

/** The CHURCHGATE / चर्चगेट destination board. */
const boardTexture = () => {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#121014'
  g.fillRect(0, 0, 512, 128)
  g.fillStyle = '#ffb030'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '58px "Yatra One", Georgia, serif'
  g.fillText('CHURCHGATE', 256, 44, 490)
  g.font = '500 42px Eczar, "Noto Serif Devanagari", serif'
  g.fillText('चर्चगेट', 256, 98)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** An LED train indicator: next train, platform, time, in amber dots. */
const indicatorTexture = () => {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 96
  const g = c.getContext('2d')!
  g.fillStyle = '#0b0a0c'
  g.fillRect(0, 0, 512, 96)
  g.fillStyle = '#ff6a1f'
  g.font = '34px monospace'
  g.textBaseline = 'middle'
  g.fillText('23:12  CCG  F  12', 18, 30)
  g.fillText('23:15  BO   S   9', 18, 70)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Corrugated sheet, as stripes, for the platform roof. */
const corrugated = () => {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 8
  const g = c.getContext('2d')!
  for (let x = 0; x < 64; x += 8) {
    g.fillStyle = '#9da3a6'
    g.fillRect(x, 0, 4, 8)
    g.fillStyle = '#7a8084'
    g.fillRect(x + 4, 0, 4, 8)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const SHIRTS = ['#e8e2d4', '#7fa7d6', '#d65a4a', '#f0c94a', '#5aa36a', '#b07ad0', '#f2efe4']
const SKINS = ['#8a5a3c', '#a06a46', '#6e452e', '#b88257']

/**
 * One local: `n` coaches along +x from the origin, cab at the +x end,
 * standing on the rails (track centre z = 0, rail top y ≈ 0.54).
 */
const makeTrain = (n: number, rand: () => number, crowd: boolean) => {
  const body = kit()
  const lit = kit()
  const doorXs = [-6.6, 0, 6.6]
  for (let i = 0; i < n; i++) {
    const cx = i * (L + 0.5) + L / 2
    const T = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) => at([cx + p[0], p[1], p[2]], r, s)
    // shell, roof, bands
    body.add(box(L, ROOF - FLOOR, W), PAL.localCream, T([0, (FLOOR + ROOF) / 2, 0]))
    body.add(box(L - 0.2, 0.32, W - 0.3), '#6f6c66', T([0, ROOF + 0.16, 0]))
    body.add(box(L + 0.02, 0.5, W + 0.02), PAL.localMaroon, T([0, FLOOR + 0.25, 0]))
    body.add(box(L + 0.02, 0.14, W + 0.02), PAL.localMaroon, T([0, 2.05, 0]))
    body.add(box(L + 0.02, 0.14, W + 0.02), PAL.localMaroon, T([0, 3.3, 0]))
    // roof vents
    for (let v = -8; v <= 8; v += 4) body.add(box(0.8, 0.22, 1.2), '#55524c', T([v, ROOF + 0.42, 0]))
    // underframe, bogies and wheels
    body.add(box(L - 1, 0.5, W - 0.6), '#2a2829', T([0, 0.85, 0]))
    for (const bx of [-L / 2 + 3, L / 2 - 3]) {
      body.add(box(2.8, 0.45, 2.4), '#1e1d1f', T([bx, 0.7, 0]))
      for (const wx of [-0.9, 0.9]) for (const wz of [-0.72, 0.72]) body.add(cyl(0.46, 0.14, 10), '#151416', T([bx + wx, 0.5, wz], [Math.PI / 2, 0, 0]))
    }
    for (const side of [-1, 1]) {
      const fz = side * (W / 2 + 0.01)
      // open doorways: dark recess, grab pole, and a commuter or two leaning out
      for (const dx of doorXs) {
        body.add(box(1.3, 2.2, 0.06), '#2a2324', T([dx, 2.25, fz]))
        body.add(cyl(0.025, 2, 6), '#c9ced6', T([dx, 2.25, fz + side * 0.05]))
        if (crowd && rand() < 0.75) {
          const m = T([dx + (rand() - 0.5) * 0.4, FLOOR, side * (W / 2 + 0.15)], [0, side > 0 ? 0 : Math.PI, side * 0.12])
          person(body, m, SHIRTS[Math.floor(rand() * SHIRTS.length)]!, SKINS[Math.floor(rand() * SKINS.length)]!, 1)
        }
      }
      // windows between the doors: lit interior panes with bars over them
      for (let wx = -L / 2 + 1.2; wx < L / 2 - 1; wx += 1.25) {
        if (doorXs.some(d => Math.abs(wx - d) < 1.2)) continue
        lit.add(box(0.95, 0.75, 0.02), '#ffffff', T([wx, 2.7, fz]))
        for (let b = -0.25; b <= 0.26; b += 0.25) body.add(box(0.98, 0.04, 0.05), '#4a4a50', T([wx, 2.7 + b, fz + side * 0.02]))
      }
    }
    // pantograph on the first (motor) coach
    if (i === 0) {
      body.add(box(1.4, 0.2, 1.4), '#3a3a3e', T([0, ROOF + 0.42, 0]))
      body.add(box(0.06, 1.3, 0.06), '#3a3a3e', T([-0.35, ROOF + 1.1, 0], [0, 0, -0.55]))
      body.add(box(0.06, 1.3, 0.06), '#3a3a3e', T([0.35, ROOF + 1.1, 0], [0, 0, 0.55]))
      body.add(box(0.1, 0.06, 1.8), '#3a3a3e', T([0, ROOF + 1.65, 0]))
    }
  }
  // the cab at the +x end: a slightly raked nose with the windscreen
  const ex = n * (L + 0.5) - 0.5
  body.add(box(0.5, ROOF - FLOOR, W), PAL.localCream, at([ex + 0.25, (FLOOR + ROOF) / 2, 0]))
  body.add(box(0.06, 0.8, W - 0.8), '#20262e', at([ex + 0.52, 2.8, 0]))
  body.add(box(0.06, 0.5, W + 0.02), PAL.localMaroon, at([ex + 0.52, FLOOR + 0.25, 0]))

  const g = new THREE.Group()
  const mesh = new THREE.Mesh(body.build(), toon('#ffffff', { vertexColors: true }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  const windows = glow('#ffd488', 1)
  const panes = new THREE.Mesh(lit.build(), windows)
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: boardTexture(), toneMapped: false }))
  board.position.set(ex + 0.56, 3.45, 0)
  board.rotation.y = Math.PI / 2
  const headMat = glow('#fff2c4', 1.5)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), headMat)
  head.position.set(ex + 0.55, 1.75, 0)
  g.add(mesh, panes, board, head)
  return { g, windows, headMat }
}

export const buildTrain = (ctx: Ctx) => {
  const { scene, reduced, compact } = ctx
  const rand = ctx.rng(77)
  const coaches = compact ? 3 : 4

  const standing = makeTrain(coaches, rand, true)
  standing.g.position.set(18, 0, LAYOUT.tracks.near)
  scene.add(standing.g)
  const runner = makeTrain(coaches, rand, !compact)
  runner.g.position.set(-400, 0, LAYOUT.tracks.far)
  scene.add(runner.g)

  // ——— overhead equipment: masts between the tracks, contact and messenger wires ———
  {
    const k = kit()
    const midZ = (LAYOUT.tracks.near + LAYOUT.tracks.far) / 2
    for (let x = -80; x <= 320; x += 40) {
      k.add(box(0.3, 7.4, 0.3), '#5b6066', at([x, 3.7, midZ]))
      k.add(box(0.1, 0.1, 7.8), '#5b6066', at([x, 6.9, midZ]))
      for (const tz of [LAYOUT.tracks.near, LAYOUT.tracks.far]) k.add(box(0.06, 0.9, 0.06), '#5b6066', at([x, 6.4, tz]))
    }
    const mast = new THREE.Mesh(k.build(), toon('#ffffff', { vertexColors: true }))
    scene.add(mast)
    const pts: number[] = []
    for (const tz of [LAYOUT.tracks.near, LAYOUT.tracks.far]) {
      pts.push(-200, 5.95, tz, 440, 5.95, tz)
      pts.push(-200, 6.85, tz, 440, 6.85, tz)
    }
    const wires = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x2a2c33 }))
    wires.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    scene.add(wires)
  }

  // ——— the platform ———
  const p = LAYOUT.platform
  const cx = (p.x0 + p.x1) / 2
  const plat = kit()
  const edgeZ = p.z - p.depth / 2
  plat.add(box(p.x1 - p.x0, p.height, p.depth), '#b8b1a2', at([cx, p.height / 2, p.z]))
  plat.add(box(p.x1 - p.x0, 0.03, 0.3), PAL.kerbYellow, at([cx, p.height + 0.015, edgeZ + 0.45]))
  plat.add(box(p.x1 - p.x0, 0.03, 0.6), '#e2c64a', at([cx, p.height + 0.015, edgeZ + 1.0]))
  plat.add(box(p.x1 - p.x0, 0.12, 0.2), '#d9d2c4', at([cx, p.height - 0.06, edgeZ + 0.1]))
  // columns and roof trusses
  const colZ = -6.4
  for (let x = 22; x <= 98; x += 12) {
    // the About camera stands between 46 and 58: leave that bay open so the board and train show
    if (x === 58) continue
    plat.add(box(0.28, 5.2, 0.28), '#2f5d7a', at([x, p.height + 2.6, colZ]))
    plat.add(box(0.12, 0.12, 5.6), '#2f5d7a', at([x, 6.05, -8.8], [0.12, 0, 0]))
    // a poster on the column
    plat.add(box(0.03, 0.9, 0.6), SHIRTS[Math.floor(rand() * SHIRTS.length)]!, at([x - 0.16, 2.6, colZ]))
  }
  // benches between columns, a dustbin, the tea stall at the far end
  for (const x of [34, 70, 82]) {
    plat.add(box(1.8, 0.08, 0.45), '#7a4a2c', at([x, p.height + 0.45, -6.9]))
    plat.add(box(1.8, 0.4, 0.06), '#7a4a2c', at([x, p.height + 0.75, -6.7]))
    for (const lx of [-0.8, 0.8]) plat.add(box(0.06, 0.45, 0.4), '#2b2b30', at([x + lx, p.height + 0.22, -6.9]))
  }
  plat.add(cyl(0.25, 0.7, 10), '#2f8a4a', at([40, p.height + 0.35, -6.8]))
  plat.add(box(3, 1.1, 1.6), '#a0522d', at([97, p.height + 0.55, -7.2]))
  plat.add(box(3.4, 0.08, 2), '#c8202f', at([97, p.height + 2.3, -7.2], [0.1, 0, 0]))
  for (const lx of [-1.5, 1.5]) plat.add(box(0.06, 1.2, 0.06), '#3a3a3e', at([97 + lx, p.height + 1.7, -6.4]))
  plat.add(cyl(0.18, 0.4, 10), '#c9ced6', at([96.3, p.height + 1.3, -7.2]))
  // fans and tube-light fittings under the roof
  for (let x = 28; x <= 94; x += 12) {
    plat.add(cyl(0.03, 0.5, 4), '#3a3a3e', at([x, 5.55, -9.4]))
    plat.add(box(1.4, 0.03, 0.14), '#5a5a5e', at([x, 5.3, -9.4]))
    plat.add(box(0.14, 0.03, 1.4), '#5a5a5e', at([x, 5.3, -9.4]))
  }
  const platMesh = new THREE.Mesh(plat.build(), toon('#ffffff', { vertexColors: true }))
  platMesh.castShadow = true
  platMesh.receiveShadow = true
  scene.add(platMesh)

  // the sloped corrugated roof
  const sheet = corrugated()
  sheet.repeat.set((p.x1 - p.x0) / 1.5, 1)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(p.x1 - p.x0 - 4, 0.12, 6.4), toon('#ffffff', { map: sheet }))
  roof.position.set(cx, 6.3, -8.8)
  roof.rotation.x = 0.12
  roof.castShadow = true
  scene.add(roof)

  // tube lights
  const tubeMat = glow('#eaf4ff', 1)
  const tubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), tubeMat, 7)
  for (let i = 0; i < 7; i++) tubes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(34 + i * 12, 5.6, -10.4))
  scene.add(tubes)

  // the station board, an LED indicator and a clock, hung from the roof
  const sign = signMesh(ctx, 1)
  sign.position.set(60, 4.6, -11.2)
  scene.add(sign)
  const ind = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: indicatorTexture(), toneMapped: false }))
  ind.position.set(72, 4.4, -11.0)
  scene.add(ind)
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20).rotateX(Math.PI / 2), toon('#f2efe4'))
  clock.position.set(48, 4.7, -11.0)
  scene.add(clock)

  // one warm fill under the canopy
  const fill = new THREE.PointLight(0xffe2b0, 0, 40, 1.4)
  fill.position.set(60, 5.2, -9.5)
  scene.add(fill)
  // a cool wash on the platform floor from the tube lights
  const poolMat = new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(p.x1 - p.x0 - 8, 5).rotateX(-Math.PI / 2), poolMat)
  pool.position.set(cx, p.height + 0.03, p.z)
  scene.add(fx(pool))

  ctx.onMode((mix) => {
    for (const t of [standing, runner]) {
      t.windows.color.set('#ffd488').multiplyScalar(0.55 + 1.6 * mix)
      t.headMat.color.set('#fff2c4').multiplyScalar(0.8 + 2.2 * mix)
    }
    tubeMat.color.set('#eaf4ff').multiplyScalar(0.7 + 2.3 * mix)
    fill.intensity = 2 + 18 * mix
    poolMat.opacity = 0.08 * mix
  })

  let speed = 0
  let nextAmbient = 6
  let cameraX = 0
  const pass = () => {
    if (reduced) return
    runner.g.position.x = cameraX - 340
    speed = 70
  }

  ctx.onFrame(({ dt, camera }) => {
    cameraX = camera.position.x
    nextAmbient -= dt
    if (nextAmbient <= 0 && !reduced) {
      nextAmbient = 18 + rand() * 16
      pass()
    }
    if (speed) {
      runner.g.position.x += speed * dt
      if (runner.g.position.x > camera.position.x + 420) {
        speed = 0
        runner.g.position.x = -400
      }
    }
  })

  return { pass }
}
