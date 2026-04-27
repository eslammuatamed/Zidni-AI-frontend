<template>
  <ThemePage :title="t('adminOps.backups.title')" :subtitle="t('adminOps.backups.subtitle')">
    <section class="admin-backups">
      <UiAlert v-if="!featureEnabled" color="warning" variant="soft" class="admin-backups__alert">
        {{ t('adminOps.backups.disabled') }}
      </UiAlert>

      <UiCard v-else hover>
        <template #title>{{ t('adminOps.backups.queueTitle') }}</template>
        <template #subtitle>{{ t('adminOps.backups.queueSubtitle') }}</template>

        <form class="admin-backups__filters" @submit.prevent="applyFilters()">
          <UiSelect
            :model-value="filters.status"
            :label="t('adminOps.backups.filters.status')"
            @update:model-value="onStatusChange"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiInput
            v-model="filters.from"
            type="datetime-local"
            appearance="datetime"
            :label="t('adminOps.backups.filters.from')"
          />
          <UiInput
            v-model="filters.to"
            type="datetime-local"
            appearance="datetime"
            :label="t('adminOps.backups.filters.to')"
          />
          <div class="admin-backups__filter-actions">
            <UiButton type="submit" size="sm" variant="link">{{ t('adminOps.backups.filters.apply') }}</UiButton>
            <UiButton type="button" size="sm" variant="link" color="secondary" @click="resetFilters">
              {{ t('adminOps.backups.filters.reset') }}
            </UiButton>
          </div>
        </form>

        <div class="admin-backups__actions">
          <UiButton :loading="creating" prepend-icon="CloudUploadOutlined" @click="triggerBackup">
            {{ t('adminOps.backups.actions.trigger') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="items"
          :loading="loading"
          density="comfortable"
          class="admin-backups__table"
          :empty-text="t('adminOps.backups.empty')"
        >
          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.status)" size="sm">{{ statusLabel(item.status) }}</UiTag>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.completedAt="{ item }">
            {{ formatDate(item.completedAt) }}
          </template>
          <template #item.actions="{ item }">
            <UiButton size="sm" variant="link" @click="openDetail(item.id)">
              {{ t('adminOps.backups.actions.view') }}
            </UiButton>
          </template>
        </UiTable>

        <div v-if="items.length" class="admin-backups__footer">
          <span>
            {{
              t('adminOps.backups.pagination', {
                from: page * size + 1,
                to: Math.min(page * size + size, totalElements),
                total: totalElements
              })
            }}
          </span>
          <div class="admin-backups__pager">
            <UiButton variant="link" size="sm" :disabled="page === 0 || loading" @click="changePage(page - 1)">
              {{ t('adminOps.backups.prevPage') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('adminOps.backups.nextPage') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiDialog v-model="detailDialog.open" :title="t('adminOps.backups.detail.title')" width="640px">
        <div v-if="detailDialog.loading" class="admin-backups__loading">
          <UiSkeleton v-for="index in 4" :key="index" height="28px" />
        </div>
        <div v-else-if="detailDialog.item" class="admin-backups__detail">
          <dl>
            <div>
              <dt>{{ t('adminOps.backups.detail.status') }}</dt>
              <dd>
                <UiTag :color="statusColor(detailDialog.item.status)">
                  {{ statusLabel(detailDialog.item.status) }}
                </UiTag>
              </dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.requestedBy') }}</dt>
              <dd>{{ detailDialog.item.requestedBy || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.createdAt') }}</dt>
              <dd>{{ formatDate(detailDialog.item.createdAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.startedAt') }}</dt>
              <dd>{{ formatDate(detailDialog.item.startedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.completedAt') }}</dt>
              <dd>{{ formatDate(detailDialog.item.completedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.storageUrl') }}</dt>
              <dd>
                <a
                  v-if="detailDialog.item.storageUrl"
                  :href="detailDialog.item.storageUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ detailDialog.item.storageUrl }}
                </a>
                <span v-else>—</span>
              </dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.storageKey') }}</dt>
              <dd>{{ detailDialog.item.storageKey || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.backups.detail.error') }}</dt>
              <dd>{{ detailDialog.item.errorMessage || '—' }}</dd>
            </div>
          </dl>
          <div class="admin-backups__metadata">
            <h4>{{ t('adminOps.backups.detail.metadata') }}</h4>
            <pre>{{ formatMetadata(detailDialog.item.metadata) }}</pre>
          </div>
        </div>
        <div v-else class="admin-backups__empty-detail">
          {{ t('adminOps.backups.detail.empty') }}
        </div>
      </UiDialog>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { useToast } from '@/composables/useToast';
import {
  createBackup,
  fetchBackup,
  listBackups,
  type BackupJob
} from '@/api/adminOps';

const { t } = useI18n();
const toast = useToast();

const featureEnabled = ref(true);
const loading = ref(false);
const creating = ref(false);
const items = ref<BackupJob[]>([]);
const page = ref(0);
const size = ref(20);
const totalElements = ref(0);
const totalPages = ref(0);

const filters = reactive({
  status: 'all',
  from: '',
  to: ''
});

const detailDialog = reactive({
  open: false,
  loading: false,
  item: null as BackupJob | null
});

const headers = computed(() => [
  { title: t('adminOps.backups.table.id'), key: 'id' },
  { title: t('adminOps.backups.table.status'), key: 'status' },
  { title: t('adminOps.backups.table.requestedBy'), key: 'requestedBy' },
  { title: t('adminOps.backups.table.createdAt'), key: 'createdAt' },
  { title: t('adminOps.backups.table.completedAt'), key: 'completedAt' },
  { title: t('adminOps.backups.table.actions'), key: 'actions', sortable: false }
]);

const statusOptions = computed(() => [
  { value: 'all', label: t('adminOps.backups.statuses.all') },
  { value: 'PENDING', label: t('adminOps.backups.statuses.pending') },
  { value: 'RUNNING', label: t('adminOps.backups.statuses.running') },
  { value: 'COMPLETED', label: t('adminOps.backups.statuses.completed') },
  { value: 'FAILED', label: t('adminOps.backups.statuses.failed') }
]);

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const statusColor = (status?: string | null) => {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return 'warning';
    case 'RUNNING':
      return 'info';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const statusLabel = (status?: string | null) => {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'PENDING':
      return t('adminOps.backups.statuses.pending');
    case 'RUNNING':
      return t('adminOps.backups.statuses.running');
    case 'COMPLETED':
      return t('adminOps.backups.statuses.completed');
    case 'FAILED':
      return t('adminOps.backups.statuses.failed');
    default:
      return normalized || '—';
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

const formatMetadata = (metadata: unknown) => {
  if (!metadata) {
    return t('adminOps.backups.detail.noMetadata');
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    return String(metadata);
  }
};

const toIsoString = (value: string) => {
  if (!value) {
    return undefined;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  } catch (error) {
    return undefined;
  }
};

async function loadBackups(resetPage = false) {
  if (resetPage) {
    page.value = 0;
  }
  loading.value = true;
  try {
    const response = await listBackups({
      status: filters.status === 'all' ? undefined : filters.status,
      from: toIsoString(filters.from),
      to: toIsoString(filters.to),
      page: page.value,
      size: size.value
    });
    featureEnabled.value = true;
    items.value = response.items;
    page.value = response.page;
    size.value = response.size;
    totalElements.value = response.totalElements;
    totalPages.value = response.totalPages;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      featureEnabled.value = false;
      items.value = [];
      return;
    }
    toast.error({ detail: t('adminOps.backups.toast.loadFailed') });
    console.error('[admin-backups] failed to load backups', error);
  } finally {
    loading.value = false;
  }
}

function onStatusChange(value: string) {
  filters.status = value;
  applyFilters(true);
}

function applyFilters(resetPage = true) {
  loadBackups(resetPage);
}

function resetFilters() {
  filters.status = 'all';
  filters.from = '';
  filters.to = '';
  loadBackups(true);
}

function changePage(nextPage: number) {
  if (nextPage < 0 || nextPage === page.value) {
    return;
  }
  page.value = nextPage;
  loadBackups();
}

async function triggerBackup() {
  creating.value = true;
  try {
    await createBackup();
    toast.success({ detail: t('adminOps.backups.toast.created') });
    await loadBackups(true);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      featureEnabled.value = false;
      return;
    }
    toast.error({ detail: t('adminOps.backups.toast.createFailed') });
    console.error('[admin-backups] failed to create backup', error);
  } finally {
    creating.value = false;
  }
}

async function openDetail(id: number) {
  detailDialog.open = true;
  detailDialog.loading = true;
  try {
    const job = await fetchBackup(id);
    detailDialog.item = job;
  } catch (error) {
    toast.error({ detail: t('adminOps.backups.toast.detailFailed') });
    console.error('[admin-backups] failed to load backup detail', error);
    detailDialog.item = null;
  } finally {
    detailDialog.loading = false;
  }
}

onMounted(() => {
  loadBackups(true);
});
</script>

<style scoped>
.admin-backups {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-backups__alert {
  align-self: stretch;
}

.admin-backups__filters {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-bottom: var(--sakai-space-5);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
  box-shadow: var(--sakai-shadow-sm);
}

.admin-backups__filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}

.admin-backups__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-3);
  margin-bottom: var(--sakai-space-4);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-alt) 85%, transparent);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-border-color));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sakai-primary) 2%, transparent);
}

.admin-backups__table {
  margin-bottom: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--sakai-shadow-sm);
}

.admin-backups__footer {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
  padding-top: var(--sakai-space-3);
  border-top: 0.0625rem dashed color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.admin-backups__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.admin-backups__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4) 0;
}

.admin-backups__detail dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
}

.admin-backups__detail dt {
  font-size: 0.85rem;
  color: var(--sakai-text-color-secondary);
  margin-bottom: var(--sakai-space-1);
}

.admin-backups__detail dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.admin-backups__metadata {
  margin-top: var(--sakai-space-5);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-alt) 92%, transparent);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-border-color));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sakai-primary) 2%, transparent);
}

.admin-backups__metadata pre {
  max-height: 240px;
  overflow: auto;
  background: var(--sakai-surface-100);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  font-size: 0.85rem;
}

.admin-backups__empty-detail {
  padding: var(--sakai-space-4) 0;
  color: var(--sakai-text-color-secondary);
}
</style>
