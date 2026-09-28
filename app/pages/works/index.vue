<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())
const { data: projects } = await useProjects()

useSeoMeta({
  title: 'Works and Collaborations',
  ogTitle: 'Works and Collaborations – Richie Patil',
  description: page.value?.works.body,
  ogDescription: page.value?.works.body
})
</script>

<template>
  <section
    class="wrap works"
    data-chapter="Works and Collaborations"
  >
    <div class="head">
      <h1 class="display title">
        <span class="mask-line"><span
          data-reveal="100"
          data-from="102%"
        >Works<sup class="tnum">({{ String(projects.length).padStart(2, '0') }})</sup></span></span>
        <span class="mask-line subtitle"><span
          data-reveal="220"
          data-from="102%"
        >and Collaborations</span></span>
      </h1>
      <div
        v-if="page"
        data-reveal="200"
        class="intro"
      >
        <p class="intro-heading">
          {{ page.works.heading }}
        </p>
        <p class="intro-body">
          {{ page.works.body }}
        </p>
      </div>
    </div>
    <div class="grid">
      <div
        v-for="(project, i) in projects"
        :key="project.slug"
        :data-reveal="(i % 2) * 120"
        class="card"
      >
        <NuxtLink
          :to="`/works/${project.slug}`"
          :aria-label="project.title"
          class="plate frame"
        >
          <ProjectPlate
            :image="project.image"
            :title="project.title"
            :num="projectNumber(i)"
            :confidential="project.confidential"
            class="still"
          />
        </NuxtLink>
        <NuxtLink
          :to="`/works/${project.slug}`"
          class="card-title"
        >
          <span class="num tnum">{{ projectNumber(i) }}</span>
          <span class="display name">{{ project.title }}</span>
          <span class="year tnum">{{ project.year }}</span>
        </NuxtLink>
        <p class="summary">
          {{ project.summary }}
        </p>
        <div class="tags">
          <span
            v-for="tag in project.tags"
            :key="tag"
            class="tag tag-outline"
          >{{ tag }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.works { padding-block: clamp(56px, 8vw, 112px) var(--section-y); }
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-divider);
  padding-bottom: 32px;
  margin-bottom: 56px;
}
.title {
  font-size: clamp(72px, 13vw, 200px);
  line-height: .86;
  letter-spacing: -.02em;
}
.subtitle {
  font-size: .36em;
  line-height: 1.1;
  letter-spacing: -.01em;
  color: var(--color-accent);
}
.title sup {
  font-size: .2em;
  vertical-align: top;
  margin-left: .2em;
  color: var(--color-accent);
}
.intro {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 40ch;
}
.intro-heading {
  font-family: var(--font-heading);
  font-size: 26px;
  line-height: 1.2;
}
.intro-body {
  font-size: 15px;
  line-height: 1.65;
  color: color-mix(in srgb, var(--color-text) 78%, transparent);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 460px), 1fr));
  gap: 64px 48px;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.frame {
  display: block;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}
.still { transition: transform 1.1s var(--ease-out); }
.frame:hover .still { transform: scale(1.05); }
.card-title {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: baseline;
}
.num {
  font-size: 13px;
  color: var(--color-accent-700);
}
.name {
  font-size: 32px;
  line-height: 1.05;
}
.year {
  font-size: 13px;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.summary {
  font-size: 15px;
  line-height: 1.65;
  max-width: 52ch;
  color: color-mix(in srgb, var(--color-text) 78%, transparent);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Tablets: two columns rather than one column of oversized cards. */
@media (min-width: 700px) and (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 56px 28px;
  }
  .name { font-size: 26px; }
}
@media (max-width: 640px) {
  .head {
    padding-bottom: 28px;
    margin-bottom: 40px;
  }
  .intro-heading { font-size: 24px; }
  .grid { gap: 48px; }
  .card { gap: 14px; }
  .card-title { gap: 12px; }
  .name { font-size: 28px; }
}
</style>
