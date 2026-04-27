<template>
  <section
    class="landing-hero"
    :class="{ 'landing-hero--has-media': Boolean(heroImage) }"
    :style="heroStyle"
  >
    <div class="landing-hero__body">
      <div class="landing-hero__content">
        <h1 class="landing-hero__title">{{ heroTitle }}</h1>
        <p class="landing-hero__subtitle">{{ heroSubtitle }}</p>
        <UiButton
          v-if="showCta"
          color="primary"
          class="landing-hero__cta"
          :to="ctaRoute || undefined"
          :href="ctaHref || undefined"
        >
          {{ ctaLabel }}
        </UiButton>
      </div>
      <figure v-if="heroImage" class="landing-hero__media">
        <img :src="heroImage" :alt="config.title || heroTitle" loading="lazy" />
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { withPlaceholder } from '@/utils/placeholders';

const props = defineProps<{ config: Record<string, any> }>();
const { t } = useI18n();

const config = computed<Record<string, any>>(() => props.config ?? {});

const heroTitle = computed(() => config.value.title || t('landing.heroTitle'));
const heroSubtitle = computed(() => config.value.subtitle || t('landing.heroSubtitle'));

const ctaLabel = computed(() => {
  const raw = (config.value.cta ?? config.value.actionLabel ?? '') as string;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  if (config.value.hideDefaultCta === true) {
    return '';
  }
  return t('landing.cta');
});
const showCta = computed(() => ctaLabel.value.trim().length > 0);
const ctaHref = computed(() => config.value.actionUrl || config.value.ctaUrl || config.value.href || '');
const ctaRoute = computed(() => config.value.actionRoute || config.value.ctaRoute || null);

const heroImage = computed(() => {
  if (config.value.hideMedia === true) {
    return '';
  }
  return withPlaceholder(config.value.image || config.value.mediaUrl || '', 'hero');
});

const heroStyle = computed(() => {
  const colors = (config.value.colors as Record<string, string> | undefined) || {};
  const start = colors.start || 'var(--sakai-primary-600)';
  const end = colors.end || 'var(--sakai-secondary-500)';
  return {
    '--landing-hero-gradient': `linear-gradient(135deg, ${start}, ${end})`,
    '--landing-hero-image': heroImage.value ? `url(${heroImage.value})` : 'none'
  } as Record<string, string>;
});
</script>

<style scoped>
.landing-hero {
  position: relative;
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-lg));
  border: 1px solid color-mix(in srgb, var(--landing-border, var(--sakai-border-color)) 70%, transparent);
  color: var(--sakai-text-color-inverse);
  overflow: hidden;
}

.landing-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--landing-hero-gradient, var(--sakai-surface-hero));
  opacity: 0.94;
}

.landing-hero--has-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--sakai-overlay-strong) 70%, transparent), transparent),
    var(--landing-hero-image, none);
  background-size: cover;
  background-position: center;
  filter: saturate(1.05);
}

.landing-hero__body {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(var(--sakai-space-8), 6vw, var(--sakai-space-12));
  padding: clamp(var(--sakai-space-8), 8vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
  align-items: center;
}

.landing-hero__content {
  display: grid;
  gap: var(--sakai-space-4);
  max-width: 36rem;
}

.landing-hero__title {
  margin: 0;
  font-size: clamp(2.25rem, 4vw, 3.25rem);
  font-weight: var(--sakai-font-weight-bold);
  line-height: 1.1;
}

.landing-hero__subtitle {
  margin: 0;
  font-size: clamp(1.05rem, 2.5vw, 1.35rem);
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 82%, transparent);
}

.landing-hero__cta {
  justify-self: flex-start;
  padding-inline: clamp(var(--sakai-space-5), 4vw, var(--sakai-space-7));
  padding-block: 0.85rem;
  font-size: 1.05rem;
  box-shadow: var(--landing-shadow, var(--sakai-shadow-md));
}

.landing-hero__media {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 420px;
  margin-inline: auto;
}

.landing-hero__media img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 24px 60px color-mix(in srgb, var(--sakai-overlay-strong) 35%, transparent));
}

@media (max-width: 640px) {
  .landing-hero__cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
