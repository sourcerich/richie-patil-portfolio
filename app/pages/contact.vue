<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())
const { site } = useAppConfig()

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.contact.title,
  ogTitle: `${page.value.contact.title} – Richie Patil`,
  description: page.value.contact.body,
  ogDescription: page.value.contact.body
})
</script>

<template>
  <div v-if="page">
    <SitePageHead
      :ghost="page.contact.ghost"
      :lines="[page.contact.title]"
      :subtitle="page.contact.subtitle"
    />

    <section class="wrap section contact">
      <p
        data-reveal="0"
        class="body"
      >
        {{ page.contact.body }}
      </p>
      <div class="ways">
        <div data-reveal="100">
          <span class="label">Mail</span>
          <a
            :href="`mailto:${site.email}`"
            class="mail line-link"
          >{{ site.email }}</a>
        </div>
        <div data-reveal="180">
          <span class="label">Elsewhere</span>
          <div class="socials">
            <a
              v-for="social in site.socials"
              :key="social.label"
              :href="social.to"
              target="_blank"
              rel="noopener"
              class="line-link"
            >{{ social.label }}</a>
          </div>
        </div>
        <div data-reveal="260">
          <span class="label">Based in</span>
          <p>{{ site.city }}, and happy working with teams anywhere.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contact {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 56px clamp(48px, 9vw, 160px);
  align-items: start;
}
.body {
  font-size: clamp(20px, 1.9vw, 26px);
  line-height: 1.35;
  letter-spacing: -.02em;
  max-width: 34ch;
}
.ways {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.ways .label {
  display: block;
  margin-bottom: 12px;
}
.mail {
  display: inline-block;
  font-size: clamp(22px, 2.2vw, 30px);
  letter-spacing: -.03em;
  color: var(--color-accent);
  overflow-wrap: anywhere;
}
.socials {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font-size: 17px;
}

@media (max-width: 860px) {
  .contact { grid-template-columns: 1fr; }
}
</style>
