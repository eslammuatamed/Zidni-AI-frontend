<template>
  <ThemePage :title="t('teacher.registrationsTitle')" :subtitle="t('teacher.registrationsSubtitle')">
    <template #actions>
      <UiButton
        prepend-icon="DownloadOutlined"
        :disabled="!hasResults || loading || exporting || !isFeatureEnabled || showBackendUnavailable"
        @click="downloadCsv"
      >
        {{ t('teacher.registrationsExportCsv') }}
      </UiButton>
    </template>

    <UiAlert v-if="!isFeatureEnabled" color="warning" variant="soft">
      {{ t('teacher.registrationsDisabled') }}
    </UiAlert>
    <UiAlert v-else-if="showBackendUnavailable" color="warning" variant="soft">
      {{ t('teacher.registrationsDisabled') }}
    </UiAlert>

    <section v-else class="teacher-registrations grid gap-6">
      <UiCard class="teacher-registrations__filters grid gap-4" hover>
        <div class="teacher-registrations__filters-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <UiSelect
            :model-value="filters.courseId"
            :label="t('teacher.filterCourse')"
            clearable
            @update:model-value="onCourseChange"
          >
            <option value="">{{ t('teacher.filterAllCourses') }}</option>
            <option v-for="course in courseOptions" :key="course.value" :value="course.value">{{ course.label }}</option>
          </UiSelect>

          <UiSelect
            :model-value="filters.sessionId"
            :label="t('teacher.filterSession')"
            :disabled="sessionLoading || sessionOptions.length === 0"
            clearable
            @update:model-value="onSessionChange"
          >
            <option value="">{{ sessionPlaceholder }}</option>
            <option v-for="session in sessionOptions" :key="session.value" :value="session.value">
              {{ session.label }}
            </option>
          </UiSelect>

          <UiSelect :model-value="filters.status" :label="t('teacher.filterRegistrationStatus')" clearable @update:model-value="onStatusChange">
            <option value="">{{ t('teacher.filterStatusAny') }}</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </UiSelect>

          <UiSelect :model-value="filters.attended" :label="t('teacher.filterAttendance')" clearable @update:model-value="onAttendanceChange">
            <option value="">{{ t('teacher.filterAttendanceAny') }}</option>
            <option value="true">{{ t('teacher.filterAttendanceYes') }}</option>
            <option value="false">{{ t('teacher.filterAttendanceNo') }}</option>
          </UiSelect>

          <UiInput v-model="filters.search" :label="t('teacher.filterSearch')" :placeholder="t('teacher.filterSearchPlaceholder')" />

          <div class="teacher-registrations__date-inputs grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            <UiInput v-model="filters.dateFrom" type="date" :label="t('teacher.filterDateFrom')" />
            <UiInput v-model="filters.dateTo" type="date" :label="t('teacher.filterDateTo')" />
          </div>
        </div>
        <div class="teacher-registrations__filters-actions flex justify-end">
          <UiButton variant="link" color="secondary" prepend-icon="ReloadOutlined" @click="resetFilters">
            {{ t('common.refresh') }}
          </UiButton>
        </div>
      </UiCard>

      <UiTable
        class="teacher-registrations__table w-full"
        :headers="tableHeaders"
        :items="registrations.items"
        :items-length="registrations.total"
        :page="filters.page"
        :items-per-page="filters.size"
        :sort-by="sortBy"
        :loading="loading"
        density="comfortable"
        :items-per-page-options="[10, 25, 50, 100]"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @update:sort-by="onSortChange"
      >
        <template #item.sessionTitle="{ item }">
          <div class="teacher-registrations__cell flex flex-col gap-[0.125rem]">
            <span class="teacher-registrations__primary font-medium">{{ item.sessionTitle }}</span>
            <span class="teacher-registrations__secondary text-[0.825rem] text-content-tertiary">{{ formatDateTime(item.sessionScheduledAt) }}</span>
          </div>
        </template>
        <template #item.courseTitle="{ item }">
          <span>{{ item.courseTitle }}</span>
        </template>
        <template #item.studentName="{ item }">
          <div class="teacher-registrations__cell flex flex-col gap-[0.125rem]">
            <span class="teacher-registrations__primary font-medium">{{ item.studentName }}</span>
            <span class="teacher-registrations__secondary text-[0.825rem] text-content-tertiary">{{ item.studentEmail }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <UiTag :color="statusColor(item.status)" size="sm">{{ formatStatus(item.status) }}</UiTag>
        </template>
        <template #item.registeredAt="{ item }">
          <span>{{ formatDateTime(item.registeredAt) }}</span>
        </template>
        <template #item.attended="{ item }">
          <UiTag :color="item.attended ? 'success' : 'warning'" size="sm">
            {{ item.attended ? t('teacher.attendanceYes') : t('teacher.attendanceNo') }}
          </UiTag>
        </template>
        <template #item.joinCount="{ item }">
          <span>{{ item.joinCount }}</span>
        </template>
        <template #item.firstJoinedAt="{ item }">
          <span>{{ formatDateTime(item.firstJoinedAt) }}</span>
        </template>
        <template #item.lastJoinedAt="{ item }">
          <span>{{ formatDateTime(item.lastJoinedAt) }}</span>
        </template>
      </UiTable>

      <div class="teacher-registrations__list" role="list">
        <article
          v-for="item in registrations.items"
          :key="`${item.sessionId}-${item.studentId}`"
          class="teacher-registrations__list-item"
          role="listitem"
        >
          <header class="teacher-registrations__list-header flex flex-wrap items-center justify-between gap-2">
            <h3>{{ item.sessionTitle }}</h3>
            <UiTag :color="statusColor(item.status)" size="sm">{{ formatStatus(item.status) }}</UiTag>
          </header>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsCourse') }}</label>
            <span>{{ item.courseTitle }}</span>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsStudent') }}</label>
            <span>{{ item.studentName }}</span>
            <small>{{ item.studentEmail }}</small>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsRegisteredAt') }}</label>
            <span>{{ formatDateTime(item.registeredAt) }}</span>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsAttendedColumn') }}</label>
            <span>{{ item.attended ? t('teacher.attendanceYes') : t('teacher.attendanceNo') }}</span>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsJoinCount') }}</label>
            <span>{{ item.joinCount }}</span>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsFirstJoin') }}</label>
            <span>{{ formatDateTime(item.firstJoinedAt) }}</span>
          </div>
          <div class="teacher-registrations__list-field grid gap-2">
            <label>{{ t('teacher.registrationsLastJoin') }}</label>
            <span>{{ formatDateTime(item.lastJoinedAt) }}</span>
          </div>
        </article>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { FEATURE } from '@/constants/featureCatalog';
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useCoursesStore } from '@/stores/courses';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { useToast } from '@/composables/useToast';
import { fetchTeacherLiveSessions } from '@/services/liveSessions';
import {
  exportTeacherRegistrationsCsv,
  fetchTeacherRegistrations,
  type TeacherRegistrationItem,
  type TeacherRegistrationsQuery
} from '@/services/teacherRegistrations';
import type { LiveSessionRegistrationStatus } from '@/services/liveSessions';

