<template>
  <ThemePage :title="title" :subtitle="subtitle">
    <section class="student-assistant">
      <UiCard class="student-assistant__card" hover>
        <template #title>{{ t('student.assistant.quickLinksTitle', defaultQuickLinksTitle) }}</template>
        <template #subtitle>{{ t('student.assistant.quickLinksSubtitle', defaultQuickLinksSubtitle) }}</template>
        <ul class="student-assistant__links" role="list">
          <li class="student-assistant__link-item" v-for="link in links" :key="link.id">
            <span class="student-assistant__link-label">
              {{ link.label }}
            </span>
            <UiButton size="sm" color="primary" :to="link.to">
              {{ link.cta }}
            </UiButton>
          </li>
        </ul>
      </UiCard>
      <UiCard class="student-assistant__card" hover>
        <template #title>{{ t('student.assistant.tipsTitle', defaultTipsTitle) }}</template>
        <p class="student-assistant__body">
          {{ t('student.assistant.tipsDescription', defaultTipsDescription) }}
        </p>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';

const { t } = useI18n();

const fallback = (key: string, defaultValue: string) =>
  computed(() => {
    const translated = t(key);
    return translated === key ? defaultValue : translated;
  });

const title = fallback('student.assistant.title', 'Learning Assistant');
const subtitle = fallback('student.assistant.subtitle', 'Find everything you need to keep learning.');
const defaultQuickLinksTitle = 'Quick links';
const defaultQuickLinksSubtitle = 'Jump into your courses and guided assistants';
const defaultTipsTitle = 'Need a hand?';
const defaultTipsDescription = 'Use the assistant to review lessons, ask questions, or revisit saved resources.';

const links = computed(() => {
  const openLabelKey = 'student.assistant.open';
  const openLabelFallback = 'Open';
  const openLabel = t(openLabelKey);
  const cta = openLabel === openLabelKey ? openLabelFallback : openLabel;

  const courseLabelKey = 'student.assistant.goToCourses';
  const courseFallback = 'Browse your courses';
  const courseLabel = t(courseLabelKey);

  const guideLabelKey = 'student.assistant.openAssistantChat';
  const guideFallback = 'Continue with guided practice';
  const assistantLabel = t(guideLabelKey);

  const firstLabel = courseLabel === courseLabelKey ? courseFallback : courseLabel;
  const secondLabel = assistantLabel === guideLabelKey ? guideFallback : assistantLabel;

  return [
    {
      id: 'courses',
      label: firstLabel,
      cta,
      to: { name: 'student-teacher-courses' }
    },
    {
      id: 'learning',
      label: secondLabel,
      cta,
      to: { name: 'student-learning' }
    }
  ];
});
</script>

<style scoped>
.student-assistant {
  display: grid;
  gap: var(--sakai-space-6);
}

.student-assistant__card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.student-assistant__links {
  display: grid;
  gap: var(--sakai-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.student-assistant__link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
}

.student-assistant__link-label {
  font-weight: var(--sakai-font-weight-medium);
}

.student-assistant__body {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}
</style>
