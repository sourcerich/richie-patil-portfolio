/*
 * Draws the Start page ticker as a dot-matrix LED board, like the train
 * indicators at Mumbai local stations.
 *
 * The phrases are rendered once, in the site's fonts, into a bitmap only
 * ROWS pixels tall; every pixel that comes out mostly inked becomes a lit
 * LED. That works for any script (Devanagari, Arabic, Chinese) without a
 * hand-made LED font. Each frame the board shows a window of that bitmap
 * and steps it left by whole LED columns, never in between, the way a real
 * board scrolls. A grid of unlit LEDs sits under the lit ones.
 *
 * Paused on hover and while off screen; static under reduced motion.
 */
type Phrase = { lang: string, text: string }

// LED rows on the board, and the largest font size drawn into them. The
// size shrinks further if any phrase's tallest marks (Devanagari matras
// above and below, Chinese, accents) wouldn't fit inside the rows. 18 rows
// give the denser scripts enough dots for their detail.
const ROWS = 18
const FONT_PX = 12.5
// Board height in CSS px (desktop, phone); the LED pitch is this / ROWS.
const HEIGHT = 42
const HEIGHT_PHONE = 34
// Scroll speed in CSS px per second; it still steps whole LED columns.
const SPEED = 100
// Lit when the rendered pixel is at least this opaque (0-255).
const INK = 88
const SEPARATOR = '   •   '

// Bold strokes merge in dense scripts (Chinese and Japanese characters,
// Devanagari and Bengali conjuncts, Arabic dots), so those are drawn
// lighter; Latin and Cyrillic stay semibold so they hold up as dots.
const WEIGHTS: Record<string, number> = { zh: 400, ja: 400, hi: 400, mr: 400, bn: 400, ar: 400, ru: 500 }
const weightOf = (lang: string) => WEIGHTS[lang] ?? 600

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

type Bitmap = { bits: Uint8Array, width: number }

const fontAt = (px: number, weight = 600) =>
  `${weight} ${px}px "Instrument Sans", Eczar, system-ui, sans-serif`

async function renderBitmap(phrases: Phrase[]): Promise<Bitmap> {
  // Fonts used only on the canvas aren't fetched by the page on their own.
  const weights = [...new Set([600, ...phrases.map(p => weightOf(p.lang))])]
  await Promise.all([
    ...weights.map(w => document.fonts.load(fontAt(FONT_PX, w), 'Available')),
    ...weights.map(w => document.fonts.load(`${w} ${FONT_PX}px Eczar`, 'मैं'))
  ]).catch(() => {})

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  let size = FONT_PX
  const use = (weight: number) => {
    ctx.font = fontAt(size, weight)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#000'
  }
  const items = phrases.map(p => ({ ...p, weight: weightOf(p.lang) }))

  // The ink's real extent above and below the baseline, over every phrase.
  const extent = () => {
    let up = 0
    let down = 0
    for (const p of [...items, { text: SEPARATOR, weight: 600 }]) {
      use(p.weight)
      const m = ctx.measureText(p.text)
      up = Math.max(up, m.actualBoundingBoxAscent)
      down = Math.max(down, m.actualBoundingBoxDescent)
    }
    return { up, down }
  }
  let { up, down } = extent()
  if (up + down > ROWS) {
    size = FONT_PX * ROWS / (up + down)
    ;({ up, down } = extent())
  }
  // Centre the ink box in the rows, on a whole-pixel baseline.
  const baseline = Math.round((ROWS - (up + down)) / 2 + up)
  use(600)
  const gap = ctx.measureText(SEPARATOR).width
  const widths = items.map((p) => {
    use(p.weight)
    return ctx.measureText(p.text).width
  })
  const width = Math.ceil(widths.reduce((sum, w) => sum + w + gap, 0))

  canvas.width = width
  canvas.height = ROWS
  let x = 0
  items.forEach((p, i) => {
    use(p.weight)
    ctx.direction = p.lang === 'ar' ? 'rtl' : 'ltr'
    ctx.fillText(p.text, x, baseline)
    ctx.direction = 'ltr'
    x += widths[i]!
    use(600)
    ctx.fillText(SEPARATOR, x, baseline)
    x += gap
  })

  const data = ctx.getImageData(0, 0, width, ROWS).data
  const bits = new Uint8Array(width * ROWS)
  for (let i = 0; i < bits.length; i++) bits[i] = data[i * 4 + 3]! >= INK ? 1 : 0
  return { bits, width }
}

async function mount(board: HTMLElement) {
  const canvas = board.querySelector<HTMLCanvasElement>('canvas.led')
  const phrases = JSON.parse(board.dataset.led ?? '[]') as Phrase[]
  if (!canvas || !phrases.length) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bitmap = await renderBitmap(phrases)
  // The unlit LED grid, redrawn only on resize or theme change.
  const grid = document.createElement('canvas')

  let pitch = 3
  let cols = 0
  let lit = '#fff'
  let position = 0
  let shown = -1

  const layout = () => {
    board.classList.add('is-led')
    const style = getComputedStyle(board)
    const inner = board.clientWidth
      - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    pitch = (window.innerWidth > 860 ? HEIGHT : HEIGHT_PHONE) / ROWS
    cols = Math.max(1, Math.floor(inner / pitch))
    lit = style.getPropertyValue('--color-led').trim() || '#ff4f1f'

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = cols * pitch
    const h = ROWS * pitch
    for (const c of [canvas, grid]) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const g = grid.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    g.fillStyle = lit
    g.globalAlpha = 0.07
    g.beginPath()
    dots(g, () => true)
    g.fill()

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    shown = -1
    draw()
  }

  // Adds a circle to the current path for every LED where `on(col, row)`.
  const dots = (g: CanvasRenderingContext2D, on: (col: number, row: number) => boolean) => {
    const r = pitch * 0.36
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (!on(col, row)) continue
        const x = (col + 0.5) * pitch
        const y = (row + 0.5) * pitch
        g.moveTo(x + r, y)
        g.arc(x, y, r, 0, Math.PI * 2)
      }
    }
  }

  const draw = () => {
    const offset = Math.floor(position / pitch) % bitmap.width
    if (offset === shown) return
    shown = offset
    const dpr = canvas.width / (cols * pitch)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(grid, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = lit
    ctx.beginPath()
    dots(ctx, (col, row) => bitmap.bits[row * bitmap.width + (offset + col) % bitmap.width] === 1)
    ctx.fill()
  }

  let visible = true
  let hovered = false
  let frame = 0
  let last = 0
  const tick = (now: number) => {
    frame = 0
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
    last = now
    if (!hovered) position += dt * SPEED
    draw()
    loop()
  }
  const loop = () => {
    if (frame || !visible || reduced.matches) {
      if (!visible) last = 0
      return
    }
    frame = requestAnimationFrame(tick)
  }

  layout()
  loop()

  new ResizeObserver(layout).observe(board)
  new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    last = 0
    loop()
  }).observe(board)
  board.addEventListener('mouseenter', () => {
    hovered = true
  })
  board.addEventListener('mouseleave', () => {
    hovered = false
  })
  new MutationObserver(layout)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })
  reduced.addEventListener('change', () => {
    last = 0
    loop()
  })
}

document.querySelectorAll<HTMLElement>('[data-led]').forEach(board => void mount(board))

// A module, so its names don't clash with the other page scripts.
export {}
