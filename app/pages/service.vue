<script setup lang="ts">
const { data: page } = await useAsyncData('service', () => queryCollection('service').first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description
})
</script>

<template>
  <div v-if="page">
    <SitePageHead
      :ghost="page.ghost"
      :lines="[page.title]"
      :subtitle="page.subtitle"
    />

    <ol class="wrap section services">
      <li
        v-for="(item, i) in page.items"
        :key="item.title"
        class="service"
      >
        <div
          data-reveal="0"
          class="service-head"
        >
          <span class="num tnum">[{{ String(i + 1).padStart(2, '0') }}]</span>
          <h2 class="service-title">
            {{ item.title }}
          </h2>
        </div>
        <span
          class="ghost deva"
          lang="mr"
          aria-hidden="true"
        >{{ item.ghost }}</span>
        <div
          data-reveal="120"
          class="service-body"
        >
          <figure class="shot">
            <img
              :src="item.image"
              alt=""
              loading="lazy"
            >
          </figure>
          <p>{{ item.body }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.services {
  display: flex;
  flex-direction: column;
  gap: clamp(100px, 13vw, 180px);
}
.service {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 32px 64px;
  align-items: start;
}
.service-head {
  display: grid;
  grid-template-columns: minmax(80px, .45fr) 1fr;
  gap: 24px;
  align-items: baseline;
}
.num,
.service-title {
  font-size: clamp(30px, 3.2vw, 46px);
  font-weight: 400;
  letter-spacing: -.03em;
  line-height: 1.05;
  color: var(--color-accent);
  text-transform: uppercase;
}
.ghost {
  position: absolute;
  left: -.04em;
  bottom: -.1em;
  z-index: -1;
  font-size: clamp(90px, 12vw, 190px);
  line-height: 1;
  color: var(--color-ghost);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  transition: color .5s ease;
}
.service-body {
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.shot {
  aspect-ratio: 5 / 4;
  overflow: hidden;
}
.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.15);
  transition: transform 1.2s var(--ease-out);
}
.service:hover .shot img { transform: scale(1.04); }
.service-body p {
  font-size: 16px;
  line-height: 1.45;
  max-width: 44ch;
}

@media (max-width: 860px) {
  .service { grid-template-columns: 1fr; }
  .ghost {
    position: static;
    order: -1;
    margin-bottom: -.35em;
    font-size: clamp(72px, 22vw, 120px);
  }
}
</style>
