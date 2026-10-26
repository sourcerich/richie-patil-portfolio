/*
 * The contract every part of the 3D city is built against. scene.ts makes
 * one Ctx and hands it to each builder (env, city, ground, sea, taxi, train,
 * arch, hoardings, promenade, post); a builder adds its meshes to ctx.scene,
 * registers what changes with day/night (onMode) and what moves (onFrame),
 * and returns a small handle if the orchestrator needs one.
 */
import type * as THREE from 'three'

export interface WorldOptions {
  canvas: HTMLCanvasElement
  reduced: boolean
  compact: boolean
  stops: { en: string, mr: string }[]
  services: string[]
  projects: { slug: string, title: string, image: string }[]
  onProject: (slug: string) => void
  onTaxi: () => void
  onMailbox: () => void
}

export interface World {
  goTo: (index: number, instant?: boolean) => void
  setDark: (dark: boolean) => void
  setLook: (x: number, y: number) => void
  setLayout: (layout: 'left' | 'center' | 'bottom') => void
  resize: () => void
  start: () => void
  passTrain: () => void
}

export interface FrameInfo {
  /** Seconds since start, and since the last frame (capped at 0.05). */
  t: number
  dt: number
  /** 0 = day (golden hour), 1 = night; eased, so it passes through values in between. */
  mix: number
  /** Which stop the camera is heading to: 0 Start … 4 Contact. */
  stop: number
  /** Pointer lean, smoothed, each in -1…1. */
  look: { x: number, y: number }
  /** The pickable group under the pointer (has userData.pick), or null. */
  hover: THREE.Object3D | null
  camera: THREE.PerspectiveCamera
  /** The point the camera is looking at this frame (before pointer lean). */
  target: THREE.Vector3
  /** How fast the camera is travelling along the route, units per second. */
  speed: number
}

export interface Ctx {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  /** Phones and touch devices: halve counts, skip expensive passes. */
  compact: boolean
  reduced: boolean
  opts: WorldOptions
  /** Add clickable groups here, with userData.pick = 'taxi' | 'mailbox' | 'project:<slug>'. */
  pickables: THREE.Group
  /** A fresh seeded generator, so each part is stable from load to load. */
  rng: (seed: number) => () => number
  /** Called once at build and whenever the day/night mix changes. */
  onMode: (fn: (mix: number) => void) => void
  /** Called every frame before rendering. */
  onFrame: (fn: (f: FrameInfo) => void) => void
}

/*
 * Where everything sits. The camera poses in scene.ts frame these, so a part
 * may add detail around its anchor but must not move the anchor.
 * Axes: +x runs along the route, +z toward the sea, y up; 1 unit ≈ 1 m.
 */
export const LAYOUT = {
  stopsX: [0, 60, 120, 180, 240],
  road: { z: 2, width: 10 },
  kerbZ: 7.6,
  tracks: { near: -14.5, far: -20 },
  platform: { x0: 15, x1: 105, z: -9, depth: 7, height: 1.1 },
  taxi: { x: 4, z: 3.2, rotY: -0.55 },
  arch: { x: 120, z: -10 },
  hoardings: { cx: 180, cz: 29, radius: 21 },
  promenade: { x0: 200, x1: 300, wallZ: 46 },
  postbox: { x: 243.6, z: 19 },
  seaLinkZ: 150,
  skyline: { zNear: -36, zFar: -180 }
} as const

export const makeRng = (seed: number) => {
  let s = Math.max(1, Math.floor(seed) % 2147483647)
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
