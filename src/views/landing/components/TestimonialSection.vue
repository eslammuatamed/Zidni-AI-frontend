<template>
  <section id="testimonials" class="landing-section landing-testimonial" aria-labelledby="landing-testimonial-title">
    <div class="landing-container">
      <header class="landing-section__header">
        <h2 id="landing-testimonial-title" class="landing-section__title">
          {{ t('landing.testimonial.title') }}
        </h2>
      </header>

      <article class="landing-testimonial__card">
        <p class="landing-testimonial__quote">“{{ t('landing.testimonial.quote') }}”</p>
        <div class="landing-testimonial__author">
          <span class="landing-testimonial__avatar" aria-hidden="true">{{ avatarInitials }}</span>
          <div>
            <p class="landing-testimonial__name">{{ t('landing.testimonial.name') }}</p>
            <p class="landing-testimonial__role">{{ t('landing.testimonial.role') }}</p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'parent' });

const avatarInitials = computed(() => {
  const name = t('landing.testimonial.name');
  if (!name) {
    return '';
  }

  const segments = name.split(' ').filter(Boolean);
  return segments
    .slice(0, 2)
    .map((segment) => segment.trim().charAt(0))
    .join('')
    .toUpperCase();
});
</script>
