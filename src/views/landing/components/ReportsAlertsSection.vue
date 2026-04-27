<template>
  <section id="reports" class="landing-section landing-reports" aria-labelledby="landing-reports-title">
    <div class="landing-container">
      <header class="landing-section__header">
        <h2 id="landing-reports-title" class="landing-section__title">
          {{ t('landing.reports.title') }}
        </h2>
      </header>

      <div class="landing-reports__grid">
        <article v-for="card in cards" :key="card.key" class="landing-card" tabindex="0">
          <h3 class="landing-card__title">{{ card.title }}</h3>
          <p class="landing-card__body">{{ card.body }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'parent' });

const cards = computed(() => [
  {
    key: 'exports',
    title: t('landing.reports.cards.exports.title'),
    body: t('landing.reports.cards.exports.body')
  },
  {
    key: 'assessments',
    title: t('landing.reports.cards.assessments.title'),
    body: t('landing.reports.cards.assessments.body')
  },
  {
    key: 'alerts',
    title: t('landing.reports.cards.alerts.title'),
    body: t('landing.reports.cards.alerts.body')
  }
]);
</script>
