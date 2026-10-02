<script setup lang="ts">
// A project still in a photographic plate. Projects without an image get a
// typographic plate instead, so the grid never shows an empty frame; client
// work that can't be shown gets "confidential" tape across that plate.
defineProps<{ image?: string, title: string, num: string, confidential?: boolean }>()

const TAPE_REPEATS = 12
</script>

<template>
  <img
    v-if="image"
    :src="image"
    :alt="title"
    loading="lazy"
  >
  <div
    v-else
    class="typeset"
    :class="{ confidential }"
  >
    <template v-if="confidential">
      <div
        class="tape tape-a"
        aria-hidden="true"
      >
        <span class="tape-track">
          <span
            v-for="n in TAPE_REPEATS"
            :key="n"
          >Confidential ✦ Client work ✦ </span>
        </span>
      </div>
      <div
        class="tape tape-b"
        aria-hidden="true"
      >
        <span class="tape-track">
          <span
            v-for="n in TAPE_REPEATS"
            :key="n"
          >Under NDA ✦ Confidential ✦ </span>
        </span>
      </div>
    </template>
    <span class="tnum">{{ num }}<template v-if="confidential"> — Confidential</template></span>
    <span class="display">{{ title }}</span>
  </div>
</template>

<style scoped>
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.typeset {
  container-type: size;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(20px, 3vw, 36px);
  background: var(--color-ink);
  color: var(--color-on-ink);
}
.typeset > .tnum,
.typeset > .display {
  position: relative;
  z-index: 1;
}
.typeset .tnum {
  font-size: 13px;
  color: var(--color-accent);
}
.typeset.confidential .tnum {
  letter-spacing: .1em;
  text-transform: uppercase;
  font-size: 12px;
}
.typeset .display {
  font-size: clamp(28px, 3.4vw, 48px);
  line-height: 1.05;
  max-width: 14ch;
}

/* — confidential tape — */
.tape {
  position: absolute;
  left: -20%;
  width: 140%;
  overflow: hidden;
  white-space: nowrap;
  padding: .7em 0;
  font-family: var(--font-body);
  font-size: clamp(11px, 1.1vw, 15px);
  font-weight: 600;
  letter-spacing: .22em;
  text-transform: uppercase;
  box-shadow: 0 6px 18px color-mix(in srgb, black 45%, transparent);
}
.tape-a {
  top: 38%;
  transform: rotate(-9deg);
  background: var(--color-accent);
  color: var(--color-ink);
}
.tape-b {
  top: 52%;
  transform: rotate(6deg);
  background: color-mix(in srgb, var(--color-accent) 55%, var(--color-on-ink));
  color: var(--color-ink);
}
.tape-track {
  display: inline-block;
  animation: tape-scroll 40s linear infinite;
}
.tape-b .tape-track { animation-direction: reverse; }
@keyframes tape-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .tape-track { animation: none; }
}

/* Small plates on phones: keep the tape clear of the title. */
@container (max-width: 440px) {
  .typeset .display { font-size: 26px; }
  .tape {
    font-size: 10px;
    padding: .6em 0;
  }
  .tape-a { top: 26%; }
  .tape-b { top: 42%; }
}
/* Short plates (the 16:9 case-study plate on narrow screens): one flatter
   ribbon and a one-line title. */
@container (max-height: 220px) {
  .typeset .display {
    font-size: 22px;
    max-width: none;
  }
  .tape-a {
    top: 38%;
    transform: rotate(-5deg);
  }
  .tape-b { display: none; }
}
</style>
