<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{ services: IndexCollectionItem['services'] }>()

// Hovering a panel raises a "blind" of its image from the bottom; leaving
// lifts it away through the top.
const EASE = '.8s cubic-bezier(.215,.61,.355,1)'
const setBlind = (panel: EventTarget | null, open: boolean) => {
  const blind = (panel as HTMLElement | null)?.querySelector<HTMLElement>('[data-blind]')
  const img = blind?.firstElementChild as HTMLElement | null
  if (!blind || !img) return
  if (!open) {
    blind.style.clipPath = 'inset(0 0 100% 0)'
    img.style.transform = 'translateY(-9%)'
    return
  }
  blind.style.transition = 'none'
  img.style.transition = 'none'
  blind.style.clipPath = 'inset(100% 0 0 0)'
  img.style.transform = 'translateY(6%)'
  void blind.offsetWidth
  blind.style.transition = `clip-path ${EASE}`
  img.style.transition = `transform ${EASE}`
  blind.style.clipPath = 'inset(0 0 0 0)'
  img.style.transform = 'translateY(-3%)'
}
</script>

<template>
  <section
    class="ink-band"
    data-theme="dark"
    data-chapter="Chapter III — What I do"
  >
    <div class="wrap section-pad">
      <div class="head">
        <div
          data-reveal="0"
          class="head-title"
        >
          <span class="kicker">Chapter III — What I do</span>
          <h2 class="display heading">
            {{ services.heading }}
          </h2>
        </div>
        <p
          data-reveal="100"
          class="intro justify"
        >
          {{ services.body }}
        </p>
      </div>
      <div class="panels">
        <div
          v-for="(service, i) in services.items"
          :key="service.title"
          :data-reveal="i * 90"
          class="panel"
          @mouseenter="setBlind($event.currentTarget, true)"
          @mouseleave="setBlind($event.currentTarget, false)"
        >
          <div
            data-blind
            class="blind"
          >
            <img
              :src="service.image"
              alt=""
              loading="lazy"
            >
          </div>
          <div class="panel-body">
            <span class="num tnum">{{ projectNumber(i) }}</span>
            <h3 class="panel-title">
              {{ service.title }}
            </h3>
            <p class="panel-text">
              {{ service.body }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 32px 80px;
  align-items: end;
  margin-bottom: 56px;
}
.head-title {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.kicker {
  font-size: 13px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--color-accent);
}
.heading {
  font-size: clamp(36px, 4.4vw, 60px);
  line-height: 1.05;
}
.intro {
  font-size: 16px;
  line-height: 1.7;
  max-width: 50ch;
  color: color-mix(in srgb, var(--color-bg) 80%, transparent);
}
.panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  border-top: 1px solid var(--color-on-ink-divider);
  border-left: 1px solid var(--color-on-ink-divider);
}
.panel {
  position: relative;
  overflow: hidden;
  border-right: 1px solid var(--color-on-ink-divider);
  border-bottom: 1px solid var(--color-on-ink-divider);
  min-height: clamp(320px, 34vw, 440px);
}
.blind {
  position: absolute;
  inset: 0;
  clip-path: inset(100% 0 0 0);
}
.blind img {
  position: absolute;
  left: 0;
  top: -10%;
  width: 100%;
  height: 120%;
  object-fit: cover;
  opacity: .38;
  filter: sepia(.3) saturate(.7);
}
.panel-body {
  position: relative;
  height: 100%;
  padding: 28px 26px 36px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.num {
  font-family: var(--font-heading);
  font-size: 64px;
  line-height: 1;
  color: var(--color-accent);
}
.panel-title {
  margin-top: auto;
  font-size: 26px;
  line-height: 1.1;
}
.panel-text {
  font-size: 15px;
  line-height: 1.65;
  color: color-mix(in srgb, var(--color-bg) 82%, transparent);
}

@media (max-width: 640px) {
  .head { margin-bottom: 40px; }
  .panel { min-height: 0; }
  .panel-body {
    padding: 24px 20px 28px;
    gap: 12px;
  }
  .num { font-size: 44px; }
  .panel-title {
    margin-top: 12px;
    font-size: 24px;
  }
}
</style>
