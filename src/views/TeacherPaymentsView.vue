<template>
  <ThemePage :title="t('teacher.paymentsTitle')" :subtitle="t('teacher.paymentsSubtitle')">
    <template #actions>
      <UiButton
        prepend-icon="DownloadOutlined"
        :disabled="downloadDisabled"
        @click="downloadCsv"
      >
        {{ t('teacher.paymentsExportCsv') }}
      </UiButton>
    </template>

    <UiAlert v-if="!isFeatureEnabled" color="warning" variant="soft">
      {{ t('teacher.paymentsDisabled') }}
    </UiAlert>
    <UiAlert v-else-if="showBackendUnavailable" color="warning" variant="soft">
      {{ t('teacher.paymentsDisabled') }}
    </UiAlert>

    <section v-else class="teacher-payments grid gap-6">
      <UiTabs v-model="activeTab" :tabs="tabItems" />

      <div v-if="activeTab === 'manual'" class="teacher-payments__panel grid gap-5">
        <UiCard class="teacher-payments__filters grid gap-4" hover>
          <div class="teacher-payments__filters-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <UiSelect
              :model-value="manualFilters.courseId"
              :label="t('teacher.filterCourse')"
              clearable
              @update:model-value="(value) => onManualSelect('courseId', value)"
            >
              <option value="">{{ t('teacher.filterAllCourses') }}</option>
              <option v-for="course in courseOptions" :key="course.value" :value="course.value">{{ course.label }}</option>
            </UiSelect>

            <UiSelect
              :model-value="manualFilters.status"
              :label="t('teacher.filterPaymentStatus')"
              clearable
              @update:model-value="(value) => onManualSelect('status', value)"
            >
              <option value="">{{ t('teacher.filterStatusAny') }}</option>
              <option v-for="option in manualStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </UiSelect>

            <UiSelect
              :model-value="manualFilters.method"
              :label="t('teacher.filterPaymentMethod')"
              clearable
              @update:model-value="(value) => onManualSelect('method', value)"
            >
              <option value="">{{ t('teacher.filterMethodAny') }}</option>
              <option v-for="option in methodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </UiSelect>

            <UiInput v-model="manualFilters.search" :label="t('teacher.filterSearch')" :placeholder="t('teacher.filterSearchPlaceholder')" />

            <div class="teacher-payments__date-inputs grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
              <UiInput v-model="manualFilters.dateFrom" type="date" :label="t('teacher.filterDateFrom')" />
              <UiInput v-model="manualFilters.dateTo" type="date" :label="t('teacher.filterDateTo')" />
            </div>
          </div>
          <div class="teacher-payments__filters-actions flex justify-end">
            <UiButton
              variant="link"
              color="secondary"
              prepend-icon="CloseCircleOutlined"
              @click="resetManualFilters"
            >
              {{ t('teacher.paymentsResetFilters') }}
            </UiButton>
          </div>
        </UiCard>

        <div class="teacher-payments__summary" role="status" aria-live="polite">
          <div class="teacher-payments__summary-info grid gap-2 min-w-[220px]">
            <h3 class="teacher-payments__summary-heading m-0 text-[1.1rem] font-semibold">{{ manualResultsHeading }}</h3>
            <p class="teacher-payments__summary-description m-0 text-content-secondary text-[0.9rem]">{{ manualRangeLabel }}</p>
          </div>
          <div class="teacher-payments__summary-meta flex flex-col items-end gap-3 min-w-[200px]">
            <div v-if="manualActiveFilters.length" class="teacher-payments__chips flex flex-wrap gap-2 justify-end">
              <span
                v-for="filter in manualActiveFilters"
                :key="`manual-filter-${filter}`"
                class="teacher-payments__chip"
              >
                {{ filter }}
              </span>
            </div>
            <span v-else class="teacher-payments__no-filters text-content-tertiary text-[0.85rem]">{{ t('teacher.paymentsFiltersEmpty') }}</span>
          </div>
        </div>

        <UiTable
          class="teacher-payments__table w-full"
          :headers="manualHeaders"
          :items="manualData.items"
          :items-length="manualData.total"
          :page="manualFilters.page"
          :items-per-page="manualFilters.size"
          :sort-by="manualSortBy"
          :loading="manualLoading"
          density="comfortable"
          :items-per-page-options="[10, 25, 50, 100]"
          @update:page="(page) => onManualPageChange(page)"
          @update:items-per-page="(size) => onManualItemsPerPageChange(size)"
          @update:sort-by="onManualSortChange"
        >
          <template #item.courseTitle="{ item }">
            <span>{{ item.courseTitle }}</span>
          </template>
          <template #item.studentName="{ item }">
            <div class="teacher-payments__cell flex flex-col gap-[0.125rem]">
              <span class="teacher-payments__primary font-medium">{{ item.studentName }}</span>
              <span class="teacher-payments__secondary text-[0.825rem] text-content-tertiary">{{ item.studentEmail }}</span>
              <span class="teacher-payments__secondary text-[0.825rem] text-content-tertiary">
                {{ t('teacher.paymentsStudentIdLabel', { id: item.studentId }) }}
              </span>
            </div>
          </template>
          <template #item.amount="{ item }">
            <span>{{ formatAmount(item.amount, item.currency) }}</span>
          </template>
          <template #item.method="{ item }">
            <UiTag color="secondary" size="sm">{{ formatMethod(item.method) }}</UiTag>
          </template>
          <template #item.status="{ item }">
            <UiTag :color="paymentStatusColor(item.status)" size="sm">{{ formatPaymentStatus(item.status) }}</UiTag>
          </template>
          <template #item.proofUrl="{ item }">
            <a
              v-if="item.proofUrl"
              :href="item.proofUrl"
              target="_blank"
              rel="noopener"
              class="teacher-payments__link"
            >
              {{ t('teacher.paymentsViewProof') }}
            </a>
            <span v-else>—</span>
          </template>
          <template #item.createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>
          <template #item.reviewedAt="{ item }">
            <span>{{ formatDateTime(item.reviewedAt) }}</span>
          </template>
          <template #item.reviewedBy="{ item }">
            <span>{{ item.reviewedBy || '—' }}</span>
          </template>
        </UiTable>
      </div>

      <div v-else class="teacher-payments__panel grid gap-5">
        <UiCard class="teacher-payments__filters grid gap-4" hover>
          <div class="teacher-payments__filters-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <UiSelect
              :model-value="tutoringFilters.status"
              :label="t('teacher.filterPaymentStatus')"
              clearable
              @update:model-value="(value) => onTutoringSelect('status', value)"
            >
              <option value="">{{ t('teacher.filterStatusAny') }}</option>
              <option v-for="option in manualStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </UiSelect>

            <UiSelect
              :model-value="tutoringFilters.method"
              :label="t('teacher.filterPaymentMethod')"
              clearable
              @update:model-value="(value) => onTutoringSelect('method', value)"
            >
              <option value="">{{ t('teacher.filterMethodAny') }}</option>
              <option v-for="option in methodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </UiSelect>

            <UiInput v-model="tutoringFilters.search" :label="t('teacher.filterSearch')" :placeholder="t('teacher.filterSearchPlaceholder')" />

            <div class="teacher-payments__date-inputs grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
              <UiInput v-model="tutoringFilters.dateFrom" type="date" :label="t('teacher.filterDateFrom')" />
              <UiInput v-model="tutoringFilters.dateTo" type="date" :label="t('teacher.filterDateTo')" />
            </div>
          </div>
          <div class="teacher-payments__filters-actions flex justify-end">
            <UiButton
              variant="link"
              color="secondary"
              prepend-icon="CloseCircleOutlined"
              @click="resetTutoringFilters"
            >
              {{ t('teacher.paymentsResetFilters') }}
            </UiButton>
          </div>
        </UiCard>

        <div class="teacher-payments__summary" role="status" aria-live="polite">
          <div class="teacher-payments__summary-info grid gap-2 min-w-[220px]">
            <h3 class="teacher-payments__summary-heading m-0 text-[1.1rem] font-semibold">{{ tutoringResultsHeading }}</h3>
            <p class="teacher-payments__summary-description m-0 text-content-secondary text-[0.9rem]">{{ tutoringRangeLabel }}</p>
          </div>
          <div class="teacher-payments__summary-meta flex flex-col items-end gap-3 min-w-[200px]">
            <div v-if="tutoringActiveFilters.length" class="teacher-payments__chips flex flex-wrap gap-2 justify-end">
              <span
                v-for="filter in tutoringActiveFilters"
                :key="`tutoring-filter-${filter}`"
                class="teacher-payments__chip"
              >
                {{ filter }}
              </span>
            </div>
            <span v-else class="teacher-payments__no-filters text-content-tertiary text-[0.85rem]">{{ t('teacher.paymentsFiltersEmpty') }}</span>
          </div>
        </div>

        <UiTable
          class="teacher-payments__table w-full"
          :headers="tutoringHeaders"
          :items="tutoringData.items"
          :items-length="tutoringData.total"
          :page="tutoringFilters.page"
          :items-per-page="tutoringFilters.size"
          :sort-by="tutoringSortBy"
          :loading="tutoringLoading"
          density="comfortable"
          :items-per-page-options="[10, 25, 50, 100]"
          @update:page="(page) => onTutoringPageChange(page)"
          @update:items-per-page="(size) => onTutoringItemsPerPageChange(size)"
          @update:sort-by="onTutoringSortChange"
        >
          <template #item.studentName="{ item }">
            <div class="teacher-payments__cell flex flex-col gap-[0.125rem]">
              <span class="teacher-payments__primary font-medium">{{ item.studentName }}</span>
              <span class="teacher-payments__secondary text-[0.825rem] text-content-tertiary">{{ item.studentEmail }}</span>
              <span class="teacher-payments__secondary text-[0.825rem] text-content-tertiary">
                {{ t('teacher.paymentsStudentIdLabel', { id: item.studentId }) }}
              </span>
            </div>
          </template>
          <template #item.amount="{ item }">
            <span>{{ formatAmount(item.amount, item.currency) }}</span>
          </template>
          <template #item.method="{ item }">
            <UiTag color="secondary" size="sm">{{ formatMethod(item.method) }}</UiTag>
          </template>
          <template #item.status="{ item }">
            <UiTag :color="paymentStatusColor(item.status)" size="sm">{{ formatPaymentStatus(item.status) }}</UiTag>
          </template>
          <template #item.proofUrl="{ item }">
            <a
              v-if="item.proofUrl"
              :href="item.proofUrl"
              target="_blank"
              rel="noopener"
              class="teacher-payments__link"
            >
              {{ t('teacher.paymentsViewProof') }}
            </a>
            <span v-else>—</span>
          </template>
          <template #item.submittedAt="{ item }">
            <span>{{ formatDateTime(item.submittedAt) }}</span>
          </template>
          <template #item.reviewedAt="{ item }">
            <span>{{ formatDateTime(item.reviewedAt) }}</span>
          </template>
          <template #item.reviewedBy="{ item }">
            <span>{{ item.reviewedBy || '—' }}</span>
          </template>
        </UiTable>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { FEATURE } from '@/constants/featureCatalog';
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import api from '@/services/api';
import { useCoursesStore } from '@/stores/courses';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { useToast } from '@/composables/useToast';
import {
  exportTeacherManualPaymentsCsv,
  exportTeacherTutoringPaymentsCsv,
  fetchTeacherManualPayments,
  fetchTeacherTutoringPayments,
  type TeacherManualPaymentItem,
  type TeacherManualPaymentsQuery,
  type TeacherTutoringPaymentItem,
  type TeacherTutoringPaymentsQuery
} from '@/services/teacherPayments';
import type { ManualPaymentMethod, ManualPaymentStatus } from '@/services/student';

