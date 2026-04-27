<template>
  <ThemePage :title="pageTitle" :subtitle="pageSubtitle">
    <div class="public-courses" :class="{ 'public-courses--rtl': isRtl }">
      <section class="public-courses__filters">
        <h2 class="public-courses__filters-title">{{ t('publicCourses.filtersTitle') }}</h2>
        <form class="public-courses__form" @submit.prevent="applyFilters">
          <UiInput v-model="filters.q" :label="t('publicCourses.searchPlaceholder')" clearable />
          <UiSelect
            v-model="filters.level"
            :label="t('publicCourses.levelLabel')"
            :items="levelOptions"
            clearable
          />
          <UiSelect
            v-model="filters.type"
            :label="t('publicCourses.typeLabel')"
            :items="typeOptions"
            clearable
          />
          <div class="public-courses__price">
            <UiInput
              v-model="filters.priceMin"
              type="number"
              min="0"
              :label="t('publicCourses.priceMin')"
            />
            <UiInput
              v-model="filters.priceMax"
              type="number"
              min="0"
              :label="t('publicCourses.priceMax')"
            />
          </div>
          <div class="public-courses__actions">
            <UiButton type="submit" color="primary">{{ t('publicCourses.apply') }}</UiButton>
            <UiButton type="button" variant="tonal" @click="resetFilters">
              {{ t('publicCourses.reset') }}
            </UiButton>
          </div>
        </form>
        <UiAlert v-if="!featureEnabled" color="warning" variant="soft">
          {{ t('publicCourses.disabled') }}
        </UiAlert>
      </section>
      <section class="public-courses__results">
        <div v-if="loading" class="public-courses__grid">
          <div v-for="index in 6" :key="`course-skeleton-${index}`" class="public-courses__skeleton">
            <UiSkeleton height="12rem" />
            <UiSkeleton height="1.25rem" />
            <UiSkeleton height="1rem" />
          </div>
        </div>
        <UiAlert v-else-if="error" color="danger" variant="soft" class="public-courses__alert">
          {{ t('publicCourses.error') }}
        </UiAlert>
        <template v-else>
          <div v-if="courses.length" class="public-courses__grid">
            <RouterLink
              v-for="course in courses"
              :key="course.id"
              class="public-courses__card"
              :to="{
                name: 'public-course-detail',
                params: { slug: slug, courseId: course.id },
                query: isPreview ? { preview: '1' } : undefined
              }"
            >
              <div class="public-courses__card-media" :style="cardStyle(course)"></div>
              <div class="public-courses__card-body">
                <h3 class="public-courses__card-title">{{ course.title }}</h3>
                <p class="public-courses__card-meta">
                  <span v-if="course.type">{{ course.type }}</span>
                  <span>· {{ formatPrice(course) }}</span>
                </p>
                <p class="public-courses__card-description">
                  {{ course.description || t('publicCourses.noDescription') }}
                </p>
              </div>
            </RouterLink>
          </div>
          <p v-else class="public-courses__empty">{{ t('publicCourses.empty') }}</p>
        </template>
        <div v-if="totalPages > 1" class="public-courses__pagination">
          <UiButton variant="tonal" :disabled="page === 0" @click="changePage(page - 1)">
            {{ t('publicCourses.prev') }}
          </UiButton>
          <span class="public-courses__pagination-label">
            {{ t('publicCourses.pageOf', { page: page + 1, total: totalPages }) }}
          </span>
          <UiButton variant="tonal" :disabled="page >= totalPages - 1" @click="changePage(page + 1)">
            {{ t('publicCourses.next') }}
          </UiButton>
        </div>
      </section>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import api from '@/services/api';
import { useTenantStore } from '@/stores/tenant';
import { withPlaceholder } from '@/utils/placeholders';
import { isPreviewEnabled } from '@/utils/preview';

