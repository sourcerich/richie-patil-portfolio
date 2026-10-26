/*
 * Drives the 3D Start page: which stop you are at, how you move between them
 * (wheel, swipe, arrow keys, the pager, a hash like /#work), the station
 * board at the top (English and Marathi, as at a Mumbai local station), the
 * project pop-up, and the sound. The 3D itself is scene.ts, loaded on demand
 * so a visitor without WebGL never downloads three.js: the page then simply
 * stays the stacked, readable version the HTML was written as.
 */
import { lenis } from '../smooth-scroll'
import { playAnnouncement, playChime } from '../chime'

interface Data {
  stops: { en: string, mr: string, to: string }[]
  services: string[]
  projects: { slug: string, title: string, image: string }[]
}

const root = document.querySelector<HTMLElement>('[data-world]')
const canvas = document.getElementById('world-canvas') as HTMLCanvasElement | null

// Mumbai local time as HH:MM, ticking once a second (works in both modes).
{
  const clock = document.getElementById('clock')
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  const tick = () => {
    if (clock) clock.textContent = format.format(new Date())
  }
  tick()
  setInterval(tick, 1000)
}

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const IDS = ['start', 'about', 'service', 'work', 'contact']
const LAYOUTS = ['left', 'left', 'left', 'bottom', 'left'] as const

