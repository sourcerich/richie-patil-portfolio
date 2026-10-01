<script setup lang="ts">
// A coverflow for case-study galleries. The current shot faces you; the ones
// either side turn further edge-on the further away they are, and the outer
// ones blur and fade, so the row reads as depth. Plain CSS 3D, no canvas.
// Arrow buttons, arrow keys, a swipe or a click on a side shot moves it.
type Shot = { src: string, alt: string }

const props = defineProps<{ shots: Shot[] }>()

const active = ref(0)
// Every shot in a gallery shares one shape; take it from the first image.
const ratio = ref(1.6)

const count = computed(() => props.shots.length)
const go = (i: number) => {
  active.value = Math.min(count.value - 1, Math.max(0, i))
}

const onLoad = (e: Event, i: number) => {
  const img = e.target as HTMLImageElement
  if (i === 0 && img.naturalWidth) ratio.value = img.naturalWidth / img.naturalHeight
}

// Each shot's place in the row, from its distance to the current one.
const place = (i: number) => {
  const d = i - active.value
  const a = Math.abs(d)
  const side = Math.sign(d)
  return {
    transform: `translateX(calc(${d} * var(--step))) translateZ(${-a * 300}px) rotateY(${-side * Math.min(a * 38, 76)}deg)`,
    opacity: a > 2 ? 0 : 1 - a * 0.22,
    filter: a >= 2 ? 'blur(3px)' : 'none',
    zIndex: 100 - a
  }
}

// Swipe: a horizontal drag of 40px or more moves one shot.
let startX = 0
let startY = 0
const onDown = (e: PointerEvent) => {
  startX = e.clientX
  startY = e.clientY
}
const onUp = (e: PointerEvent) => {
  const dx = e.clientX - startX
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - startY)) go(active.value + (dx < 0 ? 1 : -1))
}
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') go(active.value + 1)
  else if (e.key === 'ArrowLeft') go(active.value - 1)
  else return
  e.preventDefault()
}
</script>

<template>
  <div
    class="carousel"
    role="region"
    aria-roledescription="carousel"
    aria-label="Screenshots"
    tabindex="0"
    :style="{ '--ratio': ratio }"
    @keydown="onKey"
  >
    <div
      class="stage"
      @pointerdown="onDown"
      @pointerup="onUp"
    >
      <figure
        v-for="(shot, i) in shots"
        :key="shot.src"
        class="slide"
        :class="{ current: i === active }"
        :style="place(i)"
        :aria-hidden="i !== active"
        @click="go(i)"
      >
        <div class="plate">
          <img
            :src="shot.src"
            :alt="shot.alt"
            :loading="i < 2 ? 'eager' : 'lazy'"
            draggable="false"
            @load="onLoad($event, i)"
          >
        </div>
      </figure>
    </div>
    <div class="controls">
      <p
        class="caption"
        aria-live="polite"
      >
        <span class="tnum count">{{ projectNumber(active) }} / {{ projectNumber(count - 1) }}</span>
        <span>{{ shots[active]?.alt }}</span>
      </p>
      <div class="buttons">
        <button
          type="button"
          class="arrow"
          aria-label="Previous screenshot"
          :disabled="active === 0"
          @click="go(active - 1)"
        >
          ←
        </button>
        <button
          type="button"
          class="arrow"
          aria-label="Next screenshot"
          :disabled="active === count - 1"
          @click="go(active + 1)"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.carousel {
  --width: min(62%, 860px);
  --step: calc(var(--width) * .62);
  outline-offset: 8px;
}
.stage {
  position: relative;
  /* Tall enough for the current shot at --width and the given shape. */
  aspect-ratio: calc(100 / 62 * var(--ratio));
  max-height: 72vh;
  perspective: 1800px;
  touch-action: pan-y;
  user-select: none;
  overflow: hidden;
  /* Fade the far edges out rather than cutting them. */
  mask-image: linear-gradient(90deg, transparent, black 9%, black 91%, transparent);
}
.slide {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(50% - var(--width) / 2);
  width: var(--width);
  margin: auto 0;
  height: fit-content;
  cursor: pointer;
  transform-style: preserve-3d;
  transition:
    transform .8s var(--ease-out),
    opacity .6s var(--ease-out),
    filter .6s var(--ease-out);
}
.slide.current { cursor: default; }
.slide .plate { overflow: hidden; }
.slide img {
  width: 100%;
  height: auto;
  aspect-ratio: var(--ratio);
  object-fit: cover;
  pointer-events: none;
}
.controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-top: 20px;
}
.caption {
  display: flex;
  gap: 16px;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.count {
  flex: none;
  color: var(--color-accent-text);
}
.buttons {
  display: flex;
  gap: 8px;
  flex: none;
}
.arrow {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-divider);
  background: none;
  color: inherit;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  transition: border-color .3s, color .3s;
}
.arrow:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.arrow:disabled {
  opacity: .3;
  cursor: default;
}

@media (max-width: 767px) {
  .carousel {
    --width: 80%;
    --step: calc(var(--width) * .7);
  }
  .stage { aspect-ratio: calc(100 / 80 * var(--ratio)); }
  .caption { flex-direction: column; gap: 4px; }
}
@media (prefers-reduced-motion: reduce) {
  .slide { transition: none; }
}
</style>
