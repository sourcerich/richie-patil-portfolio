import { lenis } from './smooth-scroll'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
  if (!link || event.defaultPrevented) return
  const id = decodeURIComponent(link.getAttribute('href')!.slice(1))
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  if (lenis) lenis.scrollTo(target, { offset: -parseFloat(getComputedStyle(target).scrollMarginTop) || 0 })
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
})
