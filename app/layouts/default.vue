<script setup lang="ts">
const route = useRoute()
const motion = useFolioMotion()

// The year-roll intro plays once, only when the visit starts on the home page.
// It is part of the prerendered home page (so it covers the first paint) and
// is dismissed on mount for visitors who prefer reduced motion.
const showIntro = ref(route.path === '/')

// The nav wraps onto a second row on narrow screens, so offset the page by
// the header's real height rather than a fixed value.
let headerObserver: ResizeObserver | undefined

onMounted(() => {
  if (!motion.motionScale()) showIntro.value = false
  const header = document.getElementById('site-header')
  motion.start({
    progress: document.getElementById('scroll-progress'),
    chapter: document.getElementById('header-chapter'),
    header
  })
  if (header) {
    headerObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
    })
    headerObserver.observe(header)
  }
})
onBeforeUnmount(() => {
  motion.stop()
  headerObserver?.disconnect()
})

watch(() => route.fullPath, async () => {
  await nextTick()
  motion.refresh()
  setTimeout(motion.refresh, 80)
  setTimeout(motion.refresh, 300)
})
</script>

<template>
  <div>
    <SiteIntro
      v-if="showIntro"
      @done="showIntro = false"
    />
    <div
      id="page-wipe"
      class="page-wipe ink-band"
      aria-hidden="true"
    >
      <span
        id="page-wipe-label"
        class="display"
      />
    </div>
    <div
      id="scroll-progress"
      class="scroll-progress"
    />
    <SiteHeader />
    <main>
      <slot />
      <SiteFooter />
    </main>
  </div>
</template>

<style scoped>
.page-wipe {
  position: fixed;
  inset: 0;
  z-index: 85;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: inset(100% 0 0 0);
  pointer-events: none;
}
.page-wipe span {
  font-size: clamp(48px, 8vw, 120px);
  letter-spacing: -.01em;
  text-align: center;
  padding-inline: var(--gutter);
}
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: var(--color-accent);
  z-index: 60;
}
main { padding-top: var(--header-h); }
</style>
