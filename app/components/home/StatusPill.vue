<script setup lang="ts">
// The hero's "Available for work" status. Hover it (or tap, or tab to it)
// and the pill grows into a small contact card. It is one surface whose width
// and height animate between two measured sizes, so the pill visibly becomes
// the card: the status line stays put as the card's first row and the rest
// unfolds from it, down and away from the page edge.
defineProps<{ status: string }>()
const { site } = useAppConfig()

const root = ref<HTMLElement>()
const pill = ref<HTMLElement>()
const inner = ref<HTMLElement>()
const open = ref(false)
const measured = ref(false)
const closedSize = ref({ w: 0, h: 0 })
const openSize = ref({ w: 0, h: 0 })

// Size and corner radius both come from measurements. The closed radius is
// half the pill's height, not a huge "fully round" value: animating from
// 999px would keep the growing box an oval for most of the transition and
// clip the content at its corners.
const OPEN_RADIUS = 14
const surfaceSize = computed(() => {
  if (!measured.value) return undefined
  const s = open.value ? openSize.value : closedSize.value
  const radius = open.value ? OPEN_RADIUS : closedSize.value.h / 2
  return { width: `${s.w}px`, height: `${s.h}px`, borderRadius: `${radius}px` }
})
// The wrapper holds the pill's space in the layout; the card floats over it.
const rootSize = computed(() => (measured.value
  ? { width: `${closedSize.value.w}px`, height: `${closedSize.value.h}px` }
  : undefined))

const measure = () => {
  if (!pill.value || !inner.value) return
  // The surface is border-box with a border, so add the border to the
  // content's size, and round up so sub-pixel widths never clip a glyph.
  const surface = inner.value.parentElement
  const css = surface ? getComputedStyle(surface) : null
  const bx = css ? parseFloat(css.borderLeftWidth) + parseFloat(css.borderRightWidth) : 0
  const by = css ? parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth) : 0
  const p = pill.value.getBoundingClientRect()
  const c = inner.value.getBoundingClientRect()
  closedSize.value = { w: Math.ceil(p.width) + bx, h: Math.ceil(p.height) + by }
  openSize.value = { w: Math.ceil(c.width) + bx, h: Math.ceil(c.height) + by }
  measured.value = true
}

let hoverable = false
let sizes: ResizeObserver | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

const show = () => {
  clearTimeout(closeTimer)
  open.value = true
}
// A short grace period so moving from the pill onto the card doesn't snap it shut.
const hide = (wait = 160) => {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => (open.value = false), wait)
}

const onEnter = () => hoverable && show()
const onLeave = () => hoverable && hide()
const onFocusOut = (e: FocusEvent) => {
  if (!root.value?.contains(e.relatedTarget as Node)) hide(0)
}
const onOutside = (e: PointerEvent) => {
  if (open.value && !root.value?.contains(e.target as Node)) hide(0)
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value) {
    hide(0)
    pill.value?.focus()
  }
})

onMounted(() => {
  hoverable = window.matchMedia('(hover: hover)').matches
  sizes = new ResizeObserver(measure)
  if (pill.value) sizes.observe(pill.value)
  if (inner.value) sizes.observe(inner.value)
  measure()
  document.addEventListener('pointerdown', onOutside)
})
onBeforeUnmount(() => {
  sizes?.disconnect()
  clearTimeout(closeTimer)
  document.removeEventListener('pointerdown', onOutside)
})
</script>

<template>
  <div
    ref="root"
    class="status-pill"
    :class="{ open, measured }"
    :style="rootSize"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusout="onFocusOut"
  >
    <div
      class="surface"
      :style="surfaceSize"
    >
      <div
        ref="inner"
        class="inner"
      >
        <button
          ref="pill"
          type="button"
          class="pill"
          aria-controls="status-card"
          :aria-expanded="open"
          @click="open ? hide(0) : show()"
        >
          <span class="dot" />{{ status }}
        </button>
        <div
          id="status-card"
          class="body"
          :inert="!open || undefined"
        >
          <span class="label">Write to</span>
          <a
            :href="`mailto:${site.email}`"
            class="email"
          >{{ site.email }}</a>
          <span class="label">Elsewhere</span>
          <div class="links">
            <a
              v-for="social in site.socials"
              :key="social.label"
              :href="social.to"
              target="_blank"
              rel="noopener"
            >{{ social.label }} ↗</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-pill {
  position: relative;
  z-index: 20;
}
.surface {
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  background: var(--color-bg);
  overflow: hidden;
  /* Closing: wait for the details to fade, then shrink back to the pill. */
  transition:
    width .45s var(--ease-in-out) .12s,
    height .45s var(--ease-in-out) .12s,
    border-radius .45s var(--ease-in-out) .12s,
    box-shadow .45s var(--ease-out) .12s,
    border-color .3s;
}
/* Once measured, the card floats from the pill's top-right corner. */
.measured .surface {
  position: absolute;
  top: 0;
  right: 0;
}
/* Opening: grow straight away. */
.open .surface {
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  box-shadow: var(--shadow-md);
  transition:
    width .5s var(--ease-out),
    height .5s var(--ease-out),
    border-radius .5s var(--ease-out),
    box-shadow .5s var(--ease-out),
    border-color .3s;
}
.inner {
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.measured .inner {
  position: absolute;
  top: 0;
  right: 0;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  min-height: 32px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 40%, transparent);
}
/* A slow ring that says "live" without blinking at you. */
.dot::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 1px solid var(--color-accent);
  animation: ping 2.6s var(--ease-out) infinite;
}
@keyframes ping {
  from { transform: scale(1); opacity: .8; }
  to { transform: scale(2.6); opacity: 0; }
}
.body {
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 20px 20px;
  text-transform: none;
  letter-spacing: normal;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity .15s ease, transform .2s ease;
}
/* Details fade in once the card is mostly open, so nothing shows through
   a half-grown box. */
.open .body {
  opacity: 1;
  transform: none;
  transition: opacity .3s ease .28s, transform .45s var(--ease-out) .28s;
}
/* Before JS measures it, keep the card out of the layout. */
.status-pill:not(.measured) .body { display: none; }
.label {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-text) 60%, transparent);
}
.email {
  font-family: var(--font-heading);
  font-size: 19px;
  line-height: 1.2;
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-underline-offset: 4px;
  overflow-wrap: anywhere;
}
.links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
}

/* Where the status sits at the left (very narrow phones), grow rightward. */
@media (max-width: 359px) {
  .measured .surface,
  .measured .inner {
    right: auto;
    left: 0;
  }
  .inner { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .dot::after { animation: none; }
  .surface, .body { transition: none; }
}
</style>
