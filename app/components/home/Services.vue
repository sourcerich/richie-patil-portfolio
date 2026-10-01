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
    data-chapter="What I do"
  >
    <div class="wrap section-pad">
      <div class="head">
        <div
          data-reveal="0"
          class="head-title"
        >
          <span class="kicker">What I do</span>
          <h2 class="display heading">
            {{ services.heading }}
          </h2>
        </div>
        <p
          data-reveal="100"
          class="intro"
        >
          {{ services.body }}
        </p>
      </div>
      <!-- Ordered by how much of my time each takes; the first one leads. -->
      <ol class="panels">
        <li
          v-for="(service, i) in services.items"
          :key="service.title"
          :data-reveal="i * 90"
          class="panel"
          :class="{ lead: i === 0 }"
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
            <h3 class="display panel-title">
              {{ service.title }}
            </h3>
            <p class="panel-text">
              {{ service.body }}
            </p>
          </div>
        </li>
      </ol>
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
  color: color-mix(in srgb, var(--color-on-ink) 80%, transparent);
}
/* The lead service takes the left half at full height; the rest stack as
   rows beside it. */
.panels {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  grid-auto-rows: auto;
  border-top: 1px solid var(--color-on-ink-divider);
}
.panel {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-on-ink-divider);
}
.panel.lead {
  grid-row: span 3;
  border-right: 1px solid var(--color-on-ink-divider);
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
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px 16px;
  align-content: start;
  padding: 26px 0 28px 28px;
}
.panel-body > .panel-text { grid-column: 2; }
.num {
  font-size: 13px;
  padding-top: .55em;
  color: var(--color-accent);
}
.panel-title {
  font-size: 30px;
  line-height: 1.1;
}
.panel-text {
  font-size: 15px;
  line-height: 1.65;
  max-width: 48ch;
  color: color-mix(in srgb, var(--color-on-ink) 78%, transparent);
}
.lead .panel-body {
  padding: 32px 40px 40px 0;
  grid-template-columns: 1fr;
  align-content: space-between;
  min-height: clamp(360px, 36vw, 480px);
}
.lead .panel-body > .panel-text { grid-column: auto; }
.lead .num { padding-top: 0; }
.lead .panel-title {
  margin-top: auto;
  font-size: clamp(44px, 5vw, 72px);
  line-height: 1;
}
.lead .panel-text {
  font-size: 17px;
  max-width: 40ch;
  color: color-mix(in srgb, var(--color-on-ink) 86%, transparent);
}

@media (max-width: 860px) {
  .head { margin-bottom: 40px; }
  .panels { grid-template-columns: 1fr; }
  .panel.lead {
    grid-row: auto;
    border-right: 0;
  }
  .lead .panel-body {
    min-height: 0;
    padding: 28px 0 32px;
    gap: 14px;
  }
  .lead .panel-title { font-size: clamp(36px, 9vw, 52px); }
  .panel-body { padding: 22px 0 26px; }
  .panel-title { font-size: 26px; }
}
</style>
