<script setup lang="ts">
// Inner pages: header, page, footer. The first page (index) uses the bare
// layout instead, since it is a single full-screen composition.
</script>

<template>
  <div class="page">
    <SiteHeader />
    <main id="main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.page {
  /* Lets the faded Marathi words sit behind the content (z-index: -1)
     without dropping behind the page background. */
  position: relative;
  isolation: isolate;
}
</style>
