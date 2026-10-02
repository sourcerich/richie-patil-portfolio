/*
 * Page transition across real page loads. Clicking an internal link raises
 * a copper panel carrying the destination's name in English and Marathi,
 * then navigates. The next page starts covered (the inline script in
 * Base.astro sees the sessionStorage flag and sets html[data-wipe] before
 * first paint, and that page renders its own name in the panel), then the
 * panel lifts away through the top. Skipped with reduced motion.
 */
import { cleanPath, wipeName } from '../site'

const COVER_MS = 720
const LIFT_DELAY_MS = 180
const EASE = 'cubic-bezier(.77,0,.175,1)'

const root = document.documentElement
const wipe = document.getElementById('page-wipe')
const en = document.getElementById('page-wipe-en')
const mr = document.getElementById('page-wipe-mr')
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const reset = () => {
  if (!wipe) return
  wipe.style.transition = 'none'
  wipe.style.clipPath = ''
  delete root.dataset.wipe
}

// Lift the cover this page loaded under.
if (wipe && 'wipe' in root.dataset) {
  setTimeout(() => {
    wipe.style.transition = `clip-path .7s ${EASE}`
    wipe.style.clipPath = 'inset(0 0 100% 0)'
    wipe.addEventListener('transitionend', reset, { once: true })
  }, LIFT_DELAY_MS)
}

document.addEventListener('click', (e) => {
  if (!wipe || !en || !mr || reduced()) return
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const link = (e.target as Element | null)?.closest('a')
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return
  const url = new URL(link.href, location.href)
  if (url.origin !== location.origin) return
  // Same page (including #anchor links): let the browser handle it.
  if (cleanPath(url.pathname) === cleanPath(location.pathname)) return

  e.preventDefault()
  const name = wipeName(url.pathname)
  en.textContent = name.en
  mr.textContent = name.mr
  wipe.style.transition = 'none'
  wipe.style.clipPath = 'inset(100% 0 0 0)'
  void wipe.offsetWidth
  wipe.style.transition = `clip-path .7s ${EASE}`
  wipe.style.clipPath = 'inset(0 0 0 0)'
  try {
    sessionStorage.setItem('wipe', '1')
  } catch {
    // Storage disabled: the next page just appears without the lift.
  }
  setTimeout(() => location.assign(url.href), COVER_MS)
})

// Coming back with the Back button restores this page from the cache with
// the panel still up; drop it.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) reset()
})
