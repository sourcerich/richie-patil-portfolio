<script setup lang="ts">
// Header for the inner pages: name and role on the left, the five pages in
// a row on the right, plus the day/night switch. On phones the row becomes
// a "Menu" button that opens a full-screen copper sheet.
const route = useRoute()
const { site } = useAppConfig()

const isCurrent = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

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
  <header class="header">
    <div class="wrap bar">
      <NuxtLink
        to="/"
        class="brand"
        aria-label="Richie Patil, home"
      >
        <BrandMark class="mark" />
        <span class="brand-text">
          <span class="name">{{ site.name }}</span>
          <span class="role">Designer / Engineer</span>
        </span>
      </NuxtLink>
      <nav
        class="nav"
        aria-label="Main"
      >
        <NuxtLink
          v-for="link in site.nav"
          :key="link.to"
          :to="link.to"
          class="line-link"
          :aria-current="isCurrent(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <SiteThemeToggle />
      <button
        type="button"
        class="menu-toggle"
        aria-controls="menu-sheet"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>
    </div>
  </header>

  <div
    id="menu-sheet"
    class="sheet"
    :class="{ open: menuOpen }"
    :inert="!menuOpen || undefined"
  >
    <nav
      class="sheet-links"
      aria-label="Main"
    >
      <NuxtLink
        v-for="(link, i) in site.nav"
        :key="link.to"
        :to="link.to"
        :style="{ '--i': i }"
        :aria-current="isCurrent(link.to) ? 'page' : undefined"
      >
        <span class="tnum">{{ String(i).padStart(2, '0') }}</span>
        <span class="display">{{ link.label }}</span>
      </NuxtLink>
    </nav>
    <a
      :href="`mailto:${site.email}`"
      class="sheet-mail"
    >{{ site.email }}</a>
  </div>
</template>

<style scoped>
.header {
  position: relative;
  z-index: 60;
}
.bar {
  display: flex;
  align-items: center;
  gap: 28px;
  padding-block: 26px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-accent);
}
.mark { height: 30px; }
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.name {
  font-size: 19px;
  letter-spacing: -.01em;
  text-transform: uppercase;
}
.role {
  font-size: 11.5px;
  letter-spacing: .02em;
  text-transform: uppercase;
  color: var(--color-text);
}
.nav {
  margin-left: auto;
  display: flex;
  gap: clamp(20px, 3.4vw, 52px);
  font-size: 16px;
}
.nav a[aria-current="page"] { background-size: 100% 1px; }
.menu-toggle {
  display: none;
  margin-left: 4px;
  min-height: 44px;
  padding: 0 4px;
  background: none;
  border: 0;
  color: var(--color-accent);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}

/* — phone menu — */
.sheet {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 120px var(--gutter) max(32px, env(safe-area-inset-bottom));
  background: var(--color-band);
  color: var(--color-on-band);
  clip-path: inset(0 0 100% 0);
  visibility: hidden;
  transition: clip-path .7s var(--ease-in-out), visibility 0s linear .7s;
}
.sheet.open {
  clip-path: inset(0 0 0 0);
  visibility: visible;
  transition: clip-path .7s var(--ease-in-out), visibility 0s;
}
.sheet-links {
  display: flex;
  flex-direction: column;
}
.sheet-links a {
  display: flex;
  align-items: baseline;
  gap: 18px;
  padding: 10px 0;
  border-bottom: 1px dashed color-mix(in srgb, var(--color-on-band) 45%, transparent);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .5s var(--ease-out), transform .6s var(--ease-out);
}
.sheet.open .sheet-links a {
  opacity: 1;
  transform: none;
  transition-delay: calc(.25s + var(--i) * 60ms);
}
.sheet-links .tnum { font-size: 13px; }
.sheet-links .display {
  color: inherit;
  font-size: clamp(40px, 11vw, 64px);
}
.sheet-mail { font-size: 17px; }
/* The header sits over the open sheet; recolour it to match. */
.header:has(+ .sheet.open) .brand,
.header:has(+ .sheet.open) .role,
.header:has(+ .sheet.open) .menu-toggle,
.header:has(+ .sheet.open) :deep(.theme-toggle) { color: var(--color-on-band); }

@media (max-width: 900px) {
  .nav { display: none; }
  .menu-toggle { display: inline-flex; align-items: center; }
  :deep(.theme-toggle) { margin-left: auto; }
}
@media (min-width: 901px) {
  .sheet { display: none; }
}
@media (max-width: 400px) {
  .role { display: none; }
}
</style>