interface PublicCourseSummary {
  id: number;
  title: string;
  type?: string;
  price: number;
  currency?: string;
  level?: string;
  language?: string;
  thumbnailUrl?: string;
  description?: string;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const courses = ref<PublicCourseSummary[]>([]);
const loading = ref(false);
const error = ref(false);
const featureEnabled = ref(true);
const page = ref(0);
const size = 9;
const totalPages = ref(0);
const totalElements = ref(0);

const filters = reactive({
  q: '',
  level: '',
  type: '',
  priceMin: '',
  priceMax: ''
});

const slug = computed(
  () => (route.params.slug as string) || tenantStore.branding?.slug || tenantStore.slug || import.meta.env.VITE_TENANT_SLUG?.trim() || 'demo'
);
const isPreview = computed(() => isPreviewEnabled(route.query.preview));
const isRtl = computed(() => locale.value === 'ar');

const pageTitle = computed(() => {
  const teacher = tenantStore.branding?.name;
  return teacher ? t('publicCourses.titleWithTeacher', { teacher }) : t('publicCourses.title');
});
const pageSubtitle = computed(() => t('publicCourses.subtitle'));

const levelOptions = computed(() => [
  { label: t('publicCourses.levelBeginner'), value: 'beginner' },
  { label: t('publicCourses.levelIntermediate'), value: 'intermediate' },
  { label: t('publicCourses.levelAdvanced'), value: 'advanced' }
]);

const typeOptions = computed(() => [
  { label: t('publicCourses.typeRecorded'), value: 'recorded' },
  { label: t('publicCourses.typeLive'), value: 'live' }
]);

function cardStyle(course: PublicCourseSummary) {
  const image = withPlaceholder(course.thumbnailUrl, 'course');
  return { '--public-courses-card-image': `url(${image})` } as Record<string, string>;
}

function formatPrice(course: PublicCourseSummary) {
  const amount = course.price ?? 0;
  const currency = (course.currency || 'EGP').toUpperCase();
  try {
    return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
}

function applyFilters() {
  page.value = 0;
  updateRoute();
}

function resetFilters() {
  filters.q = '';
  filters.level = '';
  filters.type = '';
  filters.priceMin = '';
  filters.priceMax = '';
  page.value = 0;
  updateRoute();
}

function changePage(nextPage: number) {
  if (nextPage < 0 || nextPage >= totalPages.value) return;
  page.value = nextPage;
  updateRoute();
}

function updateRoute() {
  const query: Record<string, any> = {};
  if (filters.q) query.q = filters.q;
  if (filters.level) query.level = filters.level;
  if (filters.type) query.type = filters.type;
  if (filters.priceMin) query.priceMin = filters.priceMin;
  if (filters.priceMax) query.priceMax = filters.priceMax;
  if (page.value > 0) query.page = page.value;
  if (isPreview.value) query.preview = '1';
  router.push({ name: 'public-course-list', params: { slug: slug.value }, query });
}

function syncFiltersFromRoute() {
  filters.q = (route.query.q as string) || '';
  filters.level = (route.query.level as string) || '';
  filters.type = (route.query.type as string) || '';
  filters.priceMin = (route.query.priceMin as string) || '';
  filters.priceMax = (route.query.priceMax as string) || '';
  page.value = route.query.page ? Number(route.query.page) : 0;
}

async function loadCourses() {
  if (!slug.value) return;
  loading.value = true;
  error.value = false;
  try {
    const params: Record<string, any> = { page: page.value, size, preview: isPreview.value ? 1 : 0 };
    if (filters.q) params.q = filters.q;
    if (filters.level) params.level = filters.level;
    if (filters.type) params.type = filters.type;
    if (filters.priceMin) params.priceMin = Number(filters.priceMin);
    if (filters.priceMax) params.priceMax = Number(filters.priceMax);
    const { data } = await api.get<PageResponse<PublicCourseSummary>>(
      `/public/tenants/${slug.value}/courses`,
      {
        params
      }
    );
    courses.value = (data.items || []).map((item) => ({
      ...item,
      currency: item.currency ? item.currency.toUpperCase() : undefined
    }));
    totalPages.value = data.totalPages || 0;
    totalElements.value = data.totalElements || 0;
    featureEnabled.value = true;
    document.title = `${pageTitle.value}`;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      featureEnabled.value = false;
      courses.value = [];
      totalPages.value = 0;
      totalElements.value = 0;
    } else {
      error.value = true;
    }
    console.warn('Failed to load public courses', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!tenantStore.branding) {
    await tenantStore.fetchBranding(slug.value);
  }
  syncFiltersFromRoute();
  await loadCourses();
});

watch(
  () => route.query,
  async () => {
    syncFiltersFromRoute();
    await loadCourses();
  },
  { deep: true }
);
</script>

<style scoped>
.public-courses {
  display: grid;
  gap: var(--sakai-space-8);
  padding-block: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-10));
}

.public-courses--rtl {
  direction: rtl;
}

.public-courses__filters {
  display: grid;
  gap: var(--sakai-space-4);
  padding: clamp(var(--sakai-space-5), 5vw, var(--sakai-space-7));
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-sm);
}

.public-courses__filters-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-courses__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.public-courses__price {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--sakai-space-3);
}

.public-courses__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.public-courses__results {
  display: grid;
  gap: var(--sakai-space-5);
}

.public-courses__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-4);
}

.public-courses__card,
.public-courses__skeleton {
  display: grid;
  grid-template-rows: 160px auto;
  border-radius: var(--sakai-border-radius-xl);
  overflow: hidden;
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  box-shadow: var(--sakai-shadow-sm);
  text-decoration: none;
  color: inherit;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.public-courses__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sakai-shadow-md);
}

.public-courses__card-media {
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  background-image: var(--public-courses-card-image);
  background-size: cover;
  background-position: center;
}

.public-courses__card-body {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-4);
}

.public-courses__card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-courses__card-meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
  display: flex;
  gap: var(--sakai-space-2);
}

.public-courses__card-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
  line-height: var(--sakai-line-height-md);
}

.public-courses__empty {
  margin: 0;
  text-align: center;
  color: var(--sakai-text-color-secondary);
}

.public-courses__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--sakai-space-4);
}

.public-courses__pagination-label {
  font-weight: var(--sakai-font-weight-medium);
}

.public-courses__alert {
  justify-self: center;
  max-width: 480px;
}
</style>