interface ManualRow extends TeacherManualPaymentItem {
  courseTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
}

interface TutoringRow extends TeacherTutoringPaymentItem {
  studentId: number;
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

const resolveProofUrl = (url?: string | null) => {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (typeof window === 'undefined') {
    return url;
  }

  const base = api.defaults.baseURL || '/api';

  try {
    const origin = /^https?:\/\//i.test(base) ? new URL(base).origin : window.location.origin;
    const normalizedPath = url.startsWith('/') ? url.substring(1) : url;
    const normalizedBase = normalizedPath.startsWith('static/')
      ? `${origin}/`
      : (() => {
          const candidate = /^https?:\/\//i.test(base)
            ? base
            : new URL(base.startsWith('/') ? base : `/${base}` || '.', window.location.origin).toString();
          return candidate.endsWith('/') ? candidate : `${candidate}/`;
        })();

    return new URL(normalizedPath, normalizedBase).toString();
  } catch (error) {
    console.warn('[TeacherPaymentsView] Unable to resolve proof URL', error);
    return url;
  }
};

const activeTab = ref<'manual' | 'tutoring'>('manual');
const backendAvailable = ref(true);
const manualLoading = ref(false);
const tutoringLoading = ref(false);
const manualExporting = ref(false);
const tutoringExporting = ref(false);
const manualInitialized = ref(false);
const tutoringInitialized = ref(false);
let manualSearchTimer: number | null = null;
let tutoringSearchTimer: number | null = null;

const manualFilters = reactive({
  courseId: '',
  status: '',
  method: '',
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  size: 25,
  sortField: 'createdAt',
  sortDesc: true
});

const tutoringFilters = reactive({
  status: '',
  method: '',
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  size: 25,
  sortField: 'submittedAt',
  sortDesc: true
});

const manualData = reactive({
  items: [] as ManualRow[],
  total: 0
});

const tutoringData = reactive({
  items: [] as TutoringRow[],
  total: 0
});

const tenantFlag = computed(() => featuresStore.hasFeature(FEATURE.teacherRegsPayments));
const backendEnabled = computed(() => backendAvailable.value);

const isFeatureEnabled = computed(() => {
  if (tenantFlag.value === false) {
    return false;
  }
  return backendEnabled.value;
});

const showBackendUnavailable = computed(() => tenantFlag.value !== false && !backendAvailable.value);

const tabItems = computed(() => [
  { label: t('teacher.paymentsManualTab'), value: 'manual' },
  { label: t('teacher.paymentsTutoringTab'), value: 'tutoring' }
]);

const courseOptions = computed<SelectOption[]>(() =>
  coursesStore.list.map((course) => ({
    value: String(course.id),
    label: course.title
  }))
);

const courseLookup = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const course of coursesStore.list) {
    map[String(course.id)] = course.title;
  }
  return map;
});

