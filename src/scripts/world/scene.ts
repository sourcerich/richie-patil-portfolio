/*
 * The 3D Mumbai the Start page lives in. Everything is built from primitives
 * in code (no model files), one file per part of the city: env (sky, light,
 * weather), city (skyline, Sea Link), ground (road, tracks, street lamps),
 * sea, taxi (Start), train and platform (About), arch and lanterns
 * (Service), hoardings (Work), promenade and post box (Contact), and post
 * (how a frame reaches the screen). This file wires them together: the
 * camera that glides between the five stops, the day/night crossfade,
 * pointer picking and the render loop.
 *
 * The controller (stage.ts) owns the DOM; this file only knows about
 * three.js and exposes a small handle.
 */
import * as THREE from 'three'
import { makeRng, type Ctx, type FrameInfo, type World, type WorldOptions } from './context'
import { buildEnv } from './env'
import { buildCity } from './city'
import { buildGround } from './ground'
import { buildSea } from './sea'
import { buildTaxi } from './taxi'
import { buildTrain } from './train'
import { buildArch } from './arch'
import { buildHoardings } from './hoardings'
import { buildPromenade } from './promenade'
import { buildLife } from './life'
import { buildPost } from './post'

export type { World, WorldOptions }

interface Pose { pos: THREE.Vector3, look: THREE.Vector3 }
const pose = (p: [number, number, number], l: [number, number, number]): Pose => ({
  pos: new THREE.Vector3(...p),
  look: new THREE.Vector3(...l)
})
const POSES: Pose[] = [
  pose([-0.5, 1.6, 10], [2.2, 1.2, 3]),
  pose([51, 2.7, -6.3], [62, 2.6, -14.5]),
  pose([118, 5.5, 34], [120, 9, -6]),
  pose([180, 5.2, 30], [180, 5.4, 9]),
  pose([238, 6.6, 4], [246, 2.6, 66])
]

