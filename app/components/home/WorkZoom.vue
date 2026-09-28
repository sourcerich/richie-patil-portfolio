<script setup lang="ts">
// A sticky grid of project stills that scales up to fill its stage while
// "The" and "Work" slide apart. Driven by useFolioMotion's data-zoom handler,
// which measures the stage itself, so the stage can be full-screen on
// landscape screens and a fixed-proportion box on portrait ones.
defineProps<{ images: string[], span: string }>()
</script>

<template>
  <section
    data-zoom
    data-chapter="The Work"
    class="zoom rule-top"
  >
    <div
      data-zoom-stage
      class="stage"
    >
      <div
        data-zoom-grid
        class="grid"
      >
        <img
          v-for="src in images.slice(0, 5)"
          :key="src"
          :src="src"
          alt=""
          loading="lazy"
        >
        <div class="span display tnum">
          {{ span }}
        </div>
      </div>
      <h2 class="display title">
        <span
          data-zoom-left
          class="left"
        >The</span>
        <span
          data-zoom-right
          class="right"
        >Work</span>
      </h2>
    </div>
  </section>
</template>

<style scoped>
.zoom {
  --stage-h: 100vh;
  height: calc(var(--stage-h) + 160vh);
  position: relative;
}
.stage {
  position: sticky;
  top: 0;
  height: var(--stage-h);
  overflow: hidden;
}
/* Track the visible viewport where supported (iOS toolbars). */
@supports (height: 100dvh) {
  .zoom { --stage-h: 100dvh; }
}
.grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  padding: 6px;
  background: var(--color-ink);
  transform: scale(.22);
  transform-origin: 50% 50%;
  will-change: transform;
}
.grid img {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: cover;
}
.span {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  font-size: clamp(20px, 4vw, 64px);
}
.title {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-size: clamp(64px, 13vw, 220px);
  line-height: 1;
  letter-spacing: -.02em;
}
.title span {
  position: absolute;
  top: 50%;
  margin-top: -.55em;
  white-space: nowrap;
  will-change: transform;
}
.left { right: 50%; }
.right {
  left: 50%;
  color: var(--color-accent);
}

/*
 * Portrait screens (phones, portrait tablets): instead of a full-screen
 * stage, the stage is exactly as tall as a 2 × 3 grid of 4:3 tiles, so the
 * stills keep their proportions. It sticks centred in the visible area below
 * the header; svh doesn't change as iOS toolbars show and hide, so nothing
 * jumps mid-scroll.
 */
@media (max-aspect-ratio: 1 / 1) {
  .zoom {
    --stage-h: calc(100vw * 1.125);
    height: calc(var(--stage-h) + 130svh);
  }
  .stage {
    top: max(var(--header-h), calc(var(--header-h) + (100svh - var(--header-h) - var(--stage-h)) / 2));
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
  }
  .span { font-size: clamp(16px, 5vw, 32px); }
  .title { font-size: clamp(44px, 14vw, 120px); }
}
</style>
