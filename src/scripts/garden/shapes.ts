/*
 * The garden's shapes, bent out of flat grids so they have real curvature
 * for the light and the ink to catch: a petal that narrows to a claw at its
 * base, cups along its width, curls along its length and ruffles at the
 * rim; and a leaf folded along its midrib (which the outline pass inks as a
 * crease) with a drawn-out tip. Each grows along +y from its base at the
 * origin, its face toward +z. Vertex colours darken the base, so the toon
 * shading reads as a deep throat and a light rim.
 */
import * as THREE from 'three'

export interface PetalShape {
  len: number
  width: number
  /** how much the sides lift toward +z */
  cup: number
  /** how much the tip bends toward +z (negative bends back) */
  curl: number
  /** bumps along the rim */
  lobes: number
}

const shadeByLength = (geo: THREE.BufferGeometry, v: (i: number) => number, from: number) => {
  const pos = geo.attributes.position!
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const k = from + (1 - from) * Math.min(1, v(i) ** 0.7)
    colors.set([k, k, k], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

export const petalGeometry = ({ len, width, cup, curl, lobes }: PetalShape, seg = 10) => {
  const geo = new THREE.PlaneGeometry(1, 1, seg, seg)
  const pos = geo.attributes.position!
  const vs: number[] = []
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i)
    const v = pos.getY(i) + 0.5
    vs.push(v)
    // a narrow claw swelling to full width just past halfway, then a round
    // cap (a half ellipse), so the tip is a soft dome rather than a point
    const c = 0.55
    const cap = Math.max(0, (v - c) / (1 - c))
    let prof = v <= c ? 0.16 + 0.84 * Math.sin((v / c) * Math.PI / 2) : Math.sqrt(Math.max(0, 1 - cap * cap))
    // the rim ruffles gently into lobes
    prof *= 1 + 0.06 * Math.cos(u * Math.PI * 2 * lobes) * cap
    const x = u * width * prof
    const y = v * len
    const z = cup * (2 * u) ** 2 * width * 0.32 * (0.35 + v) + curl * v * v * len
    pos.setXYZ(i, x, y, z)
  }
  shadeByLength(geo, i => vs[i]!, 0.78)
  geo.computeVertexNormals()
  return geo
}

export const leafGeometry = (len: number, width: number, fold: number, curl: number, seg = 10) => {
  const geo = new THREE.PlaneGeometry(1, 1, 6, seg)
  const pos = geo.attributes.position!
  const vs: number[] = []
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i)
    const v = pos.getY(i) + 0.5
    vs.push(v)
    // a short stalk, swelling to the blade, drawn out to a point
    const prof = v < 0.08 ? 0.06 : Math.sin(((v - 0.08) / 0.92) ** 0.85 * Math.PI) ** 0.9
    const x = u * width * prof
    const y = v * len
    // folded along the midrib, and curling along its length
    const z = Math.abs(u) * width * prof * fold + curl * (v - 0.45) ** 2 * len
    pos.setXYZ(i, x, y, z)
  }
  shadeByLength(geo, i => vs[i]!, 0.88)
  geo.computeVertexNormals()
  return geo
}
