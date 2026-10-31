const SVG = 'http://www.w3.org/2000/svg'
const ANGLE = -0.42
const PASSES = 3
const PAINT_MS = 700
const BOIL_MS = 160

const scroller = document.getElementById('scroller')
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a'))
const sections = links
  .map(link => document.querySelector<HTMLElement>(link.getAttribute('href') ?? ''))
  .filter((el): el is HTMLElement => !!el)
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  return el
}

interface Brush {
  svg: SVGSVGElement
  paths: SVGPathElement[]
  boil: () => void
  layout: () => void
  length: () => number
}

let uid = 0

const build = (link: HTMLAnchorElement): Brush => {
  const id = `nav-paint-${uid++}`
  const label = link.textContent?.trim() ?? ''
  const svg = svgEl('svg', { 'class': 'nav-paint', 'aria-hidden': 'true' })
  const filter = svgEl('filter', { id: `${id}-f`, filterUnits: 'userSpaceOnUse' })
  const turbulence = svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.01 0.22', numOctaves: 2, seed: 9, result: 'noise' })
  const displace = svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', xChannelSelector: 'R', yChannelSelector: 'G' })
  filter.append(turbulence, displace)
  const wiggle = svgEl('filter', { id: `${id}-w`, filterUnits: 'userSpaceOnUse' })
  const wiggleNoise = svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: 1, seed: 1, result: 'wobble' })
  const wiggleShift = svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'wobble', xChannelSelector: 'R', yChannelSelector: 'G' })
  wiggle.append(wiggleNoise, wiggleShift)
  const mask = svgEl('mask', { id: `${id}-m`, maskUnits: 'userSpaceOnUse' })
  const defs = svgEl('defs')
  defs.append(filter, wiggle, mask)

  const strokeAttrs = { 'fill': 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'filter': `url(#${id}-f)` }
  const outer = svgEl('g', { filter: `url(#${id}-w)` })
  const clipped = svgEl('g')
  const frame = svgEl('g')
  const paint = svgEl('path', { ...strokeAttrs, stroke: 'var(--rust)' })
  frame.append(paint)
  clipped.append(frame)
  outer.append(clipped)
  const maskClipped = svgEl('g')
  const maskFrame = svgEl('g')
  const maskPath = svgEl('path', { ...strokeAttrs, stroke: '#fff' })
  maskFrame.append(maskPath)
  maskClipped.append(maskFrame)
  mask.append(maskClipped)
  const text = svgEl('text', { mask: `url(#${id}-m)` })
  text.textContent = label
  svg.append(defs, outer, text)
  link.append(svg)

  const paths = [paint, maskPath]
  let length = 0

  const layout = () => {
    const w = svg.clientWidth
    const h = svg.clientHeight
    if (!w || !h) return
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    mask.setAttribute('x', '0')
    mask.setAttribute('y', '0')
    mask.setAttribute('width', String(w))
    mask.setAttribute('height', String(h))
    wiggle.setAttribute('x', String(-w))
    wiggle.setAttribute('y', String(-h))
    wiggle.setAttribute('width', String(w * 3))
    wiggle.setAttribute('height', String(h * 3))
    wiggleShift.setAttribute('scale', String(Math.max(2, h * 0.09)))
    text.setAttribute('x', String(w / 2))
    text.setAttribute('y', String(h / 2))
    const rotation = `rotate(${(ANGLE * 180) / Math.PI})`
    frame.setAttribute('transform', rotation)
    maskFrame.setAttribute('transform', rotation)
    const cos = Math.cos(ANGLE)
    const sin = Math.sin(ANGLE)
    const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => ({ u: x * cos + y * sin, v: -x * sin + y * cos }))
    const uMin = Math.min(...corners.map(c => c.u))
    const uMax = Math.max(...corners.map(c => c.u))
    const vMin = Math.min(...corners.map(c => c.v))
    const vMax = Math.max(...corners.map(c => c.v))
    const spacing = (vMax - vMin) / PASSES
    const width = spacing * 1.35
    const inset = width * 0.15
    const left = uMin + inset
    const right = uMax - inset
    const rows = PASSES
    let d = ''
    for (let i = 0; i < rows; i++) {
      const v = vMin + spacing * (i + 0.5)
      const [a, b] = i % 2 ? [right, left] : [left, right]
      d += i ? ` L${a},${v}` : `M${a},${v}`
      d += ` L${b},${v}`
    }
    for (const path of paths) {
      path.setAttribute('d', d)
      path.setAttribute('stroke-width', String(width))
    }
    filter.setAttribute('x', String(left - width))
    filter.setAttribute('y', String(vMin - width * 1.5))
    filter.setAttribute('width', String(right - left + width * 2))
    filter.setAttribute('height', String(vMax - vMin + width * 3))
    displace.setAttribute('scale', String(h * 0.14))
    length = paint.getTotalLength()
    for (const path of paths) path.style.strokeDasharray = String(length)
  }

  let seed = 1
  const boil = () => {
    seed = (seed % 5) + 1
    wiggleNoise.setAttribute('seed', String(seed))
  }

  return { svg, paths, boil, layout, length: () => length }
}

const brushes = links.map(build)
const setProgress = (brush: Brush, done: boolean, animate: boolean) => {
  for (const path of brush.paths) {
    path.style.transition = animate ? `stroke-dashoffset ${PAINT_MS}ms linear` : 'none'
    path.style.strokeDashoffset = String(done ? 0 : brush.length())
  }
}

const layoutAll = () => {
  brushes.forEach((brush, i) => {
    brush.layout()
    setProgress(brush, links[i].getAttribute('aria-current') === 'true', false)
  })
}

let current = -1
let boilTimer = 0

const syncBoil = () => {
  window.clearInterval(boilTimer)
  if (reduced || current < 0) return
  const active = brushes[current]
  boilTimer = window.setInterval(() => active.boil(), BOIL_MS)
}

const mark = (index: number) => {
  current = index
  syncBoil()
  links.forEach((link, i) => {
    const active = i === index
    const was = link.getAttribute('aria-current') === 'true'
    link.setAttribute('aria-current', String(active))
    const brush = brushes[i]
    if (active && !was) {
      brush.svg.style.opacity = '1'
      setProgress(brush, false, false)
      void brush.svg.getBoundingClientRect()
      setProgress(brush, true, !reduced)
    } else if (!active && was) {
      brush.svg.style.opacity = '0'
      window.setTimeout(() => {
        if (links[i].getAttribute('aria-current') !== 'true') setProgress(brush, false, false)
        brush.svg.style.opacity = '1'
      }, 280)
    }
  })
}

const spy = () => {
  if (!scroller) return
  const line = scroller.clientHeight * 0.4
  let index = -1
  sections.forEach((section, i) => {
    if (section.getBoundingClientRect().top <= line) index = i
  })
  if (index !== current) mark(index)
}

if (scroller && links.length) {
  layoutAll()
  scroller.addEventListener('scroll', spy, { passive: true })
  window.addEventListener('resize', layoutAll)
  void document.fonts.ready.then(layoutAll)
  spy()
}

export {}
