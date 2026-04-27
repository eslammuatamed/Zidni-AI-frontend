<template>
  <ThemePage :title="t('syndication.title')" :subtitle="t('syndication.subtitle')">
    <template #actions>
      <UiButton
        v-if="featureEnabled"
        color="primary"
        prepend-icon="PlusOutlined"
        @click="openCreate()"
      >
        {{ t('syndication.submitAction') }}
      </UiButton>
    </template>

    <UiAlert v-if="!featureEnabled" color="warning" variant="soft" class="teacher-syndication__alert">
      {{ t('syndication.disabledMessage') }}
    </UiAlert>

    <section v-else class="teacher-syndication">
      <UiCard :title="t('syndication.myPublications')" hover>
        <template #subtitle>
          {{ t('syndication.myPublicationsHint') }}
        </template>

        <div class="teacher-syndication__filters">
          <UiSelect
            :model-value="statusFilter"
            :label="t('syndication.statusFilter')"
            clearable
            @update:model-value="onStatusChange"
          >
            <option value="">{{ t('syndication.status.all') }}</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiInput
            v-model="search"
            :label="t('syndication.searchLabel')"
            :placeholder="t('syndication.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters"
          />
          <UiButton variant="link" color="secondary" @click="resetFilters">
            {{ t('syndication.resetFilters') }}
          </UiButton>
        </div>

        <div v-if="!isMobile" class="teacher-syndication__table-wrapper">
          <UiTable
            :headers="headers"
            :items="items"
            :loading="loading"
            class="teacher-syndication__table"
            density="comfortable"
            :empty-text="t('syndication.emptyState')"
          >
            <template #item.sourceKind="{ item }">
              {{ sourceLabel(item.sourceKind) }}
            </template>
            <template #item.status="{ item }">
              <UiTag :color="statusColor(item.status)" size="sm">
                {{ statusLabel(item.status) }}
              </UiTag>
            </template>
            <template #item.publishedAt="{ item }">
              {{ formatDate(item.publishedAt || item.createdAt) }}
            </template>
            <template #item.actions="{ item }">
              <div class="teacher-syndication__actions">
                <UiButton
                  v-if="canEdit(item.status)"
                  size="sm"
                  variant="link"
                  prepend-icon="EditOutlined"
                  @click="openEdit(item.id)"
                >
                  {{ t('syndication.editAction') }}
                </UiButton>
                <UiButton
                  v-if="item.status === 'rejected'"
                  size="sm"
                  variant="link"
                  color="primary"
                  prepend-icon="ReloadOutlined"
                  @click="openEdit(item.id, true)"
                >
                  {{ t('syndication.resubmitAction') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="confirmDelete(item)"
                >
                  {{ item.status === 'approved' ? t('syndication.unpublishAction') : t('common.delete') }}
                </UiButton>
              </div>
            </template>
          </UiTable>
        </div>

        <div v-else class="teacher-syndication__mobile-list">
          <UiAlert v-if="!items.length" variant="soft" color="secondary">
            {{ t('syndication.emptyState') }}
          </UiAlert>
          <article
            v-for="item in items"
            :key="item.id"
            class="teacher-syndication__mobile-card"
          >
            <header class="teacher-syndication__mobile-card-header">
              <h3 class="teacher-syndication__mobile-card-title">{{ item.title }}</h3>
              <UiTag :color="statusColor(item.status)" size="sm">
                {{ statusLabel(item.status) }}
              </UiTag>
            </header>
            <dl class="teacher-syndication__mobile-meta">
              <div class="teacher-syndication__mobile-meta-row">
                <dt>{{ t('syndication.table.source') }}</dt>
                <dd>{{ sourceLabel(item.sourceKind) }}</dd>
              </div>
              <div class="teacher-syndication__mobile-meta-row">
                <dt>{{ t('syndication.table.publishedAt') }}</dt>
                <dd>{{ formatDate(item.publishedAt || item.createdAt) }}</dd>
              </div>
            </dl>
            <div class="teacher-syndication__mobile-actions">
              <UiButton
                v-if="canEdit(item.status)"
                size="sm"
                variant="link"
                prepend-icon="EditOutlined"
                @click="openEdit(item.id)"
              >
                {{ t('syndication.editAction') }}
              </UiButton>
              <UiButton
                v-if="item.status === 'rejected'"
                size="sm"
                variant="link"
                color="primary"
                prepend-icon="ReloadOutlined"
                @click="openEdit(item.id, true)"
              >
                {{ t('syndication.resubmitAction') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="link"
                color="danger"
                prepend-icon="DeleteOutlined"
                @click="confirmDelete(item)"
              >
                {{ item.status === 'approved' ? t('syndication.unpublishAction') : t('common.delete') }}
              </UiButton>
            </div>
          </article>
        </div>

        <div class="teacher-syndication__footer" v-if="items.length">
          <span>
            {{ t('syndication.paginationSummary', {
              from: page * size + 1,
              to: Math.min(page * size + size, totalElements),
              total: totalElements
            }) }}
          </span>
          <div class="teacher-syndication__pager">
            <UiButton
              variant="link"
              size="sm"
              :disabled="page === 0 || loading"
              @click="changePage(page - 1)"
            >
              {{ t('syndication.prevPage') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('syndication.nextPage') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </section>

    <UiDialog v-model="dialog.open" :title="dialogTitle" width="640px">
      <form class="teacher-syndication__form" @submit.prevent="submitDialog">
        <UiAlert v-if="dialog.error" color="danger" variant="soft">{{ dialog.error }}</UiAlert>

        <div class="teacher-syndication__form-grid">
          <UiSelect
            v-model="dialog.form.sourceKind"
            :label="t('syndication.form.sourceKind')"
            :disabled="dialog.mode === 'edit'"
            required
          >
            <option value="course_lesson">{{ t('syndication.source.courseLesson') }}</option>
            <option value="live_recording">{{ t('syndication.source.liveRecording') }}</option>
            <option value="external_url">{{ t('syndication.source.externalUrl') }}</option>
          </UiSelect>

          <UiInput v-model="dialog.form.title" :label="t('syndication.form.title')" required />
          <UiTextarea
            v-model="dialog.form.description"
            :label="t('syndication.form.description')"
            :rows="4"
          />
          <UiInput v-model="dialog.form.thumbnailUrl" :label="t('syndication.form.thumbnail')" />
          <UiInput v-model="dialog.form.videoUrl" :label="t('syndication.form.videoUrl')" />
          <UiInput v-model="dialog.form.locale" :label="t('syndication.form.locale')" />
          <UiInput v-model="dialog.form.tags" :label="t('syndication.form.tags')" :placeholder="t('syndication.form.tagsHint')" />
        </div>

        <div v-if="dialog.form.sourceKind === 'course_lesson'" class="teacher-syndication__source">
          <UiInput v-model="dialog.form.courseId" type="number" :label="t('syndication.form.courseId')" required />
          <UiInput v-model="dialog.form.lessonId" type="number" :label="t('syndication.form.lessonId')" required />
        </div>
        <div v-else-if="dialog.form.sourceKind === 'live_recording'" class="teacher-syndication__source">
          <UiInput v-model="dialog.form.liveSessionId" type="number" :label="t('syndication.form.liveSessionId')" required />
        </div>
        <div v-else class="teacher-syndication__source">
          <UiInput v-model="dialog.form.externalUrl" :label="t('syndication.form.externalUrl')" required />
        </div>

        <UiSwitch
          v-if="dialog.mode === 'edit' && dialog.allowResubmit"
          v-model="dialog.form.resubmit"
          :label="t('syndication.form.resubmitLabel')"
        />

        <div class="teacher-syndication__dialog-actions">
          <UiButton button-type="submit" color="primary" :disabled="dialog.loading">
            {{ dialog.mode === 'create' ? t('syndication.submitAction') : t('common.save') }}
          </UiButton>
          <UiButton variant="link" @click="dialog.open = false" :disabled="dialog.loading">
            {{ t('common.cancel') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="confirm.open" :title="confirm.title" width="420px">
      <p>{{ confirm.message }}</p>
      <div class="teacher-syndication__dialog-actions">
        <UiButton color="danger" :disabled="confirm.loading" @click="performDelete">
          {{ confirm.confirmLabel }}
        </UiButton>
        <UiButton variant="link" :disabled="confirm.loading" @click="confirm.open = false">
          {{ t('common.cancel') }}
        </UiButton>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { useToast } from '@/composables/useToast';
import {
  createTeacherPublication,
  deleteTeacherPublication,
  fetchTeacherPublication,
  fetchTeacherPublications,
  updateTeacherPublication,
  type PublicationDetail,
  type PublicationSummary
} from '@/services/syndication';

type SourceKind = 'course_lesson' | 'live_recording' | 'external_url';

const { t } = useI18n();
const toast = useToast();

const featureEnabled = ref(true);
const loading = ref(false);
const items = ref<PublicationSummary[]>([]);
const page = ref(0);
const size = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);
const statusFilter = ref('');
const search = ref('');
const isMobile = ref(false);

const mediaQuery = '(max-width: 640px)';

const updateIsMobile = () => {
  if (typeof window === 'undefined') {
    return;
  }
  isMobile.value = window.matchMedia(mediaQuery).matches;
};

const dialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  loading: false,
  allowResubmit: false,
  form: {
    sourceKind: 'course_lesson' as SourceKind,
    title: '',
    description: '',
    thumbnailUrl: '',
    videoUrl: '',
    locale: '',
    tags: '',
    courseId: '',
    lessonId: '',
    liveSessionId: '',
    externalUrl: '',
    resubmit: false
  },
  error: '',
  targetId: 0
});

const confirm = reactive({
  open: false,
  targetId: 0,
  status: '' as PublicationSummary['status'],
  title: '',
  message: '',
  confirmLabel: '',
  loading: false
});

const headers = computed(() => [
  { title: t('syndication.table.title'), key: 'title' },
  { title: t('syndication.table.status'), key: 'status' },
  { title: t('syndication.table.source'), key: 'sourceKind' },
  { title: t('syndication.table.publishedAt'), key: 'publishedAt' },
  { title: t('syndication.table.actions'), key: 'actions', sortable: false }
]);

const statusOptions = computed(() => [
  { value: 'pending', label: t('syndication.status.pending') },
  { value: 'approved', label: t('syndication.status.approved') },
  { value: 'rejected', label: t('syndication.status.rejected') },
  { value: 'unpublished', label: t('syndication.status.unpublished') }
]);

const dialogTitle = computed(() =>
  dialog.mode === 'create' ? t('syndication.createDialogTitle') : t('syndication.editDialogTitle')
);

const isLastPage = computed(() => page.value >= totalPages.value - 1);

const statusColor = (status: PublicationSummary['status']) => {
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

const statusLabel = (status: PublicationSummary['status']) => {
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

const canEdit = (status: PublicationSummary['status']) => status === 'pending' || status === 'rejected';

const sourceLabel = (sourceKind: PublicationSummary['sourceKind']) => {
  switch (sourceKind) {
    case 'course_lesson':
      return t('syndication.source.courseLesson');
    case 'live_recording':
      return t('syndication.source.liveRecording');
    default:
      return t('syndication.source.externalUrl');
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return date.toLocaleString();
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
    const response = await fetchTeacherPublications({
      status: statusFilter.value || undefined,
      q: search.value || undefined,
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
    } else {
      toast.error({ detail: t('syndication.loadFailed') });
    }
  } finally {
    loading.value = false;
  }
}

function onStatusChange(value: string) {
  statusFilter.value = value ?? '';
  loadPublications(true);
}

function applyFilters() {
  loadPublications(true);
}

function resetFilters() {
  statusFilter.value = '';
  search.value = '';
  loadPublications(true);
}

function changePage(target: number) {
  if (target < 0 || target === page.value) {
    return;
  }
  page.value = target;
  loadPublications();
}

function resetDialogForm() {
  dialog.form.sourceKind = 'course_lesson';
  dialog.form.title = '';
  dialog.form.description = '';
  dialog.form.thumbnailUrl = '';
  dialog.form.videoUrl = '';
  dialog.form.locale = '';
  dialog.form.tags = '';
  dialog.form.courseId = '';
  dialog.form.lessonId = '';
  dialog.form.liveSessionId = '';
  dialog.form.externalUrl = '';
  dialog.form.resubmit = false;
  dialog.error = '';
}

function openCreate() {
  resetDialogForm();
  dialog.mode = 'create';
  dialog.allowResubmit = false;
  dialog.targetId = 0;
  dialog.open = true;
}

async function openEdit(id: number, resubmit = false) {
  resetDialogForm();
  dialog.mode = 'edit';
  dialog.targetId = id;
  dialog.allowResubmit = resubmit;
  dialog.form.resubmit = resubmit;
  dialog.loading = true;
  dialog.open = true;
  try {
    const detail = await fetchTeacherPublication(id);
    const sourceRef = (detail.sourceRef ?? {}) as Record<string, unknown>;
    dialog.form.title = detail.title;
    dialog.form.description = detail.description ?? '';
    dialog.form.thumbnailUrl = detail.thumbnailUrl ?? '';
    dialog.form.videoUrl = detail.videoUrl ?? '';
    dialog.form.locale = detail.locale ?? '';
    dialog.form.tags = detail.tags?.join(', ') ?? '';
    dialog.form.sourceKind = detail.sourceKind as SourceKind;
    if (detail.sourceKind === 'course_lesson') {
      dialog.form.courseId = toStringOrEmpty(sourceRef.courseId);
      dialog.form.lessonId = toStringOrEmpty(sourceRef.lessonId);
    } else if (detail.sourceKind === 'live_recording') {
      dialog.form.liveSessionId = toStringOrEmpty(sourceRef.liveSessionId);
    } else if (detail.sourceKind === 'external_url') {
      dialog.form.externalUrl = toStringOrEmpty(sourceRef.url);
    }
  } catch (error) {
    dialog.error = t('syndication.loadFailed');
  } finally {
    dialog.loading = false;
  }
}

async function submitDialog() {
  dialog.error = '';
  dialog.loading = true;
  try {
    if (dialog.mode === 'create') {
      await createTeacherPublication(buildCreatePayload());
      toast.success({ detail: t('syndication.createdToast') });
    } else {
      await updateTeacherPublication(dialog.targetId, buildUpdatePayload());
      toast.success({ detail: t('syndication.updatedToast') });
    }
    dialog.open = false;
    await loadPublications();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      dialog.error = error.response.data.message;
    } else {
      dialog.error = t('syndication.saveFailed');
    }
  } finally {
    dialog.loading = false;
  }
}

function buildCreatePayload() {
  const sourceKind = dialog.form.sourceKind;
  const base = {
    sourceKind,
    title: dialog.form.title,
    description: dialog.form.description || undefined,
    thumbnailUrl: dialog.form.thumbnailUrl || undefined,
    videoUrl: dialog.form.videoUrl || undefined,
    locale: dialog.form.locale || undefined,
    tags: dialog.form.tags || undefined
  };
  if (sourceKind === 'course_lesson') {
    return {
      ...base,
      sourceRef: {
        courseId: Number(dialog.form.courseId),
        lessonId: Number(dialog.form.lessonId)
      }
    };
  }
  if (sourceKind === 'live_recording') {
    return {
      ...base,
      sourceRef: {
        liveSessionId: Number(dialog.form.liveSessionId)
      }
    };
  }
  return {
    ...base,
    sourceRef: {
      url: dialog.form.externalUrl
    }
  };
}

function buildUpdatePayload() {
  return {
    title: dialog.form.title,
    description: dialog.form.description || undefined,
    thumbnailUrl: dialog.form.thumbnailUrl || undefined,
    videoUrl: dialog.form.videoUrl || undefined,
    locale: dialog.form.locale || undefined,
    tags: dialog.form.tags || undefined,
    resubmit: dialog.form.resubmit || undefined
  };
}

function toStringOrEmpty(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function confirmDelete(item: PublicationSummary) {
  confirm.open = true;
  confirm.targetId = item.id;
  confirm.status = item.status;
  confirm.loading = false;
  confirm.title = item.status === 'approved' ? t('syndication.unpublishTitle') : t('syndication.deleteTitle');
  confirm.confirmLabel = item.status === 'approved' ? t('syndication.unpublishAction') : t('common.delete');
  confirm.message =
    item.status === 'approved'
      ? t('syndication.unpublishConfirm', { title: item.title })
      : t('syndication.deleteConfirm', { title: item.title });
}

async function performDelete() {
  confirm.loading = true;
  try {
    await deleteTeacherPublication(confirm.targetId);
    toast.success({ detail: confirm.status === 'approved' ? t('syndication.unpublishedToast') : t('syndication.deletedToast') });
    confirm.open = false;
    await loadPublications();
  } catch (error) {
    toast.error({ detail: t('syndication.deleteFailed') });
  } finally {
    confirm.loading = false;
  }
}

onMounted(() => {
  updateIsMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsMobile);
  }
  loadPublications(true);
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsMobile);
  }
});
</script>

<style scoped>
.teacher-syndication {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.teacher-syndication__alert {
  margin-bottom: 1.5rem;
}

.teacher-syndication__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}


.teacher-syndication__table-wrapper {
  width: 100%;
  margin-bottom: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.teacher-syndication__table {
  width: 100%;
}

.teacher-syndication__table :deep(.v-data-table__wrapper),
.teacher-syndication__table :deep(table) {
  min-width: 560px;
}

.teacher-syndication__mobile-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.teacher-syndication__mobile-card {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background-color: var(--ui-surface, #ffffff);
  box-shadow: 0 1px 1px rgba(15, 23, 42, 0.05);
}

.teacher-syndication__mobile-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.teacher-syndication__mobile-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
  flex: 1;
}

.teacher-syndication__mobile-meta {
  margin: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.teacher-syndication__mobile-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.teacher-syndication__mobile-meta-row dt {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.65);
}

.teacher-syndication__mobile-meta-row dd {
  margin: 0;
  font-size: 0.875rem;
  text-align: right;
  color: rgba(15, 23, 42, 0.85);
}

.teacher-syndication__mobile-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
}

.teacher-syndication__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}

.teacher-syndication__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.teacher-syndication__pager {
  display: flex;
  gap: 0.5rem;
}

.teacher-syndication__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.teacher-syndication__form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.teacher-syndication__source {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.teacher-syndication__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .teacher-syndication__filters {
    grid-template-columns: 1fr;
  }

  .teacher-syndication__actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .teacher-syndication__mobile-card {
    padding: 0.75rem;
  }

  .teacher-syndication__table :deep(.v-data-table__wrapper),
  .teacher-syndication__table :deep(table) {
    min-width: 480px;
  }

  .teacher-syndication__footer {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .teacher-syndication__pager {
    justify-content: center;
  }

  .teacher-syndication__dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
