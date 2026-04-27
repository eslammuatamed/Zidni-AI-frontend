<template>
  <article class="platform-course-card">
    <div class="platform-course-card__thumbnail" :style="thumbnailStyle"></div>
    <div class="platform-course-card__body">
      <div class="platform-course-card__header">
        <UiBadge v-if="course.type" color="primary" variant="soft" class="platform-course-card__badge">
          {{ formatType(course.type) }}
        </UiBadge>
        <UiBadge v-if="course.level" color="secondary" variant="outline" class="platform-course-card__badge">
          {{ formatLevel(course.level) }}
        </UiBadge>
      </div>
      <h3 class="platform-course-card__title">{{ course.title }}</h3>
      <p class="platform-course-card__teacher">{{ course.teacher.name }}</p>
      <div class="platform-course-card__meta">
        <span v-if="course.language" class="platform-course-card__pill">
          <UiIcon name="GlobalOutlined" :size="16" />
          <span>{{ course.language.toUpperCase() }}</span>
        </span>
        <span v-if="course.price != null" class="platform-course-card__price">
          {{ currency }}{{ course.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
        </span>
      </div>
      <UiButton :to="course.ctaRoute" color="primary" variant="solid" class="platform-course-card__cta">
        {{ t('platform.courses.viewCourse') }}
      </UiButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import type { PlatformCourseSummary } from '@/services/platformCatalog';
import { withPlaceholder } from '@/utils/placeholders';

const props = defineProps<{ course: PlatformCourseSummary; currency?: string }>();

const { t, locale } = useI18n();

const thumbnailUrl = computed(() => withPlaceholder(props.course.thumbnailUrl, 'course'));
const thumbnailStyle = computed(() => ({ backgroundImage: `url(${thumbnailUrl.value})` }));
const currency = computed(() => props.currency ?? (locale.value === 'ar' ? 'ج.م ' : '$'));

function formatType(value?: string) {
  if (!value) return '';
  return t(`platform.courses.types.${value.toLowerCase()}`, value);
}

function formatLevel(value?: string) {
  if (!value) return '';
  return t(`platform.courses.levels.${value.toLowerCase()}`, value);
}
</script>

<style scoped>
.platform-course-card {
  display: flex;
  flex-direction: column;
  background: var(--sakai-surface-card);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: var(--sakai-shadow-md);
  min-height: 100%;
}

.platform-course-card__thumbnail {
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
}

.platform-course-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: clamp(1.25rem, 3vw, 1.75rem);
}

.platform-course-card__header {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.platform-course-card__badge {
  font-size: 0.75rem;
  text-transform: capitalize;
}

.platform-course-card__title {
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  margin: 0;
  color: var(--sakai-text-strong);
}

.platform-course-card__teacher {
  margin: 0;
  font-size: 0.95rem;
  color: var(--sakai-text-muted);
}

.platform-course-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}

.platform-course-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-info) 12%, transparent);
  color: var(--sakai-info-700);
  font-size: 0.8rem;
}

.platform-course-card__price {
  font-weight: 600;
  font-size: 1rem;
  color: var(--sakai-text-strong);
}

.platform-course-card__cta {
  margin-top: auto;
  width: 100%;
}
</style>