const boot = async () => {
  if (!root || !canvas || !hasWebGL()) return
  const data = JSON.parse(root.dataset.world ?? '{}') as Data
  const html = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches

  // The signs are drawn on canvas, so the fonts have to be in first.
  await Promise.race([
    Promise.all([
      document.fonts.load('40px "Yatra One"', 'Start'),
      document.fonts.load('500 40px Eczar', 'सुरुवात ओळख सर्विस काम संपर्क')
    ]),
    new Promise(resolve => setTimeout(resolve, 2000))
  ])

  const { createWorld } = await import('./scene')
  let current = -1
  let modalOpen = false
  const panels = [...root.querySelectorAll<HTMLElement>('.panel')]
  const dots = [...root.querySelectorAll<HTMLElement>('[data-goto]')]
  const board = root.querySelector<HTMLElement>('.board')!
  const boardNo = document.getElementById('board-no')!
  const boardEn = document.getElementById('board-en')!
  const boardMr = document.getElementById('board-mr')!
  const boardNext = document.getElementById('board-next')!
  const modal = document.getElementById('modal')!
  const modalBody = document.getElementById('modal-body')!
  const closeBtn = document.getElementById('modal-close') as HTMLButtonElement

  let world: ReturnType<typeof createWorld>
  try {
    world = createWorld({
      canvas,
      reduced,
      compact,
      stops: data.stops,
      services: data.services,
      projects: data.projects,
      onProject: slug => openProject(slug),
      onTaxi: () => {
        playChime()
      },
      onMailbox: () => {
        document.getElementById('mail-link')?.click()
      }
    })
  } catch {
    // Context lost or refused: stay on the plain page.
    return
  }

  html.classList.add('gl')
  lenis?.stop()

  const go = (index: number, opts: { instant?: boolean, silent?: boolean } = {}) => {
    const next = Math.max(0, Math.min(IDS.length - 1, index))
    if (next === current) return
    const first = current === -1
    current = next
    panels.forEach((p, i) => {
      p.classList.toggle('active', i === next)
      p.toggleAttribute('inert', i !== next)
    })
    dots.forEach((d, i) => d.classList.toggle('on', i === next))
    const stop = data.stops[next]!
    boardNo.textContent = `${String(next + 1).padStart(2, '0')} / ${String(IDS.length).padStart(2, '0')}`
    boardEn.textContent = stop.en
    boardMr.textContent = stop.mr
    boardNext.textContent = next < IDS.length - 1 ? `Next station: ${data.stops[next + 1]!.en}` : 'Terminus: राम राम'
    board.classList.remove('flip')
    void board.offsetWidth
    board.classList.add('flip')
    world.setLayout(LAYOUTS[next]!)
    world.goTo(next, opts.instant ?? first)
    history.replaceState(null, '', next === 0 ? location.pathname : `#${IDS[next]}`)
    if (!first && !opts.silent) playAnnouncement(stop.to)
  }

  const fromHash = () => {
    const i = IDS.indexOf(decodeURIComponent(location.hash.slice(1)))
    return i === -1 ? 0 : i
  }

  // ——— project pop-up ———
  const openProject = (slug: string) => {
    const li = document.getElementById(`p-${slug}`)
    const title = data.projects.find(p => p.slug === slug)?.title ?? ''
    const body = li?.querySelector('.project-body')
    if (!body) return
    modalBody.innerHTML = ''
    const h = document.createElement('h3')
    h.className = 'modal-title'
    h.textContent = title
    const wrap = document.createElement('div')
    wrap.className = 'project-body'
    wrap.innerHTML = body.innerHTML
    wrap.querySelectorAll('img').forEach(img => img.setAttribute('loading', 'eager'))
    modalBody.append(h, wrap)
    modal.hidden = false
    modalOpen = true
    closeBtn.focus({ preventScroll: true })
  }
  const closeModal = () => {
    if (!modalOpen) return
    modal.hidden = true
    modalOpen = false
  }
  closeBtn.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  root.querySelectorAll<HTMLElement>('[data-project]').forEach((btn) => {
    btn.addEventListener('click', () => openProject(btn.dataset.project!))
  })

  // ——— moving between stops ———
  root.querySelectorAll<HTMLElement>('[data-next]').forEach(b => b.addEventListener('click', () => go(current + 1)))
  root.querySelectorAll<HTMLElement>('[data-prev]').forEach(b => b.addEventListener('click', () => go(current - 1)))
  dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.goto))))

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return closeModal()
    if (modalOpen || e.metaKey || e.ctrlKey || e.altKey) return
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A')) {
      e.preventDefault()
      go(current + 1)
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault()
      go(current - 1)
    } else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(IDS.length - 1)
    else if (/^[1-5]$/.test(e.key)) go(Number(e.key) - 1)
  })

  // Wheel: one stop per gesture, unless the wheel is scrolling a card.
  let lockUntil = 0
  const canScroll = (el: Element | null, dy: number) => {
    const card = el?.closest<HTMLElement>('.card, .modal-card')
    if (!card) return false
    if (card.scrollHeight <= card.clientHeight + 1) return false
    return dy > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 1 : card.scrollTop > 0
  }
  window.addEventListener('wheel', (e) => {
    if (modalOpen) return
    const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (Math.abs(dy) < 8 || canScroll(e.target as Element, dy)) return
    e.preventDefault()
    const now = performance.now()
    if (now < lockUntil) return
    lockUntil = now + 1100
    go(current + (dy > 0 ? 1 : -1))
  }, { passive: false })

  // Swipe on the scene; a drag past 60px moves a stop. Moving the pointer
  // anywhere leans the camera a little toward it.
  let down: { x: number, y: number } | null = null
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY }
  })
  window.addEventListener('pointerup', (e) => {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    down = null
    if (modalOpen) return
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) go(current + (dx < 0 ? 1 : -1))
    else if (compact && Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.2) go(current + (dy < 0 ? 1 : -1))
  })
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return
    world.setLook((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
  })

  // Day and night follow the switch.
  const syncMode = () => world.setDark(html.dataset.mode === 'dark')
  new MutationObserver(syncMode).observe(html, { attributes: true, attributeFilter: ['data-mode'] })
  syncMode()

  new ResizeObserver(() => world.resize()).observe(canvas)
  window.addEventListener('hashchange', () => go(fromHash()))
  window.addEventListener('pageshow', () => world.resize())

  go(fromHash(), { instant: true, silent: true })
  world.start()
  requestAnimationFrame(() => html.classList.add('ready'))
}

void boot()
