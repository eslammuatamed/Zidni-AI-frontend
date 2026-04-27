<template>
  <ThemePage :title="t('adminOps.audit.title')" :subtitle="t('adminOps.audit.subtitle')">
    <section class="admin-audit">
      <UiAlert v-if="!featureEnabled" color="warning" variant="soft" class="admin-audit__alert">
        {{ t('adminOps.audit.disabled') }}
      </UiAlert>

      <UiCard v-else hover>
        <template #title>{{ t('adminOps.audit.tableTitle') }}</template>
        <template #subtitle>{{ t('adminOps.audit.tableSubtitle') }}</template>

        <form class="admin-audit__filters" @submit.prevent="applyFilters()">
          <UiInput
            v-model="filters.q"
            :label="t('adminOps.audit.filters.search')"
            :placeholder="t('adminOps.audit.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
          />
          <UiSelect
            :model-value="filters.actorType"
            :label="t('adminOps.audit.filters.actorType')"
            @update:model-value="onActorChange"
          >
            <option v-for="option in actorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiInput
            v-model="filters.entityType"
            :label="t('adminOps.audit.filters.entityType')"
            placeholder="AuditLog"
          />
          <UiInput
            v-model="filters.from"
            type="datetime-local"
            appearance="datetime"
            :label="t('adminOps.audit.filters.from')"
          />
          <UiInput
            v-model="filters.to"
            type="datetime-local"
            appearance="datetime"
            :label="t('adminOps.audit.filters.to')"
          />
          <div class="admin-audit__filter-actions">
            <UiButton type="submit" size="sm" variant="link">{{ t('adminOps.audit.filters.apply') }}</UiButton>
            <UiButton type="button" size="sm" variant="link" color="secondary" @click="resetFilters">
              {{ t('adminOps.audit.filters.reset') }}
            </UiButton>
          </div>
        </form>

        <div class="admin-audit__actions">
          <UiButton
            :loading="exporting"
            variant="secondary"
            prepend-icon="DownloadOutlined"
            @click="exportLogs"
          >
            {{ t('adminOps.audit.actions.export') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="displayItems"
          :loading="loading"
          density="comfortable"
          class="admin-audit__table"
          :empty-text="t('adminOps.audit.empty')"
        >
          <template #item.actor="{ item }">
            <div class="admin-audit__actor">
              <UiTag :color="actorColor(item.actorType)" size="sm">{{ actorLabel(item.actorType) }}</UiTag>
              <span v-if="item.actorName" class="admin-audit__actor-name">{{ item.actorName }}</span>
              <small v-if="item.actorId" class="admin-audit__actor-id">#{{ item.actorId }}</small>
            </div>
          </template>
          <template #item.entity="{ item }">
            <div class="admin-audit__entity">
              <span>{{ item.entityType || '—' }}</span>
              <small v-if="item.entityId">#{{ item.entityId }}</small>
            </div>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <UiButton size="sm" variant="link" @click="openDetail(item)">
              {{ t('adminOps.audit.actions.view') }}
            </UiButton>
          </template>
        </UiTable>

        <div v-if="displayItems.length" class="admin-audit__footer">
          <span>
            {{
              t('adminOps.audit.pagination', {
                from: page * size + 1,
                to: Math.min(page * size + size, totalElements),
                total: totalElements
              })
            }}
          </span>
          <div class="admin-audit__pager">
            <UiButton variant="link" size="sm" :disabled="page === 0 || loading" @click="changePage(page - 1)">
              {{ t('adminOps.audit.prevPage') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('adminOps.audit.nextPage') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiDialog v-model="detailDialog.open" :title="t('adminOps.audit.detail.title')" width="640px">
        <div v-if="selectedItem" class="admin-audit__detail">
          <dl>
            <div>
              <dt>{{ t('adminOps.audit.detail.actor') }}</dt>
              <dd>{{ actorLabel(selectedItem.actorType) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.actorName') }}</dt>
              <dd>{{ selectedItem.actorName || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.actorId') }}</dt>
              <dd>{{ selectedItem.actorId ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.entity') }}</dt>
              <dd>{{ selectedItem.entityType || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.entityId') }}</dt>
              <dd>{{ selectedItem.entityId ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.action') }}</dt>
              <dd>{{ selectedItem.action || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminOps.audit.detail.createdAt') }}</dt>
              <dd>{{ formatDate(selectedItem.createdAt) }}</dd>
            </div>
          </dl>
          <div class="admin-audit__payload">
            <h4>{{ t('adminOps.audit.detail.payload') }}</h4>
            <pre>{{ formatPayload(selectedItem.payload) }}</pre>
          </div>
        </div>
        <div v-else class="admin-audit__empty-detail">
          {{ t('adminOps.audit.detail.empty') }}
        </div>
      </UiDialog>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
import { useToast } from '@/composables/useToast';
import { exportAuditLogs, listAuditLogs, type AuditLogEntry } from '@/api/adminOps';
import { extractAssistantNameFromPayload, isAssistantActor } from '@/utils/audit';

const { t } = useI18n();
const toast = useToast();

const featureEnabled = ref(true);
const loading = ref(false);
const exporting = ref(false);
const items = ref<AuditLogEntry[]>([]);
const page = ref(0);
const size = ref(20);
const totalElements = ref(0);
const totalPages = ref(0);

const filters = reactive({
  q: '',
  actorType: 'all',
  entityType: '',
  from: '',
  to: ''
});

const detailDialog = reactive({
  open: false,
  itemId: null as number | null
});

const displayItems = computed(() =>
  items.value.map((entry) => {
    if (!isAssistantActor(entry.actorType)) {
      return entry;
    }
    const resolvedName = extractAssistantNameFromPayload(entry.payload);
    if (resolvedName && resolvedName !== entry.actorName) {
      return { ...entry, actorName: resolvedName };
    }
    return entry;
  })
);

const selectedItem = computed(() => {
  if (detailDialog.itemId == null) {
    return null;
  }
  return displayItems.value.find((entry) => entry.id === detailDialog.itemId) ?? null;
});

watch(
  () => detailDialog.open,
  (open) => {
    if (!open) {
      detailDialog.itemId = null;
    }
  }
);

const headers = computed(() => [
  { title: t('adminOps.audit.table.id'), key: 'id' },
  { title: t('adminOps.audit.table.action'), key: 'action' },
  { title: t('adminOps.audit.table.actor'), key: 'actor' },
  { title: t('adminOps.audit.table.entity'), key: 'entity' },
  { title: t('adminOps.audit.table.createdAt'), key: 'createdAt' },
  { title: t('adminOps.audit.table.actions'), key: 'actions', sortable: false }
]);

const actorOptions = computed(() => [
  { value: 'all', label: t('adminOps.audit.actorTypes.all') },
  { value: 'STUDENT', label: t('adminOps.audit.actorTypes.student') },
  { value: 'TEACHER', label: t('adminOps.audit.actorTypes.teacher') },
  { value: 'TEACHER_ASSISTANT', label: t('adminOps.audit.actorTypes.teacherAssistant') },
  { value: 'PLATFORM_ADMIN', label: t('adminOps.audit.actorTypes.platformAdmin') },
  { value: 'SYSTEM', label: t('adminOps.audit.actorTypes.system') }
]);

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const actorColor = (actorType?: string | null) => {
  switch ((actorType || '').toUpperCase()) {
    case 'STUDENT':
      return 'secondary';
    case 'TEACHER':
      return 'primary';
    case 'TEACHER_ASSISTANT':
      return 'success';
    case 'PLATFORM_ADMIN':
      return 'info';
    case 'SYSTEM':
      return 'neutral';
    default:
      return 'neutral';
  }
};

const actorLabel = (actorType?: string | null) => {
  switch ((actorType || '').toUpperCase()) {
    case 'STUDENT':
      return t('adminOps.audit.actorTypes.student');
    case 'TEACHER':
      return t('adminOps.audit.actorTypes.teacher');
    case 'TEACHER_ASSISTANT':
      return t('adminOps.audit.actorTypes.teacherAssistant');
    case 'PLATFORM_ADMIN':
      return t('adminOps.audit.actorTypes.platformAdmin');
    case 'SYSTEM':
      return t('adminOps.audit.actorTypes.system');
    default:
      return t('adminOps.audit.actorTypes.unknown');
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

const formatPayload = (payload: unknown) => {
  if (!payload) {
    return t('adminOps.audit.detail.noPayload');
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return String(payload);
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

async function loadAudit(resetPage = false) {
  if (resetPage) {
    page.value = 0;
  }
  loading.value = true;
  try {
    const response = await listAuditLogs({
      q: filters.q || undefined,
      actorType: filters.actorType === 'all' ? undefined : filters.actorType,
      entityType: filters.entityType || undefined,
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
    if (axios.isAxiosError(error) && [404, 403].includes(error.response?.status ?? 0)) {
      featureEnabled.value = false;
      items.value = [];
      return;
    }
    toast.error({ detail: t('adminOps.audit.toast.loadFailed') });
    console.error('[admin-audit] failed to load audit logs', error);
  } finally {
    loading.value = false;
  }
}

function applyFilters(resetPage = true) {
  loadAudit(resetPage);
}

function resetFilters() {
  filters.q = '';
  filters.actorType = 'all';
  filters.entityType = '';
  filters.from = '';
  filters.to = '';
  loadAudit(true);
}

function onActorChange(value: string) {
  filters.actorType = value;
  applyFilters(true);
}

function changePage(next: number) {
  if (next < 0 || next === page.value) {
    return;
  }
  page.value = next;
  loadAudit();
}

async function exportLogs() {
  exporting.value = true;
  try {
    const blob = await exportAuditLogs({
      q: filters.q || undefined,
      actorType: filters.actorType === 'all' ? undefined : filters.actorType,
      entityType: filters.entityType || undefined,
      from: toIsoString(filters.from),
      to: toIsoString(filters.to)
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-log.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error) && [404, 403].includes(error.response?.status ?? 0)) {
      featureEnabled.value = false;
      return;
    }
    toast.error({ detail: t('adminOps.audit.toast.exportFailed') });
    console.error('[admin-audit] failed to export audit logs', error);
  } finally {
    exporting.value = false;
  }
}

function openDetail(item: AuditLogEntry) {
  detailDialog.itemId = item.id ?? null;
  detailDialog.open = true;
}

onMounted(() => {
  loadAudit(true);
});
</script>

<style scoped>
.admin-audit {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-audit__alert {
  align-self: stretch;
}

.admin-audit__filters {
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

.admin-audit__filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}

.admin-audit__actions {
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

.admin-audit__table {
  margin-bottom: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--sakai-shadow-sm);
}

.admin-audit__actor,
.admin-audit__entity {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.admin-audit__actor-name {
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.admin-audit__actor-id {
  font-size: 0.75rem;
  color: var(--sakai-text-color-secondary);
}

.admin-audit__footer {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
  padding-top: var(--sakai-space-3);
  border-top: 0.0625rem dashed color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.admin-audit__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.admin-audit__detail dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
}

.admin-audit__detail dt {
  font-size: 0.85rem;
  color: var(--sakai-text-color-secondary);
  margin-bottom: var(--sakai-space-1);
}

.admin-audit__detail dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.admin-audit__payload {
  margin-top: var(--sakai-space-5);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-alt) 92%, transparent);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-border-color));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sakai-primary) 2%, transparent);
}

.admin-audit__payload pre {
  max-height: 240px;
  overflow: auto;
  background: var(--sakai-surface-100);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  font-size: 0.85rem;
}

.admin-audit__empty-detail {
  padding: var(--sakai-space-4) 0;
  color: var(--sakai-text-color-secondary);
}
</style>
