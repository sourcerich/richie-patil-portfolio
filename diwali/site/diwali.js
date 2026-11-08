const frame = document.getElementById('flower-bg')
const root = document.documentElement
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── the scene behind the page ────────────────────────────────────────────────

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

const setMorph = (value) => {
  frame?.contentWindow?.postMessage({ type: 'morph', value }, location.origin)
}

// the title reads Marathi first, then turns into English, then back, for as long as the page is open
let swapping = false
const startSwapping = () => {
  if (swapping || reduced) return
  swapping = true
  let english = false
  window.setTimeout(() => {
    window.setInterval(() => {
      english = !english
      setMorph(english ? 1 : 0)
    }, 3800)
    english = true
    setMorph(1)
  }, 1800)
}

const reveal = () => {
  root.classList.add('intro-done')
  if (root.classList.contains('engine-text')) startSwapping()
}

const gl = document.createElement('canvas').getContext('webgl2')
if (!gl) reveal()
window.setTimeout(reveal, 45000)

for (const type of ['pointermove', 'pointerdown', 'pointerup']) {
  window.addEventListener(type, forward, { passive: true })
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

window.addEventListener('resize', queue)
void document.fonts.ready.then(queue)

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return
  if (event.data?.type === 'ready') queue()
  if (event.data?.type === 'words-ready') {
    root.classList.add('engine-text')
    if (root.classList.contains('intro-done')) startSwapping()
  }
  if (event.data?.type === 'intro-done') reveal()
})

// ── the diyas ────────────────────────────────────────────────────────────────

const template = document.getElementById('diya-tpl')
const lead = document.getElementById('lead')
const field = document.getElementById('field')
const status = document.getElementById('status')

const art = () => template.content.cloneNode(true)

const rowCounts = () => {
  const width = window.innerWidth
  if (width >= 900) return [5, 7, 9, 11]
  if (width >= 600) return [5, 7, 9]
  return [3, 5, 7]
}

let small = []
let lit = false

const build = () => {
  if (lit) return
  field.replaceChildren()
  small = []
  for (const count of rowCounts()) {
    const row = document.createElement('div')
    row.className = 'row'
    for (let i = 0; i < count; i++) {
      const diya = document.createElement('span')
      diya.className = 'diya'
      diya.append(art())
      row.append(diya)
      small.push(diya)
    }
    field.append(row)
  }
}

lead.append(art())
build()
window.addEventListener('resize', build)

const light = () => {
  if (lit) return
  lit = true
  const total = small.length + 1
  let count = 0
  status.setAttribute('aria-live', 'off')
  const show = () => {
    status.textContent = count < total ? `${count} lit…` : `${total} diyas lit · Shubh Deepavali`
    if (count >= total) status.setAttribute('aria-live', 'polite')
  }
  const ignite = (el, delay) => {
    el.style.setProperty('--flick', `-${(Math.random() * 0.9).toFixed(2)}s`)
    window.setTimeout(() => {
      el.classList.add('is-lit')
      count++
      show()
    }, reduced ? 0 : delay)
  }

  ignite(lead, 0)
  window.setTimeout(() => document.body.classList.add('lit'), reduced ? 0 : 500)

  // the flame travels outwards: the further a diya is from the first one, the later it catches
  const from = lead.getBoundingClientRect()
  const cx = from.left + from.width / 2
  const cy = from.top + from.height * 0.3
  for (const diya of small) {
    const rect = diya.getBoundingClientRect()
    const distance = Math.hypot(rect.left + rect.width / 2 - cx, rect.top + rect.height * 0.3 - cy)
    ignite(diya, 650 + distance * 1.15 + Math.random() * 140)
  }
}

lead.addEventListener('click', light)