const formatResultsHeading = (count: number) => {
  if (!count) {
    return t('teacher.paymentsResultsEmpty');
  }
  if (count === 1) {
    return t('teacher.paymentsResultsSingle');
  }
  return t('teacher.paymentsResultsMany', { count });
};

const manualResultsHeading = computed(() => formatResultsHeading(manualData.total));

const tutoringResultsHeading = computed(() => formatResultsHeading(tutoringData.total));

const manualRangeLabel = computed(() => {
  if (!manualData.total) {
    return t('teacher.paymentsRangeEmpty');
  }
  const from = (manualFilters.page - 1) * manualFilters.size + 1;
  const to = Math.min(from + manualData.items.length - 1, manualData.total);
  return t('teacher.paymentsRange', { from, to, total: manualData.total });
});

const tutoringRangeLabel = computed(() => {
  if (!tutoringData.total) {
    return t('teacher.paymentsRangeEmpty');
  }
  const from = (tutoringFilters.page - 1) * tutoringFilters.size + 1;
  const to = Math.min(from + tutoringData.items.length - 1, tutoringData.total);
  return t('teacher.paymentsRange', { from, to, total: tutoringData.total });
});

const manualActiveFilters = computed(() => {
  const filters: string[] = [];
  if (manualFilters.courseId) {
    const label = courseLookup.value[manualFilters.courseId] ?? manualFilters.courseId;
    filters.push(`${t('teacher.filterCourse')}: ${label}`);
  }
  if (manualFilters.status) {
    filters.push(`${t('teacher.filterPaymentStatus')}: ${formatPaymentStatus(manualFilters.status as ManualPaymentStatus)}`);
  }
  if (manualFilters.method) {
    filters.push(`${t('teacher.filterPaymentMethod')}: ${formatMethod(manualFilters.method as ManualPaymentMethod)}`);
  }
  if (manualFilters.search) {
    filters.push(t('teacher.paymentsFiltersSearch', { query: manualFilters.search }));
  }
  if (manualFilters.dateFrom || manualFilters.dateTo) {
    const from = manualFilters.dateFrom ? formatFilterDate(manualFilters.dateFrom) : t('teacher.paymentsFiltersDateAny');
    const to = manualFilters.dateTo ? formatFilterDate(manualFilters.dateTo) : t('teacher.paymentsFiltersDateAny');
    filters.push(t('teacher.paymentsFiltersDateRange', { from, to }));
  }
  return filters;
});

