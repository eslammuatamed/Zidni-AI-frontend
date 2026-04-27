<template>
  <section class="landing-testimonials">
    <div class="landing-testimonials__inner">
      <header class="landing-section-heading">
        <h2 class="landing-section-heading__title">{{ title }}</h2>
      </header>
      <div v-if="items.length" class="landing-testimonials__grid">
        <article v-for="item in items" :key="item.id" class="landing-testimonial">
          <blockquote class="landing-testimonial__quote">“{{ item.quote }}”</blockquote>
          <p class="landing-testimonial__author">{{ item.author }}</p>
        </article>
      </div>
      <div v-else class="landing-testimonials__empty">
        {{ t('landing.testimonials.empty') }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LandingTestimonial } from '@/services/landing';

const props = defineProps<{ config: Record<string, any>; testimonials?: LandingTestimonial[] }>();
const { t } = useI18n();

const config = computed(() => props.config ?? {});

const title = computed(() => config.value.title || t('landing.testimonials.title'));

const items = computed<LandingTestimonial[]>(() => {
  if (props.testimonials && props.testimonials.length) {
    return props.testimonials;
  }
  const raw = (config.value.items as LandingTestimonial[] | undefined) || [];
  return raw;
});
</script>

<style scoped>
.landing-testimonials {
  padding-block: clamp(var(--sakai-space-10), 7vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
  background: transparent;
}

.landing-testimonials__inner {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.landing-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-5);
}

.landing-testimonial {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  background: var(--landing-surface, var(--sakai-surface-card));
  border: 1px solid var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 65%, transparent));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-sm));
  position: relative;
}

.landing-testimonial::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-secondary) 12%, transparent),
    color-mix(in srgb, var(--sakai-primary) 14%, transparent)
  );
  opacity: 0.45;
  pointer-events: none;
  z-index: 0;
}

.landing-testimonial > * {
  position: relative;
  z-index: 1;
}

.landing-testimonial__quote {
  margin: 0;
  font-size: 1rem;
  font-style: italic;
  line-height: var(--sakai-line-height-lg);
  color: var(--sakai-text-color);
}

.landing-testimonial__author {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-secondary);
}

.landing-testimonials__empty {
  text-align: center;
  padding: calc(var(--sakai-space-8) + var(--sakai-space-4));
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  border: 1px dashed var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 60%, transparent));
  background: var(--landing-surface-soft, rgba(255, 255, 255, 0.7));
  color: var(--sakai-text-color-tertiary);
}
</style>
