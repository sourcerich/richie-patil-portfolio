<script setup lang="ts">
import type { ProjectsCollectionItem } from '@nuxt/content'

defineProps<{ projects: ProjectsCollectionItem[], heading: string, note: string }>()

// A stack of stills follows the cursor over the list; the hovered project's
// still scales in on top of the others.
const preview = ref<HTMLElement>()
const hovered = ref(-1)
const stacking = reactive<Record<number, number>>({})
let top = 1

const onEnter = (i: number) => {
  stacking[i] = ++top
  hovered.value = i
}
const onMove = (e: MouseEvent) => {
  if (preview.value) preview.value.style.transform = `translate3d(${e.clientX + 28}px,${e.clientY - 130}px,0) rotate(-2deg)`
}
</script>

<template>
  <section data-chapter="Selected work">
    <div class="wrap section-pad">
      <div class="head">
        <h2
          data-reveal="0"
          class="display heading"
        >
          {{ heading }}
        </h2>
        <span
          data-reveal="100"
          class="eyebrow"
        >Selected work</span>
      </div>
      <ol
        class="list"
        @mousemove="onMove"
        @mouseleave="hovered = -1"
      >
        <li
          v-for="(project, i) in projects"
          :key="project.slug"
          :data-reveal="i * 70"
        >
          <NuxtLink
            :to="`/works/${project.slug}`"
            class="row"
            @mouseenter="onEnter(i)"
          >
            <span class="num tnum">{{ projectNumber(i) }}</span>
            <span class="display title">{{ project.title }}</span>
            <span class="meta tnum"><span>{{ project.type }}</span><span>{{ project.year }}</span></span>
          </NuxtLink>
        </li>
      </ol>
      <div
        data-reveal="0"
        class="foot"
      >
        <NuxtLink
          to="/works"
          class="btn btn-primary"
        >
          View all work →
        </NuxtLink>
        <span class="note">{{ note }}</span>
      </div>
    </div>
    <div
      ref="preview"
      class="preview"
      aria-hidden="true"
    >
      <template
        v-for="(project, i) in projects"
        :key="project.slug"
      >
        <img
          v-if="project.image"
          :src="project.image"
          alt=""
          class="plate"
          :style="{ transform: `scale(${hovered === i ? 1 : 0})`, zIndex: stacking[i] ?? 0 }"
        >
      </template>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}
.heading {
  font-size: clamp(36px, 4.4vw, 60px);
  line-height: 1.05;
  max-width: 18ch;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-divider);
}
.list li { border-bottom: 1px solid var(--color-divider); }
.row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 20px;
  align-items: baseline;
  padding: 26px 0;
  transition: padding .45s var(--ease-out), color .3s;
}
.row:hover {
  padding-left: 20px;
  color: var(--color-accent);
}
.num {
  font-size: 13px;
  color: var(--color-accent-text);
}
.title {
  font-size: clamp(28px, 4vw, 56px);
  line-height: 1.05;
}
.meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 40px;
}
.note {
  font-size: 13px;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.preview {
  position: fixed;
  left: 0;
  top: 0;
  width: 340px;
  aspect-ratio: 4 / 3;
  pointer-events: none;
  z-index: 40;
  will-change: transform;
}
.preview img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  box-shadow: var(--shadow-md);
  transition: transform .45s var(--ease-out);
}
@media (hover: none), (max-width: 767px) {
  .preview { display: none; }
  .meta { display: none; }
  .row { grid-template-columns: 36px minmax(0, 1fr); }
}
</style>
