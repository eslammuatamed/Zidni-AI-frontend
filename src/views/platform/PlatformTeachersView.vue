<template>
  <ThemePage>
    <div class="platform-teachers">
      <header class="platform-teachers__filters">
        <div class="platform-teachers__intro">
          <h1>{{ t('platform.teachers.title') }}</h1>
          <p>{{ t('platform.teachers.subtitle') }}</p>
        </div>
        <div class="platform-teachers__form" role="search">
          <UiInput v-model="filters.q" :placeholder="t('platform.teachers.searchPlaceholder')" start-icon="SearchOutlined" />
          <UiInput v-model="filters.subject" :placeholder="t('platform.teachers.subjectPlaceholder')" />
          <UiInput v-model="filters.language" :placeholder="t('platform.teachers.languagePlaceholder')" />
          <UiSelect v-model="filters.sort" :label="t('platform.teachers.sortLabel')">
            <option value="joindate,desc">{{ t('platform.teachers.sort.joinDateDesc') }}</option>
            <option value="rating,desc">{{ t('platform.teachers.sort.ratingDesc') }}</option>
            <option value="rating,asc">{{ t('platform.teachers.sort.ratingAsc') }}</option>
            <option value="name,asc">{{ t('platform.teachers.sort.nameAsc') }}</option>
          </UiSelect>
        </div>
      </header>

      <UiAlert v-if="error" color="danger" variant="soft">{{ t('platform.teachers.loadError') }}</UiAlert>

      <div v-if="loading" class="platform-teachers__grid">
        <div v-for="index in 6" :key="`teacher-loading-${index}`" class="platform-teachers__card-skeleton"></div>
      </div>

      <div v-else-if="teachers.length" class="platform-teachers__grid">
        <PlatformTeacherCard v-for="teacher in teachers" :key="teacher.id" :teacher="teacher">
          <p v-if="resolveTagline(teacher)" class="platform-teachers__tagline">{{ resolveTagline(teacher) }}</p>
        </PlatformTeacherCard>
      </div>

      <div v-else class="platform-teachers__empty">
        <UiIcon name="UserOutlined" :size="42" />
        <p>{{ t('platform.teachers.emptyState') }}</p>
      </div>

      <nav v-if="meta.totalPages > 1" class="platform-teachers__pagination" aria-label="{{ t('platform.teachers.paginationLabel') }}">
        <UiButton variant="outline" color="primary" :disabled="page === 0" @click="goToPage(page - 1)">
          {{ t('platform.teachers.prevPage') }}
        </UiButton>
        <span class="platform-teachers__page-indicator">
          {{ t('platform.teachers.pageXofY', { page: page + 1, total: meta.totalPages }) }}
        </span>
        <UiButton variant="outline" color="primary" :disabled="page + 1 >= meta.totalPages" @click="goToPage(page + 1)">
          {{ t('platform.teachers.nextPage') }}
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
import PlatformTeacherCard from '@/components/platform/PlatformTeacherCard.vue';
import { fetchPlatformTeachers, type PlatformTeacherSummary, type PageResponse } from '@/services/platformCatalog';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const filters = reactive({
  q: '',
  subject: '',
  language: '',
  sort: 'joindate,desc'
});

const page = ref(0);
const size = 12;
const teachers = ref<PlatformTeacherSummary[]>([]);
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
    filters.sort = (route.query.sort as string) || 'joindate,desc';
    page.value = route.query.page ? Math.max(parseInt(route.query.page as string, 10) || 0, 0) : 0;
    loadTeachers();
    syncingRoute = false;
  },
  { immediate: true }
);

watch(
  () => [filters.q, filters.subject, filters.language, filters.sort],
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
  if (filters.sort && filters.sort !== 'joindate,desc') query.sort = filters.sort;
  if (page.value > 0) query.page = String(page.value);
  router.replace({ name: 'platform-teachers', query });
}

async function loadTeachers() {
  loading.value = true;
  error.value = false;
  try {
    const response: PageResponse<PlatformTeacherSummary> = await fetchPlatformTeachers({
      q: filters.q || undefined,
      subject: filters.subject || undefined,
      language: filters.language || undefined,
      sort: filters.sort,
      page: page.value,
      size
    });
    teachers.value = response.items;
    meta.totalPages = response.totalPages;
    meta.totalElements = response.totalElements;
  } catch (err) {
    console.warn('[platform] failed to load teachers', err);
    error.value = true;
    teachers.value = [];
    meta.totalPages = 0;
    meta.totalElements = 0;
  } finally {
    loading.value = false;
  }
}

function goToPage(nextPage: number) {
  page.value = Math.max(nextPage, 0);
}

function resolveTagline(teacher: PlatformTeacherSummary) {
  const branding = teacher.branding as Record<string, any> | undefined;
  return branding?.tagline || '';
}
</script>

<style scoped>
.platform-teachers {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 6vw, 3rem) clamp(3rem, 6vw, 4rem);
  background: var(--sakai-surface-section);
  min-height: 100vh;
}

.platform-teachers__filters {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.platform-teachers__intro h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  color: var(--sakai-text-strong);
}

.platform-teachers__intro p {
  margin: 0.5rem 0 0;
  color: var(--sakai-text-muted);
  max-width: 720px;
}

.platform-teachers__form {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: end;
}

.platform-teachers__grid {
  display: grid;
  gap: clamp(1.25rem, 3vw, 2rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.platform-teachers__card-skeleton {
  border-radius: 1.25rem;
  min-height: 240px;
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  animation: platformPulse 1.6s ease-in-out infinite;
}

.platform-teachers__tagline {
  margin: 0;
  color: var(--sakai-text-muted);
  font-size: 0.9rem;
}

.platform-teachers__empty {
  margin: 3rem auto;
  text-align: center;
  display: grid;
  gap: 1rem;
  justify-items: center;
  color: var(--sakai-text-muted);
}

.platform-teachers__pagination {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.platform-teachers__page-indicator {
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
