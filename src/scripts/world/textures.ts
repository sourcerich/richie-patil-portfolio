/*
 * Canvas textures shared across the city: the soft glow every lamp and
 * headlight uses, and the station signs (Yatra One for the English, Eczar
 * for the Marathi, so the Marathi stays Marathi). Parts keep their own
 * one-off textures in their own files.
 */
import * as THREE from 'three'
import type { Ctx } from './context'

let glow: THREE.CanvasTexture | null = null
/** A white radial falloff, for additive glows (sprites, halos, light pools). */
export const glowTexture = () => {
  if (glow) return glow
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  glow = new THREE.CanvasTexture(c)
  return glow
}

/** An additive glow sprite in the given colour, on the no-outline layer. */
export const glowSprite = (color: THREE.ColorRepresentation, scale = 5) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  s.scale.setScalar(scale)
  s.layers.set(1)
  return s
}

/** A yellow station board: English above, Marathi below. */
export const signTexture = (en: string, mr: string, w = 640, h = 190, bg = '#f2c21b', fg = '#14120d') => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = fg
  g.lineWidth = 6
  g.strokeRect(10, 10, w - 20, h - 20)
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${h * 0.4}px "Yatra One", Georgia, serif`
  g.fillText(en, w / 2, h * 0.36)
  g.font = `500 ${h * 0.3}px Eczar, "Noto Serif Devanagari", serif`
  g.fillText(mr, w / 2, h * 0.72)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** One line of yellow sign-painter text on a dark plate, shortened with … to fit. */
export const labelTexture = (text: string, w = 512, h = 96, bg = 'rgba(20,18,13,.85)', fg = '#f2c21b') => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${h * 0.46}px "Yatra One", Georgia, serif`
  let s = text
  while (g.measureText(s).width > w - 30 && s.length > 4) s = s.slice(0, -2)
  g.fillText(s === text ? s : `${s}…`, w / 2, h / 2)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** The station board for stop `i` as a plane facing +z (rotate it to face the camera). */
export const signMesh = (ctx: Ctx, i: number, w = 7, h = 2.07) => {
  const s = ctx.opts.stops[i]!
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: signTexture(s.en, s.mr), side: THREE.DoubleSide, fog: false })
  )
}
