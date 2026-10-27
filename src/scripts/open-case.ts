/*
 * Project links (the chips under each skill, or an address like /#p-rag)
 * scroll to that project and open its case.
 */
import { lenis } from './smooth-scroll'

const openCase = (hash: string, scroll: boolean) => {
  if (!hash.startsWith('#p-')) return false
  const card = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!card) return false
  const details = card.querySelector('details')
  if (details) details.open = true
  if (scroll) {
    if (lenis) lenis.scrollTo(card, { offset: -90 })
    else card.scrollIntoView({ block: 'start' })
  }
  return true
}

document.querySelectorAll<HTMLAnchorElement>('[data-open]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const hash = a.getAttribute('href') ?? ''
    if (!openCase(hash, true)) return
    e.preventDefault()
    history.replaceState(null, '', hash)
  })
})

openCase(location.hash, false)
window.addEventListener('hashchange', () => openCase(location.hash, false))