const tutoringActiveFilters = computed(() => {
  const filters: string[] = [];
  if (tutoringFilters.status) {
    filters.push(`${t('teacher.filterPaymentStatus')}: ${formatPaymentStatus(tutoringFilters.status as ManualPaymentStatus)}`);
  }
  if (tutoringFilters.method) {
    filters.push(`${t('teacher.filterPaymentMethod')}: ${formatMethod(tutoringFilters.method as ManualPaymentMethod)}`);
  }
  if (tutoringFilters.search) {
    filters.push(t('teacher.paymentsFiltersSearch', { query: tutoringFilters.search }));
  }
  if (tutoringFilters.dateFrom || tutoringFilters.dateTo) {
    const from = tutoringFilters.dateFrom ? formatFilterDate(tutoringFilters.dateFrom) : t('teacher.paymentsFiltersDateAny');
    const to = tutoringFilters.dateTo ? formatFilterDate(tutoringFilters.dateTo) : t('teacher.paymentsFiltersDateAny');
    filters.push(t('teacher.paymentsFiltersDateRange', { from, to }));
  }
  return filters;
});

const manualStatusOptions = computed(() => [
  { value: 'PENDING_REVIEW', label: t('teacher.paymentStatus.PENDING_REVIEW') },
  { value: 'APPROVED', label: t('teacher.paymentStatus.APPROVED') },
  { value: 'SUCCESS', label: t('teacher.paymentStatus.SUCCESS') },
  { value: 'REJECTED', label: t('teacher.paymentStatus.REJECTED') },
  { value: 'FAILED', label: t('teacher.paymentStatus.FAILED') }
]);

