const frame = document.getElementById('flower-bg')
const root = document.documentElement
const stage = document.getElementById('main')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const lead = document.getElementById('lead')
const title = document.getElementById('title')
const wishesWrap = document.getElementById('wishes-wrap')
const wishesTitle = document.getElementById('wishes-title')
const announce = document.getElementById('announce')

// The diyas, the toran, the sparks and the wish are all drawn by the scene. This page lays out the title the engine
// draws, keeps an invisible button over the big diya, and swaps the title when the last diya has caught.

const forward = (event) => {
  const target = frame?.contentWindow
  if (!target) return
  target.dispatchEvent(new target.PointerEvent(event.type, {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    button: event.button,
    buttons: event.buttons,
    isPrimary: event.isPrimary,
    bubbles: true
  }))
}

const words = () => Array.from(document.querySelectorAll('[data-engine-word]')).map((el, i) => {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  return {
    id: `mr-${i}`,
    text: el.textContent.trim(),
    single: true,
    center: true,
    alt: el.dataset.alt,
    font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    size: parseFloat(style.fontSize),
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height
  }
})

const post = () => {
  frame?.contentWindow?.postMessage({ type: 'words', reduced, words: words() }, location.origin)
}

let queued = false
const queue = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    post()
  })
}

const reveal = () => {
  root.classList.add('intro-done')
}

const gl = document.createElement('canvas').getContext('webgl2')
if (!gl) reveal()
window.setTimeout(reveal, 45000)

for (const type of ['pointermove', 'pointerdown', 'pointerup']) {
  window.addEventListener(type, forward, { passive: true })
}
window.addEventListener('resize', queue)
void document.fonts.ready.then(queue)

// a moment after the tap, while the flames are still spreading, the title becomes "शुभ दीपावली"
const TITLE_DELAY = 1000

const swapTitle = () => {
  const [first, second] = title.querySelectorAll('.ch')
  first.textContent = 'शुभ'
  second.textContent = 'दीपावली'
  title.setAttribute('aria-label', 'शुभ दीपावली')
  queue()
}

// when the last diya has caught: the wish is announced and its heading takes focus
const showWishes = () => {
  stage.dataset.stage = 'wishes'
  wishesWrap.removeAttribute('aria-hidden')
  announce.textContent = 'Diya lit. Shubh Deepavali. May your home glow with light and laughter, today and all year.'
  wishesTitle.focus({ preventScroll: true })
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return
  const { type } = event.data ?? {}
  if (type === 'ready') queue()
  if (type === 'words-ready') root.classList.add('engine-text')
  if (type === 'intro-done') reveal()
  if (type === 'diya-layout') {
    const { x, y, w, h } = event.data.lead
    Object.assign(lead.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` })
    lead.hidden = false
  }
  if (type === 'diya-lit-all') showWishes()
})

lead.addEventListener('click', () => {
  if (stage.dataset.stage !== 'idle') return
  stage.dataset.stage = 'lighting'
  lead.classList.add('is-lit')
  frame?.contentWindow?.postMessage({ type: 'light' }, location.origin)
  window.setTimeout(swapTitle, reduced ? 0 : TITLE_DELAY)
})
