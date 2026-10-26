/*
 * The Contact stop: Marine Drive along the sea wall. A wide concrete parapet
 * with its sitting step, the Queen's Necklace (ornamental twin-globe lamps in
 * a long row, with pools of light on the paving at night), benches facing
 * the sea, twin wet/dry bins, a kaali-peeli railing along the kerb, the
 * station board, and an Indian red pillar box you can click to write.
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, fx, glow, toon } from './style'
import { glowTexture, signMesh } from './textures'

type V3 = [number, number, number]

/** The Contact camera (scene.ts): the post box turns its slot and plate to face it. */
const CAMERA = { x: 238, z: 5 }
const IRON = '#2a2c31'
const GOLD = '#c9a548'
const WOOD = '#9b6a3e'

const at = (p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (top: number, bottom: number, h: number, seg = 10) => new THREE.CylinderGeometry(top, bottom, h, seg)

/** Collects coloured parts into one non-indexed geometry, so a whole set of objects is one draw call. */
const kit = () => {
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  const base = new THREE.Matrix4()
  const tmp = new THREE.Matrix4()
  return {
    /** Every part added after this is moved by `m` too (identity to stop). */
    place(m: THREE.Matrix4) {
      base.copy(m)
    },
    add(src: THREE.BufferGeometry, color: THREE.ColorRepresentation, m?: THREE.Matrix4) {
      const g = src.index ? src.toNonIndexed() : src
      g.applyMatrix4(m ? tmp.multiplyMatrices(base, m) : base)
      const p = g.getAttribute('position')
      const n = g.getAttribute('normal')
      c.set(color)
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i))
        nor.push(n.getX(i), n.getY(i), n.getZ(i))
        col.push(c.r, c.g, c.b)
      }
      g.dispose()
      src.dispose()
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

/** A Queen's Necklace lamp, 7.5 m: plinth, fluted iron base, gilt collars, a crossbar with braces and two globe cups. */
const addLamp = (k: Kit) => {
  k.add(box(0.62, 0.3, 0.62), '#b9b1a0', at([0, 0.15, 0]))
  k.add(cyl(0.17, 0.24, 1.1, 8), IRON, at([0, 0.85, 0]))
  k.add(cyl(0.25, 0.25, 0.08, 8), GOLD, at([0, 1.44, 0]))
  k.add(cyl(0.075, 0.11, 5.6, 8), IRON, at([0, 4.28, 0]))
  k.add(cyl(0.14, 0.14, 0.1, 8), GOLD, at([0, 4.4, 0]))
  k.add(box(1.7, 0.09, 0.09), IRON, at([0, 7.05, 0]))
  for (const side of [-1, 1]) {
    k.add(box(0.82, 0.06, 0.06), IRON, at([side * 0.35, 6.81, 0], [0, 0, side * 0.54]))
    k.add(cyl(0.15, 0.09, 0.12, 8), GOLD, at([side * 0.78, 7.15, 0]))
  }
  k.add(cyl(0.12, 0.09, 0.16, 8), IRON, at([0, 7.16, 0]))
  k.add(new THREE.ConeGeometry(0.08, 0.36, 6), GOLD, at([0, 7.42, 0]))
}

/** A park bench facing +z (the sea): iron ends, teak slats, a slightly raked back. */
const addBench = (k: Kit) => {
  for (const sx of [-0.8, 0.8]) {
    k.add(box(0.07, 0.45, 0.5), IRON, at([sx, 0.225, 0]))
    k.add(box(0.07, 0.5, 0.07), IRON, at([sx, 0.7, -0.25], [-0.12, 0, 0]))
    k.add(box(0.07, 0.04, 0.48), IRON, at([sx, 0.66, -0.01]))
  }
  for (const z of [-0.17, 0, 0.17]) k.add(box(1.9, 0.04, 0.14), WOOD, at([0, 0.47, z]))
  for (const y of [0.66, 0.86]) k.add(box(1.9, 0.12, 0.035), WOOD, at([0, y, -0.28 - (y - 0.66) * 0.12]))
}

/** BMC twin bins on an iron frame: green for wet, blue for dry, labels toward the walkway (-z). */
const addBins = (k: Kit) => {
  for (const sx of [-0.6, 0.6]) k.add(box(0.07, 1.05, 0.07), IRON, at([sx, 0.525, 0]))
  k.add(box(1.27, 0.06, 0.06), IRON, at([0, 1, 0]))
  const bins = [{ x: -0.28, body: '#2f8a4a', lid: '#1f5f33' }, { x: 0.28, body: '#2f6fb3', lid: '#1f4c7d' }]
  for (const b of bins) {
    k.add(cyl(0.24, 0.2, 0.55, 12), b.body, at([b.x, 0.62, 0]))
    k.add(cyl(0.255, 0.255, 0.05, 12), b.lid, at([b.x, 0.92, 0]))
    k.add(box(0.03, 0.08, 0.03), IRON, at([b.x, 0.97, 0]))
    k.add(box(0.2, 0.13, 0.02), '#f2efe4', at([b.x, 0.68, -0.225]))
  }
}

/**
 * An Indian pillar box, true to size (1.8 m): black flared base, red drum
 * with a door panel, a rim and domed cap with a knob, a hooded mail slot
 * and a plate, all facing local +z.
 */
const pillarGeometry = () => {
  const k = kit()
  const RED = PAL.bestRed
  const RED_DARK = '#9e1a1f'
  const BLACK = '#1d1c20'
  k.add(box(0.95, 0.12, 0.95), '#a8a092', at([0, 0.06, 0]))
  k.add(cyl(0.4, 0.44, 0.22, 24), BLACK, at([0, 0.23, 0]))
  k.add(cyl(0.355, 0.4, 0.06, 24), BLACK, at([0, 0.37, 0]))
  k.add(cyl(0.34, 0.34, 1, 24), RED, at([0, 0.9, 0]))
  // the door: a raised curved panel on the front of the drum
  k.add(new THREE.CylinderGeometry(0.352, 0.352, 0.62, 8, 1, false, -0.45, 0.9), RED_DARK, at([0, 0.8, 0]))
  k.add(cyl(0.385, 0.36, 0.07, 24), RED, at([0, 1.435, 0]))
  k.add(new THREE.SphereGeometry(0.37, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), RED, at([0, 1.47, 0], [0, 0, 0], [1, 0.62, 1]))
  k.add(cyl(0.035, 0.055, 0.07, 8), RED, at([0, 1.72, 0]))
  k.add(new THREE.SphereGeometry(0.055, 8, 6), RED, at([0, 1.78, 0]))
  // mail slot under a hood
  k.add(box(0.3, 0.05, 0.062), BLACK, at([0, 1.27, 0.321]))
  k.add(box(0.38, 0.04, 0.135), RED, at([0, 1.315, 0.3375]))
  // backing for the plate
  k.add(box(0.32, 0.21, 0.07), RED_DARK, at([0, 0.93, 0.335]))
  return k.build()
}

/** The little enamel plate on the pillar box: POST, and टपाल under it. */
const plateTexture = () => {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 160
  const g = c.getContext('2d')!
  g.fillStyle = '#efe6cc'
  g.fillRect(0, 0, 256, 160)
  g.strokeStyle = '#7a1712'
  g.lineWidth = 8
  g.strokeRect(8, 8, 240, 144)
  g.fillStyle = '#7a1712'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '64px "Yatra One", Georgia, serif'
  g.fillText('POST', 128, 60)
  g.font = '500 44px Eczar, "Noto Serif Devanagari", serif'
  g.fillText('टपाल', 128, 118)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export const buildPromenade = (ctx: Ctx) => {
  const { scene, compact } = ctx
  const rand = ctx.rng(4646)
  const { x0, x1, wallZ } = LAYOUT.promenade
  const paint = toon('#ffffff', { vertexColors: true })
  const m = new THREE.Matrix4()
  const v = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()

  // Everything static and opaque on the promenade (parapet, lamp posts,
  // benches, bins, railing, the board's frame) shares one material, so it
  // goes into one mesh: one draw call.
  const street = kit()
  const identity = new THREE.Matrix4()

  // ——— the parapet: a wide coping in slabs over the wall, with a sitting step ———
  // It runs past both ends of the promenade so its ends never show from the Contact camera,
  // and down into the water so the sea meets a face, not a gap.
  const wx0 = x0 - 14
  const wx1 = x1 + 14
  const wcx = (wx0 + wx1) / 2
  street.add(box(wx1 - wx0, 2.25, 1.6), '#a9a291', at([wcx, -0.075, wallZ]))
  street.add(box(wx1 - wx0, 0.42, 0.75), '#b8b09e', at([wcx, 0.21, wallZ - 1.175]))
  const slab = new THREE.Color()
  for (let x = wx0; x < wx1 - 1; x += 4) {
    street.add(box(3.94, 0.17, 2), slab.set(PAL.concrete).multiplyScalar(0.93 + rand() * 0.1), at([x + 2, 1.135, wallZ]))
  }

  // ——— the Queen's Necklace ———
  // Spaced so that, from the Contact camera, no pole stands in the moon's
  // glitter path or rises straight out of the post box.
  const lampXs: number[] = []
  for (let k = -7; k <= 11; k++) if (!compact || k % 2 === 0) lampXs.push(240.9 + k * 5.5)
  const lampZ = wallZ - 2.4
  const globeMat = glow('#ffd59a', 2.8)
  const globeNight = globeMat.color.clone()
  const globeDay = new THREE.Color('#d9d3c4')
  const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.27, 12, 8), globeMat, lampXs.length * 2)
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ffb35a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolMat, lampXs.length)
  const haloPos: number[] = []
  lampXs.forEach((x, i) => {
    street.place(m.makeTranslation(x, 0, lampZ))
    addLamp(street)
    for (const side of [0, 1]) {
      const gx = x + (side ? 0.78 : -0.78)
      globes.setMatrixAt(i * 2 + side, m.makeTranslation(gx, 7.45, lampZ))
      haloPos.push(gx, 7.45, lampZ)
    }
    // A long pool on the paving, tucked under the sitting step on the sea side.
    pools.setMatrixAt(i, m.compose(v.set(x, 0.06, lampZ - 1.3), q, s.set(11, 1, 6.5)))
  })
  const haloGeo = new THREE.BufferGeometry()
  haloGeo.setAttribute('position', new THREE.Float32BufferAttribute(haloPos, 3))
  const haloMat = new THREE.PointsMaterial({ map: glowTexture(), color: '#ffc46e', size: 3.4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  scene.add(fx(globes), fx(new THREE.Points(haloGeo, haloMat)), fx(pools))

  // ——— benches facing the sea, and twin bins by the lamps ———
  const benchXs = compact ? [221.65, 249.15, 282.15] : [210.65, 221.65, 232.65, 249.15, 265.65, 282.15, 293.15]
  for (const x of benchXs) {
    street.place(m.makeTranslation(x, 0, wallZ - 5))
    addBench(street)
  }
  for (const x of compact ? [235.4, 279.4] : [213.4, 235.4, 257.4, 279.4]) {
    street.place(m.makeTranslation(x + 1.1, 0, wallZ - 3))
    addBins(street)
  }
  street.place(identity)

  // ——— kaali-peeli railing along the kerb, open where the path leads to the post box ———
  const seg = compact ? 3.6 : 2.4
  const railZ = LAYOUT.kerbZ + 1.1
  let n = 0
  for (let x = x0 - 6; x < x1 + 6; x += seg, n++) {
    const mid = x + seg / 2
    if (mid > 233 && mid < 245) continue
    const color = n % 2 ? PAL.kerbBlack : PAL.kerbYellow
    for (const px of [x, x + seg]) street.add(box(0.06, 0.95, 0.06), PAL.kerbBlack, at([px, 0.475, railZ]))
    street.add(box(seg, 0.06, 0.06), color, at([mid, 0.92, railZ]))
    street.add(box(seg, 0.05, 0.05), color, at([mid, 0.5, railZ]))
  }

  // ——— the post box ———
  const pillar = new THREE.Group()
  const body = new THREE.Mesh(pillarGeometry(), paint)
  body.castShadow = true
  body.receiveShadow = true
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), toon('#ffffff', { map: plateTexture() }))
  plate.position.set(0, 0.93, 0.372)
  pillar.add(body, plate)
  pillar.position.set(LAYOUT.postbox.x, 0, LAYOUT.postbox.z)
  pillar.rotation.y = Math.atan2(CAMERA.x - LAYOUT.postbox.x, CAMERA.z - LAYOUT.postbox.z)
  pillar.userData.pick = 'mailbox'
  ctx.pickables.add(pillar)

  // ——— the station board on two posts, beside the box ———
  const sx = LAYOUT.postbox.x + 5.4
  const sz = LAYOUT.postbox.z
  const sign = signMesh(ctx, 4, 6, 1.8)
  sign.position.set(sx, 4.4, sz)
  sign.rotation.y = Math.PI
  scene.add(sign)
  street.add(box(6.24, 2.04, 0.08), IRON, at([sx, 4.4, sz + 0.05]))
  for (const side of [-1, 1]) {
    const px = sx + side * 2.65
    street.add(cyl(0.065, 0.075, 5.3, 8), IRON, at([px, 2.65, sz + 0.13]))
    for (let b = 0; b < 4; b++) street.add(cyl(0.08, 0.08, 0.25, 8), b % 2 ? PAL.kerbBlack : PAL.kerbYellow, at([px, 0.125 + b * 0.25, sz + 0.13]))
  }

  const streetMesh = new THREE.Mesh(street.build(), paint)
  streetMesh.receiveShadow = true
  scene.add(streetMesh)

  // The one real light here: warm on the post box.
  const light = new THREE.PointLight(0xffb070, 0, 16, 1.6)
  light.position.set(LAYOUT.postbox.x, 4, LAYOUT.postbox.z - 3)
  scene.add(light)

  ctx.onMode((mix) => {
    const lamp = 0.25 + (1.6 - 0.25) * mix
    globeMat.color.copy(globeDay).lerp(globeNight, mix)
    haloMat.opacity = 0.9 * mix
    poolMat.opacity = 0.5 * mix
    light.intensity = 10 + lamp * 30
  })
}
