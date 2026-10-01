<script setup lang="ts">
// Switches the site between day (cream) and night. The starting mode is set
// before first paint by the inline script in nuxt.config.ts; this reads it on
// mount, and saves the visitor's choice so it sticks across visits.
type Mode = 'light' | 'dark'

const mode = ref<Mode>()

const THEME_COLORS: Record<Mode, string> = { light: '#f3f2f2', dark: '#1b1a18' }

const apply = (next: Mode) => {
  mode.value = next
  document.documentElement.dataset.mode = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next])
}

onMounted(() => {
  // Re-apply to sync the browser's theme-color, which the pre-paint script
  // can't always reach (the meta tag may not be parsed yet when it runs).
  apply(document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light')
})

const toggle = () => {
  const next: Mode = mode.value === 'dark' ? 'light' : 'dark'
  apply(next)
  try {
    localStorage.setItem('theme', next)
  } catch {
    // Private mode or storage disabled: the switch still works for this visit.
  }
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="mode === 'dark'"
    @click="toggle"
  >
    <!-- Moon in day mode, sun at night: the icon shows where the switch goes. -->
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="icon"
    >
      <g
        v-if="mode === 'dark'"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      >
        <circle
          cx="12"
          cy="12"
          r="4.2"
        />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </g>
      <path
        v-else
        d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 50%;
  color: inherit;
  cursor: pointer;
  transition: color .3s, background-color .3s;
}
.theme-toggle:hover {
  color: var(--color-accent);
  background: color-mix(in srgb, currentColor 8%, transparent);
}
.icon {
  width: 19px;
  height: 19px;
}
</style>