export const createWorld = (opts: WorldOptions): World => {
  const { canvas, compact, reduced } = opts
  // post.ts renders into its own multisampled target, so the canvas needs no antialiasing
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1200)
  camera.position.copy(POSES[0]!.pos)
  // Layer 1 holds effects that get no ink outline (see style.ts).
  camera.layers.enable(1)
  const pickables = new THREE.Group()
  scene.add(pickables)

  const modeFns: ((mix: number) => void)[] = []
  const frameFns: ((f: FrameInfo) => void)[] = []
  const ctx: Ctx = {
    scene,
    renderer,
    camera,
    compact,
    reduced,
    opts,
    pickables,
    rng: makeRng,
    onMode: fn => modeFns.push(fn),
    onFrame: fn => frameFns.push(fn)
  }

  buildEnv(ctx)
  buildCity(ctx)
  buildGround(ctx)
  buildSea(ctx)
  const taxi = buildTaxi(ctx)
  const trains = buildTrain(ctx)
  buildArch(ctx)
  buildHoardings(ctx)
  buildPromenade(ctx)
  buildLife(ctx)
  const post = buildPost(ctx)

  // ——— day / night ———
  let dark = document.documentElement.dataset.mode === 'dark'
  let mix = dark ? 1 : 0
  const applyMode = () => {
    for (const fn of modeFns) fn(mix)
  }
  applyMode()

  // ——— camera ———
  let stop = 0
  let layout: 'left' | 'center' | 'bottom' = 'left'
  const cur = { pos: POSES[0]!.pos.clone(), look: POSES[0]!.look.clone() }
  const want = { pos: POSES[0]!.pos.clone(), look: POSES[0]!.look.clone() }
  const look = { x: 0, y: 0, sx: 0, sy: 0 }
  let w = 1
  let h = 1

  const computeWant = () => {
    const p = POSES[stop]!
    const aspect = w / h
    // Portrait screens see less sideways: back the camera away from the subject.
    const k = aspect < 1.45 ? Math.min(2.6, 1.45 / aspect) : 1
    want.look.copy(p.look)
    want.pos.copy(p.pos).sub(p.look).multiplyScalar(k).add(p.look)
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    w = Math.max(1, Math.round(rect.width))
    h = Math.max(1, Math.round(rect.height))
    renderer.setSize(w, h, false)
    post.setSize(w, h)
    camera.aspect = w / h
    // Keep the subject clear of the text panel.
    const portrait = w / h < 1
    let ox = 0
    let oy = 0
    if (layout === 'left' && !portrait) ox = -w * 0.14
    if (portrait && layout !== 'center') oy = h * (layout === 'bottom' ? 0.16 : 0.2)
    else if (layout === 'bottom') oy = h * 0.1
    camera.setViewOffset(w, h, ox, oy, w, h)
    camera.fov = portrait ? 62 : 52
    camera.updateProjectionMatrix()
    computeWant()
  }

  // ——— picking ———
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let ptr: { x: number, y: number } | null = null
  let hover: THREE.Object3D | null = null
  const pickAt = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect()
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(pickables.children, true)[0]
    let o: THREE.Object3D | null = hit?.object ?? null
    while (o && !o.userData.pick) o = o.parent
    return o
  }
  canvas.addEventListener('pointermove', (e) => {
    ptr = { x: e.clientX, y: e.clientY }
  })
  canvas.addEventListener('pointerleave', () => {
    ptr = null
  })
  canvas.addEventListener('click', (e) => {
    const id = pickAt(e.clientX, e.clientY)?.userData.pick as string | undefined
    if (!id) return
    if (id === 'taxi') {
      taxi.honk()
      opts.onTaxi()
    } else if (id === 'mailbox') opts.onMailbox()
    else if (id.startsWith('project:')) opts.onProject(id.slice(8))
  })

  // ——— loop ———
  let last = 0
  let t = 0
  let running = false
  const target = new THREE.Vector3()
  const info: FrameInfo = { t: 0, dt: 0, mix, stop, look: { x: 0, y: 0 }, hover: null, camera, target, speed: 0 }
  const frame = () => {
    if (!running) return
    requestAnimationFrame(frame)
    const nowMs = performance.now()
    const dt = Math.min(0.05, (nowMs - last) / 1000)
    last = nowMs
    t += dt

    const goal = dark ? 1 : 0
    if (Math.abs(mix - goal) > 0.002) {
      mix += (goal - mix) * (1 - Math.exp(-dt * 3.2))
      applyMode()
    }

    // camera glide
    const ease = 1 - Math.exp(-dt * (reduced ? 20 : 2.6))
    const before = cur.pos.x
    cur.pos.lerp(want.pos, ease)
    cur.look.lerp(want.look, ease)
    const speed = Math.abs(cur.pos.x - before) / Math.max(dt, 0.001)
    look.sx += (look.x - look.sx) * (1 - Math.exp(-dt * 4))
    look.sy += (look.y - look.sy) * (1 - Math.exp(-dt * 4))
    const sway = reduced ? 0 : 1
    camera.position.copy(cur.pos)
    camera.position.x += look.sx * 1.6 + Math.sin(t * 0.35) * 0.18 * sway
    camera.position.y += look.sy * 0.8 + Math.sin(t * 0.5) * 0.08 * sway
    target.copy(cur.look)
    target.x += look.sx * 2
    target.y += look.sy * 1.1
    camera.lookAt(target)
    const fov = (w / h < 1 ? 62 : 52) + Math.min(9, speed * 0.06)
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * 0.2
      camera.updateProjectionMatrix()
    }

    // what's under the pointer (only where there is something to click)
    if (ptr && (stop === 0 || stop === 3 || stop === 4)) {
      const o = pickAt(ptr.x, ptr.y)
      if (o !== hover) {
        hover = o
        canvas.style.cursor = o ? 'pointer' : ''
      }
    } else if (hover) {
      hover = null
      canvas.style.cursor = ''
    }

    info.t = t
    info.dt = dt
    info.mix = mix
    info.stop = stop
    info.look.x = look.sx
    info.look.y = look.sy
    info.hover = hover
    info.speed = speed
    target.copy(cur.look)
    for (const fn of frameFns) fn(info)

    post.render()
  }

  return {
    goTo(index, instant) {
      stop = Math.max(0, Math.min(POSES.length - 1, index))
      computeWant()
      if (instant) {
        cur.pos.copy(want.pos)
        cur.look.copy(want.look)
      } else trains.pass()
    },
    setDark(v) {
      dark = v
    },
    setLook(x, y) {
      look.x = x
      look.y = y
    },
    setLayout(l) {
      layout = l
      resize()
    },
    resize,
    start() {
      if (running) return
      running = true
      resize()
      last = performance.now()
      requestAnimationFrame(frame)
    },
    passTrain: () => trains.pass()
  }
}
