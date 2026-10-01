<script setup lang="ts">
// A dot grid behind a dark band. It sits almost invisible until the pointer
// comes near, then the dots lean in toward it and warm to copper, like a small
// gravity well following the cursor. Fills its positioned parent and listens
// to pointer moves on that parent, so it never blocks clicks.
//
// Touch screens and reduced motion get the still grid only.
const canvas = ref<HTMLCanvasElement>()

const GAP = 30
const REACH = 170

let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let dpr = 1
let frame = 0
let visible = false
let interactive = false
// Pointer target, smoothed pointer, and how strongly the well pulls (0–1).
const target = { x: -9999, y: -9999, on: 0 }
const pointer = { x: -9999, y: -9999, pull: 0 }
let ink = '243, 242, 242'
let accent = '184, 106, 67'

let resize: ResizeObserver | undefined
let seen: IntersectionObserver | undefined
let host: HTMLElement | null = null

const rgb = (value: string) => {
  // Reads a hex colour from a CSS custom property as "r, g, b".
  const hex = value.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')
}

const draw = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  const { x: px, y: py, pull } = pointer
  for (let y = GAP / 2; y < height; y += GAP) {
    for (let x = GAP / 2; x < width; x += GAP) {
      const dx = px - x
      const dy = py - y
      const near = pull * Math.exp(-(dx * dx + dy * dy) / (2 * REACH * REACH))
      // Lean toward the pointer, most strongly close in.
      const nx = x + dx * near * 0.42
      const ny = y + dy * near * 0.42
      const alpha = 0.1 + near * 0.75
      ctx.fillStyle = near > 0.12 ? `rgba(${accent}, ${alpha})` : `rgba(${ink}, ${alpha})`
      ctx.beginPath()
      ctx.arc(nx, ny, 1 + near * 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const loop = () => {
  frame = 0
  pointer.x += (target.x - pointer.x) * 0.16
  pointer.y += (target.y - pointer.y) * 0.16
  pointer.pull += (target.on - pointer.pull) * 0.08
  draw()
  const settled = Math.abs(target.on - pointer.pull) < 0.002
    && Math.abs(target.x - pointer.x) < 0.3 && Math.abs(target.y - pointer.y) < 0.3
  // Keep animating only while something is still moving and on screen.
  if (visible && !settled) frame = requestAnimationFrame(loop)
}
const kick = () => {
  if (!frame && visible) frame = requestAnimationFrame(loop)
}

const fit = () => {
  const el = canvas.value
  if (!el || !host) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = host.clientWidth
  height = host.clientHeight
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  const css = getComputedStyle(document.documentElement)
  ink = rgb(css.getPropertyValue('--color-on-ink')) ?? ink
  accent = rgb(css.getPropertyValue('--color-accent')) ?? accent
  draw()
}

const onMove = (e: PointerEvent) => {
  if (!host || e.pointerType === 'touch') return
  const r = host.getBoundingClientRect()
  target.x = e.clientX - r.left
  target.y = e.clientY - r.top
  if (!target.on) {
    // Enter at the pointer rather than sweeping in from off-screen.
    pointer.x = target.x
    pointer.y = target.y
  }
  target.on = 1
  kick()
}
const onLeave = () => {
  target.on = 0
  kick()
}

// Dark mode changes the accent; redraw with the new colours.
let modeWatch: MutationObserver | undefined

onMounted(() => {
  host = canvas.value?.parentElement ?? null
  if (!host) return
  interactive = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize = new ResizeObserver(fit)
  resize.observe(host)
  seen = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    if (visible) kick()
  })
  seen.observe(host)
  modeWatch = new MutationObserver(fit)
  modeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })
  if (interactive) {
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
  }
})

onBeforeUnmount(() => {
  resize?.disconnect()
  seen?.disconnect()
  modeWatch?.disconnect()
  cancelAnimationFrame(frame)
  host?.removeEventListener('pointermove', onMove)
  host?.removeEventListener('pointerleave', onLeave)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="mesh"
    aria-hidden="true"
  />
</template>

<style scoped>
.mesh {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
