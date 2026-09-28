<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())
const { data: projects } = await useProjects()

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: '',
  ogTitle: page.value.seo?.title || page.value.title,
  description: page.value.seo?.description || page.value.description,
  ogDescription: page.value.seo?.description || page.value.description
})

const stills = computed(() => projects.value.flatMap(p => (p.image ? [{ src: p.image, portrait: p.imagePortrait }] : [])))
</script>

<template>
  <div v-if="page">
    <HomeHero :hero="page.hero" />
    <HomeIntro :intro="page.intro" />
    <HomeStats :stats="page.stats" />
    <HomeWorkZoom
      :stills="stills"
      :span="page.work.span"
    />
    <HomeSelectedWork
      :projects="projects"
      :heading="page.work.heading"
      :note="page.work.note"
    />
    <HomeServices :services="page.services" />
    <HomeExperience :experience="page.experience" />
  </div>
</template>
