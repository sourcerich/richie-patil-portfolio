import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
export const lenis = reduced || touch
  ? null
  : new Lenis({
      autoRaf: true,
      lerp: 0.085,
      wheelMultiplier: 1,
      anchors: true
    })
