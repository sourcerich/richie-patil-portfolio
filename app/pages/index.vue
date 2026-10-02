<script setup lang="ts">
// The first page: one full screen. Copper ticker across the top, the name
// huge in display caps, role and a short intro under it, and along the
// bottom Mumbai time, what I'm doing now, the numbered menu and a "Next page" ring.
// Socials run vertically down the right edge.
definePageMeta({ layout: 'bare' })

const { data: page } = await useAsyncData('index', () => queryCollection('index').first())
const { site } = useAppConfig()
const clock = useMumbaiClock()

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: '',
  ogTitle: page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description
})

// The menu skips "Start": you're already on it.
const menu = computed(() => site.nav.slice(1))
</script>

<template>
  <section
    v-if="page"
    class="top"
  >
    <div class="ticker-wrap">
      <SiteTicker :text="page.ticker" />
    </div>

    <div class="wrap hero">
      <h1 class="display name">
        <span class="mask-line"><span
          data-reveal="150"
          data-from="105%"
        ><span class="word">Richie</span> <span class="word">Patil</span></span></span>
      </h1>
      <p
        data-reveal="350"
        class="role"
      >
        <span>{{ page.role }}</span>
        <span>{{ page.location }}</span>
      </p>
      <p
        data-reveal="450"
        class="lead"
      >
        {{ page.lead }}
      </p>
    </div>

    <div class="wrap base">
      <div
        data-reveal="550"
        class="block"
      >
        <span class="label">Local time</span>
        <p class="tnum">
          {{ site.city }} {{ clock }}
        </p>
      </div>
      <div
        data-reveal="600"
        class="block"
      >
        <span class="label">{{ page.now.label }}</span>
        <p>{{ page.now.value }}</p>
      </div>
      <nav
        data-reveal="650"
        class="block menu"
        aria-label="Main"
      >
        <span class="label">Menu</span>
        <ol>
          <li
            v-for="(link, i) in menu"
            :key="link.to"
          >
            <NuxtLink
              :to="link.to"
              class="menu-link"
            >
              <span class="tnum">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="line-link">{{ link.label }}</span>
            </NuxtLink>
          </li>
        </ol>
      </nav>
      <div
        data-reveal="750"
        class="next"
      >
        <NuxtLink
          to="/about"
          class="dot-link"
        >
          <span
            class="ring"
            aria-hidden="true"
          />
          Next page
        </NuxtLink>
      </div>
    </div>

    <div class="side">
      <a
        v-for="social in site.socials"
        :key="social.label"
        :href="social.to"
        target="_blank"
        rel="noopener"
        class="line-link"
      >{{ social.label }}</a>
    </div>
    <div class="corner">
      <SiteThemeToggle />
    </div>
  </section>
</template>

<style scoped>
.top {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  color: var(--color-accent);
}
.ticker-wrap {
  padding: 64px var(--gutter) 0;
}
.hero {
  padding-top: clamp(64px, 11vh, 120px);
}
.name {
  font-size: clamp(56px, 10.6vw, 168px);
  white-space: nowrap;
}
.role {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  font-size: 18px;
  line-height: 1.25;
}
.role span:first-child { text-transform: uppercase; }
.lead {
  margin-top: 48px;
  max-width: 34ch;
  font-size: 16px;
  line-height: 1.4;
  color: var(--color-text);
}
/* Bottom row: three labelled blocks that share one top line and one
   rhythm (label, 12px, then 16px text on a 1.5 line), plus the
   "Next page" ring pinned to the bottom right. */
.base {
  margin-top: auto;
  padding-block: 56px 48px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: start;
  gap: 40px 48px;
}
.block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  font-size: 16px;
  line-height: 1.5;
}
.block p {
  max-width: 24ch;
  color: var(--color-text);
}
.menu ol {
  display: flex;
  flex-direction: column;
}
.menu-link {
  display: grid;
  grid-template-columns: 2.2em auto;
}
.menu-link .tnum { color: var(--color-muted); }
.next {
  align-self: end;
  justify-self: end;
}
.side {
  position: absolute;
  right: calc(var(--gutter) * .45);
  top: 50%;
  transform: translateY(-50%) rotate(180deg);
  writing-mode: vertical-rl;
  display: flex;
  gap: 18px;
  font-size: 15px;
}
.corner {
  position: absolute;
  top: 12px;
  right: calc(var(--gutter) - 8px);
}

@media (max-width: 1080px) {
  .base { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .ticker-wrap { padding-top: 60px; }
  .hero { padding-top: 56px; }
  .name {
    white-space: normal;
    font-size: clamp(64px, 21vw, 110px);
  }
  .name .word { display: block; }
  .lead { margin-top: 32px; }
  .base {
    padding-block: 48px 36px;
    gap: 32px 20px;
  }
  .side { display: none; }
}
</style>
