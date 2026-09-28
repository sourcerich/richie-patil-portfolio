<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{ experience: IndexCollectionItem['experience'] }>()

// Hovering a role dims the others.
const focused = ref(-1)
</script>

<template>
  <section data-chapter="Chapter IV — Experience">
    <div class="wrap section-pad">
      <div
        data-reveal="0"
        class="head"
      >
        <span class="eyebrow">Chapter IV — Selected experience</span>
        <span class="muted note">{{ experience.note }}</span>
      </div>
      <ul
        class="list"
        @mouseleave="focused = -1"
      >
        <li
          v-for="(item, i) in experience.items"
          :key="item.role + item.when"
          :data-reveal="i * 90"
          @mouseenter="focused = i"
        >
          <div
            class="row"
            :class="{ dimmed: focused >= 0 && focused !== i }"
          >
            <span class="display org">{{ item.org }}</span>
            <span class="detail">
              <span class="role-line">
                <span class="role">{{ item.role }}</span>
                <span class="when tnum">{{ item.when }}</span>
              </span>
              <span class="muted summary">{{ item.note }}</span>
            </span>
          </div>
        </li>
      </ul>
      <p
        data-reveal="0"
        class="muted education"
      >
        {{ experience.education }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  align-items: baseline;
  margin-bottom: 40px;
}
.note { font-size: 14px; }
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-divider);
}
.list li { border-bottom: 1px solid var(--color-divider); }
.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 8px 40px;
  align-items: baseline;
  padding: 26px 0;
  transition: opacity .4s ease;
}
.row.dimmed { opacity: .25; }
.org {
  font-size: clamp(32px, 4.4vw, 60px);
  line-height: 1.05;
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.role-line {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.role { font-size: 16px; }
.when {
  font-size: 13px;
  color: var(--color-accent-700);
}
.summary {
  font-size: 14px;
  line-height: 1.6;
}
.education {
  margin-top: 28px;
  font-size: 14px;
}
</style>
