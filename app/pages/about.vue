<script setup lang="ts">
const { data: page } = await useAsyncData('about', () => queryCollection('about').first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description
})

// Years since I started writing code for a living (Celebal, Aug 2023), shown
// big the way the reference shows age. Computed at build time; the site is
// rebuilt often enough for that.
const START = new Date('2023-08-01')
const years = Math.max(1, Math.floor((Date.now() - START.getTime()) / (365.25 * 864e5)))
</script>

<template>
  <div v-if="page">
    <SitePageHead
      :ghost="page.ghost"
      :lines="page.headline"
      :subtitle="page.subtitle"
    />

    <section class="wrap section info">
      <figure
        data-reveal="0"
        class="portrait"
      >
        <img
          src="/richie.jpg"
          alt="Portrait of Richie Patil"
          width="600"
          height="750"
        >
      </figure>
      <div class="info-body">
        <div
          data-reveal="80"
          class="years"
        >
          <span class="label">Years shipping</span>
          <span class="display num tnum">{{ String(years).padStart(2, '0') }}</span>
        </div>
        <h2
          data-reveal="120"
          class="display info-title"
        >
          Info
        </h2>
        <div class="grid">
          <div data-reveal="160">
            <span class="label">Profile</span>
            <p>{{ page.profile }}</p>
          </div>
          <div data-reveal="220">
            <span class="label">Stack</span>
            <p>{{ page.stack }}</p>
          </div>
          <div data-reveal="280">
            <span class="label">Recognition</span>
            <ul>
              <li
                v-for="item in page.recognition"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </div>
          <div data-reveal="340">
            <span class="label">Outside work</span>
            <p>{{ page.outside }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="approach">
      <div class="wrap section approach-inner">
        <div class="approach-head">
          <h2 class="display approach-title">
            <span class="mask-line"><span
              data-reveal="0"
              data-from="105%"
            >{{ page.approach.title }}</span></span>
          </h2>
          <p
            data-reveal="120"
            class="approach-sub"
          >
            {{ page.approach.subtitle }}
          </p>
        </div>
        <ol class="values">
          <li
            v-for="(item, i) in page.approach.items"
            :key="item.title"
            :data-reveal="i * 100"
          >
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="wrap section experience">
      <h2
        data-reveal="0"
        class="display exp-title"
      >
        {{ page.experience.title }}
      </h2>
      <ol class="jobs">
        <li
          v-for="(job, i) in page.experience.items"
          :key="job.role + job.when"
          :data-reveal="i * 80"
          class="job"
        >
          <span class="tnum when">{{ job.when }}</span>
          <span class="org">{{ job.org }}</span>
          <span class="job-role">{{ job.role }}</span>
          <p class="note">
            {{ job.note }}
          </p>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.info {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 2fr);
  gap: clamp(32px, 4vw, 64px);
  align-items: start;
}
.portrait {
  aspect-ratio: 4 / 5;
  overflow: hidden;
}
.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.1);
}
.info-body {
  display: flex;
  flex-direction: column;
}
.years {
  align-self: flex-end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.num {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: clamp(110px, 15vw, 220px);
  letter-spacing: -.06em;
  line-height: .85;
}
.info-title {
  margin-top: 20px;
  font-size: clamp(40px, 4.4vw, 64px);
}
.grid {
  margin-top: 56px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 56px 64px;
}
.grid .label { margin-bottom: 14px; }
.grid p,
.grid li {
  font-size: 16px;
  line-height: 1.45;
}

/* — approach: a solid copper band — */
.approach {
  background: var(--color-band);
  color: var(--color-on-band);
  transition: background-color .5s ease, color .5s ease;
}
.approach-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 56px 80px;
}
.approach-title {
  color: inherit;
  font-size: clamp(48px, 6.2vw, 100px);
}
.approach-sub {
  margin-top: 16px;
  font-size: 18px;
}
.values {
  display: flex;
  flex-direction: column;
  gap: 56px;
}
.values h3 {
  font-size: clamp(30px, 2.8vw, 40px);
  font-weight: 500;
  letter-spacing: -.03em;
  line-height: 1.1;
}
.values p {
  margin-top: 14px;
  font-size: 16px;
  line-height: 1.45;
  max-width: 48ch;
}

/* — experience — */
.exp-title {
  font-size: clamp(48px, 6vw, 96px);
  margin-bottom: 48px;
}
.jobs { border-top: 1px dashed var(--color-divider); }
.job {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr 2fr;
  gap: 12px 32px;
  padding: 26px 0;
  border-bottom: 1px dashed var(--color-divider);
  align-items: baseline;
}
.when {
  font-size: 14px;
  color: var(--color-accent);
}
.org {
  font-size: 22px;
  letter-spacing: -.02em;
  color: var(--color-accent);
}
.job-role { font-size: 16px; }
.note {
  font-size: 15px;
  line-height: 1.45;
  color: var(--color-muted);
}

@media (max-width: 900px) {
  .info { grid-template-columns: 1fr; }
  .portrait { max-width: 420px; }
  .years { align-self: flex-start; align-items: flex-start; }
  .approach-inner { grid-template-columns: 1fr; }
  .job { grid-template-columns: 1fr 1fr; }
  .note { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .job { grid-template-columns: 1fr; gap: 6px; }
}
</style>
