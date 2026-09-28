<script setup lang="ts">
const route = useRoute()
const { data: projects } = await useProjects()

const index = computed(() => projects.value.findIndex(p => p.slug === route.params.slug))
const project = computed(() => projects.value[index.value])
const next = computed(() => projects.value[(index.value + 1) % projects.value.length])

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const sections = computed(() => {
  if (!project.value) return []
  const { problem, build, outcome } = project.value
  return [['Problem', problem], ['Build', build], ['Outcome', outcome]]
    .map(([label, body], i) => ({ label, body, num: projectNumber(i) }))
})

useSeoMeta({
  title: () => project.value?.title,
  description: () => project.value?.summary,
  ogImage: () => project.value?.image
})
</script>

<template>
  <article
    v-if="project"
    class="wrap case"
    :data-chapter="project.title"
  >
    <NuxtLink
      data-reveal="0"
      to="/works"
      class="back"
    >
      ← All work
    </NuxtLink>
    <div
      data-reveal="80"
      class="eyebrow kicker tnum"
    >
      <span>{{ projectNumber(index) }}</span><span>—</span><span>{{ project.type }}</span>
    </div>
    <h1 class="display title mask-line">
      <span
        data-reveal="150"
        data-from="102%"
      >{{ project.title }}</span>
    </h1>
    <p
      data-reveal="250"
      class="summary"
    >
      {{ project.summary }}
    </p>
    <dl
      data-reveal="320"
      class="facts"
    >
      <div>
        <dt class="label">
          Year
        </dt>
        <dd class="tnum">
          {{ project.year }}
        </dd>
      </div>
      <div>
        <dt class="label">
          Discipline
        </dt>
        <dd>{{ project.type }}</dd>
      </div>
      <div class="wide">
        <dt class="label">
          Stack
        </dt>
        <dd>{{ project.tags.join(', ') }}</dd>
      </div>
    </dl>
    <figure
      data-reveal="0"
      data-wipe
      class="plate hero-still"
    >
      <ProjectPlate
        :image="project.image"
        :title="project.title"
        :num="projectNumber(index)"
        :confidential="project.confidential"
        :data-scale="project.image ? '' : undefined"
      />
    </figure>
    <div class="body">
      <div
        data-reveal="0"
        class="metric"
      >
        <span class="display tnum metric-value">{{ project.metric }}</span>
        <span class="label">{{ project.metricLabel }}</span>
        <a
          v-if="project.link"
          :href="project.link"
          target="_blank"
          rel="noopener"
          class="btn btn-primary live"
        >{{ project.linkLabel ?? 'Visit live site ↗' }}</a>
      </div>
      <div class="sections">
        <div
          v-for="(section, i) in sections"
          :key="section.label"
          :data-reveal="i * 80"
          class="section"
        >
          <h2 class="display section-title">
            <span class="tnum">{{ section.num }}</span>{{ section.label }}
          </h2>
          <p class="justify">
            {{ section.body }}
          </p>
        </div>
        <div
          data-reveal="0"
          class="tags"
        >
          <span
            v-for="tag in project.tags"
            :key="tag"
            class="tag tag-outline"
          >{{ tag }}</span>
        </div>
      </div>
    </div>
    <section
      v-if="project.gallery?.length"
      class="gallery"
    >
      <span
        data-reveal="0"
        class="eyebrow"
      >In the product</span>
      <div class="gallery-grid">
        <figure
          v-for="(shot, i) in project.gallery"
          :key="shot.src"
          :data-reveal="(i % 2) * 120"
          class="shot"
        >
          <div class="plate">
            <img
              :src="shot.src"
              :alt="shot.alt"
              loading="lazy"
            >
          </div>
          <figcaption>{{ shot.alt }}</figcaption>
        </figure>
      </div>
    </section>
    <NuxtLink
      v-if="next"
      data-reveal="0"
      :to="`/works/${next.slug}`"
      class="next"
    >
      <div class="next-title">
        <span class="eyebrow">Next project →</span>
        <span class="display next-name">{{ next.title }}</span>
      </div>
      <span class="next-summary">{{ next.summary }}</span>
    </NuxtLink>
  </article>
</template>

<style scoped>
.case { padding-block: clamp(40px, 6vw, 80px) var(--section-y); }
.back {
  display: inline-flex;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 40px;
}
.kicker {
  display: flex;
  gap: 16px;
  align-items: baseline;
  margin-bottom: 24px;
}
.title {
  font-size: clamp(48px, 8.4vw, 132px);
  line-height: .95;
  letter-spacing: -.02em;
  padding-bottom: .22em;
}
.summary {
  margin-top: 32px;
  font-family: var(--font-heading);
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.25;
  max-width: 34ch;
}
.facts {
  margin: 56px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  border-top: 1px solid var(--color-divider);
  border-bottom: 1px solid var(--color-divider);
}
.facts > div {
  padding: 20px 20px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.facts .wide { grid-column: span 2; }
.facts dd { font-size: 15px; }
.hero-still {
  overflow: hidden;
  aspect-ratio: 16 / 9;
}
.body {
  margin-top: clamp(56px, 8vw, 104px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 40px 64px;
  align-items: start;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 1px solid var(--color-accent);
  padding-left: 20px;
}
.metric-value {
  font-size: clamp(48px, 5vw, 72px);
  line-height: 1;
  color: var(--color-accent);
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}
.live {
  align-self: flex-start;
  margin-top: 16px;
}
.sections {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
}
.section {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
  gap: 16px 40px;
  padding: 28px 0;
  border-top: 1px solid var(--color-divider);
}
.section-title {
  font-size: 28px;
  line-height: 1.1;
  display: flex;
  gap: 12px;
  align-items: baseline;
}
.section-title .tnum {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-accent-700);
}
.section p {
  font-size: 17px;
  line-height: 1.75;
  max-width: 62ch;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 24px;
  border-top: 1px solid var(--color-divider);
}
.gallery {
  margin-top: clamp(56px, 8vw, 104px);
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
  gap: 48px 40px;
}
.shot {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shot .plate { overflow: hidden; }
.shot img {
  width: 100%;
  height: auto;
}
.shot figcaption {
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.next {
  margin-top: clamp(56px, 8vw, 104px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 32px;
  align-items: center;
  border-top: 1px solid var(--color-divider);
  padding-top: 48px;
}
.next-title {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.next-name {
  font-size: clamp(36px, 5.4vw, 80px);
  line-height: 1;
}
.next-summary {
  font-size: 15px;
  justify-self: end;
  max-width: 40ch;
  line-height: 1.6;
  color: color-mix(in srgb, var(--color-text) 78%, transparent);
}
@media (max-width: 767px) {
  .sections { grid-column: auto; }
  .facts .wide { grid-column: auto; }
  .section { grid-template-columns: 1fr; }
}
</style>
