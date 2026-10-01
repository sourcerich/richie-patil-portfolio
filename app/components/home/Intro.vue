<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{ intro: IndexCollectionItem['intro'] }>()
</script>

<template>
  <section
    class="rule-top"
    data-chapter="About"
  >
    <div class="wrap section-pad grid">
      <div class="text">
        <div
          data-reveal="0"
          class="eyebrow chapter-rule"
        >
          <span>About</span><span class="line" />
        </div>
        <p
          data-reveal="120"
          class="display lead"
        >
          {{ intro.lead }}
        </p>
        <p
          data-reveal="240"
          class="body justify"
        >
          {{ intro.body }}
        </p>
        <NuxtLink
          data-reveal="360"
          to="/about"
          class="draw-link"
        >
          More about me →
        </NuxtLink>
      </div>
      <div class="portrait-col">
        <figure
          data-reveal="150"
          data-wipe
          class="plate portrait"
        >
          <img
            data-py="-0.12"
            src="/richie.jpg"
            alt="Portrait of Richie Patil"
          >
        </figure>
        <blockquote
          data-reveal="300"
          class="display quote"
        >
          {{ intro.quote }}
        </blockquote>
        <p
          data-reveal="380"
          class="muted beyond"
        >
          {{ intro.beyond }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: clamp(40px, 7vw, 120px);
  align-items: center;
}
.text, .portrait-col {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.portrait-col { gap: 32px; }
.chapter-rule {
  display: flex;
  gap: 16px;
  align-items: baseline;
}
.line {
  flex: 1;
  height: 1px;
  background: var(--color-divider);
}
.lead {
  font-size: clamp(30px, 3.3vw, 46px);
  line-height: 1.15;
}
.body {
  font-size: 16px;
  line-height: 1.75;
  max-width: 54ch;
  color: color-mix(in srgb, var(--color-text) 80%, transparent);
}
.portrait {
  overflow: hidden;
  aspect-ratio: 4 / 5;
  max-width: 480px;
  width: 100%;
}
.portrait img {
  width: 100%;
  height: 118%;
  margin-top: -9%;
  object-fit: cover;
}
.quote {
  font-size: clamp(26px, 2.6vw, 36px);
  line-height: 1.2;
  max-width: 24ch;
}
.beyond { font-size: 14px; }
</style>
