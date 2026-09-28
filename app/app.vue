<script setup lang="ts">
useSeoMeta({
  titleTemplate: title => (title ? `${title} – Richie Patil` : 'Richie Patil – Developer & Creative Solutions Architect'),
  ogImage: '/richie.jpg',
  twitterImage: '/richie.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
