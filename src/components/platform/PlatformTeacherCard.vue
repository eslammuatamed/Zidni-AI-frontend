<template>
  <article class="platform-teacher-card">
    <div class="platform-teacher-card__header">
      <UiAvatar :name="teacher.name" :src="avatarSrc" size="lg" />
      <div class="platform-teacher-card__meta">
        <h3 class="platform-teacher-card__name">{{ teacher.name }}</h3>
        <p v-if="teacher.subject" class="platform-teacher-card__subject">{{ teacher.subject }}</p>
        <div v-if="hasRating" class="platform-teacher-card__rating">
          <UiIcon name="StarFilled" :size="18" />
          <span>{{ teacher.rating?.toFixed(1) }}</span>
          <span class="platform-teacher-card__rating-count">({{ teacher.ratingCount }})</span>
        </div>
      </div>
    </div>
    <slot />
    <UiButton :to="teacher.landingRoute" color="primary" variant="solid" class="platform-teacher-card__cta">
      {{ t('platform.teachers.viewProfile') }}
    </UiButton>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import type { PlatformTeacherSummary } from '@/services/platformCatalog';
import { withCacheBusting } from '@/utils/cacheBusting';

const props = defineProps<{ teacher: PlatformTeacherSummary }>();

const { t } = useI18n();

const hasRating = computed(() => typeof props.teacher.rating === 'number' && props.teacher.ratingCount != null);
const avatarSrc = computed(() => withCacheBusting(props.teacher.photoUrl));
</script>

<style scoped>
.platform-teacher-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1.5rem, 3vw, 2rem);
  border-radius: 1.25rem;
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-md);
  min-height: 100%;
}

.platform-teacher-card__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.platform-teacher-card__meta {
  display: grid;
  gap: 0.35rem;
}

.platform-teacher-card__name {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 600;
  margin: 0;
  color: var(--sakai-text-strong);
}

.platform-teacher-card__subject {
  margin: 0;
  color: var(--sakai-text-muted);
  font-size: 0.95rem;
}

.platform-teacher-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--sakai-warning-600);
}

.platform-teacher-card__rating-count {
  color: var(--sakai-text-muted);
}

.platform-teacher-card__cta {
  margin-top: auto;
  width: 100%;
}
</style>
