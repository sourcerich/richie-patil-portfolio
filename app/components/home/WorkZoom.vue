<script setup lang="ts">
// A sticky grid of project stills that scales up to fill its stage while
// "The" and "Work" slide apart. Driven by useFolioMotion's data-zoom handler,
// which measures the stage itself rather than the window. Portrait screens
// get each still's hand-made 4:5 crop where one exists.
type Still = { src: string, portrait?: string }

defineProps<{ stills: Still[], span: string }>()
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
        <picture
          v-for="still in stills.slice(0, 5)"
          :key="still.src"
        >
          <source
            v-if="still.portrait"
            media="(max-aspect-ratio: 1/1)"
            :srcset="still.portrait"
          >
          <img
            :src="still.src"
            alt=""
            loading="lazy"
          >
        </picture>
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
.grid picture {
  display: block;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
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
 * Portrait screens (phones, portrait tablets): the stage fills the visible
 * area below the header (dvh tracks iOS toolbars; svh is the fallback), so
 * there's no empty page around it. The grid is 2 × 3 and each tile shows the
 * still's 4:5 portrait crop, so tall cells don't slice through text. The
 * runway is in svh, so it doesn't shift as the toolbars move.
 */
@media (max-aspect-ratio: 1 / 1) {
  .zoom {
    --stage-h: calc(100svh - var(--header-h));
    height: calc(var(--stage-h) + 130svh);
  }
  @supports (height: 100dvh) {
    .zoom { --stage-h: calc(100dvh - var(--header-h)); }
  }
  .stage { top: var(--header-h); }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
  }
  /* Near-square tiles (short screens) trim the 4:5 crops top and bottom;
     favour the top, where the headlines sit. */
  .grid img { object-position: 50% 15%; }
  .span { font-size: clamp(16px, 5vw, 32px); }
  .title { font-size: clamp(44px, 14vw, 120px); }
}
</style>