const methodOptions = computed(() => [
  { value: 'bank', label: t('teacher.paymentMethod.bank') },
  { value: 'cash', label: t('teacher.paymentMethod.cash') },
  { value: 'transfer', label: t('teacher.paymentMethod.transfer') },
  { value: 'instapay', label: t('teacher.paymentMethod.instapay') },
  { value: 'vodafone_cash', label: t('teacher.paymentMethod.vodafone_cash') },
  { value: 'custom_link', label: t('teacher.paymentMethod.custom_link') },
  { value: 'other', label: t('teacher.paymentMethod.other') }
]);

const manualHeaders = computed(() => [
  { title: t('teacher.paymentsCourse'), key: 'courseTitle', sortable: true },
  { title: t('teacher.paymentsStudent'), key: 'studentName', sortable: true },
  { title: t('teacher.paymentsAmount'), key: 'amount', sortable: true },
  { title: t('teacher.paymentsMethod'), key: 'method', sortable: true },
  { title: t('teacher.paymentsStatus'), key: 'status', sortable: true },
  { title: t('teacher.paymentsProof'), key: 'proofUrl' },
  { title: t('teacher.paymentsCreatedAt'), key: 'createdAt', sortable: true },
  { title: t('teacher.paymentsReviewedBy'), key: 'reviewedBy', sortable: true },
  { title: t('teacher.paymentsReviewedAt'), key: 'reviewedAt', sortable: true }
]);

const tutoringHeaders = computed(() => [
  { title: t('teacher.paymentsStudent'), key: 'studentName', sortable: true },
  { title: t('teacher.paymentsAmount'), key: 'amount', sortable: true },
  { title: t('teacher.paymentsMethod'), key: 'method', sortable: true },
  { title: t('teacher.paymentsStatus'), key: 'status', sortable: true },
  { title: t('teacher.paymentsProof'), key: 'proofUrl' },
  { title: t('teacher.paymentsSubmittedAt'), key: 'submittedAt', sortable: true },
  { title: t('teacher.paymentsReviewedBy'), key: 'reviewedBy', sortable: true },
  { title: t('teacher.paymentsReviewedAt'), key: 'reviewedAt', sortable: true }
]);

const manualSortBy = computed(() => [
  {
    key: manualFilters.sortField,
    order: manualFilters.sortDesc ? 'desc' : 'asc'
  }
]);

