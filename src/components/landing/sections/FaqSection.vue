<template>
  <section class="landing-faq">
    <div class="landing-faq__inner">
      <header class="landing-section-heading">
        <h2 class="landing-section-heading__title">{{ title }}</h2>
      </header>
      <UiAccordion :items="accordionItems" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAccordion, { type UiAccordionItem } from '@/components/ui/UiAccordion.vue';
import type { LandingFaq } from '@/services/landing';

const props = defineProps<{ config: Record<string, any>; faqs?: LandingFaq[] }>();
const { t } = useI18n();

const config = computed(() => props.config ?? {});

const title = computed(() => config.value.title || t('landing.faqTitle'));

const faqs = computed<LandingFaq[]>(() => {
  if (props.faqs && props.faqs.length) {
    return props.faqs;
  }
  const raw = (config.value.items as LandingFaq[] | undefined) || [];
  return raw;
});

const accordionItems = computed<UiAccordionItem[]>(() =>
  faqs.value.map((item, index) => ({
    value: item.id ?? index,
    title: item.question,
    content: item.answer
  }))
);
</script>

<style scoped>
.landing-faq {
  padding-block: clamp(var(--sakai-space-10), 7vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
}

.landing-faq__inner {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.landing-faq__inner :deep(.ui-accordion) {
  box-shadow: var(--landing-shadow, var(--sakai-shadow-md));
  border: 1px solid var(--landing-border, var(--sakai-border-color));
  border-radius: var(--landing-radius, var(--sakai-border-radius-lg));
  background: var(--landing-surface, var(--sakai-surface-card));
  overflow: hidden;
}

.landing-faq__inner :deep(.ui-accordion__item) {
  border-color: var(--landing-border, var(--sakai-border-color));
}

.landing-faq__inner :deep(.ui-accordion__content) {
  background: var(--landing-surface-soft, var(--sakai-surface-muted));
}

.landing-faq__inner :deep(.ui-accordion__header) {
  font-size: 1.05rem;
}
</style>
