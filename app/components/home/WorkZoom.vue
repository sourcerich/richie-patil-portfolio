<script setup lang="ts">
// A sticky grid of project stills that scales up to fill the screen while
// "The" and "Work" slide apart. Driven by useFolioMotion's data-zoom handler.
defineProps<{ images: string[], span: string }>()
</script>

<template>
  <section
    data-zoom
    data-chapter="The Work"
    class="zoom rule-top"
  >
    <div class="stage">
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
  height: 260vh;
  position: relative;
}
.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
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
  will-change: transform;
}
.left { right: 50%; }
.right {
  left: 50%;
  color: var(--color-accent);
}
</style>
