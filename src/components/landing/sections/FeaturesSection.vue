<template>
  <section class="landing-features">
    <div class="landing-features__inner">
      <header class="landing-section-heading">
        <h2 class="landing-section-heading__title">{{ title }}</h2>
        <p v-if="subtitle" class="landing-section-heading__subtitle">{{ subtitle }}</p>
      </header>
      <div class="landing-features__grid">
        <article v-for="item in items" :key="item.title" class="landing-feature-card">
          <div v-if="item.icon" class="landing-feature-card__icon">
            <UiIcon :name="item.icon" :size="26" />
          </div>
          <h3 class="landing-feature-card__title">{{ item.title }}</h3>
          <p class="landing-feature-card__description">{{ item.description }}</p>
        </article>
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

const title = computed(() => config.value.title || t('landing.featuresTitle'));
const subtitle = computed(() => (config.value.subtitle as string | undefined) || '');

const items = computed(() => {
  const raw = (config.value.items as Array<Record<string, string>> | undefined) || [];
  return raw
    .map((item) => ({
      icon: item.icon,
      title: item.title,
      description: item.description
    }))
    .filter((item) => Boolean(item.title));
});
</script>

<style scoped>
.landing-features {
  padding-block: clamp(var(--sakai-space-10), 8vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
  background: transparent;
}

.landing-features__inner {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.landing-section-heading {
  display: grid;
  gap: var(--sakai-space-3);
  text-align: center;
}

.landing-section-heading__title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: var(--sakai-font-weight-bold);
  color: var(--sakai-text-color);
}

.landing-section-heading__subtitle {
  margin: 0 auto;
  max-width: 48rem;
  color: var(--sakai-text-color-secondary);
  font-size: 1.05rem;
}

.landing-features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sakai-space-5);
}

.landing-feature-card {
  position: relative;
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  background: var(--landing-surface, var(--sakai-surface-card));
  border: 1px solid var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 70%, transparent));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-sm));
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.landing-feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-primary) 16%, transparent),
    color-mix(in srgb, var(--sakai-secondary) 18%, transparent)
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.landing-feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--landing-shadow-hover, var(--sakai-shadow-md));
}

.landing-feature-card:hover::before {
  opacity: 1;
}

.landing-feature-card > * {
  position: relative;
  z-index: 1;
}

.landing-feature-card__icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--sakai-border-radius-lg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--sakai-primary) 18%, transparent);
  color: var(--sakai-primary);
}

.landing-feature-card__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-feature-card__description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.98rem;
  line-height: var(--sakai-line-height-lg);
}
</style>
