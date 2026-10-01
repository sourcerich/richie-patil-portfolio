<script setup lang="ts">
const { site } = useAppConfig()
const year = new Date().getFullYear()

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <section
    class="ink-band contact"
    data-theme="dark"
    data-chapter="Contact"
  >
    <MeshFlow />
    <div class="wrap footer">
      <div class="head">
        <span
          data-reveal="0"
          class="kicker"
        >Open to work</span>
        <h2 class="display big">
          <span class="mask-line"><span
            data-reveal="0"
            data-from="102%"
          >Say</span></span>
          <span class="mask-line right"><span
            data-reveal="200"
            data-from="102%"
            class="accent"
          >hello</span></span>
        </h2>
      </div>
      <div class="cols">
        <div
          data-reveal="300"
          class="col"
        >
          <span class="col-label">Write to</span>
          <a
            :href="`mailto:${site.email}`"
            class="email"
          >{{ site.email }}</a>
        </div>
        <div
          data-reveal="420"
          class="col"
        >
          <span class="col-label">Elsewhere</span>
          <div class="socials">
            <a
              v-for="social in site.socials"
              :key="social.label"
              :href="social.to"
              target="_blank"
              rel="noopener"
            >{{ social.label }} ↗</a>
          </div>
        </div>
      </div>
      <div class="colophon">
        <span>© {{ year }} {{ site.name }}</span>
        <span>{{ site.city }}</span>
        <a
          href="#top"
          @click.prevent="toTop"
        >Back to top ↑</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The dot grid fills the band behind the content. */
.contact {
  position: relative;
  overflow: hidden;
}
.footer {
  position: relative;
  padding-block: clamp(56px, 7vw, 96px) 32px;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 4vw, 56px);
}
.head {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kicker {
  font-size: 13px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-accent);
}
.big {
  font-size: clamp(64px, 11vw, 176px);
  line-height: .86;
  letter-spacing: -.02em;
}
.right { text-align: right; }
.accent { color: var(--color-accent); }
.cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 32px 64px;
  border-top: 1px solid color-mix(in srgb, var(--color-on-ink) 20%, transparent);
  padding-top: 32px;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.col-label {
  font-size: 13px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-on-ink) 70%, transparent);
}
.email {
  font-family: var(--font-heading);
  font-size: clamp(26px, 3vw, 42px);
  line-height: 1.1;
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 8px;
  overflow-wrap: anywhere;
}
.socials {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 16px;
}
.colophon {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-on-ink) 65%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--color-on-ink) 20%, transparent);
  padding-top: 24px;
}

@media (max-width: 640px) {
  .footer { padding-bottom: max(28px, env(safe-area-inset-bottom)); }
  .email { font-size: 26px; }
  .colophon {
    flex-direction: column;
    gap: 10px;
    font-size: 11px;
  }
}
</style>
