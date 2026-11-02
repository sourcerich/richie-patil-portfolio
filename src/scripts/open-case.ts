import { lenis } from './smooth-scroll'

const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('.work-dialog'))
let opener: HTMLElement | null = null

const open = (dialog: HTMLDialogElement, from: HTMLElement | null) => {
  opener = from
  lenis?.stop()
  dialog.showModal()
}

document.querySelectorAll<HTMLButtonElement>('.tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    const dialog = document.getElementById(`p-${tile.dataset.work}`)
    if (dialog instanceof HTMLDialogElement) open(dialog, tile)
  })
})

dialogs.forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    const target = event.target as Element
    if (target === dialog || target.closest('[data-close]')) dialog.close()
  })
  dialog.addEventListener('close', () => {
    lenis?.start()
    opener?.focus()
    opener = null
  })
})

const fromHash = () => {
  if (!location.hash.startsWith('#p-')) return
  const dialog = document.getElementById(decodeURIComponent(location.hash.slice(1)))
  if (dialog instanceof HTMLDialogElement && !dialog.open) open(dialog, null)
}

fromHash()
window.addEventListener('hashchange', fromHash)