const tutoringSortBy = computed(() => [
  {
    key: tutoringFilters.sortField,
    order: tutoringFilters.sortDesc ? 'desc' : 'asc'
  }
]);

const downloadDisabled = computed(() => {
  if (!isFeatureEnabled.value) {
    return true;
  }
  if (!backendAvailable.value) {
    return true;
  }
  if (activeTab.value === 'manual') {
    return manualLoading.value || manualExporting.value || manualData.items.length === 0;
  }
  return tutoringLoading.value || tutoringExporting.value || tutoringData.items.length === 0;
});

const buildManualQuery = (): TeacherManualPaymentsQuery => ({
  courseId: manualFilters.courseId ? Number(manualFilters.courseId) : undefined,
  status: (manualFilters.status || undefined) as ManualPaymentStatus | undefined,
  method: (manualFilters.method || undefined) as ManualPaymentMethod | undefined,
  search: manualFilters.search || undefined,
  dateFrom: manualFilters.dateFrom || undefined,
  dateTo: manualFilters.dateTo || undefined,
  page: manualFilters.page,
  size: manualFilters.size,
  sortField: manualFilters.sortField,
  sortDesc: manualFilters.sortDesc
});

const buildTutoringQuery = (): TeacherTutoringPaymentsQuery => ({
  status: (tutoringFilters.status || undefined) as ManualPaymentStatus | undefined,
  method: (tutoringFilters.method || undefined) as ManualPaymentMethod | undefined,
  search: tutoringFilters.search || undefined,
  dateFrom: tutoringFilters.dateFrom || undefined,
  dateTo: tutoringFilters.dateTo || undefined,
  page: tutoringFilters.page,
  size: tutoringFilters.size,
  sortField: tutoringFilters.sortField,
  sortDesc: tutoringFilters.sortDesc
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

const fetchManualPayments = async () => {
  if (!isFeatureEnabled.value) {
    return;
  }
  manualLoading.value = true;
  try {
    const data = await fetchTeacherManualPayments(buildManualQuery());
    backendAvailable.value = true;
    manualData.total = data.total;
    manualData.items = data.items.map((item) => ({
      ...item,
      courseTitle: item.course.title,
      studentId: item.student.id,
      studentName: item.student.name,
      studentEmail: item.student.email,
      proofUrl: resolveProofUrl(item.proofUrl)
    }));
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404 || status === 403) {
        backendAvailable.value = false;
        manualData.items = [];
        manualData.total = 0;
        try {
          await featuresStore.refresh();
        } catch (refreshError) {
          console.warn('[payments] unable to refresh features after manual payments error', refreshError);
        }
        return;
      }
    }
    toast.error(t('teacher.paymentsLoadFailed'));
  } finally {
    manualLoading.value = false;
  }
};

const fetchTutoringPayments = async () => {
  if (!isFeatureEnabled.value) {
    return;
  }
  tutoringLoading.value = true;
  try {
    const data = await fetchTeacherTutoringPayments(buildTutoringQuery());
    backendAvailable.value = true;
    tutoringData.total = data.total;
    tutoringData.items = data.items.map((item) => ({
      ...item,
      studentId: item.student.id,
      studentName: item.student.name,
      studentEmail: item.student.email,
      proofUrl: resolveProofUrl(item.proofUrl)
    }));
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404 || status === 403) {
        backendAvailable.value = false;
        tutoringData.items = [];
        tutoringData.total = 0;
        try {
          await featuresStore.refresh();
        } catch (refreshError) {
          console.warn('[payments] unable to refresh features after tutoring payments error', refreshError);
        }
        return;
      }
    }
    toast.error(t('teacher.tutoringPaymentsLoadFailed'));
  } finally {
    tutoringLoading.value = false;
  }
};

const debounceManualFetch = () => {
  if (manualSearchTimer) {
    window.clearTimeout(manualSearchTimer);
  }
  manualSearchTimer = window.setTimeout(() => {
    if (manualInitialized.value && backendAvailable.value) {
      fetchManualPayments();
    }
  }, 350);
};

const debounceTutoringFetch = () => {
  if (tutoringSearchTimer) {
    window.clearTimeout(tutoringSearchTimer);
  }
  tutoringSearchTimer = window.setTimeout(() => {
    if (tutoringInitialized.value && backendAvailable.value) {
      fetchTutoringPayments();
    }
  }, 350);
};

