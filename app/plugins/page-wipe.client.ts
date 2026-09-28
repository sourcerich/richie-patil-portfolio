// Covers the page with an ink panel carrying the destination's name, swaps the
// route underneath, then lifts the panel off the top. Ported from the design.
const PAGE_NAMES: Record<string, string> = { '/': 'Home', '/about': 'About', '/works': 'Works and Collaborations' }
const COVER_MS = 780
const LIFT_DELAY_MS = 160

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const { motionScale } = useFolioMotion()
  let covering = false

  const destinationName = (path: string) => {
    if (PAGE_NAMES[path]) return PAGE_NAMES[path]
    const slug = path.match(/^\/works\/([^/]+)/)?.[1]
    const projects = useNuxtData<{ slug: string, title: string }[]>('projects').data.value
    return projects?.find(p => p.slug === slug)?.title ?? 'Work'
  }

  router.beforeEach(async (to, from) => {
    if (!from.matched.length || to.path === from.path || !motionScale()) return
    const wipe = document.getElementById('page-wipe')
    const label = document.getElementById('page-wipe-label')
    if (!wipe || !label) return
    label.textContent = destinationName(to.path)
    wipe.style.transition = 'none'
    wipe.style.clipPath = 'inset(100% 0 0 0)'
    void wipe.offsetWidth
    wipe.style.transition = 'clip-path .75s cubic-bezier(.77,0,.175,1)'
    wipe.style.clipPath = 'inset(0 0 0 0)'
    covering = true
    await wait(COVER_MS)
  })

  nuxtApp.hook('page:finish', () => {
    window.scrollTo(0, 0)
    if (!covering) return
    covering = false
    setTimeout(() => {
      const wipe = document.getElementById('page-wipe')
      if (wipe) wipe.style.clipPath = 'inset(0 0 100% 0)'
    }, LIFT_DELAY_MS)
  })
})
