<script setup lang="ts">
const emit = defineEmits<{ done: [] }>()
const { site } = useAppConfig()
const { tempo, holdRevealsFor } = useFolioMotion()

const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026']

const lifted = ref(false)
const stripIn = ref(false)
const rolled = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

onMounted(() => {
  const t = tempo()
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms * t))
  document.documentElement.style.overflow = 'hidden'
  holdRevealsFor(4100 * t)
  at(100, () => (stripIn.value = true))
  at(1000, () => (rolled.value = true))
  at(3900, () => (lifted.value = true))
  at(5000, () => emit('done'))
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <div
    class="intro ink-band"
    :class="{ lifted }"
    aria-hidden="true"
  >
    <div class="intro-meta">
      <span>Folio — Edition</span><span>{{ site.city }}</span>
    </div>
    <div class="intro-years display tnum">
      <div
        class="strip"
        :class="{ in: stripIn }"
      >
        <div
          class="roll"
          :class="{ rolled }"
        >
          <div
            v-for="year in YEARS"
            :key="year"
          >
            {{ year }}
          </div>
        </div>
      </div>
    </div>
    <div class="intro-foot">
      <span class="tagline">From first commit to production.</span>
      <div class="bar">
        <div :class="{ full: rolled }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(24px, 5vw, 72px);
  transition: transform 1.1s var(--ease-in-out);
}
.intro.lifted { transform: translateY(-100%); }
.intro-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-bg) 70%, transparent);
}
.intro-years {
  font-size: clamp(96px, 20vw, 300px);
  line-height: 1;
  height: 1em;
  overflow: hidden;
  letter-spacing: -.02em;
}
.roll > div { height: 1em; }
.strip {
  transform: translateY(102%);
  transition: transform 1.2s var(--ease-out);
}
.strip.in { transform: translateY(0); }
.roll { transition: transform 2.85s var(--ease-in-out); }
.roll.rolled { transform: translateY(-6em); }
.intro-foot {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.tagline {
  align-self: flex-end;
  font-family: var(--font-heading);
  font-size: clamp(20px, 2vw, 28px);
}
.bar {
  height: 6px;
  background: color-mix(in srgb, var(--color-bg) 12%, transparent);
}
.bar > div {
  height: 100%;
  width: 0;
  background: var(--color-accent);
  transition: width 2.85s var(--ease-in-out);
}
.bar > div.full { width: 100%; }
</style>