interface RegistrationRow extends TeacherRegistrationItem {
  sessionTitle: string;
  sessionScheduledAt: string;
  courseTitle: string;
  studentName: string;
  studentEmail: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const { t, locale } = useI18n();
const toast = useToast();
const coursesStore = useCoursesStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();

const filters = reactive({
  courseId: '',
  sessionId: '',
  status: '',
  attended: '',
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  size: 25,
  sortField: 'registeredAt',
  sortDesc: true
});

const registrations = reactive({
  items: [] as RegistrationRow[],
  total: 0
});

const loading = ref(false);
const exporting = ref(false);
const sessionLoading = ref(false);
const sessions = ref<SelectOption[]>([]);
const initialized = ref(false);
const backendAvailable = ref(true);
let searchTimer: number | null = null;

const tenantFlag = computed(() => featuresStore.hasFeature(FEATURE.teacherRegsPayments));
const isFeatureEnabled = computed(() => {
  if (tenantFlag.value === false) {
    return false;
  }
  return backendAvailable.value;
});

const showBackendUnavailable = computed(() => tenantFlag.value !== false && !backendAvailable.value);

const courseOptions = computed<SelectOption[]>(() =>
  coursesStore.list.map((course) => ({
    value: String(course.id),
    label: course.title
  }))
);

const sessionOptions = computed(() => sessions.value);
const sessionPlaceholder = computed(() =>
  sessionLoading.value
    ? t('teacher.sessionsLoading')
    : sessionOptions.value.length
      ? t('teacher.filterSelectSession')
      : t('teacher.filterNoSessions')
);

const statusOptions = computed(() => [
  { value: 'invited', label: t('teacher.registrationStatus.invited') },
  { value: 'registered', label: t('teacher.registrationStatus.registered') },
  { value: 'banned', label: t('teacher.registrationStatus.banned') },
  { value: 'revoked', label: t('teacher.registrationStatus.revoked') }
]);

const tableHeaders = computed(() => [
  { title: t('teacher.registrationsSession'), key: 'sessionTitle', sortable: true },
  { title: t('teacher.registrationsCourse'), key: 'courseTitle', sortable: true },
  { title: t('teacher.registrationsStudent'), key: 'studentName', sortable: true },
  { title: t('teacher.registrationsStatus'), key: 'status', sortable: true },
  { title: t('teacher.registrationsRegisteredAt'), key: 'registeredAt', sortable: true },
  { title: t('teacher.registrationsAttendedColumn'), key: 'attended', sortable: true },
  { title: t('teacher.registrationsJoinCount'), key: 'joinCount', sortable: true },
  { title: t('teacher.registrationsFirstJoin'), key: 'firstJoinedAt', sortable: true },
  { title: t('teacher.registrationsLastJoin'), key: 'lastJoinedAt', sortable: true }
]);

const sortBy = computed(() => [
  {
    key: filters.sortField,
    order: filters.sortDesc ? 'desc' : 'asc'
  }
]);

const hasResults = computed(() => registrations.items.length > 0);

const buildQuery = (): TeacherRegistrationsQuery => ({
  courseId: filters.courseId ? Number(filters.courseId) : undefined,
  sessionId: filters.sessionId ? Number(filters.sessionId) : undefined,
  status: (filters.status || undefined) as LiveSessionRegistrationStatus | undefined,
  attended:
    filters.attended === ''
      ? undefined
      : filters.attended === 'true'
        ? true
        : false,
  search: filters.search || undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  page: filters.page,
  size: filters.size,
  sortField: filters.sortField,
  sortDesc: filters.sortDesc
});

const loadCourses = async () => {
  if (coursesStore.list.length) {
    return;
  }
  try {
    await coursesStore.fetchCourses();
  } catch (error) {
    toast.error(t('teacher.coursesLoadFailed'));
  }
};

const loadSessions = async () => {
  if (!isFeatureEnabled.value) {
    sessions.value = [];
    return;
  }
  sessionLoading.value = true;
  try {
    const courseId = filters.courseId ? Number(filters.courseId) : undefined;
    const data = await fetchTeacherLiveSessions(courseId);
    backendAvailable.value = true;
    sessions.value = data.map((session) => ({
      value: String(session.id),
      label: `${session.title} • ${formatDateTime(session.scheduledAt)}`
    }));
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404 || status === 403) {
        backendAvailable.value = false;
        sessions.value = [];
        try {
          await featuresStore.refresh();
        } catch (refreshError) {
          console.warn('[registrations] unable to refresh features after sessions error', refreshError);
        }
        return;
      }
    }
    toast.error(t('teacher.sessionsLoadFailed'));
  } finally {
    sessionLoading.value = false;
  }
};

