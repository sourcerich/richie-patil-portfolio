<script setup lang="ts">
// The {R P} monogram from /logo.png, redrawn as SVG in the site's heading
// face: an R, then a P turned upside down sitting below the R's baseline,
// between two leaning braces. It takes the surrounding text colour.
</script>

<template>
  <svg
    class="brand-mark"
    viewBox="40 140 420 220"
    role="img"
    aria-label="RP"
  >
    <g
      fill="currentColor"
      style="font-family: var(--font-mark)"
    >
      <text
        x="80"
        y="318"
        font-size="250"
        text-anchor="middle"
        transform="skewX(-10) translate(56 0)"
      >{</text>
      <text
        x="196"
        y="286"
        font-size="150"
        font-weight="600"
        text-anchor="middle"
        stroke="currentColor"
        stroke-width="4"
      >R</text>
      <text
        x="305"
        y="310"
        font-size="150"
        font-weight="600"
        text-anchor="middle"
        stroke="currentColor"
        stroke-width="4"
        transform="rotate(180 305 262)"
      >P</text>
      <text
        x="400"
        y="318"
        font-size="250"
        text-anchor="middle"
        transform="skewX(-10) translate(56 0)"
      >}</text>
    </g>
  </svg>
</template>

<style scoped>
.brand-mark {
  display: inline-block;
  height: 1em;
  width: auto;
  aspect-ratio: 420 / 220;
  overflow: visible;
}
</style>
