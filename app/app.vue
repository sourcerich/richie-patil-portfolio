<script setup lang="ts">
const route = useRoute()
const { site } = useAppConfig()

// Crawlers for link previews need absolute URLs.
const pageUrl = computed(() => site.url + (route.path === '/' ? '/' : route.path.replace(/\/$/, '')))

useSeoMeta({
  titleTemplate: title => (title ? `${title} – Richie Patil` : 'Richie Patil – Developer & Creative Solutions Architect'),
  ogUrl: pageUrl,
  ogType: 'website',
  ogImage: `${site.url}/richie.jpg`,
  twitterImage: `${site.url}/richie.jpg`,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [{ rel: 'canonical', href: pageUrl }]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
