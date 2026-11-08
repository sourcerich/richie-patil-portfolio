const frame = document.getElementById('flower-bg')
const root = document.documentElement
const stage = document.getElementById('main')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms))

// ── the scene behind the page: the same scene as the hero page, with the title drawn by the engine ──

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

let queued = false
const queue = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    post()
  })
}

let introDone = false
let englishQueued = false

// the title reads Marathi first and turns into English a moment after the page appears
const showEnglish = async () => {
  if (englishQueued || reduced || !introDone || !root.classList.contains('engine-text')) return
  englishQueued = true
  await sleep(1600)
  if (stage.dataset.stage === 'idle') setMorph(1)
}

const reveal = () => {
  root.classList.add('intro-done')
  introDone = true
  void showEnglish()
}

const gl = document.createElement('canvas').getContext('webgl2')
if (!gl) reveal()
window.setTimeout(reveal, 45000)

for (const type of ['pointermove', 'pointerdown', 'pointerup']) {
  window.addEventListener(type, forward, { passive: true })
}
window.addEventListener('resize', queue)
void document.fonts.ready.then(queue)

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return
  if (event.data?.type === 'ready') queue()
  if (event.data?.type === 'words-ready') {
    root.classList.add('engine-text')
    void showEnglish()
  }
  if (event.data?.type === 'intro-done') reveal()
})

// ── the diyas ────────────────────────────────────────────────────────────────

const template = document.getElementById('diya-tpl')
const lead = document.getElementById('lead')
const field = document.getElementById('field')
const status = document.getElementById('status')
const splat = document.getElementById('splat')
const title = document.getElementById('title')
const wishesWrap = document.getElementById('wishes-wrap')
const wishesTitle = document.getElementById('wishes-title')
const announce = document.getElementById('announce')

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

// ── sparks: a few gold dots drift up from every lit flame ────────────────────

const canvas = document.getElementById('sparks')
const ctx = canvas.getContext('2d')
const MAX_SPARKS = 60
let sparks = []
let flames = []
let ratio = 1
let sparkTimer = 0

const sizeCanvas = () => {
  ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(window.innerWidth * ratio)
  canvas.height = Math.round(window.innerHeight * ratio)
}
sizeCanvas()
window.addEventListener('resize', sizeCanvas)

const collectFlames = () => {
  flames = Array.from(document.querySelectorAll('.diya.is-lit .flame')).map((el) => {
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.2 }
  })
}

// about 12 frames a second, like the stepped wobble of the drawing
const stepSparks = () => {
  if (document.hidden) return
  if (flames.length && sparks.length < MAX_SPARKS) {
    for (let n = 0; n < 3 && sparks.length < MAX_SPARKS; n++) {
      const flame = flames[Math.floor(Math.random() * flames.length)]
      sparks.push({
        x: flame.x + (Math.random() - 0.5) * 8,
        y: flame.y,
        vx: (Math.random() - 0.5) * 3,
        vy: -(1.6 + Math.random() * 2.4),
        life: 0,
        max: 14 + Math.random() * 14,
        r: 1.6 + Math.random() * 2.2
      })
    }
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  sparks = sparks.filter(spark => spark.life < spark.max)
  for (const spark of sparks) {
    spark.life++
    spark.x += spark.vx
    spark.y += spark.vy
    spark.vx += (Math.random() - 0.5) * 0.8
    const fade = 1 - spark.life / spark.max
    ctx.globalAlpha = Math.max(0, fade)
    ctx.fillStyle = spark.life % 2 ? '#ffd24d' : '#e8590c'
    ctx.beginPath()
    ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = '#4a2315'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const startSparks = () => {
  if (reduced || sparkTimer) return
  sparkTimer = window.setInterval(() => {
    collectFlames()
    stepSparks()
  }, 83)
}

// ── light a diya, then the wishes ────────────────────────────────────────────

const swapTitle = async () => {
  // back to the Marathi word, change the words, then turn them into English again
  if (!reduced) {
    setMorph(0)
    await sleep(750)
  }
  const [first, second] = title.querySelectorAll('.ch')
  first.textContent = 'दिवाळीच्या'
  first.dataset.alt = 'Diwali'
  second.textContent = 'शुभेच्छा'
  second.dataset.alt = 'wishes'
  title.setAttribute('aria-label', 'Diwali wishes')
  queue()
  await sleep(500)
  if (!reduced) setMorph(1)
}

const showWishes = async () => {
  await sleep(reduced ? 0 : 900)
  stage.dataset.stage = 'wishes'
  wishesWrap.removeAttribute('aria-hidden')
  announce.textContent = 'Diya lit. Diwali wishes:'
  wishesTitle.focus({ preventScroll: true })
  await swapTitle()
}

const light = () => {
  if (lit) return
  lit = true
  stage.dataset.stage = 'lighting'
  const total = small.length + 1
  let count = 0
  status.setAttribute('aria-live', 'off')
  const show = () => {
    status.textContent = count < total ? `${count} lit…` : `${total} diyas lit`
  }
  const ignite = (el, delay) => {
    el.style.setProperty('--flick', `-${(Math.random() * 0.9).toFixed(2)}s`)
    window.setTimeout(() => {
      el.classList.add('is-lit')
      count++
      show()
      if (count >= total) {
        status.setAttribute('aria-live', 'polite')
        void showWishes()
      }
    }, reduced ? 0 : delay)
  }

  startSparks()
  splat.classList.add('is-on')
  ignite(lead, 0)

  // the flame travels outwards: the further a diya is from the first one, the later it catches
  const from = lead.querySelector('svg').getBoundingClientRect()
  const cx = from.left + from.width / 2
  const cy = from.top + from.height * 0.3
  for (const diya of small) {
    const rect = diya.getBoundingClientRect()
    const distance = Math.hypot(rect.left + rect.width / 2 - cx, rect.top + rect.height * 0.3 - cy)
    ignite(diya, 650 + distance * 1.15 + Math.random() * 140)
  }
}

lead.addEventListener('click', light)
