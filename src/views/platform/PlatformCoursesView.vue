<template>
  <ThemePage>
    <div class="platform-courses">
      <header class="platform-courses__filters">
        <div class="platform-courses__intro">
          <h1>{{ t('platform.courses.title') }}</h1>
          <p>{{ t('platform.courses.subtitle') }}</p>
        </div>
        <div class="platform-courses__form" role="search">
          <UiInput v-model="filters.q" :placeholder="t('platform.courses.searchPlaceholder')" start-icon="SearchOutlined" />
          <UiInput v-model="filters.subject" :placeholder="t('platform.courses.subjectPlaceholder')" />
          <UiInput v-model="filters.language" :placeholder="t('platform.courses.languagePlaceholder')" />
          <UiSelect v-model="filters.type">
            <option value="">{{ t('platform.courses.typeAny') }}</option>
            <option value="recorded">{{ t('platform.courses.types.recorded') }}</option>
            <option value="live">{{ t('platform.courses.types.live') }}</option>
            <option value="blended">{{ t('platform.courses.types.blended') }}</option>
          </UiSelect>
          <UiSelect v-model="filters.level">
            <option value="">{{ t('platform.courses.levelAny') }}</option>
            <option value="beginner">{{ t('platform.courses.levels.beginner') }}</option>
            <option value="intermediate">{{ t('platform.courses.levels.intermediate') }}</option>
            <option value="advanced">{{ t('platform.courses.levels.advanced') }}</option>
          </UiSelect>
          <div class="platform-courses__price">
            <UiInput v-model="filters.priceMin" type="number" :placeholder="t('platform.courses.priceMin')" />
            <UiInput v-model="filters.priceMax" type="number" :placeholder="t('platform.courses.priceMax')" />
          </div>
          <UiSelect v-model="filters.sort">
            <option value="createdAt,desc">{{ t('platform.courses.sort.newest') }}</option>
            <option value="price,asc">{{ t('platform.courses.sort.priceAsc') }}</option>
            <option value="price,desc">{{ t('platform.courses.sort.priceDesc') }}</option>
            <option value="rating,desc">{{ t('platform.courses.sort.ratingDesc') }}</option>
            <option value="rating,asc">{{ t('platform.courses.sort.ratingAsc') }}</option>
          </UiSelect>
        </div>
      </header>

      <UiAlert v-if="error" color="danger" variant="soft">{{ t('platform.courses.loadError') }}</UiAlert>

      <div v-if="loading" class="platform-courses__grid">
        <div v-for="index in 6" :key="`course-loading-${index}`" class="platform-courses__card-skeleton"></div>
      </div>

      <div v-else-if="courses.length" class="platform-courses__grid">
        <PlatformCourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>

      <div v-else class="platform-courses__empty">
        <UiIcon name="BookOutlined" :size="42" />
        <p>{{ t('platform.courses.emptyState') }}</p>
      </div>

      <nav v-if="meta.totalPages > 1" class="platform-courses__pagination" aria-label="{{ t('platform.courses.paginationLabel') }}">
        <UiButton variant="outline" color="primary" :disabled="page === 0" @click="goToPage(page - 1)">
          {{ t('platform.courses.prevPage') }}
        </UiButton>
        <span class="platform-courses__page-indicator">
          {{ t('platform.courses.pageXofY', { page: page + 1, total: meta.totalPages }) }}
        </span>
        <UiButton variant="outline" color="primary" :disabled="page + 1 >= meta.totalPages" @click="goToPage(page + 1)">
          {{ t('platform.courses.nextPage') }}
        </UiButton>
      </nav>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import PlatformCourseCard from '@/components/platform/PlatformCourseCard.vue';
import { fetchPlatformCourses, type PlatformCourseSummary, type PageResponse } from '@/services/platformCatalog';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const filters = reactive({
  q: '',
  subject: '',
  language: '',
  type: '',
  level: '',
  priceMin: '',
  priceMax: '',
  sort: 'createdAt,desc'
});

