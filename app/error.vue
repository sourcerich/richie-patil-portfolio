<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

useSeoMeta({ title: props.error.statusCode === 404 ? 'Page not found' : 'Something went wrong' })
</script>

<template>
  <NuxtLayout>
    <section class="wrap error">
      <span class="eyebrow tnum">{{ error.statusCode }}</span>
      <h1 class="display">
        {{ error.statusCode === 404 ? 'This page isn’t in the folio.' : 'Something went wrong.' }}
      </h1>
      <button
        class="btn btn-primary"
        @click="clearError({ redirect: '/' })"
      >
        Back to the start →
      </button>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.error {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  padding-block: var(--section-y);
}
h1 {
  font-size: clamp(44px, 7vw, 108px);
  line-height: .98;
  max-width: 16ch;
}
</style>
