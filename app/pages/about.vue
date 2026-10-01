<script setup lang="ts">
const { data: page } = await useAsyncData('about', () => queryCollection('about').first())
const { site } = useAppConfig()

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.seo?.title || page.value.title,
  description: page.value.seo?.description || page.value.description,
  ogDescription: page.value.seo?.description || page.value.description
})
</script>

<template>
  <section
    v-if="page"
    class="wrap about"
    data-chapter="About"
  >
    <div
      data-reveal="0"
      class="eyebrow chapter-rule"
    >
      <span>About</span><span class="line" />
    </div>
    <h1 class="display headline">
      <FocusReveal
        :lines="page.headline"
        accent-last
      />
    </h1>

    <div class="bio">
      <figure
        data-reveal="0"
        data-wipe
        class="plate portrait"
      >
        <img
          data-py="-0.1"
          src="/richie.jpg"
          alt="Portrait of Richie Patil"
        >
      </figure>
      <div class="bio-text justify">
        <p
          v-for="(paragraph, i) in page.paragraphs"
          :key="i"
          :data-reveal="100 + i * 60"
        >
          {{ paragraph }}
        </p>
        <div
          :data-reveal="100 + page.paragraphs.length * 60"
          class="actions"
        >
          <a
            :href="`mailto:${site.email}`"
            class="btn btn-primary"
          >Start a conversation →</a>
        </div>
      </div>
    </div>

    <div class="block first">
      <div
        data-reveal="0"
        class="block-head"
      >
        <span class="eyebrow">Toolkit</span>
        <h2 class="display block-title">
          The instruments.
        </h2>
      </div>
      <dl class="rows">
        <div
          v-for="(skill, i) in page.skills"
          :key="skill.label"
          :data-reveal="i * 50"
          class="skill"
        >
          <dt class="label">
            {{ skill.label }}
          </dt>
          <dd>{{ skill.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="block">
      <div
        data-reveal="0"
        class="block-head"
      >
        <span class="eyebrow">Education &amp; recognition</span>
        <h2 class="display block-title">
          The record.
        </h2>
      </div>
      <div class="rows">
        <div
          v-for="(item, i) in page.achievements"
          :key="item.title"
          :data-reveal="i * 60"
          class="record"
        >
          <span class="record-text">
            <span class="record-title">{{ item.title }}</span>
            <span class="record-detail">{{ item.detail }}</span>
          </span>
          <span class="record-year tnum">{{ item.year }}</span>
        </div>
      </div>
    </div>

    <div class="block">
      <div
        data-reveal="0"
        class="block-head"
      >
        <span class="eyebrow">Beyond the screen</span>
        <p class="beyond">
          {{ page.beyond }}
        </p>
      </div>
      <div class="rows">
        <details
          v-for="(item, i) in page.faq"
          :key="item.question"
          :data-reveal="i * 70"
          class="faq"
        >
          <summary>{{ item.question }}<span class="plus">+</span></summary>
          <p class="justify">
            {{ item.answer }}
          </p>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about { padding-block: clamp(56px, 8vw, 112px) var(--section-y); }
.chapter-rule {
  display: flex;
  gap: 16px;
  align-items: baseline;
  margin-bottom: 32px;
}
.line {
  flex: 1;
  height: 1px;
  background: var(--color-divider);
}
.headline {
  margin-bottom: clamp(56px, 8vw, 112px);
  font-size: clamp(44px, 7vw, 108px);
  line-height: .98;
  letter-spacing: -.015em;
  max-width: 17ch;
}
.bio {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
.portrait {
  overflow: hidden;
  aspect-ratio: 4 / 5;
  width: 100%;
  max-width: 520px;
}
.portrait img {
  width: 100%;
  height: 118%;
  margin-top: -9%;
  object-fit: cover;
}
.bio-text {
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-size: 16.5px;
  line-height: 1.75;
  max-width: 58ch;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}
.block {
  margin-top: clamp(56px, 8vw, 112px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 48px 80px;
  border-top: 1px solid var(--color-divider);
  padding-top: 48px;
}
.block.first { margin-top: var(--section-y); }
.block-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.block-title {
  font-size: clamp(32px, 3.6vw, 48px);
  line-height: 1.1;
}
.beyond {
  font-family: var(--font-heading);
  font-size: clamp(24px, 2.4vw, 32px);
  line-height: 1.25;
}
.rows {
  display: flex;
  flex-direction: column;
}
.skill {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-divider);
}
.skill dt { padding-top: 3px; }
.skill dd {
  font-size: 15.5px;
  line-height: 1.6;
}
.record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-divider);
  align-items: baseline;
}
.record-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.record-title { font-size: 15.5px; }
.record-detail {
  font-size: 13px;
  color: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.record-year {
  font-size: 13px;
  color: var(--color-accent-text);
}
.faq { border-bottom: 1px solid var(--color-divider); }
.faq summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  font-family: var(--font-heading);
  font-size: 22px;
  line-height: 1.25;
}
.plus {
  color: var(--color-accent);
  transition: transform .3s var(--ease-out);
}
.faq[open] .plus { transform: rotate(45deg); }
.faq p {
  margin-bottom: 20px;
  font-size: 15.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--color-text) 80%, transparent);
}

@media (max-width: 640px) {
  .headline { margin-bottom: 48px; }
  .bio { gap: 36px; }
  .bio-text {
    gap: 20px;
    font-size: 16px;
    line-height: 1.7;
  }
  .block,
  .block.first {
    margin-top: 64px;
    gap: 24px;
    padding-top: 36px;
  }
  .skill {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 14px 0;
  }
  .skill dt { padding-top: 0; }
  .record { padding: 14px 0; }
  .faq summary {
    font-size: 20px;
    padding: 16px 0;
  }
}
</style>