const page = ref(0);
const size = 12;
const courses = ref<PlatformCourseSummary[]>([]);
const meta = reactive({ totalPages: 0, totalElements: 0 });
const loading = ref(false);
const error = ref(false);

let syncingRoute = false;

watch(
  () => route.query,
  () => {
    syncingRoute = true;
    filters.q = (route.query.q as string) || '';
    filters.subject = (route.query.subject as string) || '';
    filters.language = (route.query.language as string) || '';
    filters.type = (route.query.type as string) || '';
    filters.level = (route.query.level as string) || '';
    filters.priceMin = (route.query.priceMin as string) || '';
    filters.priceMax = (route.query.priceMax as string) || '';
    filters.sort = (route.query.sort as string) || 'createdAt,desc';
    page.value = route.query.page ? Math.max(parseInt(route.query.page as string, 10) || 0, 0) : 0;
    loadCourses();
    syncingRoute = false;
  },
  { immediate: true }
);

watch(
  () => [filters.q, filters.subject, filters.language, filters.type, filters.level, filters.priceMin, filters.priceMax, filters.sort],
  () => {
    if (syncingRoute) return;
    page.value = 0;
    updateRoute();
  }
);

watch(page, () => {
  if (syncingRoute) return;
  updateRoute();
});

function updateRoute() {
  const query: Record<string, string> = {};
  if (filters.q) query.q = filters.q;
  if (filters.subject) query.subject = filters.subject;
  if (filters.language) query.language = filters.language;
  if (filters.type) query.type = filters.type;
  if (filters.level) query.level = filters.level;
  if (filters.priceMin) query.priceMin = filters.priceMin;
  if (filters.priceMax) query.priceMax = filters.priceMax;
  if (filters.sort && filters.sort !== 'createdAt,desc') query.sort = filters.sort;
  if (page.value > 0) query.page = String(page.value);
  router.replace({ name: 'platform-courses', query });
}

async function loadCourses() {
  loading.value = true;
  error.value = false;
  try {
    const response: PageResponse<PlatformCourseSummary> = await fetchPlatformCourses({
      q: filters.q || undefined,
      subject: filters.subject || undefined,
      language: filters.language || undefined,
      type: filters.type || undefined,
      level: filters.level || undefined,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      sort: filters.sort,
      page: page.value,
      size
    });
    courses.value = response.items;
    meta.totalPages = response.totalPages;
    meta.totalElements = response.totalElements;
  } catch (err) {
    console.warn('[platform] failed to load courses', err);
    error.value = true;
    courses.value = [];
    meta.totalPages = 0;
    meta.totalElements = 0;
  } finally {
    loading.value = false;
  }
}

function goToPage(nextPage: number) {
  page.value = Math.max(nextPage, 0);
}
</script>

<style scoped>
.platform-courses {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 6vw, 3rem) clamp(3rem, 6vw, 4rem);
  background: var(--sakai-surface-section);
  min-height: 100vh;
}

.platform-courses__filters {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.platform-courses__intro h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  color: var(--sakai-text-strong);
}

.platform-courses__intro p {
  margin: 0.5rem 0 0;
  color: var(--sakai-text-muted);
  max-width: 720px;
}

.platform-courses__form {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
}

.platform-courses__price {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.platform-courses__grid {
  display: grid;
  gap: clamp(1.25rem, 3vw, 2rem);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.platform-courses__card-skeleton {
  border-radius: 1.25rem;
  min-height: 280px;
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  animation: platformPulse 1.6s ease-in-out infinite;
}

.platform-courses__empty {
  margin: 3rem auto;
  text-align: center;
  display: grid;
  gap: 1rem;
  justify-items: center;
  color: var(--sakai-text-muted);
}

.platform-courses__pagination {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.platform-courses__page-indicator {
  font-weight: 600;
  color: var(--sakai-text-strong);
}

@keyframes platformPulse {
  0% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.55;
  }
}
</style>
