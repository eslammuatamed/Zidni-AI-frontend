<template>
  <section id="integrations" class="landing-section" aria-labelledby="landing-integrations-title">
    <div class="landing-container">
      <header class="landing-section__header">
        <h2 id="landing-integrations-title" class="landing-section__title">
          {{ t('landing.integrations.title') }}
        </h2>
        <p class="landing-section__description">
          {{ t('landing.integrations.body') }}
        </p>
      </header>

      <div class="landing-integrations__grid">
        <article
          v-for="integration in integrations"
          :key="integration.key"
          class="landing-integrations__item"
        >
          <div class="landing-integrations__icon" aria-hidden="true">
            {{ integration.icon }}
          </div>
          <h3 class="landing-integrations__title">{{ integration.title }}</h3>
          <p class="landing-integrations__body">{{ integration.body }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'parent' });

const integrations = computed(() => [
  {
    key: 'aiWorkspace',
    icon: '🤖',
    title: t('landing.integrations.items.aiWorkspace.title'),
    body: t('landing.integrations.items.aiWorkspace.body')
  },
  {
    key: 'assessmentBuilder',
    icon: '📝',
    title: t('landing.integrations.items.assessmentBuilder.title'),
    body: t('landing.integrations.items.assessmentBuilder.body')
  },
  {
    key: 'liveSessions',
    icon: '🎥',
    title: t('landing.integrations.items.liveSessions.title'),
    body: t('landing.integrations.items.liveSessions.body')
  },
  {
    key: 'tutoring',
    icon: '👥',
    title: t('landing.integrations.items.tutoring.title'),
    body: t('landing.integrations.items.tutoring.body')
  },
  {
    key: 'marketingHub',
    icon: '🛍️',
    title: t('landing.integrations.items.marketingHub.title'),
    body: t('landing.integrations.items.marketingHub.body')
  },
  {
    key: 'notifications',
    icon: '🔔',
    title: t('landing.integrations.items.notifications.title'),
    body: t('landing.integrations.items.notifications.body')
  }
]);
</script>
