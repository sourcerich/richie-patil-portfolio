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

const post = () => {
  const target = frame?.contentWindow
  if (!target || !scroller) return
  const max = scroller.scrollHeight - scroller.clientHeight
  target.postMessage({ type: 'scroll', progress: max > 0 ? scroller.scrollTop / max : 0, top: scroller.scrollTop, vh: scroller.clientHeight }, location.origin)
  target.postMessage({ type: 'words', words: words() }, location.origin)
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
  window.addEventListener('resize', queue)
  void document.fonts.ready.then(queue)
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return
    if (event.data?.type === 'ready') queue()
    if (event.data?.type === 'words-ready') document.documentElement.classList.add('engine-text')
    if (event.data?.type === 'intro-done') reveal()
    if (event.data?.type === 'ink') root.classList.toggle('ink', Boolean(event.data.on))
  })
}

export {}
