import { lenis } from './smooth-scroll'

const openCase = (hash: string, scroll: boolean) => {
  if (!hash.startsWith('#p-')) return false
  const card = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!card) return false
  const details = card.querySelector('details')
  if (details) details.open = true
  if (scroll) {
    if (lenis) lenis.scrollTo(card, { offset: -160 })
    else card.scrollIntoView({ block: 'start' })
  }
  return true
}

document.querySelectorAll<HTMLAnchorElement>('[data-open]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const hash = a.getAttribute('href') ?? ''
    if (!openCase(hash, true)) return
    e.preventDefault()
  })
})

openCase(location.hash, false)
window.addEventListener('hashchange', () => openCase(location.hash, false))

document.querySelectorAll<HTMLImageElement>('.project .shot').forEach((shot) => {
  shot.addEventListener('click', () => {
    const details = shot.closest('.project')?.querySelector('details')
    if (details) details.open = !details.open
  })
})
