/*
 * Starts the garden (scene.ts, loaded on demand so a visitor without WebGL
 * never downloads three.js), lets a tap on the flower shake petals loose,
 * and pauses it while the tab is hidden. Without WebGL the hero is simply
 * the name and the words on the paper.
 */
const canvas = document.getElementById('garden') as HTMLCanvasElement | null
const anchor = document.querySelector<HTMLElement>('[data-bloom]')

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const boot = async () => {
  if (!canvas || !anchor || !hasWebGL()) return
  const html = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  html.classList.add('garden-on')
  const { createGarden } = await import('./scene')
  let garden: ReturnType<typeof createGarden>
  try {
    garden = createGarden({ canvas, anchor, reduced, compact })
  } catch {
    // Context lost or refused: the hero stays words only.
    html.classList.remove('garden-on')
    return
  }
  anchor.addEventListener('click', () => garden.burst())
  window.addEventListener('resize', () => garden.resize())
  document.addEventListener('visibilitychange', () => garden.setVisible(!document.hidden))
  garden.start()
  requestAnimationFrame(() => html.classList.add('garden-ready'))
}

void boot()
