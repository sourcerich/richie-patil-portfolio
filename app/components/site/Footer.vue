<script setup lang="ts">
// The foot of every inner page: menu, links and email in bracket-labelled
// columns at the top right, then one enormous closing word that fills the
// width. The closer is set in English with its Marathi twin under it.
const { site } = useAppConfig()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="wrap footer">
    <div class="cols">
      <div
        data-reveal="0"
        class="col"
      >
        <span class="label">Menu</span>
        <NuxtLink
          v-for="link in site.nav"
          :key="link.to"
          :to="link.to"
          class="line-link"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <div
        data-reveal="80"
        class="col"
      >
        <span class="label">Elsewhere</span>
        <a
          v-for="social in site.socials"
          :key="social.label"
          :href="social.to"
          target="_blank"
          rel="noopener"
          class="line-link"
        >{{ social.label }}</a>
      </div>
      <div
        data-reveal="160"
        class="col"
      >
        <span class="label">Mail</span>
        <a
          :href="`mailto:${site.email}`"
          class="line-link"
        >{{ site.email }}</a>
      </div>
      <div
        data-reveal="240"
        class="col credit"
      >
        <span class="label">Credit</span>
        <span>Designed and built by Richie, {{ year }}</span>
      </div>
    </div>
    <div class="closer">
      <span class="mask-line"><span
        data-reveal="0"
        data-from="105%"
        class="display thanks"
      >Thank you</span></span>
      <span
        data-reveal="200"
        class="deva marathi"
        lang="mr"
      >धन्यवाद</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding-block: var(--section-y) 28px;
}
.cols {
  margin-left: auto;
  width: min(100%, 580px);
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: space-between;
  gap: 40px 48px;
  font-size: 16px;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}
.col .label { margin-bottom: 10px; }
.credit { grid-column: 1 / -1; }
.closer {
  margin-top: clamp(140px, 22vw, 340px);
  text-align: center;
}
.thanks {
  /* Sized so the two words span the content width. */
  font-size: clamp(56px, 13.4vw, 214px);
  line-height: .9;
  white-space: nowrap;
}
.marathi {
  display: block;
  margin-top: 10px;
  font-size: clamp(20px, 2.2vw, 30px);
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 24px;
  }
  .col:nth-child(3) { grid-column: 1 / -1; }
}
</style>
