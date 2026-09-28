/*
 * Scroll-driven motion for the folio, ported from the Claude Design prototype.
 * Elements opt in with data attributes, so components stay declarative:
 *
 *   data-reveal="<delay ms>"   fade/slide in once when scrolled into view
 *     + data-from="102%"       …as a masked line sliding up instead
 *     + data-wipe              …as a left-to-right clip wipe instead
 *   data-count="<n>"           count up when its revealed parent appears
 *                              (data-dec, data-pre, data-suf format it)
 *   data-px / data-py="<k>"    horizontal / vertical parallax factor
 *   data-scale                 image settles from 1.14 to 1 as it scrolls
 *   data-zoom                  "The Work" zoom section (see HomeWorkZoom)
 *   data-chapter="<label>"     label shown in the header while in view
 *   data-theme="dark"          header flips to dark while over this section
 */

type Chrome = {
  progress: HTMLElement | null
  chapter: HTMLElement | null
  header: HTMLElement | null
}

const EASE_OUT = 'cubic-bezier(.215,.61,.355,1)'
const DEFAULT_CHAPTER = 'Richie Patil'

let chrome: Chrome = { progress: null, chapter: null, header: null }
let observer: IntersectionObserver | null = null
let mutations: MutationObserver | null = null
let frame = 0
let holdUntil = 0

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const motionScale = () => (prefersReducedMotion() ? 0 : 1)
// Slightly quicker choreography on small screens.
const tempo = () => (window.innerWidth < 768 ? 0.86 : 1)

const countUp = (el: HTMLElement, delay: number) => {
  const target = parseFloat(el.dataset.count ?? '0')
  const decimals = Number(el.dataset.dec) || 0
  const prefix = el.dataset.pre ?? ''
  const suffix = el.dataset.suf ?? ''
  const duration = 1700 * tempo()
  let start = 0
  const step = (now: number) => {
    if (!start) start = now
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = prefix + (target * eased).toFixed(decimals) + suffix
    if (progress < 1) requestAnimationFrame(step)
  }
  setTimeout(() => requestAnimationFrame(step), delay)
}

const reveal = (el: HTMLElement) => {
  const wait = holdUntil - performance.now()
  if (wait > 0) {
    setTimeout(() => reveal(el), wait)
    return
  }
  if (el.hasAttribute('data-wipe')) {
    el.style.clipPath = 'inset(0 0 0 0)'
  } else {
    el.style.opacity = '1'
    el.style.transform = 'none'
  }
  if (!motionScale()) return
  const delay = parseInt(el.dataset.reveal ?? '0') || 0
  el.querySelectorAll<HTMLElement>('[data-count]').forEach(c => countUp(c, delay))
}

const prepareReveal = (el: HTMLElement) => {
  el.setAttribute('data-rv', '')
  if (!motionScale()) return
  const t = tempo()
  const delay = (parseInt(el.dataset.reveal ?? '0') || 0) * t
  if (el.hasAttribute('data-wipe')) {
    el.style.clipPath = 'inset(0 100% 0 0)'
    el.style.transition = `clip-path ${1.1 * t}s cubic-bezier(.65,0,.35,1) ${delay}ms`
  } else if (el.dataset.from) {
    el.style.transform = `translate3d(0,${el.dataset.from},0)`
    el.style.transition = `transform ${1.7 * t}s ${EASE_OUT} ${delay}ms`
  } else {
    el.style.opacity = '0'
    el.style.transform = 'translate3d(0,24px,0)'
    el.style.transition = `opacity ${1.2 * t}s ${EASE_OUT} ${delay}ms, transform ${1.4 * t}s ${EASE_OUT} ${delay}ms`
  }
  el.querySelectorAll<HTMLElement>('[data-count]').forEach((c) => {
    c.textContent = (c.dataset.pre ?? '') + '0' + (c.dataset.suf ?? '')
  })
  observer?.observe(el)
}

const scan = () => {
  document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rv])').forEach(prepareReveal)
}

const updateZoom = (vh: number, vw: number, k: number) => {
  const section = document.querySelector<HTMLElement>('[data-zoom]')
  if (!section) return
  const grid = section.querySelector<HTMLElement>('[data-zoom-grid]')
  const left = section.querySelector<HTMLElement>('[data-zoom-left]')
  const right = section.querySelector<HTMLElement>('[data-zoom-right]')
  const rect = section.getBoundingClientRect()
  const p = k ? Math.min(1, Math.max(0, -rect.top / (rect.height - vh))) : 1
  const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
  const scale = 0.22 + 0.78 * eased
  if (grid) grid.style.transform = `scale(${scale})`
  const offset = scale * vw / 2 + vw * 0.015
  if (left) left.style.transform = `translate3d(${-offset}px,0,0)`
  if (right) right.style.transform = `translate3d(${offset}px,0,0)`
}

const updateChrome = (vh: number) => {
  let label = DEFAULT_CHAPTER
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.4) label = el.dataset.chapter ?? label
  })
  if (chrome.chapter && chrome.chapter.textContent !== label) chrome.chapter.textContent = label

  const headerBottom = chrome.header?.offsetHeight ?? 64
  let dark = false
  document.querySelectorAll<HTMLElement>('[data-theme="dark"]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top <= headerBottom && r.bottom > headerBottom) dark = true
  })
  if (chrome.header) chrome.header.dataset.dark = String(dark)
}

const tick = () => {
  const k = motionScale()
  const y = window.scrollY
  const vh = window.innerHeight
  const vw = window.innerWidth
  const max = document.documentElement.scrollHeight - vh
  if (chrome.progress) chrome.progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`

  document.querySelectorAll<HTMLElement>('[data-px]').forEach((el) => {
    el.style.transform = `translate3d(${y * parseFloat(el.dataset.px ?? '0') * k}px,0,0)`
  })
  document.querySelectorAll<HTMLElement>('[data-py]').forEach((el) => {
    const r = el.parentElement!.getBoundingClientRect()
    el.style.transform = `translate3d(0,${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.py ?? '0') * k}px,0)`
  })
  document.querySelectorAll<HTMLElement>('[data-scale]').forEach((el) => {
    const r = el.parentElement!.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
    el.style.transform = `scale(${1 + 0.14 * (1 - p) * k})`
  })
  updateZoom(vh, vw, k)
  updateChrome(vh)
}

const requestTick = () => {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    tick()
  })
}

const refresh = () => {
  scan()
  tick()
}

const start = (elements: Chrome) => {
  chrome = elements
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      observer?.unobserve(entry.target)
      reveal(entry.target as HTMLElement)
    })
  }, { rootMargin: '0px 0px -10% 0px' })

  const main = document.querySelector('main')
  if (main) {
    mutations = new MutationObserver(() => {
      scan()
      requestTick()
    })
    mutations.observe(main, { childList: true, subtree: true })
  }
  window.addEventListener('scroll', requestTick, { passive: true })
  window.addEventListener('resize', requestTick)
  refresh()
}

const stop = () => {
  window.removeEventListener('scroll', requestTick)
  window.removeEventListener('resize', requestTick)
  observer?.disconnect()
  mutations?.disconnect()
  observer = null
  mutations = null
}

// Reveals queued while the intro overlay is up wait until it has lifted.
const holdRevealsFor = (ms: number) => {
  holdUntil = performance.now() + ms
}

export const useFolioMotion = () => ({
  start,
  stop,
  refresh,
  holdRevealsFor,
  motionScale,
  tempo
})
