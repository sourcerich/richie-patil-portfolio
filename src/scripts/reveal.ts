/*
 * Scroll reveals. Elements opt in with data attributes:
 *
 *   data-reveal="<delay ms>"   fade and rise once when scrolled into view
 *     + data-from="105%"       …or slide up from behind a .mask-line instead
 *
 * Content is prerendered visible. CSS hides [data-reveal] only once JS is
 * running (html.js, set before first paint), and this sets the start state
 * before revealing, so there is no flash. With reduced motion everything
 * simply shows.
 */

const EASE_OUT = 'cubic-bezier(.215,.61,.355,1)'
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// What each observed element reveals (a mask reveals the line inside it).
const targets = new WeakMap<Element, HTMLElement>()

const reveal = (el: HTMLElement) => {
  el.style.opacity = '1'
  el.style.transform = 'none'
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    observer.unobserve(entry.target)
    reveal(targets.get(entry.target) ?? entry.target as HTMLElement)
  }
}, { rootMargin: '0px 0px -6% 0px' })

for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
  el.setAttribute('data-rv', '')
  if (reduced) continue
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
  observer.observe(watched)
}
