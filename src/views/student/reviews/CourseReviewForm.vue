<template>
  <UiCard class="course-review-form">
    <UiAlert v-if="!courseId" color="info" variant="soft">
      {{ t('reviews.student.selectCourse') }}
    </UiAlert>
    <div v-else class="course-review-form__body">
      <UiAlert v-if="loadError" color="danger" variant="soft" class="course-review-form__alert">
        {{ loadError }}
      </UiAlert>
      <form class="course-review-form__form" @submit.prevent="submit">
        <fieldset :disabled="isDisabled" class="course-review-form__fieldset">
          <legend class="course-review-form__legend">{{ t('reviews.student.ratingLabel') }}</legend>
          <div class="course-review-form__rating">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="course-review-form__star"
              :class="{ 'is-active': (rating ?? 0) >= star }"
              @click="setRating(star)"
            >
              <UiIcon :name="(rating ?? 0) >= star ? 'StarFilled' : 'StarOutlined'" />
              <span class="sr-only">{{ star }}</span>
            </button>
          </div>
        </fieldset>
        <UiTextarea
          v-model="comment"
          class="course-review-form__comment"
          :label="t('reviews.student.commentLabel')"
          :placeholder="t('reviews.student.commentPlaceholder')"
          :rows="4"
          :disabled="isDisabled"
          maxlength="2000"
        />
        <div class="course-review-form__actions">
          <UiButton
            button-type="submit"
            color="primary"
            :loading="submitting"
            :disabled="isDisabled || rating === null"
          >
            {{ rating === null ? t('reviews.student.selectRating') : t('reviews.student.submitCta') }}
          </UiButton>
        </div>
      </form>
      <p v-if="lastUpdated" class="course-review-form__meta">
        {{ t('reviews.student.lastSubmitted', { date: formatDate(lastUpdated) }) }}
      </p>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import reviewsApi, { type CourseReview } from '@/api/reviews';

const props = defineProps<{ courseId: number | null; disabled?: boolean }>();

const emit = defineEmits<{
  (e: 'submitted', review: CourseReview): void;
  (e: 'error', message: string): void;
}>();

const { t } = useI18n();

const rating = ref<number | null>(null);
const comment = ref('');
const lastUpdated = ref<string | null>(null);
const loading = ref(false);
const submitting = ref(false);
const loadError = ref<string | null>(null);

const isDisabled = computed(() => submitting.value || loading.value || props.disabled === true);

const resetForm = () => {
  rating.value = null;
  comment.value = '';
  lastUpdated.value = null;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const loadReview = async () => {
  if (!props.courseId) {
    resetForm();
    loadError.value = null;
    return;
  }
  loading.value = true;
  loadError.value = null;
  try {
    const review = await reviewsApi.fetchStudentCourseReview(props.courseId);
    rating.value = review.rating;
    comment.value = review.comment ?? '';
    lastUpdated.value = review.createdAt;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      resetForm();
    } else {
      loadError.value = t('reviews.student.loadFailed');
      emit('error', loadError.value);
    }
  } finally {
    loading.value = false;
  }
};

const setRating = (value: number) => {
  if (isDisabled.value) return;
  rating.value = value;
};

const submit = async () => {
  if (!props.courseId || rating.value === null) {
    return;
  }
  submitting.value = true;
  try {
    const review = await reviewsApi.submitStudentCourseReview(props.courseId, {
      rating: rating.value,
      comment: comment.value || undefined
    });
    rating.value = review.rating;
    comment.value = review.comment ?? '';
    lastUpdated.value = review.createdAt;
    loadError.value = null;
    emit('submitted', review);
  } catch (error) {
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? String(error.response.data.message)
      : t('reviews.student.submitFailed');
    emit('error', message);
    loadError.value = message;
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.courseId,
  () => {
    void loadReview();
  }
);

onMounted(() => {
  void loadReview();
});

defineExpose({ refresh: loadReview });
</script>

<style scoped>
.course-review-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-review-form__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-review-form__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-review-form__rating {
  display: inline-flex;
  gap: 0.5rem;
}

.course-review-form__star {
  border: none;
  background: transparent;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-warning-500, #fbbf24);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.course-review-form__star:is(:hover, :focus-visible) {
  transform: scale(1.1);
}

.course-review-form__star:not(.is-active) {
  color: var(--color-neutral-400, #9ca3af);
}

.course-review-form__actions {
  display: flex;
  justify-content: flex-end;
}

.course-review-form__meta {
  font-size: 0.875rem;
  color: var(--color-neutral-600, #4b5563);
  margin: 0;
}

.course-review-form__legend {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.course-review-form__fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.course-review-form__alert {
  margin: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