watch(
  () => [
    manualFilters.courseId,
    manualFilters.status,
    manualFilters.method,
    manualFilters.dateFrom,
    manualFilters.dateTo,
    manualFilters.page,
    manualFilters.size,
    manualFilters.sortField,
    manualFilters.sortDesc
  ],
  () => {
    if (!manualInitialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    fetchManualPayments();
  }
);

watch(
  () => manualFilters.search,
  () => {
    if (!manualInitialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    manualFilters.page = 1;
    debounceManualFetch();
  }
);

watch(
  () => [
    tutoringFilters.status,
    tutoringFilters.method,
    tutoringFilters.dateFrom,
    tutoringFilters.dateTo,
    tutoringFilters.page,
    tutoringFilters.size,
    tutoringFilters.sortField,
    tutoringFilters.sortDesc
  ],
  () => {
    if (!tutoringInitialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    fetchTutoringPayments();
  }
);

watch(
  () => tutoringFilters.search,
  () => {
    if (!tutoringInitialized.value || !isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    tutoringFilters.page = 1;
    debounceTutoringFetch();
  }
);

watch(
  () => activeTab.value,
  async (tab) => {
    if (!isFeatureEnabled.value || !backendAvailable.value) {
      return;
    }
    if (tab === 'manual' && !manualInitialized.value) {
      await fetchManualPayments();
      manualInitialized.value = true;
    } else if (tab === 'manual') {
      fetchManualPayments();
    }
    if (tab === 'tutoring' && !tutoringInitialized.value) {
      await fetchTutoringPayments();
      tutoringInitialized.value = true;
    } else if (tab === 'tutoring') {
      fetchTutoringPayments();
    }
  }
);

watch(
  () => isFeatureEnabled.value,
  async (enabled) => {
    if (!enabled) {
      backendAvailable.value = true;
      manualData.items = [];
      manualData.total = 0;
      tutoringData.items = [];
      tutoringData.total = 0;
      return;
    }
    backendAvailable.value = true;
    if (activeTab.value === 'manual') {
      if (!manualInitialized.value) {
        await fetchManualPayments();
        manualInitialized.value = true;
      } else {
        fetchManualPayments();
      }
    }
    if (activeTab.value === 'tutoring') {
      if (!tutoringInitialized.value) {
        await fetchTutoringPayments();
        tutoringInitialized.value = true;
      } else {
        fetchTutoringPayments();
      }
    }
  }
);

const onManualSelect = (key: 'courseId' | 'status' | 'method', value: string | number | string[] | null) => {
  const next = Array.isArray(value) ? (value.length ? String(value[0]) : '') : value === null ? '' : String(value);
  manualFilters[key] = next;
  manualFilters.page = 1;
};

const onTutoringSelect = (key: 'status' | 'method', value: string | number | string[] | null) => {
  const next = Array.isArray(value) ? (value.length ? String(value[0]) : '') : value === null ? '' : String(value);
  tutoringFilters[key] = next;
  tutoringFilters.page = 1;
};

const onManualPageChange = (page: number) => {
  manualFilters.page = page;
};

const onManualItemsPerPageChange = (size: number) => {
  manualFilters.size = size;
  manualFilters.page = 1;
};

const onManualSortChange = (sort: Array<{ key: string; order?: 'asc' | 'desc' }>) => {
  const first = sort[0];
  if (!first) {
    manualFilters.sortField = 'createdAt';
    manualFilters.sortDesc = true;
    return;
  }
  manualFilters.sortField = first.key;
  manualFilters.sortDesc = first.order !== 'asc';
};

const onTutoringPageChange = (page: number) => {
  tutoringFilters.page = page;
};

const onTutoringItemsPerPageChange = (size: number) => {
  tutoringFilters.size = size;
  tutoringFilters.page = 1;
};

const onTutoringSortChange = (sort: Array<{ key: string; order?: 'asc' | 'desc' }>) => {
  const first = sort[0];
  if (!first) {
    tutoringFilters.sortField = 'submittedAt';
    tutoringFilters.sortDesc = true;
    return;
  }
  tutoringFilters.sortField = first.key;
  tutoringFilters.sortDesc = first.order !== 'asc';
};

const resetManualFilters = () => {
  manualFilters.courseId = '';
  manualFilters.status = '';
  manualFilters.method = '';
  manualFilters.search = '';
  manualFilters.dateFrom = '';
  manualFilters.dateTo = '';
  manualFilters.page = 1;
  manualFilters.sortField = 'createdAt';
  manualFilters.sortDesc = true;
  if (manualInitialized.value && isFeatureEnabled.value) {
    backendAvailable.value = true;
    fetchManualPayments();
  }
};

const resetTutoringFilters = () => {
  tutoringFilters.status = '';
  tutoringFilters.method = '';
  tutoringFilters.search = '';
  tutoringFilters.dateFrom = '';
  tutoringFilters.dateTo = '';
  tutoringFilters.page = 1;
  tutoringFilters.sortField = 'submittedAt';
  tutoringFilters.sortDesc = true;
  if (tutoringInitialized.value && isFeatureEnabled.value) {
    backendAvailable.value = true;
    fetchTutoringPayments();
  }
};

const formatAmount = (value: number, currency?: string | null) => {
  const resolvedCurrency = (currency ?? 'EGP').toUpperCase();
  try {
    return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: resolvedCurrency
    }).format(value ?? 0);
  } catch {
    const amount = Number.isFinite(value) ? value : 0;
    return `${resolvedCurrency} ${amount}`;
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

const formatFilterDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const paymentStatusColor = (status: ManualPaymentStatus) => {
  const normalized = String(status ?? '').toUpperCase();
  switch (normalized) {
    case 'APPROVED':
    case 'SUCCESS':
      return 'success';
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'FAILED':
      return 'danger';
    default:
      return 'secondary';
  }
};

const formatPaymentStatus = (status: ManualPaymentStatus) => {
  const raw = String(status ?? '');
  const upperKey = `teacher.paymentStatus.${raw.toUpperCase()}`;
  const upperTranslated = t(upperKey);
  if (upperTranslated !== upperKey) {
    return upperTranslated;
  }
  const lowerKey = `teacher.paymentStatus.${raw.toLowerCase()}`;
  const lowerTranslated = t(lowerKey);
  if (lowerTranslated !== lowerKey) {
    return lowerTranslated;
  }
  return raw.replace(/_/g, ' ');
};

const formatMethod = (method: ManualPaymentMethod) => {
  const key = `teacher.paymentMethod.${method}`;
  const translated = t(key);
  return translated === key ? method : translated;
};

const downloadCsv = async () => {
  if (!isFeatureEnabled.value) {
    return;
  }
  if (activeTab.value === 'manual') {
    manualExporting.value = true;
    try {
      const data = await exportTeacherManualPaymentsCsv(buildManualQuery());
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `manual-payments-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(t('teacher.paymentsExportFailed'));
    } finally {
      manualExporting.value = false;
    }
    return;
  }
  tutoringExporting.value = true;
  try {
    const data = await exportTeacherTutoringPaymentsCsv(buildTutoringQuery());
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `tutoring-payments-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(t('teacher.paymentsExportFailed'));
  } finally {
    tutoringExporting.value = false;
  }
};

onMounted(async () => {
  await loadCourses();
  if (isFeatureEnabled.value) {
    await fetchManualPayments();
    manualInitialized.value = true;
  }
});

onBeforeUnmount(() => {
  if (manualSearchTimer) {
    window.clearTimeout(manualSearchTimer);
  }
  if (tutoringSearchTimer) {
    window.clearTimeout(tutoringSearchTimer);
  }
});
</script>

<style scoped>
.teacher-payments__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary-100) 42%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary-400) 18%, transparent);
}

.teacher-payments__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-primary-500) 12%, transparent);
  color: var(--sakai-primary-700);
  font-size: 0.8rem;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-payments__link {
  color: var(--sakai-primary-600);
  text-decoration: none;
}

.teacher-payments__link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .teacher-payments__summary {
    padding: var(--sakai-space-4);
    align-items: flex-start;
  }

  .teacher-payments__summary-meta {
    align-items: flex-start;
    min-width: unset;
  }

  .teacher-payments__chips {
    justify-content: flex-start;
  }
}
</style>
