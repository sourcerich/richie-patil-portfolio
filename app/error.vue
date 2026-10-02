<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const missing = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: missing.value ? 'Page not found' : 'Something went wrong' })
</script>

<template>
  <NuxtLayout>
    <SitePageHead
      :ghost="missing ? 'हरवले' : 'चूक'"
      :lines="[missing ? 'Not found' : 'Error']"
      :subtitle="missing ? 'There’s nothing at this address.' : 'Something went wrong on this page.'"
    />
    <section class="wrap section">
      <button
        type="button"
        class="dot-link back"
        @click="clearError({ redirect: '/' })"
      >
        <span
          class="ring"
          aria-hidden="true"
        />
        Back to the start
      </button>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.back {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
</style>
