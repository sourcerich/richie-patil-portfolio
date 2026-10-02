/*
 * Fills "Richie Patil" on the Start page with Mumbai footage: the "4K
 * TIMELAPSE MUMBAI" night skyline (orange traffic trails, blue lights),
 * its end crossfaded into its start so the loop has no jump, silent and
 * hosted here (public/video/mumbai-reel.{webm,mp4}, 960 px; poster .jpg).
 * Rebuild with tools/mumbai-reel.sh. Day mode only: at night the name is
 * plain taxi-yellow type and the reel stays hidden and paused.
 *
 * CSS can't use live text as a mask, so once the name has risen in and the
 * display font is loaded, each letter is drawn onto a canvas at the exact
 * spot the browser laid it out (one Range per character, so kerning,
 * letter-spacing, uppercase and the two-line phone layout all match), and
 * that canvas becomes the player's mask-image. Redrawn on resize. The real
 * heading stays in the page, just transparent, for screen readers and
 * search. Skipped under reduced motion and Save-Data.
 */
const SOURCES = [
  { src: '/video/mumbai-reel.webm', type: 'video/webm; codecs=vp9' },
  { src: '/video/mumbai-reel.mp4', type: 'video/mp4' }
]

const wrap = document.querySelector<HTMLElement>('[data-name-reel]')
const name = wrap?.querySelector<HTMLElement>('h1')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData

// Resolves once the name's slide-up reveal has finished (or straight away).
const risen = (el: HTMLElement) => new Promise<void>((resolve) => {
  const line = el.querySelector<HTMLElement>('[data-reveal]')
  if (!line) return resolve()
  const done = () => resolve()
  line.addEventListener('transitionend', done, { once: true })
  setTimeout(done, 2600)
})

const paintMask = (box: HTMLElement, text: HTMLElement) => {
  const rect = box.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(rect.width * dpr)
  canvas.height = Math.ceil(rect.height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'alphabetic'

  const range = document.createRange()
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const style = getComputedStyle(node.parentElement!)
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const upper = style.textTransform === 'uppercase'
    // A character's client rect is its font's content box, so the baseline
    // sits one font ascent below its top.
    const ascent = ctx.measureText('H').fontBoundingBoxAscent
    const value = node.textContent ?? ''
    for (let i = 0; i < value.length; i++) {
      const ch = value[i]!
      if (/\s/.test(ch)) continue
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const r = range.getBoundingClientRect()
      ctx.fillText(upper ? ch.toUpperCase() : ch, r.left - rect.left, r.top - rect.top + ascent)
    }
  }
  const url = `url(${canvas.toDataURL()})`
  box.style.setProperty('mask-image', url)
  box.style.setProperty('-webkit-mask-image', url)
}

async function mount(wrap: HTMLElement, name: HTMLElement) {
  const reel = document.createElement('div')
  reel.className = 'name-reel'
  reel.setAttribute('aria-hidden', 'true')
  const video = document.createElement('video')
  // Muted + playsinline is what lets browsers (iOS included) autoplay it.
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.autoplay = true
  video.playsInline = true
  video.preload = 'auto'
  video.poster = '/video/mumbai-reel.jpg'
  video.disablePictureInPicture = true
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  for (const { src, type } of SOURCES) {
    const source = document.createElement('source')
    source.src = src
    source.type = type
    video.append(source)
  }
  reel.append(video)
  wrap.append(reel)

  const loaded = new Promise<void>((resolve) => {
    if (video.readyState >= 3) return resolve()
    video.addEventListener('canplay', () => resolve(), { once: true })
    // Slow network: show the poster frame through the letters anyway.
    setTimeout(resolve, 4000)
  })
  void video.play().catch(() => {})
  await Promise.all([risen(name), document.fonts.ready])
  paintMask(reel, name)

  let frameId = 0
  new ResizeObserver(() => {
    cancelAnimationFrame(frameId)
    frameId = requestAnimationFrame(() => paintMask(reel, name))
  }).observe(wrap)

  await loaded
  wrap.classList.add('is-reel')

  // Only decode frames while the name is on screen and in day mode (at
  // night the name is plain type, so the reel is hidden and paused).
  const root = document.documentElement
  let onScreen = true
  const sync = () => {
    if (onScreen && root.dataset.mode !== 'dark') void video.play().catch(() => {})
    else video.pause()
  }
  new IntersectionObserver(([entry]) => {
    onScreen = !!entry?.isIntersecting
    sync()
  }).observe(wrap)
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-mode'] })
  sync()
}

if (wrap && name && !reduced && !saveData) void mount(wrap, name)

export {}
