<template>
  <article class="landing-legal">
    <div class="landing-container landing-legal__container">
      <header class="landing-legal__header">
        <p class="landing-legal__eyebrow">{{ t('landing.legal.brand') }}</p>
        <h1 class="landing-legal__title">{{ content.title }}</h1>
        <p class="landing-legal__intro">{{ content.intro }}</p>
      </header>

      <section v-for="section in content.sections" :key="section.title" class="landing-legal__section">
        <h2 class="landing-legal__section-title">{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="landing-legal__paragraph">
          {{ paragraph }}
        </p>
        <ul v-if="section.bullets?.length" class="landing-legal__list">
          <li v-for="bullet in section.bullets" :key="bullet" class="landing-legal__list-item">
            {{ bullet }}
          </li>
        </ul>
        <div v-if="section.links?.length" class="landing-legal__links">
          <a
            v-for="link in section.links"
            :key="link.href"
            class="landing-legal__link"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.label }}
          </a>
        </div>
      </section>

      <section v-if="content.cta" class="landing-legal__section landing-legal__section--cta">
        <h2 class="landing-legal__section-title">{{ content.cta.title }}</h2>
        <p v-for="paragraph in content.cta.paragraphs" :key="paragraph" class="landing-legal__paragraph">
          {{ paragraph }}
        </p>
        <div v-if="content.cta.actions?.length" class="landing-legal__actions">
          <a
            v-for="action in content.cta.actions"
            :key="action.href"
            class="landing-legal__action"
            :href="action.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ action.label }}
          </a>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LandingMessageSchema } from '@/views/landing/messages';

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: Array<{
    label: string;
    href: string;
  }>;
};

type LegalAction = {
  label: string;
  href: string;
};

type LegalContent = {
  title: string;
  intro: string;
  sections: LegalSection[];
  cta?: {
    title: string;
    paragraphs: string[];
    actions?: LegalAction[];
  };
};

const props = defineProps<{
  pageKey: 'privacy_page' | 'terms_page' | 'support_page';
}>();

const { tm, t } = useI18n<{ landing: LandingMessageSchema }>();

const content = computed(() => tm(`landing.${props.pageKey}`) as unknown as LegalContent);
</script>
