<script setup lang="ts">
// The opening of every inner page: the huge faded Marathi word behind, the
// English title in copper display caps on top of it, a small subtitle, a
// "Scroll" cue on the right, then a dashed rule.
const props = defineProps<{
  ghost: string
  // One entry per line of the title; each line is kept whole.
  lines: string[]
  subtitle: string
}>()

// The title is sized so its longest line fits the content width, capped at
// the usual display size. --fit is that line's width in em. Before fonts
// load (and in the prerendered HTML) it's estimated at .7em per character;
// once Kalnia is ready the real widths replace the estimate, since wide caps
// and "&" run well past the average.
const longest = computed(() => Math.max(...props.lines.map(line => line.length)))
const fit = ref(longest.value * 0.7)
const title = ref<HTMLElement>()

const measure = () => {
  const el = title.value
  if (!el) return
  const size = parseFloat(getComputedStyle(el).fontSize)
  const range = document.createRange()
  let widest = 0
  for (const line of el.querySelectorAll('.mask-line > span')) {
    range.selectNodeContents(line)
    widest = Math.max(widest, range.getBoundingClientRect().width)
  }
  // A hair of slack so sub-pixel rounding never wraps a line.
  if (widest && size) fit.value = widest / size + 0.04
}

onMounted(() => document.fonts.ready.then(measure))
watch(() => props.lines, () => nextTick(measure))
</script>

<template>
  <section class="wrap head">
    <span
      class="ghost deva"
      lang="mr"
      aria-hidden="true"
    >{{ ghost }}</span>
    <h1
      ref="title"
      class="display title"
      :style="{ '--fit': fit.toFixed(3) }"
    >
      <span
        v-for="(line, i) in lines"
        :key="line"
        class="mask-line"
      ><span
        :data-reveal="80 + i * 90"
        data-from="105%"
      >{{ line }}</span></span>
    </h1>
    <p
      :data-reveal="140 + lines.length * 90"
      class="subtitle"
    >
      {{ subtitle }}
    </p>
    <span
      class="scroll"
      aria-hidden="true"
    ><span>Scroll</span><span>Scroll</span></span>
  </section>
  <hr class="dashed">
</template>

<style scoped>
.head {
  position: relative;
  min-height: clamp(420px, calc(100svh - 140px), 760px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 60px 80px;
}
.ghost {
  position: absolute;
  right: var(--gutter);
  top: 6%;
  z-index: -1;
  font-size: clamp(110px, 17vw, 260px);
  line-height: 1;
  color: var(--color-ghost);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  transition: color .5s ease;
}
.title {
  font-size: min(clamp(52px, 9.4vw, 148px), calc((100vw - 2 * var(--gutter)) / var(--fit)));
}
.title .mask-line { white-space: nowrap; }
.subtitle {
  margin-top: 22px;
  font-size: 19px;
  color: var(--color-accent);
}
/* "Scroll" that rolls up on a loop. */
.scroll {
  position: absolute;
  right: var(--gutter);
  bottom: 30px;
  height: 1.25em;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-size: 15px;
  line-height: 1.25;
  color: var(--color-accent);
}
.scroll span { animation: roll 2.6s var(--ease-in-out) infinite; }
@keyframes roll {
  0%, 35% { transform: translateY(0); }
  65%, 100% { transform: translateY(-100%); }
}

@media (max-width: 640px) {
  .head {
    min-height: 0;
    padding-block: 72px 64px;
  }
  .ghost {
    top: 18px;
    right: auto;
    left: calc(var(--gutter) - .05em);
  }
  .scroll { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .scroll span { animation: none; }
}
</style>
