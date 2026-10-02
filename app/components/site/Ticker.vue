<script setup lang="ts">
// A copper band whose sentence scrolls endlessly to the left. The text is
// repeated enough times to overfill the widest screen, and the track moves
// by exactly half its width, so the loop has no visible seam.
defineProps<{ text: string }>()
const REPEATS = 12
</script>

<template>
  <div
    class="ticker"
    role="marquee"
    :aria-label="text"
  >
    <div
      class="track"
      aria-hidden="true"
    >
      <span
        v-for="n in REPEATS"
        :key="n"
      >{{ text }}</span>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  overflow: hidden;
  background: var(--color-band);
  color: var(--color-on-band);
  padding-block: 11px;
  transition: background-color .5s ease, color .5s ease;
}
.track {
  display: flex;
  width: max-content;
  animation: scroll 48s linear infinite;
}
.track span {
  padding-right: 1.4em;
  font-size: 14px;
  white-space: nowrap;
}
.ticker:hover .track { animation-play-state: paused; }
@keyframes scroll {
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .track { animation: none; }
}
</style>
