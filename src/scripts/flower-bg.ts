const frame = document.getElementById('flower-bg') as HTMLIFrameElement | null
const scroller = document.getElementById('scroller')

const forward = (event: PointerEvent) => {
  const target = frame?.contentWindow
  if (!target) return
  target.dispatchEvent(new (target as typeof window).PointerEvent(event.type, {
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

const words = () => Array.from(document.querySelectorAll<HTMLElement>('[data-engine-word]')).map((el, i) => {
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const single = el.hasAttribute('data-single')
  return {
    id: `${single ? 'mr' : 'name'}-${i}`,
    text: el.textContent?.trim() ?? '',
    single,
    center: single,
    alt: el.dataset.alt,
    font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    size: parseFloat(style.fontSize),
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height
  }
})

const root = document.documentElement
const reveal = () => root.classList.add('intro-done')
const gl = document.createElement('canvas').getContext('webgl2')
if (!gl) reveal()
window.setTimeout(reveal, 45000)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let morph = 0
const clamp = (value: number) => Math.min(1, Math.max(0, value))

const sendMorph = () => frame?.contentWindow?.postMessage({ type: 'morph', value: morph }, location.origin)

const setMorph = (value: number) => {
  const next = clamp(value)
  if (next === morph) return
  morph = next
  sendMorph()
}

const post = () => {
  const target = frame?.contentWindow
  if (!target || !scroller) return
  if (scroller.scrollTop > 1 && morph < 1) morph = 1
  sendMorph()
  const max = scroller.scrollHeight - scroller.clientHeight
  target.postMessage({ type: 'scroll', progress: max > 0 ? scroller.scrollTop / max : 0, top: scroller.scrollTop, vh: scroller.clientHeight }, location.origin)
  target.postMessage({ type: 'words', reduced, words: words() }, location.origin)
}

if (frame && scroller) {
  for (const type of ['pointermove', 'pointerdown', 'pointerup'] as const) {
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
  scroller.addEventListener('scroll', queue, { passive: true })

  const locked = (down: boolean) =>
    !reduced
    && root.classList.contains('intro-done')
    && root.classList.contains('engine-text')
    && scroller.scrollTop <= 1
    && (down ? morph < 1 : morph > 0)

  window.addEventListener('wheel', (event) => {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1
    const delta = event.deltaY * unit
    if (!delta || !locked(delta > 0)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    setMorph(morph + delta * 0.0014)
  }, { capture: true, passive: false })

  let touchY = 0
  window.addEventListener('touchstart', (event) => {
    touchY = event.touches[0]?.clientY ?? 0
  }, { passive: true })
  window.addEventListener('touchmove', (event) => {
    const y = event.touches[0]?.clientY ?? touchY
    const delta = touchY - y
    touchY = y
    if (!delta || !locked(delta > 0)) return
    event.preventDefault()
    setMorph(morph + delta * 0.004)
  }, { capture: true, passive: false })

  window.addEventListener('keydown', (event) => {
    const down = ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && !event.shiftKey
    const up = ['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)
    if (!(down || up) || !locked(down)) return
    event.preventDefault()
    setMorph(morph + (down ? 0.34 : -0.34))
  })

  document.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a[href^="#"]')) setMorph(1)
  }, true)
  window.addEventListener('resize', queue)
  void document.fonts.ready.then(queue)
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return
    if (event.data?.type === 'ready') queue()
    if (event.data?.type === 'words-ready') document.documentElement.classList.add('engine-text')
    if (event.data?.type === 'intro-done') reveal()
  })
}

export {}
