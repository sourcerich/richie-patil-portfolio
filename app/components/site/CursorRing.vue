<script setup lang="ts">
// A thin copper ring with a dot that trails the pointer. Over a link or a
// button the ring grows and the dot fades, so it reads as "this is
// clickable". Mouse and pen only; touch screens and reduced motion keep the
// normal cursor and never render it.
const ring = ref<HTMLElement>()
const enabled = ref(false)
const active = ref(false)
const pressed = ref(false)
const shown = ref(false)

const target = { x: -100, y: -100 }
const pos = { x: -100, y: -100 }
let frame = 0

const loop = () => {
  pos.x += (target.x - pos.x) * 0.22
  pos.y += (target.y - pos.y) * 0.22
  if (ring.value) ring.value.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`
  frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.2 ? requestAnimationFrame(loop) : 0
}

const onMove = (e: PointerEvent) => {
  if (e.pointerType === 'touch') return
  target.x = e.clientX
  target.y = e.clientY
  if (!shown.value) {
    pos.x = target.x
    pos.y = target.y
    shown.value = true
  }
  const el = e.target as Element | null
  active.value = !!el?.closest('a, button, summary, [role="button"], label')
  if (!frame) frame = requestAnimationFrame(loop)
}

const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)
// Hide when the pointer leaves the window.
const onLeave = () => (shown.value = false)

onMounted(() => {
  enabled.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!enabled.value) return
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  document.documentElement.addEventListener('pointerleave', onLeave)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerdown', onDown)
  window.removeEventListener('pointerup', onUp)
  document.documentElement.removeEventListener('pointerleave', onLeave)
})
</script>

<template>
  <div
    v-if="enabled"
    ref="ring"
    class="cursor"
    :class="{ active, pressed, shown }"
    aria-hidden="true"
  >
    <span class="ring" />
  </div>
</template>

<style scoped>
.cursor {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 300;
  pointer-events: none;
  will-change: transform;
}
.ring {
  position: absolute;
  left: -25px;
  top: -25px;
  width: 50px;
  height: 50px;
  border: 1px solid var(--color-accent);
  border-radius: 50%;
  opacity: 0;
  transform: scale(.4);
  transition: transform .45s var(--ease-out), opacity .3s ease, background-color .3s ease;
}
.ring::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
  transition: opacity .3s ease;
}
.shown .ring {
  opacity: 1;
  transform: scale(1);
}
.active .ring {
  transform: scale(1.5);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}
.active .ring::after { opacity: 0; }
.pressed .ring { transform: scale(.8); }
</style>
