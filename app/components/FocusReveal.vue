<script setup lang="ts">
// A headline whose words start soft and out of focus. When it scrolls into
// view, a camera-style focus frame travels from word to word, stretching to
// fit each one's measured box, and each word sharpens as the frame lands on
// it. Pass the headline as lines; each line breaks onto its own row.
//
// Without JS the words render sharp (the blur is gated on html.js), and with
// reduced motion they are sharp from the start.
const props = withDefaults(defineProps<{
  lines: string[]
  // Colour the last line in the accent, as the About headline does.
  accentLast?: boolean
  // Wait before the frame sets off, e.g. for the page wipe to lift.
  delay?: number
}>(), { accentLast: false, delay: 450 })

const root = ref<HTMLElement>()
const frame = ref<HTMLElement>()
const lit = ref(-1)
const done = ref(false)

const words = computed(() => {
  let n = 0
  return props.lines.map(line => line.split(/\s+/).filter(Boolean).map(text => ({ text, i: n++ })))
})
const total = computed(() => words.value.reduce((sum, line) => sum + line.length, 0))

const timers: ReturnType<typeof setTimeout>[] = []
let observer: IntersectionObserver | undefined

// Moves the frame onto word i, sized to the word plus a little breathing room.
const frameOn = (i: number, instant = false) => {
  const el = root.value?.querySelector<HTMLElement>(`[data-w="${i}"]`)
  const box = root.value?.getBoundingClientRect()
  if (!el || !box || !frame.value) return
  const r = el.getBoundingClientRect()
  const pad = Math.max(4, r.height * 0.08)
  const style = frame.value.style
  if (instant) style.transition = 'none'
  style.transform = `translate3d(${r.left - box.left - pad}px,${r.top - box.top - pad * 0.6}px,0)`
  style.width = `${r.width + pad * 2}px`
  style.height = `${r.height + pad * 1.2}px`
  if (instant) {
    void frame.value.offsetWidth
    style.removeProperty('transition')
  }
}

const play = () => {
  const n = total.value
  // About a quarter-second per word, but long headlines speed up so the
  // whole pass stays under ~2.4 seconds.
  const step = Math.min(260, 2400 / Math.max(n, 1))
  frame.value?.style.setProperty('--step', `${step}ms`)
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
  at(props.delay, () => {
    frameOn(0, true)
    root.value?.classList.add('framing')
  })
  for (let i = 0; i < n; i++) {
    at(props.delay + 60 + i * step, () => frameOn(i))
    at(props.delay + 60 + i * step + step * 0.6, () => (lit.value = i))
  }
  at(props.delay + 60 + n * step + 380, () => {
    root.value?.classList.remove('framing')
    done.value = true
  })
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done.value = true
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (!entries.some(e => e.isIntersecting)) return
    observer?.disconnect()
    play()
  }, { rootMargin: '0px 0px -12% 0px' })
  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  timers.forEach(clearTimeout)
})
</script>

<template>
  <span
    ref="root"
    class="focus-reveal"
    :class="{ done }"
  >
    <span
      v-for="(line, li) in words"
      :key="li"
      class="line"
      :class="{ accent: accentLast && li === words.length - 1 }"
    >
      <template
        v-for="(word, j) in line"
        :key="word.i"
      ><span
        class="w"
        :class="{ sharp: word.i <= lit }"
        :data-w="word.i"
      >{{ word.text }}</span>{{ j < line.length - 1 ? ' ' : '' }}</template>
    </span>
    <span
      ref="frame"
      class="frame"
      aria-hidden="true"
    ><i /><i /><i /><i /></span>
  </span>
</template>

<style scoped>
.focus-reveal {
  position: relative;
  display: block;
}
.line { display: block; }
.accent { color: var(--color-accent); }
.w {
  display: inline-block;
  transition: filter .5s var(--ease-out), opacity .5s var(--ease-out);
}
/* Out of focus until the frame reaches the word. Gated on html.js so the
   prerendered page reads normally without JS. */
html.js .focus-reveal:not(.done) .w:not(.sharp) {
  filter: blur(.08em);
  opacity: .32;
}

/* The focus frame: four corner brackets, no box. */
.frame {
  --step: 260ms;
  --arm: .2em;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  opacity: 0;
  transition:
    transform calc(var(--step) * .9) var(--ease-out),
    width calc(var(--step) * .9) var(--ease-out),
    height calc(var(--step) * .9) var(--ease-out),
    opacity .35s ease;
}
.framing .frame { opacity: 1; }
.frame i {
  position: absolute;
  width: var(--arm);
  height: var(--arm);
  border: 0 solid var(--color-accent);
}
.frame i:nth-child(1) { left: 0; top: 0; border-width: 2px 0 0 2px; }
.frame i:nth-child(2) { right: 0; top: 0; border-width: 2px 2px 0 0; }
.frame i:nth-child(3) { left: 0; bottom: 0; border-width: 0 0 2px 2px; }
.frame i:nth-child(4) { right: 0; bottom: 0; border-width: 0 2px 2px 0; }
</style>
