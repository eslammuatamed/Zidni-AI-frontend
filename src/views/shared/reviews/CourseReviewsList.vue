<template>
  <div class="course-reviews-list">
    <UiAlert v-if="!courseId" color="info" variant="soft">
      {{ t('reviews.shared.selectCourse') }}
    </UiAlert>
    <div v-else class="course-reviews-list__body">
      <UiAlert v-if="loadError" color="danger" variant="soft">
        {{ loadError }}
      </UiAlert>

      <div v-if="showSummary && (summary.reviewCount > 0 || summary.averageRating !== null)" class="course-reviews-list__summary">
        <span class="course-reviews-list__summary-score">
          <UiIcon name="StarFilled" />
          <strong>{{ summary.averageRating?.toFixed(1) ?? '0.0' }}</strong>
        </span>
        <span class="course-reviews-list__summary-meta">
          {{ t('reviews.shared.summaryCount', { count: summary.reviewCount }) }}
        </span>
      </div>

      <div v-if="loading" class="course-reviews-list__loading">
        <UiSkeleton v-for="placeholder in size" :key="placeholder" height="72px" />
      </div>

      <UiAlert v-else-if="!items.length" color="info" variant="soft">
        {{ t('reviews.shared.empty') }}
      </UiAlert>

      <ul v-else class="course-reviews-list__items">
        <li v-for="review in items" :key="review.id" class="course-reviews-list__item">
          <header class="course-reviews-list__item-header">
            <div class="course-reviews-list__item-meta">
              <strong>{{ review.studentName || t('reviews.shared.anonymousStudent') }}</strong>
              <time :datetime="review.createdAt">{{ formatDate(review.createdAt) }}</time>
            </div>
            <div class="course-reviews-list__item-rating">
              <UiIcon
                v-for="star in 5"
                :key="star"
                :name="review.rating >= star ? 'StarFilled' : 'StarOutlined'"
              />
            </div>
          </header>
          <p v-if="review.comment" class="course-reviews-list__comment">{{ review.comment }}</p>
        </li>
      </ul>

      <div v-if="totalPages > 1" class="course-reviews-list__pagination">
        <UiButton
          variant="outline"
          color="secondary"
          :disabled="page === 0 || loading"
          @click="previousPage"
        >
          {{ t('reviews.shared.previous') }}
        </UiButton>
        <span class="course-reviews-list__page-indicator">
          {{ t('reviews.shared.pageIndicator', { current: page + 1, total: totalPages }) }}
        </span>
        <UiButton
          variant="outline"
          color="secondary"
          :disabled="page >= totalPages - 1 || loading"
          @click="nextPage"
        >
          {{ t('reviews.shared.next') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import reviewsApi, { type CourseReview, type CourseReviewListResponse } from '@/api/reviews';

const props = defineProps<{
  courseId: number | null;
  pageSize?: number;
  showSummary?: boolean;
  refreshKey?: number;
  tenantSlug?: string | null;
  preview?: boolean;
}>();

const emit = defineEmits<{
  (e: 'summary', payload: { averageRating: number | null; reviewCount: number }): void;
  (e: 'error', message: string): void;
}>();

const { t } = useI18n();

const items = ref<CourseReview[]>([]);
const total = ref(0);
const page = ref(0);
const loading = ref(false);
const loadError = ref<string | null>(null);
const summary = reactive({ averageRating: null as number | null, reviewCount: 0 });

const size = computed(() => props.pageSize ?? 5);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)));
const showSummary = computed(() => props.showSummary !== false);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const reset = () => {
  items.value = [];
  total.value = 0;
  page.value = 0;
  summary.averageRating = null;
  summary.reviewCount = 0;
  loadError.value = null;
  emit('summary', { averageRating: summary.averageRating, reviewCount: summary.reviewCount });
};

const handleSummary = (data: CourseReviewListResponse) => {
  summary.averageRating = data.averageRating;
  summary.reviewCount = data.reviewCount;
  emit('summary', { averageRating: summary.averageRating, reviewCount: summary.reviewCount });
};

const fetchReviews = async () => {
  if (!props.courseId) {
    reset();
    return;
  }
  loading.value = true;
  loadError.value = null;
  try {
    const data = await reviewsApi.listCourseReviews(props.courseId, {
      page: page.value,
      size: size.value,
      tenantSlug: props.tenantSlug,
      preview: props.preview
    });
    items.value = data.items;
    total.value = data.total;
    page.value = data.page;
    handleSummary(data);
  } catch (error) {
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? String(error.response.data.message)
      : t('reviews.shared.loadFailed');
    loadError.value = message;
    emit('error', message);
  } finally {
    loading.value = false;
  }
};

const previousPage = () => {
  if (page.value <= 0) return;
  page.value -= 1;
  void fetchReviews();
};

const nextPage = () => {
  if (page.value >= totalPages.value - 1) return;
  page.value += 1;
  void fetchReviews();
};

watch(
  () => props.courseId,
  () => {
    page.value = 0;
    void fetchReviews();
  }
);

watch(
  () => props.tenantSlug,
  () => {
    page.value = 0;
    void fetchReviews();
  }
);

watch(
  () => props.preview,
  () => {
    page.value = 0;
    void fetchReviews();
  }
);

watch(
  () => props.refreshKey,
  () => {
    page.value = 0;
    void fetchReviews();
  }
);

onMounted(() => {
  void fetchReviews();
});

defineExpose({ refresh: fetchReviews });

watch(size, () => {
  page.value = 0;
  void fetchReviews();
});
</script>

<style scoped>
.course-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-reviews-list__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-reviews-list__summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-neutral-50, #f9fafb);
  border-radius: 0.75rem;
}

.course-reviews-list__summary-score {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  color: var(--color-warning-500, #fbbf24);
}

.course-reviews-list__summary-score strong {
  font-size: 1.25rem;
}

.course-reviews-list__summary-meta {
  color: var(--color-neutral-600, #4b5563);
}

.course-reviews-list__loading {
  display: grid;
  gap: 0.75rem;
}

.course-reviews-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
}

.course-reviews-list__item {
  border: 1px solid var(--color-neutral-200, #e5e7eb);
  border-radius: 0.75rem;
  padding: 1rem;
  background-color: var(--color-surface, #ffffff);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
}

.course-reviews-list__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.course-reviews-list__item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.course-reviews-list__item-meta time {
  color: var(--color-neutral-500, #6b7280);
}

.course-reviews-list__item-rating {
  display: inline-flex;
  gap: 0.25rem;
  color: var(--color-warning-500, #fbbf24);
}

.course-reviews-list__comment {
  margin: 0.75rem 0 0;
  color: var(--color-neutral-700, #374151);
  line-height: 1.5;
}

.course-reviews-list__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.course-reviews-list__page-indicator {
  font-size: 0.875rem;
  color: var(--color-neutral-600, #4b5563);
}
</style>
