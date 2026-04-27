<template>
  <section class="landing-offers">
    <div class="landing-offers__inner">
      <header class="landing-section-heading">
        <h2 class="landing-section-heading__title">{{ title }}</h2>
      </header>
      <div v-if="items.length" class="landing-offers__grid">
        <article v-for="offer in items" :key="offer.code" class="landing-offer-card">
          <UiTag color="secondary" variant="soft" size="sm" class="landing-offer-card__tag">
            {{ readableType(offer.type) }}
          </UiTag>
          <h3 class="landing-offer-card__title">{{ offer.name }}</h3>
          <p v-if="offer.description" class="landing-offer-card__description">{{ offer.description }}</p>
          <dl class="landing-offer-card__meta">
            <div v-if="offer.type === 'PERCENTAGE'">
              <dt>{{ t('landing.offers.percentageLabel') }}</dt>
              <dd>{{ offer.percentage }}%</dd>
            </div>
            <div v-else-if="offer.type === 'FIXED'">
              <dt>{{ t('landing.offers.amountLabel') }}</dt>
              <dd>{{ offer.amount }}</dd>
            </div>
            <div v-else-if="offer.type === 'BUNDLE'">
              <dt>{{ t('landing.offers.bundleLabel') }}</dt>
              <dd>{{ offer.bundlePrice }}</dd>
            </div>
          </dl>
          <p v-if="offer.courses?.length" class="landing-offer-card__courses">
            {{ t('landing.offers.includes') }}
            <span class="landing-offer-card__course" v-for="(course, index) in offer.courses" :key="course.id">
              {{ course.title }}<span v-if="index < offer.courses.length - 1">،</span>
            </span>
          </p>
        </article>
      </div>
      <div v-else class="landing-offers__empty">
        {{ t('landing.offers.empty') }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiTag from '@/components/ui/UiTag.vue';
import type { LandingOffer } from '@/services/landing';

const props = defineProps<{ config: Record<string, any>; offers?: LandingOffer[] }>();

const { t } = useI18n();

const title = computed(() => props.config?.title || t('landing.offers.title'));

const items = computed<LandingOffer[]>(() => {
  if (props.offers && props.offers.length) {
    return props.offers;
  }
  const rawItems = (props.config?.items as LandingOffer[] | undefined) || [];
  return rawItems;
});

const readableType = (type: LandingOffer['type']) => {
  switch (type) {
    case 'PERCENTAGE':
      return t('landing.offers.types.percentage');
    case 'FIXED':
      return t('landing.offers.types.fixed');
    case 'BUNDLE':
      return t('landing.offers.types.bundle');
    default:
      return type;
  }
};
</script>

<style scoped>
.landing-offers {
  padding-block: clamp(var(--sakai-space-10), 7vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
}

.landing-offers__inner {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.landing-offers__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-5);
}

.landing-offer-card {
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

.landing-offer-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--landing-shadow-hover, var(--sakai-shadow-md));
}

.landing-offer-card__tag {
  justify-self: flex-start;
}

.landing-offer-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-offer-card__description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-lg);
}

.landing-offer-card__meta {
  margin: 0;
  display: grid;
  gap: var(--sakai-space-2);
  font-size: 0.95rem;
  color: var(--sakai-text-color);
}

.landing-offer-card__meta div {
  display: flex;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 6%, var(--landing-surface, transparent));
}

.landing-offer-card__meta dt {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.landing-offer-card__meta dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.landing-offer-card__courses {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.landing-offer-card__course {
  color: var(--sakai-text-color);
}

.landing-offers__empty {
  text-align: center;
  padding: calc(var(--sakai-space-8) + var(--sakai-space-4)) 0;
  color: var(--sakai-text-color-tertiary);
  background: var(--landing-surface-soft, rgba(255, 255, 255, 0.7));
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  border: 1px dashed var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 60%, transparent));
}
</style>
