/*
 * Scroll reveals. Elements opt in with data attributes:
 *
 *   data-reveal="<delay ms>"   fade and rise once when scrolled into view
 *     + data-from="105%"       …or slide up from behind a .mask-line instead
 *
 * Content is prerendered visible. CSS hides [data-reveal] only once JS is
 * running (html.js), and this sets the start state before revealing, so
 * there is no flash. With reduced motion everything simply shows.
 */

const EASE_OUT = 'cubic-bezier(.215,.61,.355,1)'

let observer: IntersectionObserver | null = null
// What each observed element reveals (a mask reveals the line inside it).
const targets = new WeakMap<Element, HTMLElement>()
let mutations: MutationObserver | null = null

const motionScale = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1)

const reveal = (el: HTMLElement) => {
  el.style.opacity = '1'
  el.style.transform = 'none'
}

const prepare = (el: HTMLElement) => {
  el.setAttribute('data-rv', '')
  if (!motionScale()) return
  const delay = parseInt(el.dataset.reveal ?? '0') || 0
  if (el.dataset.from) {
    el.style.transform = `translate3d(0,${el.dataset.from},0)`
    el.style.transition = `transform 1.3s ${EASE_OUT} ${delay}ms`
  } else {
    el.style.opacity = '0'
    el.style.transform = 'translate3d(0,18px,0)'
    el.style.transition = `opacity 1s ${EASE_OUT} ${delay}ms, transform 1.1s ${EASE_OUT} ${delay}ms`
  }
  // A masked line starts pushed out of its mask, so it is clipped away and
  // can never be "in view" by itself; near the end of a page it would never
  // fire. Watch the mask instead.
  const watched = el.dataset.from ? el.closest<HTMLElement>('.mask-line') ?? el : el
  targets.set(watched, el)
  observer?.observe(watched)
}

const scan = () => {
  document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rv])').forEach(prepare)
}

const start = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      observer?.unobserve(entry.target)
      reveal(targets.get(entry.target) ?? entry.target as HTMLElement)
    })
  }, { rootMargin: '0px 0px -6% 0px' })
  mutations = new MutationObserver(scan)
  mutations.observe(document.body, { childList: true, subtree: true })
  scan()
}

const stop = () => {
  observer?.disconnect()
  mutations?.disconnect()
  observer = null
  mutations = null
}

export const useReveal = () => ({ start, stop, refresh: scan, motionScale })
