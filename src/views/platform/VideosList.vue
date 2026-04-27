<template>
  <ThemePage :title="t('videos.title')" :subtitle="t('videos.subtitle')">
    <section class="videos-list">
      <div class="videos-list__filters">
        <UiInput
          v-model="filters.q"
          :label="t('videos.filters.search')"
          :placeholder="t('videos.filters.searchPlaceholder')"
          start-icon="SearchOutlined"
          @keyup.enter="applyFilters"
        />
        <UiInput v-model="filters.tag" :label="t('videos.filters.tag')" />
        <UiInput v-model="filters.teacherSlug" :label="t('videos.filters.teacher')" />
        <UiInput v-model="filters.dateFrom" type="date" :label="t('videos.filters.from')" />
        <UiInput v-model="filters.dateTo" type="date" :label="t('videos.filters.to')" />
        <UiButton variant="link" color="secondary" @click="resetFilters">
          {{ t('syndication.resetFilters') }}
        </UiButton>
      </div>

      <div v-if="loading" class="videos-list__loading">
        <UiSkeleton v-for="index in 6" :key="index" height="220px" />
      </div>

      <div v-else-if="items.length" class="videos-list__grid">
        <RouterLink v-for="item in items" :key="item.id" :to="{ name: 'platform-video-detail', params: { id: item.id } }" class="videos-list__card">
          <UiCard hover>
            <div class="videos-list__thumbnail" v-if="item.thumbnailUrl">
              <img :src="item.thumbnailUrl" :alt="item.title" loading="lazy" />
            </div>
            <div class="videos-list__thumbnail videos-list__thumbnail--placeholder" v-else>
              <MuseIcon name="PlayCircleOutlined" size="2x" />
            </div>
            <div class="videos-list__content">
              <h3>{{ item.title }}</h3>
              <p class="videos-list__teacher">{{ item.teacher.name }}</p>
              <div class="videos-list__meta">
                <span>{{ formatDate(item.publishedAt) }}</span>
                <span v-if="item.locale">{{ item.locale?.toUpperCase() }}</span>
              </div>
              <div class="videos-list__tags" v-if="item.tags.length">
                <UiTag v-for="tag in item.tags" :key="tag" size="sm">#{{ tag }}</UiTag>
              </div>
            </div>
          </UiCard>
        </RouterLink>
      </div>

      <UiAlert v-else color="info" variant="soft">{{ t('videos.empty') }}</UiAlert>

      <div v-if="items.length" class="videos-list__footer">
        <span>
          {{ t('syndication.paginationSummary', {
            from: page * size + 1,
            to: Math.min(page * size + size, totalElements),
            total: totalElements
          }) }}
        </span>
        <div class="videos-list__pager">
          <UiButton variant="link" size="sm" :disabled="page === 0 || loading" @click="changePage(page - 1)">
            {{ t('syndication.prevPage') }}
          </UiButton>
          <UiButton variant="link" size="sm" :disabled="isLastPage || loading" @click="changePage(page + 1)">
            {{ t('syndication.nextPage') }}
          </UiButton>
        </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import MuseIcon from '@/components/MuseIcon.vue';
import { useToast } from '@/composables/useToast';
import { fetchPublicVideos, type PublicPublicationListItem } from '@/services/syndication';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const items = ref<PublicPublicationListItem[]>([]);
const page = ref(0);
const size = ref(12);
const totalElements = ref(0);
const totalPages = ref(0);

const filters = reactive({
  q: (route.query.q as string) || '',
  tag: (route.query.tag as string) || '',
  teacherSlug: (route.query.teacherSlug as string) || '',
  dateFrom: (route.query.dateFrom as string) || '',
  dateTo: (route.query.dateTo as string) || ''
});

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const formatDate = (value?: string | null) => {
  if (!value) {
    return t('videos.notPublished');
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return value;
  }
};

async function loadVideos(resetPage = false) {
  if (resetPage) {
    page.value = 0;
  }
  loading.value = true;
  try {
    const response = await fetchPublicVideos({
      q: filters.q || undefined,
      tag: filters.tag || undefined,
      teacherSlug: filters.teacherSlug || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: page.value,
      size: size.value
    });
    items.value = response.items;
    page.value = response.page;
    size.value = response.size;
    totalElements.value = response.totalElements;
    totalPages.value = response.totalPages;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      toast.error({ detail: t('videos.loadFailed') });
    }
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  router.replace({
    query: {
      q: filters.q || undefined,
      tag: filters.tag || undefined,
      teacherSlug: filters.teacherSlug || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined
    }
  });
  loadVideos(true);
}

function resetFilters() {
  filters.q = '';
  filters.tag = '';
  filters.teacherSlug = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  applyFilters();
}

function changePage(target: number) {
  if (target < 0 || target === page.value) {
    return;
  }
  page.value = target;
  loadVideos();
}

onMounted(() => {
  loadVideos(true);
});
</script>

<style scoped>
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.videos-list__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.videos-list__loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.videos-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.videos-list__card {
  text-decoration: none;
  color: inherit;
}

.videos-list__thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--muse-radius-lg);
  overflow: hidden;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--muse-surface) 80%, var(--muse-primary) 20%);
}

.videos-list__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.videos-list__thumbnail--placeholder {
  color: var(--muse-primary);
}

.videos-list__content {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.videos-list__teacher {
  color: var(--muse-text-muted);
  margin: 0;
}

.videos-list__meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--muse-text-muted);
}

.videos-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.videos-list__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.videos-list__pager {
  display: flex;
  gap: 0.5rem;
}
</style>
