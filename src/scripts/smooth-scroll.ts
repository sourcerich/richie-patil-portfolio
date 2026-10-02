/*
 * Smooth, eased scrolling for the whole site (Lenis), instead of the
 * browser's stepped mouse-wheel jumps. It only smooths wheel and trackpad
 * input: touch keeps the phone's own native scrolling, and with reduced
 * motion nothing changes.
 *
 * It moves the real window scroll position, so everything that watches the
 * page (scroll reveals, sticky bits, GSAP ScrollTrigger on the About page)
 * keeps working; paint-stroke.ts also hooks ScrollTrigger to it so pinned
 * animations update on exactly the same frame. Other scripts use `lenis`
 * to pause scrolling (the phone menu) or scroll to a point.
 */
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const lenis = reduced
  ? null
  : new Lenis({
      autoRaf: true,
      // Lower = longer, softer glide after each wheel tick.
      lerp: 0.085,
      wheelMultiplier: 1,
      // In-page links like /work#jotr glide to their target.
      anchors: true
    })
