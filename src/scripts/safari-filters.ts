const safari = /^((?!chrome|chromium|android|crios|fxios).)*safari/i.test(navigator.userAgent)

export const filterRatio = safari ? 1 / (window.devicePixelRatio || 1) : 1

if (filterRatio !== 1) {
  document.querySelectorAll('.defs feDisplacementMap').forEach((el) => {
    el.setAttribute('scale', String(parseFloat(el.getAttribute('scale') ?? '0') * filterRatio))
  })
}
