<template>
  <ThemePage :title="t('moderation.title')" :subtitle="t('moderation.subtitle')">
    <section class="moderation">
      <UiAlert v-if="!featureEnabled" color="warning" variant="soft" class="moderation__alert">
        {{ t('moderation.disabled') }}
      </UiAlert>

      <div v-else class="moderation__content">
        <div class="moderation__overview" :aria-label="t('moderation.metrics.title')">
          <UiStatCard
            v-for="metric in queueMetrics"
            :key="metric.label"
            :label="metric.label"
            :value="metric.value"
            :secondary-stat="metric.description"
            :icon="metric.icon"
            :color="metric.color"
          />
        </div>

        <UiCard class="moderation__filters-card">
          <template #title>{{ t('moderation.filtersTitle') }}</template>
          <template #subtitle>{{ t('moderation.filtersSubtitle') }}</template>

          <form class="moderation__filters-form" @submit.prevent="applyFilters">
            <div class="moderation__filters-grid">
              <div class="moderation__filters-group">
                <span class="moderation__filters-heading">{{ t('moderation.filters.quickGroup') }}</span>
                <UiSelect :model-value="filters.status" :label="t('moderation.filters.status')" @update:model-value="onStatusChange">
                  <option value="">{{ t('syndication.status.all') }}</option>
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </UiSelect>
                <UiInput
                  v-model="filters.q"
                  appearance="search"
                  :label="t('moderation.filters.search')"
                  :placeholder="t('moderation.filters.searchPlaceholder')"
                />
                <UiInput
                  v-model="filters.teacherSlug"
                  :label="t('moderation.filters.teacherSlug')"
                  :placeholder="t('moderation.filters.teacherPlaceholder')"
                />
              </div>
              <div class="moderation__filters-group">
                <span class="moderation__filters-heading">{{ t('moderation.filters.dateGroup') }}</span>
                <div class="moderation__filters-dates">
                  <UiInput v-model="filters.from" type="date" :label="t('moderation.filters.from')" />
                  <UiInput v-model="filters.to" type="date" :label="t('moderation.filters.to')" />
                </div>
              </div>
            </div>
            <div class="moderation__filters-actions">
              <UiButton button-type="submit" color="primary" prepend-icon="FilterOutlined">
                {{ t('moderation.filters.apply') }}
              </UiButton>
              <UiButton
                variant="outline"
                color="secondary"
                prepend-icon="ReloadOutlined"
                button-type="button"
                @click="resetFilters"
              >
                {{ t('moderation.filters.reset') }}
              </UiButton>
            </div>
          </form>
        </UiCard>

        <UiCard class="moderation__queue-card" hover>
          <template #title>{{ t('moderation.queueTitle') }}</template>
          <template #subtitle>{{ t('moderation.queueSubtitle') }}</template>
          <template #actions>
            <div class="moderation__queue-actions">
              <span class="moderation__last-updated">{{ lastRefreshedLabel }}</span>
              <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" :disabled="loading" @click="refreshQueue">
                {{ t('moderation.refresh') }}
              </UiButton>
            </div>
          </template>

          <div v-if="items.length" class="moderation__status-summary">
            <span class="moderation__status-title">{{ t('moderation.statusSummaryTitle') }}</span>
            <div class="moderation__status-tags">
              <UiTag v-for="status in statusSummary" :key="status.key" :color="status.color" size="sm">
                {{ status.label }} · {{ status.count }}
              </UiTag>
            </div>
          </div>

          <div class="moderation__table-wrapper">
            <UiTable
              :headers="headers"
              :items="items"
              :loading="loading"
              density="comfortable"
              class="moderation__table"
              :empty-text="t('moderation.empty')"
            >
              <template #item.publication.status="{ item }">
                <UiTag :color="statusColor(item.publication.status)" size="sm">{{ statusLabel(item.publication.status) }}</UiTag>
              </template>
              <template #item.publication.createdAt="{ item }">
                {{ formatDate(item.publication.createdAt) }}
              </template>
              <template #item.publication.publishedAt="{ item }">
                {{ formatDate(item.publication.publishedAt) }}
              </template>
              <template #item.actions="{ item }">
                <div class="moderation__actions">
                  <UiButton size="sm" variant="link" @click="openDetail(item.publication.id)">
                    {{ t('moderation.viewAction') }}
                  </UiButton>
                  <UiButton
                    v-if="item.publication.status === 'pending'"
                    size="sm"
                    variant="link"
                    color="success"
                    prepend-icon="CheckOutlined"
                    @click="openAction('approve', item.publication.id)"
                  >
                    {{ t('moderation.approve') }}
                  </UiButton>
                  <UiButton
                    v-if="item.publication.status === 'pending' || item.publication.status === 'approved'"
                    size="sm"
                    variant="link"
                    color="danger"
                    prepend-icon="StopOutlined"
                    @click="openAction('reject', item.publication.id)"
                  >
                    {{ t('moderation.reject') }}
                  </UiButton>
                  <UiButton
                    v-if="item.publication.status === 'approved'"
                    size="sm"
                    variant="link"
                    color="secondary"
                    prepend-icon="EyeInvisibleOutlined"
                    @click="openAction('unpublish', item.publication.id)"
                  >
                    {{ t('moderation.unpublish') }}
                  </UiButton>
                </div>
              </template>
            </UiTable>
          </div>

          <div class="moderation__footer" v-if="items.length">
            <span>
              {{ t('syndication.paginationSummary', {
                from: page * size + 1,
                to: Math.min(page * size + size, totalElements),
                total: totalElements
              }) }}
            </span>
            <div class="moderation__pager">
              <UiButton variant="link" size="sm" :disabled="page === 0 || loading" @click="changePage(page - 1)">
                {{ t('syndication.prevPage') }}
              </UiButton>
              <UiButton variant="link" size="sm" :disabled="isLastPage || loading" @click="changePage(page + 1)">
                {{ t('syndication.nextPage') }}
              </UiButton>
            </div>
          </div>
        </UiCard>
      </div>
    </section>

    <UiDialog v-model="detailDialog.open" :title="detailDialog.detail?.title || t('moderation.detailTitle')" width="720px">
      <div v-if="detailDialog.loading" class="moderation__loading">
        <UiSkeleton v-for="index in 3" :key="index" height="32px" />
      </div>
      <div v-else-if="detailDialog.detail" class="moderation__detail">
        <h3>{{ detailDialog.detail.title }}</h3>
        <p class="moderation__detail-description">{{ detailDialog.detail.description || t('moderation.noDescription') }}</p>
        <div class="moderation__detail-meta">
          <div>
            <strong>{{ t('moderation.detail.teacher') }}:</strong>
            <span>{{ detailDialog.detail.teacher?.name }}</span>
          </div>
          <div>
            <strong>{{ t('moderation.detail.source') }}:</strong>
            <span>{{ detailDialog.detail.sourceKind }}</span>
          </div>
          <div>
            <strong>{{ t('moderation.detail.publishedAt') }}:</strong>
            <span>{{ formatDate(detailDialog.detail.publishedAt) }}</span>
          </div>
        </div>
        <div class="moderation__detail-tags" v-if="detailDialog.detail.tags.length">
          <UiTag v-for="tag in detailDialog.detail.tags" :key="tag" size="sm">#{{ tag }}</UiTag>
        </div>
        <div v-if="detailDialog.detail.videoUrl" class="moderation__detail-video">
          <a :href="detailDialog.detail.videoUrl" target="_blank" rel="noopener" class="moderation__detail-link">
            {{ t('moderation.detail.openVideo') }}
          </a>
        </div>
        <div v-if="detailDialog.detail.moderationNote" class="moderation__detail-note">
          <strong>{{ t('moderation.detail.note') }}:</strong>
          <span>{{ detailDialog.detail.moderationNote }}</span>
        </div>
      </div>
      <div v-else>
        <UiAlert color="danger" variant="soft">{{ t('moderation.detailError') }}</UiAlert>
      </div>
    </UiDialog>

    <UiDialog v-model="actionDialog.open" :title="actionDialog.title" width="520px">
      <form class="moderation__form" @submit.prevent="submitAction">
        <UiAlert v-if="actionDialog.error" color="danger" variant="soft">{{ actionDialog.error }}</UiAlert>
        <UiTextarea
          v-model="actionDialog.note"
          :label="t('moderation.noteLabel')"
          :placeholder="t('moderation.notePlaceholder')"
          :rows="4"
        />
        <div class="moderation__dialog-actions">
          <UiButton button-type="submit" color="primary" :disabled="actionDialog.loading">
            {{ actionDialog.submitLabel }}
          </UiButton>
          <UiButton variant="link" :disabled="actionDialog.loading" @click="actionDialog.open = false">
            {{ t('common.cancel') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import { useToast } from '@/composables/useToast';
import {
  approvePublication,
  fetchAdminPublication,
  fetchAdminPublications,
  rejectPublication,
  unpublishPublication,
  type AdminPublicationSummary,
  type PublicationDetail
} from '@/services/syndication';

const { t, locale } = useI18n();
const toast = useToast();

const featureEnabled = ref(true);
const loading = ref(false);
const items = ref<AdminPublicationSummary[]>([]);
const page = ref(0);
const size = ref(20);
const totalElements = ref(0);
const totalPages = ref(0);
const lastRefreshed = ref<Date | null>(null);

const filters = reactive({
  status: 'pending',
  q: '',
  teacherSlug: '',
  from: '',
  to: ''
});

const detailDialog = reactive({
  open: false,
  loading: false,
  detail: null as PublicationDetail | null
});

const actionDialog = reactive({
  open: false,
  loading: false,
  type: 'approve' as 'approve' | 'reject' | 'unpublish',
  title: '',
  submitLabel: '',
  note: '',
  error: '',
  targetId: 0
});

const headers = computed(() => [
  { title: t('moderation.table.title'), key: 'publication.title' },
  { title: t('moderation.table.teacher'), key: 'teacher.name' },
  { title: t('moderation.table.status'), key: 'publication.status' },
  { title: t('moderation.table.submittedAt'), key: 'publication.createdAt' },
  { title: t('moderation.table.publishedAt'), key: 'publication.publishedAt' },
  { title: t('moderation.table.actions'), key: 'actions', sortable: false }
]);

const statusOptions = computed(() => [
  { value: 'pending', label: t('syndication.status.pending') },
  { value: 'approved', label: t('syndication.status.approved') },
  { value: 'rejected', label: t('syndication.status.rejected') },
  { value: 'unpublished', label: t('syndication.status.unpublished') }
]);

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const dateTimeFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
);

const lastRefreshedLabel = computed(() => {
  if (!lastRefreshed.value) {
    return t('moderation.neverRefreshed');
  }
  return t('moderation.lastRefreshed', { value: dateTimeFormatter.value.format(lastRefreshed.value) });
});

const statusSummary = computed(() => {
  const counts: Record<AdminPublicationSummary['publication']['status'], number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    unpublished: 0
  };

  for (const item of items.value) {
    const status = item.publication.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return (Object.keys(counts) as Array<keyof typeof counts>).map((key) => ({
    key,
    count: counts[key],
    label: statusLabel(key),
    color: statusColor(key)
  }));
});

const queueMetrics = computed(() => {
  const summary = statusSummary.value;
  const pending = summary.find((entry) => entry.key === 'pending')?.count ?? 0;
  const approved = summary.find((entry) => entry.key === 'approved')?.count ?? 0;
  const rejected = summary.find((entry) => entry.key === 'rejected')?.count ?? 0;
  const unpublished = summary.find((entry) => entry.key === 'unpublished')?.count ?? 0;

  return [
    {
      label: t('moderation.metrics.totalInQueue'),
      value: totalElements.value.toLocaleString(),
      description: t('moderation.metrics.totalInQueueDescription'),
      icon: 'InboxOutlined',
      color: 'primary'
    },
    {
      label: t('moderation.metrics.pendingToday'),
      value: pending.toLocaleString(),
      description: t('moderation.metrics.pendingTodayDescription'),
      icon: 'ClockCircleOutlined',
      color: 'warning'
    },
    {
      label: t('moderation.metrics.reviewed'),
      value: (approved + rejected + unpublished).toLocaleString(),
      description: t('moderation.metrics.reviewedDescription'),
      icon: 'SafetyCertificateOutlined',
      color: 'success'
    }
  ];
});

const statusColor = (status: AdminPublicationSummary['publication']['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'unpublished':
      return 'secondary';
    default:
      return 'warning';
  }
};

const statusLabel = (status: AdminPublicationSummary['publication']['status']) => {
  switch (status) {
    case 'approved':
      return t('syndication.status.approved');
    case 'rejected':
      return t('syndication.status.rejected');
    case 'unpublished':
      return t('syndication.status.unpublished');
    default:
      return t('syndication.status.pending');
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

async function loadPublications(resetPage = false) {
  if (resetPage) {
    page.value = 0;
  }
  loading.value = true;
  try {
    const response = await fetchAdminPublications({
      status: filters.status || undefined,
      q: filters.q || undefined,
      teacherSlug: filters.teacherSlug || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      page: page.value,
      size: size.value
    });
    featureEnabled.value = true;
    items.value = response.items;
    page.value = response.page;
    size.value = response.size;
    totalElements.value = response.totalElements;
    totalPages.value = response.totalPages;
    lastRefreshed.value = new Date();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      featureEnabled.value = false;
      items.value = [];
      lastRefreshed.value = null;
    } else {
      toast.error({ detail: t('moderation.loadFailed') });
    }
  } finally {
    loading.value = false;
  }
}

function refreshQueue() {
  loadPublications();
}

function onStatusChange(value: string) {
  filters.status = value ?? '';
  loadPublications(true);
}

function applyFilters() {
  loadPublications(true);
}

function resetFilters() {
  filters.status = 'pending';
  filters.q = '';
  filters.teacherSlug = '';
  filters.from = '';
  filters.to = '';
  loadPublications(true);
}

function changePage(target: number) {
  if (target < 0 || target === page.value) {
    return;
  }
  page.value = target;
  loadPublications();
}

async function openDetail(id: number) {
  detailDialog.open = true;
  detailDialog.loading = true;
  detailDialog.detail = null;
  try {
    detailDialog.detail = await fetchAdminPublication(id);
  } catch (error) {
    detailDialog.detail = null;
  } finally {
    detailDialog.loading = false;
  }
}

function openAction(type: 'approve' | 'reject' | 'unpublish', id: number) {
  actionDialog.open = true;
  actionDialog.type = type;
  actionDialog.targetId = id;
  actionDialog.loading = false;
  actionDialog.note = '';
  actionDialog.error = '';
  if (type === 'approve') {
    actionDialog.title = t('moderation.approveDialogTitle');
    actionDialog.submitLabel = t('moderation.approve');
  } else if (type === 'reject') {
    actionDialog.title = t('moderation.rejectDialogTitle');
    actionDialog.submitLabel = t('moderation.reject');
  } else {
    actionDialog.title = t('moderation.unpublishDialogTitle');
    actionDialog.submitLabel = t('moderation.unpublish');
  }
}

async function submitAction() {
  actionDialog.error = '';
  actionDialog.loading = true;
  try {
    if (actionDialog.type === 'approve') {
      await approvePublication(actionDialog.targetId, { note: actionDialog.note || undefined });
      toast.success({ detail: t('moderation.approvedToast') });
    } else if (actionDialog.type === 'reject') {
      await rejectPublication(actionDialog.targetId, { note: actionDialog.note || undefined });
      toast.success({ detail: t('moderation.rejectedToast') });
    } else {
      await unpublishPublication(actionDialog.targetId, { note: actionDialog.note || undefined });
      toast.success({ detail: t('moderation.unpublishedToast') });
    }
    actionDialog.open = false;
    await loadPublications();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      actionDialog.error = error.response.data.message;
    } else {
      actionDialog.error = t('moderation.actionFailed');
    }
  } finally {
    actionDialog.loading = false;
  }
}

onMounted(() => {
  loadPublications(true);
});
</script>

<style scoped>
.moderation {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.moderation__alert {
  margin-bottom: 1rem;
}

.moderation__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(1.5rem, 2vw, 2rem);
  align-items: start;
}

.moderation__overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(1rem, 3vw, 1.5rem);
}

