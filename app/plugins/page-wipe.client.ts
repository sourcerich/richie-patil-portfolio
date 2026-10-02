// Page transition: a copper panel rises over the page carrying the
// destination's name in English and Marathi, the route swaps underneath,
// then the panel lifts away through the top. Skipped with reduced motion.
const PAGE_NAMES: Record<string, { en: string, mr: string }> = {
  '/': { en: 'Start', mr: 'सुरुवात' },
  '/about': { en: 'About', mr: 'ओळख' },
  '/service': { en: 'Service', mr: 'सेवा' },
  '/work': { en: 'Work', mr: 'काम' },
  '/contact': { en: 'Contact', mr: 'संपर्क' }
}
const COVER_MS = 720
const LIFT_DELAY_MS = 180

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const { motionScale } = useReveal()
  let covering = false

  router.beforeEach(async (to, from) => {
    if (!from.matched.length || to.path === from.path || !motionScale()) return
    const wipe = document.getElementById('page-wipe')
    const en = document.getElementById('page-wipe-en')
    const mr = document.getElementById('page-wipe-mr')
    if (!wipe || !en || !mr) return
    const name = PAGE_NAMES[to.path] ?? { en: 'Richie Patil', mr: '' }
    en.textContent = name.en
    mr.textContent = name.mr
    wipe.style.transition = 'none'
    wipe.style.clipPath = 'inset(100% 0 0 0)'
    void wipe.offsetWidth
    wipe.style.transition = 'clip-path .7s cubic-bezier(.77,0,.175,1)'
    wipe.style.clipPath = 'inset(0 0 0 0)'
    covering = true
    await wait(COVER_MS)
  })

  nuxtApp.hook('page:finish', () => {
    // A link to /work#<slug> scrolls to that project instead of the top.
    const hash = router.currentRoute.value.hash
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
    if (!covering) return
    covering = false
    setTimeout(() => {
      const wipe = document.getElementById('page-wipe')
      if (wipe) wipe.style.clipPath = 'inset(0 0 100% 0)'
    }, LIFT_DELAY_MS)
  })
})
