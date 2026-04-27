<template>
  <ThemePage :title="t('nav.teacherAudit')" :subtitle="t('adminOps.audit.subtitle')">
    <section class="teacher-audit">
      <UiCard hover>
        <template #title>{{ t('adminOps.audit.tableTitle') }}</template>
        <template #subtitle>{{ t('adminOps.audit.tableSubtitle') }}</template>

        <form class="teacher-audit__filters" @submit.prevent="applyFilters()">
          <UiInput
            v-model="filters.q"
            :label="t('adminOps.audit.filters.search')"
            :placeholder="t('adminOps.audit.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
          />
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
          <div class="teacher-audit__filter-actions">
            <UiButton type="submit" size="sm" variant="link">{{ t('adminOps.audit.filters.apply') }}</UiButton>
            <UiButton type="button" size="sm" variant="link" color="secondary" @click="resetFilters">
              {{ t('adminOps.audit.filters.reset') }}
            </UiButton>
          </div>
        </form>

        <div class="teacher-audit__actions">
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
          class="teacher-audit__table"
          :empty-text="t('adminOps.audit.empty')"
        >
          <template #item.actor="{ item }">
            <div class="teacher-audit__actor">
              <UiTag :color="actorColor(item.actorType)" size="sm">{{ actorLabel(item.actorType) }}</UiTag>
              <span v-if="item.actorName" class="teacher-audit__actor-name">{{ item.actorName }}</span>
              <small v-if="item.actorId" class="teacher-audit__actor-id">#{{ item.actorId }}</small>
            </div>
          </template>
          <template #item.entity="{ item }">
            <div class="teacher-audit__entity">
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

        <div v-if="displayItems.length" class="teacher-audit__footer">
          <span>
            {{
              t('adminOps.audit.pagination', {
                from: page * size + 1,
                to: Math.min(page * size + size, totalElements),
                total: totalElements
              })
            }}
          </span>
          <div class="teacher-audit__pager">
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
        <div v-if="selectedItem" class="teacher-audit__detail">
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
          <div class="teacher-audit__payload">
            <h4>{{ t('adminOps.audit.detail.payload') }}</h4>
            <pre>{{ formatPayload(selectedItem.payload) }}</pre>
          </div>
        </div>
        <div v-else class="teacher-audit__empty-detail">
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
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import { useToast } from '@/composables/useToast';
import { exportTeacherAuditLogs, listTeacherAuditLogs } from '@/api/teacherAudit';
import type { AuditLogEntry } from '@/api/adminOps';
import { storeToRefs } from 'pinia';
import { useTeacherAssistantsStore } from '@/stores/teacherAssistants';
import { extractAssistantNameFromPayload, isAssistantActor } from '@/utils/audit';

const { t } = useI18n();
const toast = useToast();
const assistantsStore = useTeacherAssistantsStore();
const { assistants: assistantAccounts } = storeToRefs(assistantsStore);

const loading = ref(false);
const exporting = ref(false);
const items = ref<AuditLogEntry[]>([]);
const page = ref(0);
const size = ref(20);
const totalElements = ref(0);
const totalPages = ref(0);

const filters = reactive({
  q: '',
  entityType: '',
  from: '',
  to: ''
});

const detailDialog = reactive({
  open: false,
  itemId: null as number | null
});

const assistantDirectory = computed(() => {
  const directory = new Map<number, string>();
  for (const assistant of assistantAccounts.value) {
    if (assistant && typeof assistant.id === 'number' && assistant.name) {
      directory.set(assistant.id, assistant.name);
    }
  }
  return directory;
});

const displayItems = computed(() =>
  items.value.map((entry) => {
    if (!isAssistantActor(entry.actorType)) {
      return entry;
    }

    let resolvedName: string | null = null;
    if (typeof entry.actorId === 'number') {
      resolvedName = assistantDirectory.value.get(entry.actorId) ?? null;
    }
    if (!resolvedName) {
      resolvedName = extractAssistantNameFromPayload(entry.payload);
    }
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

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const actorColor = (actorType?: string | null) => {
  switch ((actorType || '').toUpperCase()) {
    case 'TEACHER':
      return 'primary';
    case 'TEACHER_ASSISTANT':
      return 'success';
    default:
      return 'neutral';
  }
};

const actorLabel = (actorType?: string | null) => {
  switch ((actorType || '').toUpperCase()) {
    case 'TEACHER':
      return t('adminOps.audit.actorTypes.teacher');
    case 'TEACHER_ASSISTANT':
      return t('adminOps.audit.actorTypes.teacherAssistant');
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
    const response = await listTeacherAuditLogs({
      q: filters.q || undefined,
      entityType: filters.entityType || undefined,
      from: toIsoString(filters.from),
      to: toIsoString(filters.to),
      page: page.value,
      size: size.value
    });
    items.value = response.items;
    page.value = response.page;
    size.value = response.size;
    totalElements.value = response.totalElements;
    totalPages.value = response.totalPages;
  } catch (error) {
    if (axios.isAxiosError(error) && [404, 403].includes(error.response?.status ?? 0)) {
      items.value = [];
      toast.error({ detail: t('adminOps.audit.disabled') });
      return;
    }
    toast.error({ detail: t('adminOps.audit.toast.loadFailed') });
    console.error('[teacher-audit] failed to load audit logs', error);
  } finally {
    loading.value = false;
  }
}

function applyFilters(resetPage = true) {
  loadAudit(resetPage);
}

function resetFilters() {
  filters.q = '';
  filters.entityType = '';
  filters.from = '';
  filters.to = '';
  loadAudit(true);
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
    const blob = await exportTeacherAuditLogs({
      q: filters.q || undefined,
      entityType: filters.entityType || undefined,
      from: toIsoString(filters.from),
      to: toIsoString(filters.to)
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teacher-audit-log.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error) && [404, 403].includes(error.response?.status ?? 0)) {
      toast.error({ detail: t('adminOps.audit.disabled') });
      return;
    }
    toast.error({ detail: t('adminOps.audit.toast.exportFailed') });
    console.error('[teacher-audit] failed to export audit logs', error);
  } finally {
    exporting.value = false;
  }
}

function openDetail(item: AuditLogEntry) {
  detailDialog.itemId = item.id ?? null;
  detailDialog.open = true;
}

onMounted(() => {
  void assistantsStore.loadAssistants();
  loadAudit(true);
});
</script>

<style scoped>
.teacher-audit {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.teacher-audit__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--sakai-space-4);
  margin-block-end: var(--sakai-space-4);
}

.teacher-audit__filter-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--sakai-space-2);
}

.teacher-audit__actions {
  display: flex;
  justify-content: flex-end;
  margin-block-end: var(--sakai-space-4);
}

.teacher-audit__table {
  margin-block-end: var(--sakai-space-4);
}

.teacher-audit__actor {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-audit__actor-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sakai-color-text);
}

.teacher-audit__actor-id {
  color: var(--sakai-color-text-subtle);
}

.teacher-audit__entity {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-audit__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teacher-audit__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.teacher-audit__detail dl {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-audit__detail dt {
  font-weight: 600;
}

.teacher-audit__detail dd {
  margin: 0;
}

.teacher-audit__payload {
  margin-block-start: var(--sakai-space-4);
}

.teacher-audit__payload pre {
  background: var(--sakai-color-surface-subtle);
  border-radius: var(--sakai-radius-md);
  padding: var(--sakai-space-3);
  overflow-x: auto;
}

.teacher-audit__empty-detail {
  text-align: center;
  color: var(--sakai-color-text-subtle);
}
</style>
