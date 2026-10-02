/*
 * The Work page's sideways reel. The section is made as tall as the reel
 * is wide (plus one screen); its inner viewport sticks to the top while
 * that extra height scrolls past, and the scroll distance is turned into a
 * sideways shift of the project row, one pixel for one pixel. When the last
 * project is in view the sticky part lets go and the page scrolls on.
 *
 * It reads the real window scroll position, so Lenis smoothing applies to
 * it like everything else. Only on wide screens without reduced motion;
 * otherwise the plain vertical list stays.
 */
const section = document.querySelector<HTMLElement>('[data-hscroll]')
const track = section?.querySelector<HTMLElement>('[data-hscroll-track]')
const bar = section?.querySelector<HTMLElement>('[data-hscroll-bar]')

if (section && track) {
  const wide = window.matchMedia('(min-width: 861px)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let travel = 0
  let frame = 0

  const update = () => {
    frame = 0
    if (!travel) return
    const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / travel))
    track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`
    if (bar) bar.style.transform = `scaleX(${progress})`
  }

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }

  const setup = () => {
    const on = wide.matches && !reduced.matches
    section.classList.toggle('is-on', on)
    if (!on) {
      travel = 0
      section.style.height = ''
      track.style.transform = ''
      return
    }
    // clientWidth leaves out the scrollbar, so the last project ends at the
    // gutter rather than under it.
    travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth)
    section.style.height = `${travel + window.innerHeight}px`
    update()
  }

  // /work#<slug>: scroll to the point where that project has slid in.
  const goToHash = () => {
    const id = decodeURIComponent(location.hash.slice(1))
    const project = id ? document.getElementById(id) : null
    if (!travel || !project || !track.contains(project)) return
    // Undo any sideways scroll from the browser's own jump to the anchor.
    if (track.parentElement) track.parentElement.scrollLeft = 0
    const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top + Math.min(travel, Math.max(0, project.offsetLeft - gutter)))
  }

  setup()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', setup)
  wide.addEventListener('change', setup)
  reduced.addEventListener('change', setup)
  // Widths settle once the web fonts are in.
  document.fonts.ready.then(() => {
    setup()
    goToHash()
  })
}