.moderation__filters-card :deep(.ui-card__body) {
  gap: 1.5rem;
}

.moderation__filters-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.moderation__filters-grid {
  display: grid;
  gap: clamp(1rem, 3vw, 1.5rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.moderation__filters-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--sakai-surface-subtle);
  border-radius: var(--sakai-border-radius-lg);
  padding: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
}

.moderation__filters-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-tertiary);
}

.moderation__filters-dates {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.moderation__filters-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.moderation__queue-card :deep(.ui-card__body) {
  gap: 1.5rem;
}

.moderation__filters-card,
.moderation__queue-card {
  min-width: 0;
}

.moderation__queue-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.moderation__last-updated {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.moderation__status-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-subtle);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
}

.moderation__status-title {
  font-size: 0.9rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.moderation__status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.moderation__table-wrapper {
  overflow-x: auto;
}

.moderation__table { 
  min-width: 720px;
}

.moderation__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.moderation__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.moderation__pager {
  display: flex;
  gap: 0.5rem;
}

.moderation__detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moderation__detail-description {
  white-space: pre-line;
}

.moderation__detail-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.moderation__detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.moderation__detail-video {
  margin-top: 0.5rem;
}

.moderation__detail-link {
  color: var(--muse-primary);
  font-weight: var(--muse-font-semibold);
}

.moderation__detail-note {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.moderation__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moderation__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.moderation__loading {
  display: grid;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .moderation__filters-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .moderation__filters-actions :deep(.ui-button) {
    flex: 1 1 100%;
  }
}

@media (min-width: 1024px) {
  .moderation__filters-actions {
    justify-content: flex-start;
  }
}

@media (min-width: 1200px) {
  .moderation__content {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  }

  .moderation__overview {
    grid-column: 1 / -1;
  }

  .moderation__filters-card {
    grid-column: 1 / 2;
    position: sticky;
    top: 1.5rem;
  }

  .moderation__queue-card {
    grid-column: 2 / 3;
  }
}

@media (min-width: 1440px) {
  .moderation__content {
    grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  }
}
</style>
