<script setup lang="ts">
import type { IndexCollectionItem } from '@nuxt/content'

defineProps<{ hero: IndexCollectionItem['hero'] }>()
const { site } = useAppConfig()

const clock = ref('--:--:--')
const tickClock = () => {
  clock.value = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  tickClock()
  timer = setInterval(tickClock, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section
    class="wrap hero"
    data-chapter="Richie Patil"
  >
    <div class="meta tnum">
      <span
        data-reveal="0"
        class="role"
      >{{ hero.role }}</span>
      <span data-reveal="80">{{ hero.location }} · {{ clock }} IST</span>
      <span
        data-reveal="160"
        class="status"
      ><span class="dot" />{{ hero.status }}</span>
    </div>
    <h1 class="display name">
      <span class="mask-line"><span
        data-reveal="100"
        data-from="102%"
      ><span data-px="-0.16">Richie</span></span></span>
      <span class="mask-line right"><span
        data-reveal="300"
        data-from="102%"
      ><span data-px="0.16"><BrandMark class="mark" /> Patil</span></span></span>
    </h1>
    <div class="foot">
      <div class="lead-col">
        <p
          data-reveal="500"
          class="lead"
        >
          {{ hero.lead }}
        </p>
        <div
          data-reveal="600"
          class="actions"
        >
          <NuxtLink
            to="/works"
            class="btn btn-primary"
          >View the work →</NuxtLink>
          <a
            :href="`mailto:${site.email}`"
            class="btn btn-ghost"
          >Start a conversation</a>
        </div>
      </div>
      <p
        data-reveal="700"
        class="stack"
      >
        <template
          v-for="(line, i) in hero.stack"
          :key="line"
        >
          <br v-if="i">{{ line }}
        </template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding-block: clamp(40px, 7vw, 96px) clamp(40px, 5vw, 64px);
  min-height: calc(100vh - var(--header-h));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
}
.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 24px;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.role { color: var(--color-accent-text); }
.status {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: end;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 40%, transparent);
}
.name {
  font-size: clamp(88px, 19vw, 300px);
  line-height: .86;
  letter-spacing: -.02em;
}
.name span { display: block; }
/* The monogram sits on the line in place of a dash, sized to the cap height. */
.name .mark {
  height: .5em;
  margin-right: .02em;
  vertical-align: baseline;
  color: var(--color-accent);
}
.right { text-align: right; }
.foot {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 28px 48px;
  align-items: end;
  border-top: 1px solid var(--color-divider);
  padding-top: 28px;
}
.lead-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.lead {
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.6;
  max-width: 46ch;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stack {
  justify-self: end;
  text-align: right;
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  line-height: 2;
  max-width: 40ch;
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
}

@media (max-width: 640px) {
  .hero {
    min-height: calc(100svh - var(--header-h));
    padding-block: 32px 36px;
    gap: 32px;
  }
  .meta {
    grid-template-columns: 1fr auto;
    gap: 10px 16px;
    font-size: 11px;
  }
  .role { grid-column: 1 / -1; }
  .foot {
    gap: 24px;
    padding-top: 24px;
  }
  .stack {
    justify-self: start;
    text-align: left;
    font-size: 11px;
  }
}
@media (max-width: 359px) {
  .meta { grid-template-columns: 1fr; }
  .status { justify-self: start; }
}
</style>
