<template>
  <section class="landing-cta" :style="ctaStyle">
    <div class="landing-cta__inner">
      <div class="landing-cta__panel">
        <h2 class="landing-cta__title">{{ title }}</h2>
        <p class="landing-cta__subtitle">{{ subtitle }}</p>
        <UiButton
          v-if="showCta"
          color="primary"
          class="landing-cta__button"
          :href="ctaHref || undefined"
          :to="ctaRoute || undefined"
        >
          {{ ctaLabel }}
        </UiButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ config: Record<string, any> }>();
const { t } = useI18n();

const config = computed(() => props.config ?? {});

const title = computed(() => config.value.title || t('landing.ctaTitle'));
const subtitle = computed(() => config.value.subtitle || t('landing.ctaSubtitle'));

const ctaLabel = computed(() => {
  const raw = (config.value.actionLabel ?? config.value.cta ?? '') as string;
  if (raw && raw.trim().length) {
    return raw.trim();
  }
  if (config.value.hideDefaultCta === true) {
    return '';
  }
  return t('landing.cta');
});

const showCta = computed(() => ctaLabel.value.trim().length > 0);

const ctaHref = computed(() => config.value.actionUrl || config.value.href || '');
const ctaRoute = computed(() => config.value.actionRoute || config.value.ctaRoute || null);

const ctaStyle = computed(() => {
  const colors = (config.value.colors as Record<string, string> | undefined) || {};
  const start = colors.start || 'var(--sakai-primary-700)';
  const end = colors.end || 'var(--sakai-secondary-500)';
  return {
    '--landing-cta-gradient': `linear-gradient(135deg, ${start}, ${end})`
  } as Record<string, string>;
});
</script>

<style scoped>
.landing-cta {
  padding-block: clamp(var(--sakai-space-10), 8vw, calc(var(--sakai-space-12) + var(--sakai-space-4)));
  background: var(--landing-cta-gradient, var(--sakai-surface-hero));
  color: var(--sakai-text-color-inverse);
}

.landing-cta__inner {
  width: min(100%, 720px);
  margin: 0 auto;
  display: grid;
}

.landing-cta__panel {
  display: grid;
  gap: var(--sakai-space-4);
  text-align: center;
  padding: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-8));
  border-radius: var(--landing-radius, var(--sakai-border-radius-lg));
  border: 1px solid var(--landing-border, var(--sakai-border-color));
  background: color-mix(in srgb, var(--landing-surface, var(--sakai-surface-card)) 92%, white);
  box-shadow: var(--landing-shadow, var(--sakai-shadow-md));
}

.landing-cta__title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: var(--sakai-font-weight-bold);
}

.landing-cta__subtitle {
  margin: 0;
  font-size: 1.05rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 82%, transparent);
  line-height: var(--sakai-line-height-lg);
}

.landing-cta__button {
  justify-self: center;
  padding-inline: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-8));
  padding-block: 0.9rem;
  font-size: 1.05rem;
  box-shadow: var(--landing-shadow, var(--sakai-shadow-md));
}
</style>
