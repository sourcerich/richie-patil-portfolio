<script setup lang="ts">
const route = useRoute()
const { site } = useAppConfig()

const links = computed(() => [
  { num: '01.', label: 'Home', to: '/', current: route.path === '/' },
  { num: '02.', label: 'About', to: '/about', current: route.path === '/about' },
  { num: '03.', label: 'Works and Collaborations', to: '/works', current: route.path.startsWith('/works') }
])

// Below the desktop breakpoint the nav collapses into a full-screen menu.
const menuOpen = ref(false)

watch(() => route.fullPath, () => (menuOpen.value = false))
watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') menuOpen.value = false
})
</script>

<template>
  <header
    id="site-header"
    class="header"
    data-dark="false"
    :data-menu="menuOpen"
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
      <button
        type="button"
        class="menu-toggle"
        aria-controls="mobile-menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span>{{ menuOpen ? 'Close' : 'Menu' }}</span>
        <span
          class="menu-icon"
          aria-hidden="true"
        ><span /><span /></span>
      </button>
    </div>
  </header>

  <div
    id="mobile-menu"
    class="menu ink-band"
    :class="{ open: menuOpen }"
    :inert="!menuOpen || undefined"
  >
    <nav class="menu-links tnum">
      <NuxtLink
        v-for="(link, i) in links"
        :key="link.to"
        :to="link.to"
        :aria-current="link.current ? 'page' : undefined"
        :style="{ '--i': i }"
      >
        <span class="num">{{ link.num }}</span>
        <span class="display">{{ link.label }}</span>
      </NuxtLink>
      <a
        :href="`mailto:${site.email}`"
        :style="{ '--i': links.length }"
      >
        <span class="num">04.</span>
        <span class="display">Contact</span>
      </a>
    </nav>
    <div class="menu-foot">
      <a
        :href="`mailto:${site.email}`"
        class="menu-email"
      >{{ site.email }}</a>
      <div class="menu-socials">
        <a
          v-for="social in site.socials"
          :key="social.label"
          :href="social.to"
          target="_blank"
          rel="noopener"
        >{{ social.label }} ↗</a>
      </div>
    </div>
  </div>
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
.header[data-dark="true"],
.header[data-menu="true"] {
  background: color-mix(in oklch, var(--color-neutral-900) 78%, black);
  color: var(--color-bg);
  border-color: var(--color-on-ink-divider);
}
.header-inner {
  padding-block: 12px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.brand:hover { color: inherit; }
.logo {
  width: 40px;
  height: 40px;
  flex: none;
  mix-blend-mode: multiply;
  transition: filter .5s;
}
.header[data-dark="true"] .logo,
.header[data-menu="true"] .logo {
  filter: invert(1);
  mix-blend-mode: screen;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.edition {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--color-accent);
  white-space: nowrap;
}
.chapter {
  font-family: var(--font-heading);
  font-size: 16px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav {
  margin-left: auto;
  display: flex;
  gap: clamp(14px, 2.4vw, 32px);
  font-size: 14px;
  white-space: nowrap;
}
.nav a {
  display: flex;
  gap: 6px;
}
.nav a[aria-current="page"] { color: var(--color-accent); }
.num { color: var(--color-accent); }

/* — mobile menu — */
.menu-toggle {
  display: none;
  margin-left: auto;
  flex: none;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 2px 0 12px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  cursor: pointer;
}
.menu-icon {
  position: relative;
  width: 22px;
  height: 9px;
}
.menu-icon span {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: currentColor;
  transition: transform .4s var(--ease-out), top .4s var(--ease-out);
}
.menu-icon span:first-child { top: 0; }
.menu-icon span:last-child { top: 8px; }
[aria-expanded="true"] .menu-icon span:first-child { top: 4px; transform: rotate(45deg); }
[aria-expanded="true"] .menu-icon span:last-child { top: 4px; transform: rotate(-45deg); }

.menu {
  position: fixed;
  inset: 0;
  z-index: 49;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  padding: calc(var(--header-h) + 40px) var(--gutter) max(32px, env(safe-area-inset-bottom));
  overflow-y: auto;
  clip-path: inset(0 0 100% 0);
  visibility: hidden;
  transition: clip-path .7s var(--ease-in-out), visibility 0s linear .7s;
}
.menu.open {
  clip-path: inset(0 0 0 0);
  visibility: visible;
  transition: clip-path .7s var(--ease-in-out), visibility 0s;
}
.menu-links {
  display: flex;
  flex-direction: column;
}
.menu-links a {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-on-ink-divider);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .5s var(--ease-out), transform .6s var(--ease-out);
}
.menu.open .menu-links a {
  opacity: 1;
  transform: none;
  transition-delay: calc(.25s + var(--i) * 70ms);
}
.menu-links .num {
  font-size: 13px;
  min-width: 26px;
}
.menu-links .display {
  font-size: clamp(34px, 9vw, 52px);
  line-height: 1.05;
}
.menu-links a[aria-current="page"] .display { color: var(--color-accent); }
.menu-foot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 15px;
}
.menu-email {
  font-family: var(--font-heading);
  font-size: 22px;
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-underline-offset: 6px;
  overflow-wrap: anywhere;
}
.menu-socials {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

@media (max-width: 959px) {
  .nav { display: none; }
  .menu-toggle { display: inline-flex; }
}
@media (min-width: 960px) {
  .menu { display: none; }
}
@media (max-width: 380px) {
  .edition { font-size: 10px; letter-spacing: .1em; }
  .logo { width: 34px; height: 34px; }
}
</style>
