<template>
  <ThemePage class="theme-page--admin" :title="t('adminStudents.title')" :subtitle="t('adminStudents.subtitle')">
    <section class="admin-students flex flex-col gap-6">
      <UiCard hover>
        <template #title>{{ t('adminStudents.tableTitle') }}</template>
        <template #subtitle>{{ t('adminStudents.tableSubtitle') }}</template>

        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-students__alert mb-4">
          {{ translateError(store.error) }}
        </UiAlert>

        <div class="admin-students__filters grid gap-4 mb-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <UiSelect
            :model-value="filters.status"
            :label="t('adminStudents.filters.status')"
            @update:model-value="onStatusChange"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.teacherId ?? ''"
            :label="t('adminStudents.filters.teacher')"
            @update:model-value="onTeacherChange"
          >
            <option value="">
              {{ t('adminStudents.filters.teacherAll') }}
            </option>
            <option v-for="teacher in teacherOptions" :key="teacher.value" :value="teacher.value">
              {{ teacher.label }}
            </option>
          </UiSelect>

          <UiInput
            v-model="filters.search"
            :label="t('adminStudents.filters.search')"
            :placeholder="t('adminStudents.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters()"
          />

          <UiButton variant="link" color="secondary" @click="resetFilters">
            {{ t('adminStudents.filters.reset') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="store.students"
          :loading="store.loading"
          density="comfortable"
          class="admin-students__table"
          :empty-text="t('adminStudents.empty')"
        >
          <template #item.name="{ item }">
            <div class="admin-students__student">
              <span class="admin-students__student-name font-semibold">{{ (item as any).name }}</span>
              <small class="admin-students__student-email">{{ (item as any).email }}</small>
            </div>
          </template>

          <template #item.status="{ item }">
            <UiTag :color="statusColor((item as any).status)">
              {{ statusLabel((item as any).status) }}
            </UiTag>
          </template>

          <template #item.primaryTeacher="{ item }">
            <div class="admin-students__teacher" v-if="(item as any).primaryTeacher">
              <span>{{ (item as any).primaryTeacher.name }}</span>
              <small>{{ (item as any).primaryTeacher.slug }} · {{ (item as any).primaryTeacher.plan }}</small>
            </div>
            <span v-else>—</span>
          </template>

          <template #item.linkCount="{ item }">
            <UiTag color="primary" variant="soft">{{ (item as any).linkCount }}</UiTag>
          </template>

          <template #item.joinedAt="{ item }">
            {{ formatDate((item as any).joinedAt) }}
          </template>

          <template #item.actions="{ item }">
            <UiButton size="sm" variant="link" @click="openDetail((item as any).id)">
              {{ t('adminStudents.actions.manage') }}
            </UiButton>
          </template>
        </UiTable>

        <div v-if="store.totalElements" class="admin-students__footer flex items-center justify-between mt-4">
          <span>
            {{ t('adminStudents.paginationSummary', {
              from: pageStart,
              to: pageEnd,
              total: store.totalElements
            }) }}
          </span>
          <div class="admin-students__pager flex gap-2">
            <UiButton variant="link" size="sm" :disabled="store.page === 0 || store.loading" @click="changePage(store.page - 1)">
              {{ t('adminStudents.prevPage') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || store.loading"
              @click="changePage(store.page + 1)"
            >
              {{ t('adminStudents.nextPage') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </section>

    <UiDialog v-model="detailDialog.open" :title="detailTitle" width="720px" @hide="closeDetail">
      <div v-if="store.loadingDetail" class="admin-students__dialog-loading flex flex-col gap-3">
        <UiSkeleton v-for="n in 4" :key="n" height="32px" />
      </div>
      <div v-else-if="selectedStudent" class="admin-students__dialog flex flex-col gap-6">
        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-students__dialog-alert mb-4">
          {{ translateError(store.error) }}
        </UiAlert>

        <section class="admin-students__section flex flex-col gap-4">
          <header class="admin-students__section-header flex items-center justify-between gap-3">
            <h3>{{ t('adminStudents.detail.overview') }}</h3>
            <UiTag :color="statusColor(selectedStudent.status)">
              {{ statusLabel(selectedStudent.status) }}
            </UiTag>
          </header>
          <dl class="admin-students__meta grid gap-y-3 gap-x-6 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <div>
              <dt>{{ t('adminStudents.detail.email') }}</dt>
              <dd>{{ selectedStudent.email }}</dd>
            </div>
            <div>
              <dt>{{ t('adminStudents.detail.phone') }}</dt>
              <dd>{{ selectedStudent.phone || t('adminStudents.detail.noPhone') }}</dd>
            </div>
            <div>
              <dt>{{ t('adminStudents.detail.joined') }}</dt>
              <dd>{{ formatDate(selectedStudent.joinedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminStudents.detail.verified') }}</dt>
              <dd>{{ formatDate(selectedStudent.verifiedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminStudents.detail.primaryTeacher') }}</dt>
              <dd>
                <template v-if="selectedStudent.primaryTeacher">
                  <span>{{ selectedStudent.primaryTeacher.name }}</span>
                  <small>{{ selectedStudent.primaryTeacher.slug }} · {{ selectedStudent.primaryTeacher.plan }}</small>
                </template>
                <span v-else>{{ t('adminStudents.detail.noPrimaryTeacher') }}</span>
              </dd>
            </div>
            <div>
              <dt>{{ t('adminStudents.detail.planLimit') }}</dt>
              <dd>
                <template v-if="primaryPlanQuota">
                  <span>
                    {{ planUsage(primaryPlanQuota) }}
                  </span>
                  <small v-if="primaryPlanQuota.limitReached" class="admin-students__plan-warning text-danger">
                    {{ t('adminStudents.detail.planLimitReached') }}
                  </small>
                </template>
                <span v-else>{{ t('adminStudents.detail.planUnknown') }}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section class="admin-students__section flex flex-col gap-4">
          <header class="admin-students__section-header flex items-center justify-between gap-3">
            <h3>{{ t('adminStudents.detail.statusControls') }}</h3>
          </header>
          <div class="admin-students__actions flex flex-wrap gap-3">
            <UiButton
              size="sm"
              color="success"
              :disabled="selectedStudent.status === 'active' || activationBlocked"
              @click="changeStatus('active')"
            >
              {{ t('adminStudents.actions.activate') }}
            </UiButton>
            <UiButton
              size="sm"
              color="warning"
              :disabled="selectedStudent.status === 'suspended'"
              @click="changeStatus('suspended')"
            >
              {{ t('adminStudents.actions.suspend') }}
            </UiButton>
            <UiButton
              size="sm"
              color="danger"
              :disabled="selectedStudent.status === 'deleted'"
              @click="changeStatus('deleted')"
            >
              {{ t('adminStudents.actions.delete') }}
            </UiButton>
          </div>
          <UiAlert v-if="activationBlocked" color="warning" variant="soft">
            {{ t('adminStudents.detail.activationBlocked') }}
          </UiAlert>
        </section>

        <section class="admin-students__section flex flex-col gap-4">
          <header class="admin-students__section-header flex items-center justify-between gap-3">
            <h3>{{ t('adminStudents.device.title') }}</h3>
            <UiTag :color="deviceStatusColor">
              {{ deviceStatusText }}
            </UiTag>
          </header>
          <dl class="admin-students__meta grid gap-y-3 gap-x-6 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <div>
              <dt>{{ t('adminStudents.device.lastSeen') }}</dt>
              <dd>{{ formatDate(selectedStudent.deviceLastSeen) }}</dd>
            </div>
          </dl>
          <div class="admin-students__actions flex flex-wrap gap-3">
            <UiButton
              size="sm"
              color="danger"
              :disabled="selectedStudent.deviceDisabled"
              @click="disableDevice"
            >
              {{ t('adminStudents.device.disable') }}
            </UiButton>
            <UiButton
              size="sm"
              color="success"
              :disabled="!selectedStudent.deviceDisabled"
              @click="enableDevice"
            >
              {{ t('adminStudents.device.enable') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="!selectedStudent.deviceRegistered"
              @click="resetDevice"
            >
              {{ t('adminStudents.device.reset') }}
            </UiButton>
          </div>
        </section>

        <section class="admin-students__section flex flex-col gap-4">
          <header class="admin-students__section-header flex items-center justify-between gap-3">
            <h3>{{ t('adminStudents.links.title') }}</h3>
            <UiButton size="sm" variant="outline" color="primary" @click="toggleLinkForm">
              {{ showLinkForm ? t('adminStudents.links.cancelLink') : t('adminStudents.links.addLink') }}
            </UiButton>
          </header>

          <form v-if="showLinkForm" class="admin-students__link-form grid gap-4 mb-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]" @submit.prevent="submitLink">
            <UiSelect v-model="linkForm.teacherId" :label="t('adminStudents.links.teacherLabel')">
              <option value="" disabled>{{ t('adminStudents.links.teacherPlaceholder') }}</option>
              <option v-for="teacher in teacherOptions" :key="teacher.value" :value="teacher.value">
                {{ teacher.label }}
              </option>
            </UiSelect>
            <UiSelect v-model="linkForm.status" :label="t('adminStudents.links.statusLabel')">
              <option v-for="option in statusOptions.filter((option) => option.value)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiSwitch v-model="linkForm.primary" :label="t('adminStudents.links.primaryLabel')" />
            <div class="admin-students__actions flex flex-wrap gap-3">
              <UiButton
                button-type="submit"
                color="primary"
                :disabled="!linkForm.teacherId || linkingDisabled"
              >
                {{ t('adminStudents.links.submit') }}
              </UiButton>
            </div>
            <UiAlert v-if="linkingDisabled" color="warning" variant="soft">
              {{ t('adminStudents.links.planLimitReached') }}
            </UiAlert>
          </form>

          <UiTable
            :headers="linkHeaders"
            :items="selectedStudent.links"
            density="comfortable"
            class="admin-students__links mt-3"
            :empty-text="t('adminStudents.links.empty')"
          >
            <template #item.teacherName="{ item }">
              <div class="admin-students__teacher" v-if="(item as any).teacherName">
                <span>{{ (item as any).teacherName }}</span>
                <small>{{ (item as any).teacherSlug }} · {{ (item as any).quota?.plan || '—' }}</small>
              </div>
              <span v-else>—</span>
            </template>
            <template #item.status="{ item }">
              <UiTag :color="statusColor((item as any).status)">{{ statusLabel((item as any).status) }}</UiTag>
            </template>
            <template #item.quota="{ item }">
              <span v-if="(item as any).quota">{{ planUsage((item as any).quota) }}</span>
              <span v-else>—</span>
            </template>
            <template #item.createdAt="{ item }">
              {{ formatDate((item as any).createdAt) }}
            </template>
            <template #item.actions="{ item }">
              <div class="admin-students__link-actions flex flex-wrap gap-2 justify-end">
                <UiButton
                  v-if="(item as any).teacherId && !(item as any).primary"
                  size="xs"
                  variant="link"
                  @click="setPrimary(item as any)"
                >
                  {{ t('adminStudents.links.makePrimary') }}
                </UiButton>
                <UiButton
                  v-if="(item as any).teacherId && (item as any).status !== 'active'"
                  size="xs"
                  variant="link"
                  color="success"
                  :disabled="linkLimitReached(item as any)"
                  @click="updateLinkStatus(item as any, 'active')"
                >
                  {{ t('adminStudents.links.activateLink') }}
                </UiButton>
                <UiButton
                  v-if="(item as any).teacherId && (item as any).status === 'active'"
                  size="xs"
                  variant="link"
                  color="warning"
                  @click="updateLinkStatus(item as any, 'suspended')"
                >
                  {{ t('adminStudents.links.suspendLink') }}
                </UiButton>
                <UiButton
                  v-if="(item as any).teacherId"
                  size="xs"
                  variant="link"
                  color="danger"
                  @click="removeLink(item as any)"
                >
                  {{ t('adminStudents.links.removeLink') }}
                </UiButton>
              </div>
            </template>
          </UiTable>
        </section>
      </div>
      <div v-else class="admin-students__dialog-empty py-4">
        <UiAlert color="info" variant="soft">{{ t('adminStudents.detail.empty') }}</UiAlert>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminStudentsStore } from '@/stores/adminStudents';
import { useAdminStore } from '@/stores/admin';
import { useToast } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { formatDateTime } from '@/utils/formatters';
import type { PlanQuota } from '@/services/adminStudents';

const { t } = useI18n();
const store = useAdminStudentsStore();
const adminStore = useAdminStore();
const toast = useToast();

const filters = reactive({
  status: '',
  teacherId: undefined as number | undefined,
  search: ''
});

const detailDialog = reactive({
  open: false
});

const showLinkForm = ref(false);
const linkForm = reactive({
  teacherId: '' as string,
  status: 'pending_verification',
  primary: false
});

const headers = computed<UiTableHeader[]>(() => [
  { key: 'name', title: t('adminStudents.columns.student') },
  { key: 'status', title: t('adminStudents.columns.status') },
  { key: 'primaryTeacher', title: t('adminStudents.columns.teacher') },
  { key: 'linkCount', title: t('adminStudents.columns.links'), align: 'center' },
  { key: 'joinedAt', title: t('adminStudents.columns.joined') },
  { key: 'actions', title: t('adminStudents.columns.actions'), sortable: false, align: 'end' }
]);

const linkHeaders = computed<UiTableHeader[]>(() => [
  { key: 'teacherName', title: t('adminStudents.links.teacherColumn') },
  { key: 'status', title: t('adminStudents.links.statusColumn') },
  { key: 'quota', title: t('adminStudents.links.quotaColumn') },
  { key: 'createdAt', title: t('adminStudents.links.createdColumn') },
  { key: 'actions', title: t('adminStudents.links.actionsColumn'), sortable: false, align: 'end' }
]);

const statusOptions = computed(() => [
  { value: '', label: t('adminStudents.filters.statusAll') },
  { value: 'pending_verification', label: t('adminStudents.status.pending_verification') },
  { value: 'active', label: t('adminStudents.status.active') },
  { value: 'suspended', label: t('adminStudents.status.suspended') },
  { value: 'deleted', label: t('adminStudents.status.deleted') }
]);

const teacherOptions = computed(() =>
  adminStore.teachers.map((teacher) => ({
    value: teacher.id.toString(),
    label: `${teacher.name} · ${teacher.plan}`
  }))
);

const selectedStudent = computed(() => store.selectedStudent);
const primaryLink = computed(() => selectedStudent.value?.links.find((link) => link.primary) ?? null);
const primaryPlanQuota = computed(() => primaryLink.value?.quota ?? null);
const deviceStatusText = computed(() => {
  if (!selectedStudent.value) return t('adminStudents.device.none');
  if (selectedStudent.value.deviceDisabled) return t('adminStudents.device.disabled');
  if (selectedStudent.value.deviceRegistered) return t('adminStudents.device.registered');
  return t('adminStudents.device.none');
});
const deviceStatusColor = computed(() => {
  if (!selectedStudent.value) return 'warning';
  if (selectedStudent.value.deviceDisabled) return 'danger';
  if (selectedStudent.value.deviceRegistered) return 'success';
  return 'warning';
});

const activationBlocked = computed(() => {
  const student = selectedStudent.value;
  if (!student) return false;
  return student.links.some((link) => link.primary && link.quota?.limitReached && student.status !== 'active');
});

const linkingDisabled = computed(() => {
  if (!linkForm.teacherId) {
    return false;
  }
  const teacherId = Number(linkForm.teacherId);
  const link = selectedStudent.value?.links.find((entry) => entry.teacherId === teacherId);
  if (!link || !link.quota) {
    return false;
  }
  return link.quota.limitReached && link.status !== 'active';
});

const detailTitle = computed(() => selectedStudent.value?.name || t('adminStudents.detail.title'));
const isLastPage = computed(() => store.page >= store.totalPages - 1);
const pageStart = computed(() => (store.totalElements ? store.page * store.size + 1 : 0));
const pageEnd = computed(() => Math.min(store.totalElements, store.page * store.size + store.students.length));

watch(
  () => store.filters.status,
  (value) => {
    filters.status = value || '';
  },
  { immediate: true }
);

watch(
  () => store.filters.teacherId,
  (value) => {
    filters.teacherId = value ?? undefined;
  },
  { immediate: true }
);

watch(
  () => store.filters.q,
  (value) => {
    filters.search = value || '';
  },
  { immediate: true }
);

watch(selectedStudent, (student) => {
  if (!student) {
    showLinkForm.value = false;
    linkForm.teacherId = '';
    linkForm.status = 'pending_verification';
    linkForm.primary = false;
    return;
  }
  linkForm.status = student.status;
  linkForm.primary = !student.primaryTeacher;
});

onMounted(async () => {
  if (!adminStore.teachers.length) {
    await adminStore.loadTeachers().catch(() => {
      /* ignore */
    });
  }
  await store.loadStudents().catch(() => {
    /* ignore */
  });
});

function statusColor(status: string) {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
    case 'deleted':
      return 'danger';
    case 'pending_verification':
    default:
      return 'warning';
  }
}

function statusLabel(status: string) {
  const key = `adminStudents.status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  return formatDateTime(value);
}

function planUsage(quota: PlanQuota) {
  const limit = quota.maxActiveStudents ?? null;
  if (limit == null) {
    return t('adminStudents.detail.planUsageUnlimited', {
      active: quota.activeStudents,
      total: quota.totalStudents
    });
  }
  return t('adminStudents.detail.planUsage', {
    active: quota.activeStudents,
    limit,
    total: quota.totalStudents
  });
}

function linkLimitReached(link: { quota?: { limitReached: boolean }; status: string }) {
  return Boolean(link.quota?.limitReached && link.status !== 'active');
}

async function applyFilters() {
  await store.loadStudents({
    status: filters.status,
    teacherId: filters.teacherId,
    q: filters.search,
    page: 0
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

function onStatusChange(value: SelectValue) {
  filters.status = String(value || '');
  applyFilters();
}

function onTeacherChange(value: SelectValue) {
  filters.teacherId = value ? Number(value) : undefined;
  applyFilters();
}

function resetFilters() {
  store.resetFilters();
  filters.status = '';
  filters.teacherId = undefined;
  filters.search = '';
  applyFilters();
}

async function changePage(page: number) {
  await store.loadStudents({
    status: filters.status,
    teacherId: filters.teacherId,
    q: filters.search,
    page
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

async function openDetail(studentId: number) {
  await store.selectStudent(studentId).catch(() => {
    toast.error(translateError(store.error));
    return;
  });
  detailDialog.open = !!store.selectedStudent;
}

function closeDetail() {
  detailDialog.open = false;
  showLinkForm.value = false;
  linkForm.teacherId = '';
  store.selectedStudent = null;
  store.clearError();
}

async function changeStatus(status: string) {
  try {
    await store.updateStatus(status);
    toast.success(t('adminStudents.toasts.statusUpdated'));
    await store.loadStudents({
      status: filters.status,
      teacherId: filters.teacherId,
      q: filters.search,
      page: store.page
    });
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function disableDevice() {
  try {
    await store.disableDevice();
    toast.success(t('adminStudents.toasts.deviceDisabled'));
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function enableDevice() {
  try {
    await store.enableDevice();
    toast.success(t('adminStudents.toasts.deviceEnabled'));
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function resetDevice() {
  try {
    await store.resetDevice();
    toast.success(t('adminStudents.toasts.deviceReset'));
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

function toggleLinkForm() {
  showLinkForm.value = !showLinkForm.value;
  if (!showLinkForm.value) {
    linkForm.teacherId = '';
    linkForm.primary = false;
    linkForm.status = selectedStudent.value?.status ?? 'pending_verification';
  }
}

async function submitLink() {
  if (!linkForm.teacherId) return;
  try {
    await store.upsertLink({
      teacherId: Number(linkForm.teacherId),
      status: linkForm.status,
      primary: linkForm.primary
    });
    toast.success(t('adminStudents.toasts.linkUpdated'));
    showLinkForm.value = false;
    linkForm.teacherId = '';
    await store.loadStudents({
      status: filters.status,
      teacherId: filters.teacherId,
      q: filters.search,
      page: store.page
    });
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function setPrimary(link: { teacherId?: number | null; status: string }) {
  if (!link.teacherId) return;
  try {
    await store.upsertLink({ teacherId: link.teacherId, primary: true, status: link.status });
    toast.success(t('adminStudents.toasts.linkUpdated'));
    await store.loadStudents({
      status: filters.status,
      teacherId: filters.teacherId,
      q: filters.search,
      page: store.page
    });
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function updateLinkStatus(link: { teacherId?: number | null; status: string; primary?: boolean }, status: string) {
  if (!link.teacherId) return;
  try {
    await store.upsertLink({ teacherId: link.teacherId, status, primary: link.primary });
    toast.success(t('adminStudents.toasts.linkUpdated'));
    await store.loadStudents({
      status: filters.status,
      teacherId: filters.teacherId,
      q: filters.search,
      page: store.page
    });
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

async function removeLink(link: { teacherId?: number | null; teacherName?: string | null }) {
  if (!link.teacherId) return;
  if (!window.confirm(t('adminStudents.links.removeConfirm', { teacher: link.teacherName ?? '#' }))) {
    return;
  }
  try {
    await store.removeLink(link.teacherId);
    toast.success(t('adminStudents.toasts.linkRemoved'));
    await store.loadStudents({
      status: filters.status,
      teacherId: filters.teacherId,
      q: filters.search,
      page: store.page
    });
  } catch (error) {
    toast.error(translateError(store.error));
  }
}

function translateError(code: string | null | undefined) {
  if (!code) {
    return t('adminStudents.errors.generic');
  }
  const key = `errors.${code}`;
  const translated = t(key);
  if (translated !== key) {
    return translated;
  }
  const scopedKey = `adminStudents.errors.${code}`;
  const scoped = t(scopedKey);
  return scoped !== scopedKey ? scoped : t('adminStudents.errors.generic');
}
</script>

<style scoped>
.admin-students__table :deep(tbody tr td) {
  vertical-align: middle;
}

.admin-students__student-email,
.admin-students__teacher small {
  color: var(--sakai-text-color-secondary);
}

.admin-students__meta dt {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--sakai-text-color-tertiary);
}

.admin-students__meta dd {
  margin: 0;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
</style>
