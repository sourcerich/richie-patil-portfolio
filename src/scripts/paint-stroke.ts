/*
 * Scroll-led brush paint, driven by GSAP ScrollTrigger. Any element with
 * [data-paint] gets painted in as you scroll it into view: one continuous,
 * wide brush stroke that zigzags back and forth, each pass rising to the
 * right, working from the top-left corner down to the bottom-right, like
 * painting a wall. Passes overlap, so no paper shows between them; only the
 * outer edges are rough, with dry-brush streaks running along the stroke.
 * The element is pinned while it paints, so the whole stroke plays out on
 * screen at a steady pace. The words inside [data-paint-text] come into
 * focus during the paint, one after another in reading order: each starts
 * blurred and invisible, the starts are staggered, and every word lands
 * sharp at the moment the paint finishes. Then the section holds a little
 * before the page scrolls on. All of it follows the scroll, so scrolling
 * back up reverses it.
 *
 * Built as SVG: a wide round-capped path revealed with stroke-dashoffset,
 * drawn in a rotated frame so a stretched turbulence + displacement filter
 * makes streaks that follow the stroke. Without JS, or with reduced motion,
 * the element keeps its plain CSS background (.paintable, added here,
 * clears it).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis } from './smooth-scroll'

gsap.registerPlugin(ScrollTrigger)
// Update scroll-linked animations on the same frame the smooth scroll moves.
lenis?.on('scroll', ScrollTrigger.update)

const SVG = 'http://www.w3.org/2000/svg'
const ANGLE = -0.42 // radians: passes rise to the right
const PASSES = 4 // roughly how many passes cover the element
let uid = 0

const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  return el
}

// Wrap every word under `root` in its own span (spaces stay as plain text,
// so line breaking and copy-paste are unchanged) and return the spans in
// reading order.
const splitWords = (root: HTMLElement) => {
  const words: HTMLElement[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    if (!node.data.trim()) continue
    const frag = document.createDocumentFragment()
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) {
        frag.append(part)
        continue
      }
      const span = document.createElement('span')
      span.className = 'paint-word'
      span.textContent = part
      frag.append(span)
      words.push(span)
    }
    node.replaceWith(frag)
  }
  return words
}

const paint = (el: HTMLElement) => {
  const id = `paint-${uid++}`
  const svg = svgEl('svg', { 'class': 'paint-stroke', 'aria-hidden': 'true' })
  const filter = svgEl('filter', { id, filterUnits: 'userSpaceOnUse' })
  filter.append(
    // Stretched along the stroke (low x, high y frequency): streaks, like
    // the dry edge of a loaded brush.
    svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.004 0.06', numOctaves: 3, seed: 9, result: 'noise' }),
    svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: 46, xChannelSelector: 'R', yChannelSelector: 'G' })
  )
  const defs = svgEl('defs')
  defs.append(filter)
  // The stroke lives in a frame rotated to the stroke direction.
  const frame = svgEl('g', { transform: `rotate(${(ANGLE * 180) / Math.PI})` })
  const path = svgEl('path', {
    'fill': 'none',
    'stroke': 'var(--paint)',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'filter': `url(#${id})`
  })
  frame.append(path)
  // Closes any last specks at the very end.
  const finish = svgEl('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: 'var(--paint)', opacity: 0 })
  svg.append(defs, frame, finish)
  el.prepend(svg)
  el.classList.add('paintable')

  let length = 0
  const layout = () => {
    const w = el.clientWidth
    const h = el.clientHeight
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    // Element corners in the rotated frame (u along a pass, v across).
    const cos = Math.cos(ANGLE)
    const sin = Math.sin(ANGLE)
    const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => ({ u: x * cos + y * sin, v: -x * sin + y * cos }))
    const uMin = Math.min(...corners.map(c => c.u))
    const uMax = Math.max(...corners.map(c => c.u))
    const vMin = Math.min(...corners.map(c => c.v))
    const vMax = Math.max(...corners.map(c => c.v))

    const spacing = (vMax - vMin) / PASSES
    const width = spacing * 1.7 // wide overlap: no gaps between passes
    // Turn around well outside the element so the turns never show.
    const pad = width * 0.6 + 60
    const left = uMin - pad
    const right = uMax + pad
    const rows = Math.ceil((vMax - vMin) / spacing) + 1
    let d = ''
    for (let i = 0; i < rows; i++) {
      const v = vMin + spacing * (i + 0.15)
      const [a, b] = i % 2 ? [right, left] : [left, right]
      d += i ? ` L${a},${v}` : `M${a},${v}`
      d += ` L${b},${v}`
    }
    path.setAttribute('d', d)
    path.setAttribute('stroke-width', String(width))
    filter.setAttribute('x', String(left - width))
    filter.setAttribute('y', String(vMin - width * 1.5))
    filter.setAttribute('width', String(right - left + width * 2))
    filter.setAttribute('height', String(vMax - vMin + width * 3))
    length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
  }

  const state = { p: 0 }
  const render = () => {
    path.style.strokeDashoffset = String(length * (1 - state.p))
    finish.setAttribute('opacity', String(Math.min(1, Math.max(0, (state.p - 0.94) / 0.06))))
  }

  layout()
  render()
  // The section stays pinned for the whole sequence, measured in screens
  // of scrolling: the paint (with the words focusing in), then a short
  // pause so they can be read before the page moves on.
  const PAINT = 1.6
  const HOLD = 0.35
  // The first word starts focusing this far into the paint, the last one
  // this far; all of them finish with the paint.
  const FIRST_WORD = 0.3
  const LAST_WORD = 0.7
  const words = [...el.querySelectorAll<HTMLElement>('[data-paint-text]')].flatMap(splitWords)
  gsap.set(words, { opacity: 0, filter: 'blur(14px)' })
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: () => (el.offsetHeight > window.innerHeight ? 'top top' : 'center center'),
      end: () => `+=${Math.round(window.innerHeight * (PAINT + HOLD))}`,
      pin: true,
      invalidateOnRefresh: true,
      // Follows the scroll with a little glide of its own; the smooth
      // scroll already eases the input, so this is lighter than before.
      scrub: 0.6
    }
  })
  // Even speed along the stroke, like a steady hand.
  timeline.to(state, { p: 1, duration: PAINT, ease: 'none', onUpdate: render }, 0)
  words.forEach((word, i) => {
    const at = PAINT * (FIRST_WORD + (LAST_WORD - FIRST_WORD) * (words.length > 1 ? i / (words.length - 1) : 0))
    timeline.to(word, { opacity: 1, filter: 'blur(0px)', duration: PAINT - at, ease: 'power2.out' }, at)
  })
  // Nothing moves here: the finished section just stays put.
  timeline.to({}, { duration: HOLD }, PAINT)
  new ResizeObserver(() => {
    layout()
    render()
  }).observe(el)
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll<HTMLElement>('[data-paint]').forEach(paint)
}
