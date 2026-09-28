<script setup lang="ts">
const route = useRoute()
const { site } = useAppConfig()

const links = computed(() => [
  { num: '01.', label: 'Home', to: '/', current: route.path === '/' },
  { num: '02.', label: 'About', to: '/about', current: route.path === '/about' },
  { num: '03.', label: 'Works and Collaborations', to: '/works', current: route.path.startsWith('/works') }
])
</script>

<template>
  <header
    id="site-header"
    class="header"
    data-dark="false"
  >
    <div class="wrap header-inner">
      <NuxtLink
        to="/"
        aria-label="Home"
        class="brand"
      >
        <img
          src="/logo.png"
          alt="Richie Patil logo"
          width="40"
          height="40"
          class="logo"
        >
        <span class="brand-text">
          <span class="edition">{{ site.edition }}</span>
          <span
            id="header-chapter"
            class="chapter"
          >{{ site.name }}</span>
        </span>
      </NuxtLink>
      <nav class="nav tnum">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="link.current ? 'page' : undefined"
        >
          <span class="num">{{ link.num }}</span><span>{{ link.label }}</span>
        </NuxtLink>
        <a :href="`mailto:${site.email}`">
          <span class="num">04.</span><span>Contact</span>
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-divider);
  transition: background .5s, color .5s, border-color .5s;
}
.header[data-dark="true"] {
  background: color-mix(in oklch, var(--color-neutral-900) 78%, black);
  color: var(--color-bg);
  border-color: var(--color-on-ink-divider);
}
.header-inner {
  padding-block: 12px;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand:hover { color: inherit; }
.logo {
  width: 40px;
  height: 40px;
  mix-blend-mode: multiply;
  transition: filter .5s;
}
.header[data-dark="true"] .logo {
  filter: invert(1);
  mix-blend-mode: screen;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.edition {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--color-accent);
}
.chapter {
  font-family: var(--font-heading);
  font-size: 16px;
  line-height: 1.1;
}
.nav {
  margin-left: auto;
  display: flex;
  gap: clamp(14px, 2.4vw, 32px);
  flex-wrap: wrap;
  font-size: 14px;
}
.nav a {
  display: flex;
  gap: 6px;
}
.nav a[aria-current="page"] { color: var(--color-accent); }
.num { color: var(--color-accent); }
</style>
