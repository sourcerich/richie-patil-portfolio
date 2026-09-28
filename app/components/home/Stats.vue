<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{ stats: IndexCollectionItem['stats'] }>()
</script>

<template>
  <section class="rule-top">
    <div class="wrap stats">
      <div
        v-for="(stat, i) in stats"
        :key="stat.caption"
        :data-reveal="i * 90"
        class="stat"
      >
        <span
          :data-count="stat.value"
          :data-dec="stat.decimals"
          :data-pre="stat.prefix"
          :data-suf="stat.suffix"
          class="display tnum value"
          :class="{ accent: stat.accent }"
        >{{ stat.prefix }}{{ stat.value.toFixed(stat.decimals) }}{{ stat.suffix }}</span>
        <span class="label caption">{{ stat.caption }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats {
  padding-block: clamp(56px, 7vw, 96px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px 48px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 1px solid var(--color-divider);
  padding-left: 20px;
}
.value {
  font-size: clamp(48px, 5vw, 72px);
  line-height: 1;
  letter-spacing: -.01em;
  /* Lining figures: Cormorant's default old-style numerals dip below the
     baseline, which looks uneven at display size. */
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}
.accent { color: var(--color-accent); }
.caption {
  line-height: 1.6;
  max-width: 26ch;
}

/* Two by two on phones rather than one long column. */
@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px 16px;
  }
  .stat {
    gap: 10px;
    padding-left: 14px;
  }
  .value { font-size: clamp(36px, 11vw, 48px); }
  .caption {
    font-size: 11px;
    letter-spacing: .08em;
  }
}
</style>
