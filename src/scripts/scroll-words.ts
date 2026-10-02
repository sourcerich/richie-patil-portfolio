/*
 * Scroll-linked word reveal: inside [data-scroll-words], each word starts
 * faint and fills in to full ink as the paragraph moves up the screen, in
 * reading order, so the text "reads itself" as you scroll. Scrolling back
 * up fades them back. Tied to the real scroll position, so Lenis smoothing
 * applies.
 *
 * Words are wrapped in spans by walking the text nodes (spaces stay text),
 * so wrapping, copy-paste and screen readers are unchanged. Without JS, or
 * with reduced motion, the paragraph is simply shown.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Faintest a word gets before its turn.
const FLOOR = 0.16
// The reveal runs while the paragraph's top travels from START to END
// (fractions of the viewport height from the top).
const START = 0.85
const END = 0.35
// How many words fill at once, as a share of the whole paragraph.
const SPREAD = 0.18

const split = (root: HTMLElement) => {
  const words: HTMLElement[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text)
  for (const node of nodes) {
    const frag = document.createDocumentFragment()
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) {
        frag.append(part)
        continue
      }
      const span = document.createElement('span')
      span.className = 'sw'
      span.textContent = part
      frag.append(span)
      words.push(span)
    }
    node.replaceWith(frag)
  }
  return words
}

for (const el of document.querySelectorAll<HTMLElement>('[data-scroll-words]')) {
  if (reduced) continue
  const words = split(el)
  const n = words.length
  if (!n) continue
  el.classList.add('is-scroll-words')

  let frame = 0
  const update = () => {
    frame = 0
    const vh = window.innerHeight
    const top = el.getBoundingClientRect().top
    const p = Math.min(1, Math.max(0, (vh * START - top) / (vh * (START - END))))
    // Spread the words along the progress so each has a short window.
    const span = 1 + SPREAD
    words.forEach((w, i) => {
      const local = (p * span - (i / n)) / SPREAD
      const t = Math.min(1, Math.max(0, local))
      w.style.opacity = String(FLOOR + (1 - FLOOR) * t)
    })
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
}

export {}