const fetchRegistrations = async () => {
  if (!isFeatureEnabled.value || !backendAvailable.value) {
    return;
  }
  loading.value = true;
  try {
    const query = buildQuery();
    const data = await fetchTeacherRegistrations(query);
    backendAvailable.value = true;
    registrations.total = data.total;
    registrations.items = data.items.map((item) => ({
      ...item,
      sessionTitle: item.session.title,
      sessionScheduledAt: item.session.scheduledAt,
      courseTitle: item.session.courseTitle,
      studentName: item.student.name,
      studentEmail: item.student.email
    }));
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404 || status === 403) {
        backendAvailable.value = false;
        registrations.items = [];
        registrations.total = 0;
        try {
          await featuresStore.refresh();
        } catch (refreshError) {
          console.warn('[registrations] unable to refresh features after registrations error', refreshError);
        }
        return;
      }
    }
    toast.error(t('teacher.registrationsLoadFailed'));
  } finally {
    loading.value = false;
  }
};

const debounceFetch = () => {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }
  searchTimer = window.setTimeout(() => {
    if (initialized.value && backendAvailable.value) {
      fetchRegistrations();
    }
  }, 350);
};

watch(
  () => [
    filters.courseId,
    filters.sessionId,
    filters.status,
    filters.attended,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.size,
    filters.sortField,
    filters.sortDesc
  ],
  () => {
    if (!initialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    fetchRegistrations();
  }
);

watch(
  () => filters.search,
  () => {
    if (!initialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    filters.page = 1;
    debounceFetch();
  }
);

watch(
  () => filters.courseId,
  async () => {
    if (!isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    await loadSessions();
    filters.sessionId = '';
    if (initialized.value) {
      filters.page = 1;
    }
  }
);

watch(
  () => isFeatureEnabled.value,
  async (enabled) => {
    if (!enabled) {
      backendAvailable.value = true;
      registrations.items = [];
      registrations.total = 0;
      sessions.value = [];
      return;
    }
    backendAvailable.value = true;
    await loadCourses();
    await loadSessions();
    await fetchRegistrations();
    initialized.value = true;
  }
);

const onCourseChange = (value: string | number | string[] | null) => {
  if (Array.isArray(value)) {
    filters.courseId = value.length ? String(value[0]) : '';
  } else if (value === null) {
    filters.courseId = '';
  } else {
    filters.courseId = String(value);
  }
};

const onSessionChange = (value: string | number | string[] | null) => {
  if (Array.isArray(value)) {
    filters.sessionId = value.length ? String(value[0]) : '';
  } else if (value === null) {
    filters.sessionId = '';
  } else {
    filters.sessionId = String(value);
  }
  filters.page = 1;
};

const onStatusChange = (value: string | number | string[] | null) => {
  if (Array.isArray(value)) {
    filters.status = value.length ? String(value[0]) : '';
  } else if (value === null) {
    filters.status = '';
  } else {
    filters.status = String(value);
  }
  filters.page = 1;
};

const onAttendanceChange = (value: string | number | string[] | null) => {
  if (Array.isArray(value)) {
    filters.attended = value.length ? String(value[0]) : '';
  } else if (value === null) {
    filters.attended = '';
  } else {
    filters.attended = String(value);
  }
  filters.page = 1;
};

const onPageChange = (page: number) => {
  filters.page = page;
};

const onItemsPerPageChange = (size: number) => {
  filters.size = size;
  filters.page = 1;
};

const onSortChange = (sort: Array<{ key: string; order?: 'asc' | 'desc' }>) => {
  const first = sort[0];
  if (!first) {
    filters.sortField = 'registeredAt';
    filters.sortDesc = true;
    return;
  }
  filters.sortField = first.key;
  filters.sortDesc = first.order !== 'asc';
};

const resetFilters = () => {
  filters.courseId = '';
  filters.sessionId = '';
  filters.status = '';
  filters.attended = '';
  filters.search = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  filters.page = 1;
  filters.sortField = 'registeredAt';
  filters.sortDesc = true;
  if (isFeatureEnabled.value) {
    backendAvailable.value = true;
    fetchRegistrations();
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'registered':
      return 'success';
    case 'invited':
      return 'info';
    case 'banned':
    case 'revoked':
      return 'danger';
    default:
      return 'secondary';
  }
};

const formatStatus = (status: LiveSessionRegistrationStatus) => {
  const key = `teacher.registrationStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
};

const downloadCsv = async () => {
  if (!isFeatureEnabled.value) {
    return;
  }
  exporting.value = true;
  try {
    const data = await exportTeacherRegistrationsCsv(buildQuery());
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date();
    const stamp = today.toISOString().slice(0, 10);
    link.download = `registrations-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(t('teacher.registrationsExportFailed'));
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  await loadCourses();
  await loadSessions();
  if (isFeatureEnabled.value) {
    await fetchRegistrations();
  }
  initialized.value = true;
});

onBeforeUnmount(() => {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }
});
</script>

<style scoped>
.teacher-registrations__list {
  display: none;
  gap: var(--sakai-space-3);
}

.teacher-registrations__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-registrations__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-registrations__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.teacher-registrations__list-field small {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

@media (max-width: 1200px) {
  .teacher-registrations__table {
    display: none;
  }

  .teacher-registrations__list {
    display: grid;
  }
}
</style>
