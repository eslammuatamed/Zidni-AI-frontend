<template>
  <ThemePage :title="t('studentTeacherCourses.title')" :subtitle="t('studentTeacherCourses.subtitle')">
    <template #actions>
      <UiButton
        variant="outline"
        color="primary"
        prepend-icon="ReloadOutlined"
        :disabled="loading"
        @click="refresh"
      >
        {{ t('common.refresh') }}
      </UiButton>
    </template>

    <div class="student-teacher-courses flex flex-col gap-4">
      <UiAlert v-if="error" color="danger" variant="soft">
        {{ t('studentTeacherCourses.error') }}
      </UiAlert>
      <UiAlert v-else-if="!featureEnabled && !loading" color="warning" variant="soft">
        {{ t('studentTeacherCourses.unavailable') }}
      </UiAlert>

      <div
        v-if="featureEnabled"
        class="student-teacher-courses__catalog grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))] mt-2"
        :aria-busy="loading"
        role="list"
      >
        <article
          v-for="course in courses"
          :key="course.id"
          class="student-teacher-courses__card"
          role="listitem"
        >
          <div
            class="student-teacher-courses__cover relative w-full aspect-video bg-cover bg-center bg-no-repeat"
            :style="coverStyle(course)"
            role="img"
            :aria-label="course.title"
          ></div>
          <div class="student-teacher-courses__card-body grid gap-4 p-5">
            <header class="student-teacher-courses__card-header flex flex-wrap items-start justify-between gap-3">
              <div class="student-teacher-courses__card-titles flex flex-col gap-[0.35rem]">
                <h3>{{ course.title }}</h3>
                <span>{{ formatType(course.type) }}</span>
              </div>
              <UiBadge v-if="course.language" color="info" variant="soft">
                {{ course.language.toUpperCase() }}
              </UiBadge>
            </header>
            <p v-if="course.description" class="student-teacher-courses__card-description m-0 text-[0.95rem] leading-[1.5] text-content-secondary line-clamp-3">
              {{ course.description }}
            </p>
            <dl class="student-teacher-courses__card-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(8rem,1fr))]">
              <div>
                <dt>{{ t('studentTeacherCourses.tableLevel') }}</dt>
                <dd>{{ formatLevel(course.level) }}</dd>
              </div>
              <div>
                <dt>{{ t('studentTeacherCourses.tablePrice') }}</dt>
                <dd>{{ formatPrice(course) }}</dd>
              </div>
            </dl>
            <UiButton
              class="student-teacher-courses__card-action justify-center"
              color="primary"
              append-icon="RightOutlined"
              @click="goToCourse(course)"
            >
              {{ t('studentTeacherCourses.viewAction') }}
            </UiButton>
          </div>
        </article>
        <p
          v-if="!loading && !courses.length"
          class="student-teacher-courses__empty"
          role="status"
        >
          {{ t('studentTeacherCourses.empty') }}
        </p>
      </div>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import api from '@/services/api';
import type { StudentCourseSummary as StudentCourseBase } from '@/services/student';
import { useTenantStore } from '@/stores/tenant';
import { withPlaceholder } from '@/utils/placeholders';
import { getStoredTenantSlug } from '@/utils/tenantStorage';

type StudentCourseSummary = StudentCourseBase & { description?: string | null };

const { t, locale } = useI18n();
const router = useRouter();
const tenantStore = useTenantStore();

const courses = ref<StudentCourseSummary[]>([]);
const loading = ref(false);
const error = ref(false);
const featureEnabled = ref(true);

const tenantSlug = computed(() => {
  if (tenantStore.branding?.slug) {
    return tenantStore.branding.slug;
  }
  const storedTenant = getStoredTenantSlug().raw;
  return storedTenant || 'demo';
});

const loadCourses = async () => {
  if (!tenantSlug.value) {
    return;
  }
  loading.value = true;
  error.value = false;
  featureEnabled.value = true;
  try {
    const { data } = await api.get<StudentCourseSummary[]>(
      '/api/v1/students/courses'
    );
    courses.value = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          currency: item.currency ? item.currency.toUpperCase() : item.currency
        }))
      : [];
  } catch (err: any) {
    if (err?.response?.status === 404) {
      courses.value = [];
      featureEnabled.value = false;
    } else {
      error.value = true;
      console.error('Failed to load teacher courses', err);
    }
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  await loadCourses();
};

const formatType = (value?: string) => {
  if (!value) {
    return t('studentTeacherCourses.typeUnknown');
  }
  const normalized = value.toLowerCase();
  if (normalized === 'recorded') {
    return t('publicCourses.typeRecorded');
  }
  if (normalized === 'live') {
    return t('publicCourses.typeLive');
  }
  return value;
};

const formatLevel = (value?: string) => {
  if (!value) {
    return t('studentTeacherCourses.levelUnknown');
  }
  const normalized = value.toLowerCase();
  if (normalized === 'beginner') {
    return t('publicCourses.levelBeginner');
  }
  if (normalized === 'intermediate') {
    return t('publicCourses.levelIntermediate');
  }
  if (normalized === 'advanced') {
    return t('publicCourses.levelAdvanced');
  }
  return value;
};

const formatPrice = (course: StudentCourseSummary) => {
  if (course.price == null) {
    return t('studentTeacherCourses.priceUnknown');
  }
  const amount = Number(course.price);
  if (!Number.isFinite(amount)) {
    return t('studentTeacherCourses.priceUnknown');
  }
  if (amount === 0) {
    return t('studentTeacherCourses.free');
  }
  const currency = (course.currency || 'EGP').toUpperCase();
  try {
    return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
};

const coverStyle = (course: StudentCourseSummary) => ({
  backgroundImage: `url(${withPlaceholder(course.thumbnailUrl ?? null, 'course')})`
});

const goToCourse = (course: StudentCourseSummary) => {
  const slug = tenantSlug.value;
  if (!slug) {
    return;
  }
  router.push({ name: 'public-course-detail', params: { slug, courseId: course.id } });
};

onMounted(async () => {
  if (!tenantStore.branding) {
    try {
      await tenantStore.fetchBranding();
    } catch (err) {
      console.warn('Failed to fetch tenant branding', err);
    }
  }
  await loadCourses();
});
</script>

<style scoped>
.student-teacher-courses__card {
  display: grid;
  grid-template-rows: auto 1fr;
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--sakai-shadow-color) 15%, transparent);
  min-height: 100%;
  overflow: hidden;
}

.student-teacher-courses__card-titles h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.student-teacher-courses__card-titles span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.student-teacher-courses__card-grid div {
  display: grid;
  gap: var(--sakai-space-1);
}

.student-teacher-courses__card-grid dt {
  font-size: 0.78rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
}

.student-teacher-courses__card-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.student-teacher-courses__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--sakai-space-6) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px dashed color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  color: var(--sakai-text-color-secondary);
}

@media (max-width: 480px) {
  .student-teacher-courses__card {
    grid-template-rows: auto 1fr;
  }

  .student-teacher-courses__card-body {
    padding: var(--sakai-space-4);
  }
}
</style>
