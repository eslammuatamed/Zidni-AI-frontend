<template>
  <ThemePage :title="t('adminCourses.title')" :subtitle="t('adminCourses.subtitle')">
    <section class="admin-courses">
      <UiAlert v-if="!featureEnabled" color="warning" variant="soft" class="admin-courses__alert">
        {{ t('adminCourses.disabled') }}
      </UiAlert>

      <UiCard v-else hover>
        <template #title>{{ t('adminCourses.queueTitle') }}</template>
        <template #subtitle>{{ t('adminCourses.queueSubtitle') }}</template>

        <div class="admin-courses__filters">
          <UiSelect
            :model-value="filters.status"
            :label="t('adminCourses.filters.status')"
            @update:model-value="onStatusChange"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiInput
            v-model="filters.q"
            :label="t('adminCourses.filters.search')"
            :placeholder="t('adminCourses.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters"
          />
          <UiInput
            v-model="filters.teacherSlug"
            :label="t('adminCourses.filters.teacherSlug')"
            :placeholder="t('adminCourses.filters.teacherPlaceholder')"
          />
          <UiSwitch
            v-model="filters.includeDeleted"
            :label="t('adminCourses.filters.includeDeleted')"
          />
          <UiButton variant="link" color="secondary" @click="resetFilters">
            {{ t('adminCourses.filters.reset') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="items"
          :loading="loading"
          density="comfortable"
          class="admin-courses__table"
          :empty-text="t('adminCourses.empty')"
        >
          <template #item.title="{ item }">
            <div class="admin-courses__title">
              <span>{{ item.title }}</span>
              <small class="admin-courses__type">{{ item.type }}</small>
            </div>
          </template>
          <template #item.teacher="{ item }">
            <div class="admin-courses__teacher">
              <span>{{ item.teacherName || t('adminCourses.unknownTeacher') }}</span>
              <small v-if="item.teacherSlug">{{ item.teacherSlug }}</small>
            </div>
          </template>
          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.active)" size="sm">{{ statusLabel(item.active) }}</UiTag>
          </template>
          <template #item.deleted="{ item }">
            <UiTag :color="item.deleted ? 'danger' : 'secondary'" size="sm">
              {{ item.deleted ? t('adminCourses.deleted.yes') : t('adminCourses.deleted.no') }}
            </UiTag>
          </template>
          <template #item.createdBy="{ item }">
            {{ item.createdBy || '—' }}
          </template>
          <template #item.updatedBy="{ item }">
            {{ item.updatedBy || '—' }}
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <div class="admin-courses__actions">
              <UiButton size="sm" variant="link" @click="openDetail(item.id)">
                {{ t('adminCourses.viewAction') }}
              </UiButton>
              <UiButton
                v-if="!item.active"
                size="sm"
                variant="link"
                color="success"
                prepend-icon="CheckOutlined"
                @click="openAction('approve', item.id)"
              >
                {{ t('adminCourses.approve') }}
              </UiButton>
              <UiButton
                v-if="item.active"
                size="sm"
                variant="link"
                color="danger"
                prepend-icon="StopOutlined"
                @click="openAction('disable', item.id)"
              >
                {{ t('adminCourses.disable') }}
              </UiButton>
              <UiButton
                v-if="item.deleted"
                size="sm"
                variant="link"
                color="success"
                prepend-icon="HistoryOutlined"
                @click="openAction('restore', item.id)"
              >
                {{ t('adminCourses.restore') }}
              </UiButton>
            </div>
          </template>
        </UiTable>

        <div v-if="items.length" class="admin-courses__footer">
          <span>
            {{ t('adminCourses.paginationSummary', {
              from: page * size + 1,
              to: Math.min(page * size + size, totalElements),
              total: totalElements
            }) }}
          </span>
          <div class="admin-courses__pager">
            <UiButton variant="link" size="sm" :disabled="page === 0 || loading" @click="changePage(page - 1)">
              {{ t('adminCourses.prevPage') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('adminCourses.nextPage') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiDialog v-model="detailDialog.open" :title="detailDialog.title" width="640px">
        <div v-if="detailDialog.loading" class="admin-courses__loading">
          <UiSkeleton v-for="index in 3" :key="index" height="28px" />
        </div>
        <div v-else-if="detailDialog.detail" class="admin-courses__detail">
          <header class="admin-courses__detail-header">
            <h3>{{ detailDialog.detail.title }}</h3>
            <UiTag :color="statusColor(detailDialog.detail.active)" size="sm">
              {{ statusLabel(detailDialog.detail.active) }}
            </UiTag>
          </header>
          <p class="admin-courses__detail-description">
            {{ detailDialog.detail.description || t('adminCourses.noDescription') }}
          </p>
          <dl class="admin-courses__detail-meta">
            <div>
              <dt>{{ t('adminCourses.detail.teacher') }}</dt>
              <dd>
                <span>{{ detailDialog.detail.teacher?.name || t('adminCourses.unknownTeacher') }}</span>
                <small v-if="detailDialog.detail.teacher?.slug">
                  {{ detailDialog.detail.teacher?.slug }} · {{ detailDialog.detail.teacher?.plan }}
                </small>
              </dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.deleted') }}</dt>
              <dd>
                <UiTag :color="detailDialog.detail.deleted ? 'danger' : 'success'" size="sm">
                  {{ detailDialog.detail.deleted ? t('adminCourses.deleted.yes') : t('adminCourses.deleted.no') }}
                </UiTag>
              </dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.type') }}</dt>
              <dd>{{ detailDialog.detail.type }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.level') }}</dt>
              <dd>{{ detailDialog.detail.level || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.language') }}</dt>
              <dd>{{ detailDialog.detail.language || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.modules') }}</dt>
              <dd>{{ detailDialog.detail.moduleCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.lessons') }}</dt>
              <dd>{{ detailDialog.detail.lessonCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.price') }}</dt>
              <dd>{{ formatCurrency(detailDialog.detail.price) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.createdAt') }}</dt>
              <dd>{{ formatDate(detailDialog.detail.createdAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.updatedAt') }}</dt>
              <dd>{{ formatDate(detailDialog.detail.updatedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.createdBy') }}</dt>
              <dd>{{ detailDialog.detail.createdBy || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('adminCourses.detail.updatedBy') }}</dt>
              <dd>{{ detailDialog.detail.updatedBy || '—' }}</dd>
            </div>
          </dl>
        </div>
        <div v-else>
          <UiAlert color="danger" variant="soft">{{ t('adminCourses.detailError') }}</UiAlert>
        </div>
      </UiDialog>

      <UiDialog v-model="actionDialog.open" :title="actionDialog.title" width="480px">
        <form class="admin-courses__form" @submit.prevent="submitAction">
          <UiAlert v-if="actionDialog.error" color="danger" variant="soft">{{ actionDialog.error }}</UiAlert>
          <p class="admin-courses__confirm">{{ actionDialog.message }}</p>
          <div class="admin-courses__dialog-actions">
            <UiButton button-type="submit" color="primary" :disabled="actionDialog.loading">
              {{ actionDialog.submitLabel }}
            </UiButton>
            <UiButton variant="link" :disabled="actionDialog.loading" @click="actionDialog.open = false">
              {{ t('common.cancel') }}
            </UiButton>
          </div>
        </form>
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
import UiDialog from '@/components/ui/UiDialog.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { useToast } from '@/composables/useToast';
import {
  approveAdminCourse,
  disableAdminCourse,
  fetchAdminCourse,
  listAdminCourses,
  restoreAdminCourse,
  type CourseModerationDetail,
  type CourseModerationSummary
} from '@/api/adminModeration';

const { t } = useI18n();
const toast = useToast();

const featureEnabled = ref(true);
const loading = ref(false);
const items = ref<CourseModerationSummary[]>([]);
const page = ref(0);
const size = ref(20);
const totalElements = ref(0);
const totalPages = ref(0);

const filters = reactive({
  status: 'all',
  q: '',
  teacherSlug: '',
  includeDeleted: false
});

const detailDialog = reactive({
  open: false,
  loading: false,
  title: t('adminCourses.detailTitle'),
  detail: null as CourseModerationDetail | null
});

const actionDialog = reactive({
  open: false,
  loading: false,
  type: 'approve' as 'approve' | 'disable' | 'restore',
  title: '',
  submitLabel: '',
  message: '',
  error: '',
  targetId: 0
});

const headers = computed(() => [
  { title: t('adminCourses.table.course'), key: 'title' },
  { title: t('adminCourses.table.teacher'), key: 'teacher' },
  { title: t('adminCourses.table.status'), key: 'status' },
  { title: t('adminCourses.table.deleted'), key: 'deleted' },
  { title: t('adminCourses.table.createdBy'), key: 'createdBy' },
  { title: t('adminCourses.table.updatedBy'), key: 'updatedBy' },
  { title: t('adminCourses.table.createdAt'), key: 'createdAt' },
  { title: t('adminCourses.table.actions'), key: 'actions', sortable: false }
]);

const statusOptions = computed(() => [
  { value: 'all', label: t('adminCourses.status.all') },
  { value: 'active', label: t('adminCourses.status.active') },
  { value: 'inactive', label: t('adminCourses.status.inactive') }
]);

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const statusColor = (active: boolean) => (active ? 'success' : 'danger');

const statusLabel = (active: boolean) =>
  active ? t('adminCourses.status.active') : t('adminCourses.status.inactive');

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

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD'
    }).format(value ?? 0);
  } catch (error) {
    return value?.toString() ?? '0';
  }
};

async function loadCourses(resetPage = false) {
  if (resetPage) {
    page.value = 0;
  }
  loading.value = true;
  try {
    const response = await listAdminCourses({
      teacherSlug: filters.teacherSlug || undefined,
      q: filters.q || undefined,
      status: filters.status === 'all' ? undefined : (filters.status as 'active' | 'inactive'),
      page: page.value,
      size: size.value,
      includeDeleted: filters.includeDeleted
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
    } else {
      toast.error({ detail: t('adminCourses.loadFailed') });
    }
  } finally {
    loading.value = false;
  }
}

function onStatusChange(value: string) {
  filters.status = value ?? 'all';
  loadCourses(true);
}

function applyFilters() {
  loadCourses(true);
}

function resetFilters() {
  filters.status = 'all';
  filters.q = '';
  filters.teacherSlug = '';
  filters.includeDeleted = false;
  loadCourses(true);
}

function changePage(target: number) {
  if (target < 0 || target === page.value) {
    return;
  }
  page.value = target;
  loadCourses();
}

async function openDetail(id: number) {
  detailDialog.open = true;
  detailDialog.loading = true;
  detailDialog.detail = null;
  detailDialog.title = t('adminCourses.detailTitle');
  try {
    const detail = await fetchAdminCourse(id);
    detailDialog.detail = detail;
    detailDialog.title = detail.title;
  } catch (error) {
    detailDialog.detail = null;
  } finally {
    detailDialog.loading = false;
  }
}

function openAction(type: 'approve' | 'disable' | 'restore', id: number) {
  actionDialog.open = true;
  actionDialog.loading = false;
  actionDialog.type = type;
  actionDialog.error = '';
  actionDialog.targetId = id;
  if (type === 'approve') {
    actionDialog.title = t('adminCourses.dialog.approveTitle');
    actionDialog.submitLabel = t('adminCourses.dialog.approveSubmit');
    actionDialog.message = t('adminCourses.dialog.approveMessage');
  } else if (type === 'disable') {
    actionDialog.title = t('adminCourses.dialog.disableTitle');
    actionDialog.submitLabel = t('adminCourses.dialog.disableSubmit');
    actionDialog.message = t('adminCourses.dialog.disableMessage');
  } else {
    actionDialog.title = t('adminCourses.dialog.restoreTitle');
    actionDialog.submitLabel = t('adminCourses.dialog.restoreSubmit');
    actionDialog.message = t('adminCourses.dialog.restoreMessage');
  }
}

async function submitAction() {
  if (!actionDialog.targetId) {
    return;
  }
  actionDialog.loading = true;
  actionDialog.error = '';
  try {
    if (actionDialog.type === 'approve') {
      await approveAdminCourse(actionDialog.targetId);
      toast.success({ detail: t('adminCourses.toast.approved') });
    } else if (actionDialog.type === 'disable') {
      await disableAdminCourse(actionDialog.targetId);
      toast.success({ detail: t('adminCourses.toast.disabled') });
    } else {
      await restoreAdminCourse(actionDialog.targetId);
      toast.success({ detail: t('adminCourses.toast.restored') });
    }
    actionDialog.open = false;
    loadCourses();
  } catch (error) {
    actionDialog.error = t('adminCourses.dialog.error');
  } finally {
    actionDialog.loading = false;
  }
}

onMounted(() => {
  loadCourses(true);
});

watch(
  () => filters.includeDeleted,
  () => {
    loadCourses(true);
  }
);
</script>

<style scoped>
.admin-courses {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-courses__alert {
  align-self: stretch;
}

.admin-courses__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-4);
  margin-bottom: var(--sakai-space-5);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
  box-shadow: var(--sakai-shadow-sm);
}

.admin-courses__filters > * {
  flex: 1 1 220px;
  min-width: 12rem;
}

.admin-courses__table {
  margin-bottom: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--sakai-shadow-sm);
}

.admin-courses__title {
  display: flex;
  flex-direction: column;
}

.admin-courses__type {
  color: var(--theme-text-muted);
}

.admin-courses__teacher {
  display: flex;
  flex-direction: column;
}

.admin-courses__teacher small {
  color: var(--theme-text-muted);
}

.admin-courses__actions {
  display: flex;
  gap: var(--sakai-space-2);
}

.admin-courses__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--sakai-space-4);
  gap: var(--sakai-space-3);
  padding-top: var(--sakai-space-3);
  border-top: 0.0625rem dashed color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.admin-courses__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.admin-courses__loading {
  display: grid;
  gap: 0.75rem;
}

.admin-courses__detail {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.admin-courses__detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
}

.admin-courses__detail-description {
  margin: 0;
  color: var(--theme-text-muted);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-alt) 92%, transparent);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-border-color));
}

.admin-courses__detail-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
}

.admin-courses__detail-meta dt {
  font-weight: 600;
  color: var(--theme-text-muted);
}

.admin-courses__detail-meta dd {
  margin: 0;
}

.admin-courses__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-3) 0;
}

.admin-courses__confirm {
  margin: 0;
}

.admin-courses__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
