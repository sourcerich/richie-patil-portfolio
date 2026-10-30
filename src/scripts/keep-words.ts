/*
 * Keeps short hyphenated words (multi-tenant, stop-loss, e-commerce) from
 * being split at the hyphen when a line wraps: each is wrapped in a
 * no-break span. Very long ones are left to wrap, so
 * they can never push a narrow screen wider than it is.
 */
const MAX = 22
const root = document.querySelector('main')

if (root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) {
    const n = walker.currentNode as Text
    const p = n.parentElement
    if (p && !p.closest('script, style, noscript, svg') && /\w-\w/.test(n.data)) nodes.push(n)
  }
  for (const node of nodes) {
    const parts = node.data.split(/([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/u)
    if (parts.length < 2) continue
    const frag = document.createDocumentFragment()
    parts.forEach((part, i) => {
      if (i % 2 && part.length <= MAX) {
        const span = document.createElement('span')
        span.className = 'nb'
        span.textContent = part
        frag.append(span)
      } else if (part) frag.append(part)
    })
    node.replaceWith(frag)
  }
}
