<script setup lang="ts">
const route = useRoute()
const { site } = useAppConfig()
const reveal = useReveal()

// Crawlers for link previews need absolute URLs.
const pageUrl = computed(() => site.url + (route.path === '/' ? '/' : route.path.replace(/\/$/, '')))

useSeoMeta({
  titleTemplate: title => (title ? `${title} – Richie Patil` : 'Richie Patil – Full-stack & ML Developer'),
  ogUrl: pageUrl,
  ogType: 'website',
  ogImage: `${site.url}/richie.jpg`,
  twitterImage: `${site.url}/richie.jpg`,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [{ rel: 'canonical', href: pageUrl }]
})

onMounted(reveal.start)
onBeforeUnmount(reveal.stop)
</script>

<template>
  <div>
    <a
      href="#main"
      class="skip"
    >Skip to content</a>
    <SiteCursorRing />
    <div
      id="page-wipe"
      class="page-wipe"
      aria-hidden="true"
    >
      <span
        id="page-wipe-en"
        class="display"
      />
      <span
        id="page-wipe-mr"
        class="deva"
        lang="mr"
      />
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style scoped>
.skip {
  position: fixed;
  left: 12px;
  top: 12px;
  z-index: 400;
  padding: 10px 14px;
  background: var(--color-band);
  color: var(--color-on-band);
  transform: translateY(-200%);
}
.skip:focus-visible { transform: none; }
.page-wipe {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--color-band);
  color: var(--color-on-band);
  clip-path: inset(100% 0 0 0);
  pointer-events: none;
}
.page-wipe .display {
  color: inherit;
  font-size: clamp(56px, 10vw, 150px);
}
.page-wipe .deva { font-size: clamp(22px, 2.6vw, 34px); }
</style>
