const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

if (entry?.type === 'reload' && location.hash) {
  history.replaceState(null, '', location.pathname + location.search)
  document.getElementById('scroller')?.scrollTo(0, 0)
}

export {}
