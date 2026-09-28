<script setup lang="ts">
// "The Work". On desktop, a sticky grid of project stills scales up to fill
// the screen while "The" and "Work" slide apart, driven by useFolioMotion's
// data-zoom handler. On phones and other portrait screens it is a plain
// section instead (heading, then a grid of 4:5 crops) with no sticky or
// scroll-linked motion; the handler stands down when the stage isn't sticky.
type Still = { src: string, portrait?: string }

defineProps<{ stills: Still[], span: string }>()

// Keep in sync with the "simple layout" media query in the styles below.
const SIMPLE_LAYOUT = '(max-width: 767px), (max-aspect-ratio: 1/1)'
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
            :media="SIMPLE_LAYOUT"
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
/* Track the visible viewport where supported. */
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
 * Simple layout for phones and portrait screens: an ordinary section with
 * the heading above an edge-to-edge 2 × 3 grid of the stills' 4:5 portrait
 * crops. Nothing sticks and nothing is tied to scroll position.
 */
@media (max-width: 767px), (max-aspect-ratio: 1 / 1) {
  .zoom {
    height: auto;
    padding-top: clamp(56px, 12vw, 96px);
  }
  .stage {
    position: static;
    height: auto;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .title {
    position: static;
    order: -1;
    padding-inline: var(--gutter);
    font-size: clamp(56px, 17vw, 120px);
    pointer-events: auto;
  }
  .title span {
    position: static;
    margin: 0;
    will-change: auto;
  }
  .title .left { margin-right: .22em; }
  .grid {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
    gap: 4px;
    padding: 4px;
    transform: none;
    will-change: auto;
  }
  .grid picture,
  .span { aspect-ratio: 4 / 5; }
  .span { font-size: clamp(16px, 5vw, 32px); }
}
</style>
