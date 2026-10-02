<script setup lang="ts">
// Every project on one page, the way the reference lists its work: title,
// what it was, a Year / Stack / Role row and a link, beside a big image.
// Each project has an anchor (/work#<slug>) so it can be linked directly.
const { data: page } = await useAsyncData('work', () => queryCollection('work').first())
const { data: projects } = await useProjects()

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description
})

// The "Stack" fact is the project's first two tags; Role comes from its type.
const stackOf = (tags: string[]) => tags.slice(0, 2).join(', ')
</script>

<template>
  <div v-if="page">
    <SitePageHead
      :ghost="page.ghost"
      :lines="[page.title]"
      :subtitle="page.subtitle"
    />

    <ol class="wrap section projects">
      <li
        v-for="(project, i) in projects"
        :id="project.slug"
        :key="project.slug"
        class="project"
      >
        <div
          data-reveal="0"
          class="text"
        >
          <span class="tnum count">[{{ String(i + 1).padStart(2, '0') }}]</span>
          <h2 class="title">
            {{ project.title }}
          </h2>
          <p class="summary">
            {{ project.summary }}
          </p>
          <details class="more">
            <summary>
              <span class="label">The story</span>
              <span
                class="plus"
                aria-hidden="true"
              >+</span>
            </summary>
            <dl class="story">
              <dt>Problem</dt>
              <dd>{{ project.problem }}</dd>
              <dt>Build</dt>
              <dd>{{ project.build }}</dd>
              <dt>Outcome</dt>
              <dd>{{ project.outcome }}</dd>
            </dl>
          </details>
          <dl class="facts">
            <div>
              <dt>Year</dt>
              <dd class="tnum">
                {{ project.year }}
              </dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{{ stackOf(project.tags) }}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{{ project.type }}</dd>
            </div>
          </dl>
          <a
            v-if="project.link"
            :href="project.link"
            target="_blank"
            rel="noopener"
            class="dot-link"
          >
            <span
              class="ring"
              aria-hidden="true"
            />
            {{ (project.linkLabel ?? 'Visit the live site').replace(/\s*↗$/, '') }}
          </a>
          <a
            v-else-if="project.repo"
            :href="project.repo"
            target="_blank"
            rel="noopener"
            class="dot-link"
          >
            <span
              class="ring"
              aria-hidden="true"
            />
            Available on GitHub
          </a>
          <span
            v-else
            class="no-link"
          >{{ project.confidential ? 'Client work, under NDA' : 'Not public' }}</span>
        </div>
        <figure
          data-reveal="120"
          class="plate"
        >
          <ProjectPlate
            :image="project.image"
            :title="project.title"
            :num="String(i + 1).padStart(2, '0')"
            :confidential="project.confidential"
          />
        </figure>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.projects {
  display: flex;
  flex-direction: column;
  gap: clamp(100px, 12vw, 170px);
}
.project {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 40px clamp(48px, 9vw, 160px);
  align-items: start;
  scroll-margin-top: 40px;
}
.text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.count {
  font-size: 14px;
  color: var(--color-accent);
}
.title {
  margin-top: 10px;
  font-size: clamp(36px, 3.6vw, 52px);
  font-weight: 400;
  letter-spacing: -.035em;
  line-height: 1.02;
  color: var(--color-accent);
}
.summary {
  margin-top: 26px;
  max-width: 46ch;
  font-size: 16px;
  line-height: 1.45;
}
.more {
  margin-top: 18px;
  width: 100%;
  max-width: 52ch;
}
.more summary {
  display: inline-flex;
  gap: 10px;
  align-items: baseline;
}
.plus {
  color: var(--color-accent);
  transition: transform .3s var(--ease-out);
}
.more[open] .plus { transform: rotate(45deg); }
.story {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 12px 16px;
  font-size: 15px;
  line-height: 1.45;
}
.story dt { color: var(--color-accent); }
.facts {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px 52px;
}
.facts dt {
  font-size: 13px;
  color: var(--color-accent);
}
.facts dd { font-size: 16px; }
.dot-link,
.no-link { margin-top: 40px; }
.no-link {
  font-size: 15px;
  color: var(--color-muted);
}
.plate {
  aspect-ratio: 4 / 3;
  overflow: hidden;
}
.plate :deep(img) {
  filter: saturate(1.15);
  transition: transform 1.2s var(--ease-out);
}
.project:hover .plate :deep(img) { transform: scale(1.04); }

@media (max-width: 860px) {
  .project { grid-template-columns: 1fr; }
  .plate { order: -1; }
}
</style>
