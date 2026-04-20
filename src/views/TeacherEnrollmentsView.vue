<template>
  <ThemePage :title="t('teacher.paymentsTitle')" :subtitle="t('teacher.enrollmentsTitle')">
    <div class="teacher-enrollments grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
      <UiDialog
        v-model="decisionDialog.open"
        :title="t('teacher.paymentRejectDialogTitle')"
        :mask-closable="false"
      >
        <p class="teacher-enrollments__dialog-lead">{{ t('teacher.paymentRejectDialogPrompt') }}</p>
        <UiTextarea
          v-model="decisionDialog.notes"
          :label="t('teacher.paymentRejectDialogReasonLabel')"
          :rows="4"
          maxlength="2000"
        />
        <template #footer>
          <UiButton variant="outline" :disabled="decisionDialog.loading" @click="closeDecisionDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton color="danger" :loading="decisionDialog.loading" @click="submitRejection">
            {{ t('teacher.reject') }}
          </UiButton>
        </template>
      </UiDialog>

      <UiCard class="teacher-enrollments__card" :title="t('teacher.paymentsTitle')" hover>
        <div class="teacher-enrollments__filters flex flex-wrap justify-between items-center gap-3 mb-4">
          <UiSegmentedControl v-model="selectedStatus" :options="statusOptions" size="sm" />
          <div v-if="selectedPayments.length" class="teacher-enrollments__bulk flex items-center gap-3 flex-wrap">
            <UiTag color="info" size="sm">{{ selectedPayments.length }} {{ t('common.selectedOptions') }}</UiTag>
            <div class="teacher-enrollments__bulk-actions flex flex-wrap gap-2">
              <UiButton color="success" variant="outline" @click="bulkDecision('approved')">
                {{ t('teacher.approve') }}
              </UiButton>
              <UiButton color="danger" variant="outline" @click="bulkDecision('rejected')">
                {{ t('teacher.reject') }}
              </UiButton>
            </div>
          </div>
        </div>
        <UiTable
          class="teacher-enrollments__table block w-full overflow-x-auto"
          v-model:selected="selectedPayments"
          :headers="paymentHeaders"
          :items="payments"
          :show-select="selectedStatus === 'pending'"
          item-value="id"
          density="comfortable"
        >
          <template #item.student="{ item }">
            <div class="teacher-enrollments__student flex flex-col gap-[2px]">
              <strong>{{ item.studentName || t('teacher.enrollmentUnknownStudent') }}</strong>
              <span v-if="item.studentEmail" class="teacher-enrollments__student-email text-[0.85rem] text-content-secondary">{{ item.studentEmail }}</span>
            </div>
          </template>
          <template #item.proofUrl="{ item }">
            <a
              v-if="item.proofUrl"
              :href="item.proofUrl"
              target="_blank"
              rel="noopener"
              class="teacher-enrollments__link"
            >
              {{ t('student.proofUrl') }}
            </a>
            <span v-else class="teacher-enrollments__empty text-content-tertiary text-[0.85rem]">—</span>
          </template>
          <template #item.courseTitle="{ item }">
            <div class="teacher-enrollments__course-meta flex flex-col gap-[0.2rem]">
              <span>{{ item.courseTitle }}</span>
              <small v-if="paymentUsageSummary(item)" class="teacher-enrollments__course-helper text-[0.8rem] text-content-tertiary">
                {{ paymentUsageSummary(item) }}
              </small>
            </div>
          </template>
          <template #item.method="{ item }">
            {{ formatManualMethod(item.method) }}
          </template>
          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.status)" size="sm">{{ item.status }}</UiTag>
          </template>
          <template #item.actions="{ item }">
            <div v-if="isPendingStatus(item.status)" class="teacher-enrollments__row-actions inline-flex gap-2">
              <UiButton color="success" variant="link" @click="decision(item.id, 'approved')">
                {{ t('teacher.approve') }}
              </UiButton>
              <UiButton color="danger" variant="link" @click="decision(item.id, 'rejected')">
                {{ t('teacher.reject') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div class="teacher-enrollments__list teacher-enrollments__list--payments" role="list">
          <article
            v-for="payment in payments"
            :key="payment.id"
            class="teacher-enrollments__list-item"
            role="listitem"
          >
            <header class="teacher-enrollments__list-header flex flex-wrap items-center justify-between gap-2">
              <div class="teacher-enrollments__list-titles flex flex-col gap-[0.35rem]">
                <h3>{{ payment.courseTitle }}</h3>
                <span>{{ formatManualMethod(payment.method) }}</span>
                <span v-if="paymentUsageSummary(payment)">{{ paymentUsageSummary(payment) }}</span>
              </div>
              <UiTag :color="statusColor(payment.status)" size="sm">{{ payment.status }}</UiTag>
            </header>
            <div class="teacher-enrollments__student flex flex-col gap-[2px]">
              <strong>{{ payment.studentName || t('teacher.enrollmentUnknownStudent') }}</strong>
              <span v-if="payment.studentEmail" class="teacher-enrollments__student-email text-[0.85rem] text-content-secondary">{{ payment.studentEmail }}</span>
            </div>
            <dl class="teacher-enrollments__list-grid grid gap-3">
              <div>
                <dt>{{ t('student.tableAmount') }}</dt>
                <dd>{{ payment.amount }}</dd>
              </div>
              <div>
                <dt>{{ t('student.tableProof') }}</dt>
                <dd>
                  <a
                    v-if="payment.proofUrl"
                    :href="payment.proofUrl"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ t('student.proofUrl') }}
                  </a>
                  <span v-else>—</span>
                </dd>
              </div>
              <div>
                <dt>{{ t('student.tableReviewedBy') }}</dt>
                <dd>{{ payment.reviewedBy || t('teacher.enrollmentUnknownStudent') }}</dd>
              </div>
            </dl>
            <div v-if="isPendingStatus(payment.status)" class="teacher-enrollments__list-actions flex flex-wrap gap-2">
              <UiButton color="success" variant="outline" @click="decision(payment.id, 'approved')">
                {{ t('teacher.approve') }}
              </UiButton>
              <UiButton color="danger" variant="outline" @click="decision(payment.id, 'rejected')">
                {{ t('teacher.reject') }}
              </UiButton>
            </div>
          </article>
        </div>
      </UiCard>

      <UiCard class="teacher-enrollments__card" :title="t('teacher.enrollmentsTitle')" hover>
        <UiTable
          class="teacher-enrollments__table teacher-enrollments__table--enrollments block w-full overflow-x-auto"
          :headers="enrollmentHeaders"
          :items="enrollments"
          density="comfortable"
        >
          <template #item.student="{ item }">
            <div class="teacher-enrollments__student flex flex-col gap-[2px]">
              <strong>{{ item.studentName || t('teacher.enrollmentUnknownStudent') }}</strong>
              <span v-if="item.studentEmail" class="teacher-enrollments__student-email text-[0.85rem] text-content-secondary">{{ item.studentEmail }}</span>
            </div>
          </template>
          <template #item.courseTitle="{ item }">
            <div class="teacher-enrollments__course flex flex-col gap-1">
              <UiSelect
                :model-value="String(item.courseId)"
                size="sm"
                class="teacher-enrollments__course-select max-w-[220px]"
                :disabled="isEnrollmentUpdating(item.id) || !courseOptions.length"
                @update:model-value="(value) => onEnrollmentCourseChange(item, value as string)"
              >
                <option
                  v-for="course in courseOptions"
                  :key="course.value"
                  :value="course.value"
                >
                  {{ course.label }}
                </option>
              </UiSelect>
              <span class="teacher-enrollments__course-helper text-[0.8rem] text-content-tertiary">{{ currentCourseLabel(item.courseId) }}</span>
              <span v-if="enrollmentUsageSummary(item)" class="teacher-enrollments__course-helper text-[0.8rem] text-content-tertiary">
                {{ enrollmentUsageSummary(item) }}
              </span>
            </div>
          </template>
          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.status)" size="sm">{{ item.status }}</UiTag>
          </template>
          <template #item.progress="{ item }">
            <div v-if="item.progress !== undefined && item.progress !== null" class="teacher-enrollments__progress flex items-center gap-3">
              <UiProgressBar :value="Number(item.progress)" :show-value="false" />
              <span class="teacher-enrollments__progress-value text-[0.85rem] text-content-secondary">{{ Math.round(Number(item.progress)) }}%</span>
            </div>
            <span v-else class="teacher-enrollments__empty text-content-tertiary text-[0.85rem]">—</span>
          </template>
        </UiTable>
        <div class="teacher-enrollments__list" role="list">
          <article
            v-for="enrollment in enrollments"
            :key="enrollment.id"
            class="teacher-enrollments__list-item"
            role="listitem"
          >
            <header class="teacher-enrollments__list-header flex flex-wrap items-center justify-between gap-2">
              <div class="teacher-enrollments__list-titles flex flex-col gap-[0.35rem]">
                <h3>{{ enrollment.studentName || t('teacher.enrollmentUnknownStudent') }}</h3>
                <span v-if="enrollment.studentEmail">{{ enrollment.studentEmail }}</span>
              </div>
              <UiTag :color="statusColor(enrollment.status)" size="sm">{{ enrollment.status }}</UiTag>
            </header>
            <div class="teacher-enrollments__list-field grid gap-2">
              <label>{{ t('student.tableCourse') }}</label>
              <UiSelect
                :model-value="String(enrollment.courseId)"
                size="sm"
                :disabled="isEnrollmentUpdating(enrollment.id) || !courseOptions.length"
                @update:model-value="(value) => onEnrollmentCourseChange(enrollment, value as string)"
              >
                <option
                  v-for="course in courseOptions"
                  :key="course.value"
                  :value="course.value"
                >
                  {{ course.label }}
                </option>
              </UiSelect>
              <small class="teacher-enrollments__course-helper text-[0.8rem] text-content-tertiary">{{ currentCourseLabel(enrollment.courseId) }}</small>
              <small v-if="enrollmentUsageSummary(enrollment)" class="teacher-enrollments__course-helper text-[0.8rem] text-content-tertiary">
                {{ enrollmentUsageSummary(enrollment) }}
              </small>
            </div>
            <dl class="teacher-enrollments__list-grid grid gap-3">
              <div>
                <dt>{{ t('student.tableStart') }}</dt>
                <dd>{{ enrollment.startAt || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('student.tableEnd') }}</dt>
                <dd>{{ enrollment.endAt || '—' }}</dd>
              </div>
              <div>
                <dt>{{ t('student.tableProgress') }}</dt>
                <dd>
                  <div v-if="enrollment.progress !== undefined && enrollment.progress !== null" class="teacher-enrollments__list-progress flex items-center gap-2">
                    <UiProgressBar :value="Number(enrollment.progress)" :show-value="false" />
                    <span>{{ Math.round(Number(enrollment.progress)) }}%</span>
                  </div>
                  <span v-else>—</span>
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </UiCard>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useCoursesStore } from '@/stores/courses';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';
import { isSessionRedirecting } from '@/lib/sessionExpiry';
import {
  getTeacherManualPayments,
  reviewManualPayment,
  getTeacherEnrollments,
  reviewManualPaymentsBulk,
  updateTeacherEnrollment
} from '@/services/student';
import type {
  ManualPaymentStatus,
  ManualPaymentView,
  EnrollmentView,
  TeacherEnrollmentUpdatePayload
} from '@/services/student';
import UiCard from '@/components/ui/UiCard.vue';
import UiSegmentedControl from '@/components/ui/UiSegmentedControl.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiProgressBar from '@/components/ui/UiProgressBar.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';

const { t } = useI18n();
const auth = useAuthStore();
const toast = useToast();
const selectedStatus = ref<ManualPaymentStatus>('pending');
const payments = ref<ManualPaymentView[]>([]);
const selectedPayments = ref<ManualPaymentView[]>([]);
const enrollments = ref<EnrollmentView[]>([]);
const enrollmentUpdating = ref<number[]>([]);
let pollHandle: number | undefined;
const decisionDialog = ref({
  open: false,
  mode: 'single' as 'single' | 'bulk',
  paymentId: null as number | null,
  paymentIds: [] as number[],
  notes: '',
  loading: false
});

const coursesStore = useCoursesStore();
const { list: coursesList } = storeToRefs(coursesStore);

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
    console.warn('[TeacherEnrollmentsView] Unable to resolve proof URL', error);
    return url;
  }
};

const paymentHeaders = [
  { title: t('teacher.enrollmentStudentHeader'), key: 'student' },
  { title: t('student.tableCourse'), key: 'courseTitle' },
  { title: t('student.tableAmount'), key: 'amount' },
  { title: t('student.tableMethod'), key: 'method' },
  { title: t('student.tableProof'), key: 'proofUrl' },
  { title: t('student.tableStatus'), key: 'status' },
  { title: t('student.tableReviewedBy'), key: 'reviewedBy' },
  { title: '', key: 'actions', width: 160 }
];

const enrollmentHeaders = [
  { title: t('teacher.enrollmentStudentHeader'), key: 'student' },
  { title: t('student.tableCourse'), key: 'courseTitle' },
  { title: t('student.tableStatus'), key: 'status' },
  { title: t('student.tableStart'), key: 'startAt' },
  { title: t('student.tableEnd'), key: 'endAt' },
  { title: t('student.tableProgress'), key: 'progress' }
];

const statusOptions = computed(() => [
  { label: t('teacher.statusPending'), value: 'pending' },
  { label: t('teacher.statusApproved'), value: 'approved' },
  { label: t('teacher.statusRejected'), value: 'rejected' }
]);

const courseOptions = computed(() =>
  coursesList.value.map((course) => ({ label: course.title, value: String(course.id) }))
);

const isEnrollmentUpdating = (id: number) => enrollmentUpdating.value.includes(id);

const normalizeManualStatus = (status: ManualPaymentStatus): ManualPaymentStatus => {
  const value = String(status || '').toUpperCase();
  switch (value) {
    case 'PENDING_REVIEW':
      return 'pending';
    case 'APPROVED':
    case 'SUCCESS':
      return 'approved';
    case 'REJECTED':
    case 'FAILED':
      return 'rejected';
    default:
      return status;
  }
};

const isPendingStatus = (status: ManualPaymentStatus) => normalizeManualStatus(status) === 'pending';

const formatManualMethod = (method?: string | null) => {
  if (!method) {
    return '—';
  }
  const studentKey = `student.paymentMethod.${method}`;
  const studentTranslated = t(studentKey);
  if (studentTranslated !== studentKey) {
    return studentTranslated;
  }
  const teacherKey = `teacher.paymentMethod.${method}`;
  const teacherTranslated = t(teacherKey);
  if (teacherTranslated !== teacherKey) {
    return teacherTranslated;
  }
  return method.replace(/_/g, ' ');
};

const statusColor = (status: string) => {
  const normalized = normalizeManualStatus(status as ManualPaymentStatus);
  switch (normalized) {
    case 'approved':
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'danger';
    default:
      return 'info';
  }
};

const paymentUsageSummary = (payment: ManualPaymentView) => {
  if (payment.source === 'FREE_OFFER_CHECKOUT' && payment.offerCode) {
    return t('teacher.enrollmentSourceFreeOffer', { code: payment.offerCode });
  }
  return '';
};

const enrollmentUsageSummary = (enrollment: EnrollmentView) => {
  if (enrollment.source === 'FREE_OFFER_CHECKOUT' && enrollment.offerCode) {
    return t('teacher.enrollmentSourceFreeOffer', { code: enrollment.offerCode });
  }
  return '';
};

const isAuthFailure = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403 || status === 419;
};

const stopPolling = () => {
  if (pollHandle) {
    window.clearInterval(pollHandle);
    pollHandle = undefined;
  }
};

const loadPayments = async () => {
  const response = await getTeacherManualPayments(selectedStatus.value);
  payments.value = response.map((payment) => ({
    ...payment,
    proofUrl: resolveProofUrl(payment.proofUrl),
    status: normalizeManualStatus(payment.status)
  }));
  selectedPayments.value = [];
};

const loadEnrollments = async () => {
  enrollments.value = await getTeacherEnrollments();
};

const ensureCoursesLoaded = async () => {
  if (coursesList.value.length) return;
  try {
    await coursesStore.fetchCourses();
  } catch (error) {
    console.error(error);
    toast.error(t('teacher.loadCoursesError'));
  }
};

const currentCourseLabel = (courseId: number) => {
  const match = coursesList.value.find((course) => course.id === courseId);
  return match ? match.title : t('teacher.enrollmentUnknownCourse');
};

const decision = async (paymentId: number, status: ManualPaymentStatus) => {
  if (status === 'rejected') {
    openDecisionDialog({ mode: 'single', paymentId, paymentIds: [] });
    return;
  }
  try {
    await reviewManualPayment(paymentId, { status });
    await loadPayments();
    await loadEnrollments();
    toast.success(t('teacher.paymentApprovedToast'));
  } catch (error) {
    console.error(error);
    toast.error(t('teacher.paymentDecisionError'));
  }
};

const bulkDecision = async (status: ManualPaymentStatus) => {
  if (!selectedPayments.value.length) return;
  if (status === 'rejected') {
    openDecisionDialog({
      mode: 'bulk',
      paymentId: null,
      paymentIds: selectedPayments.value.map((payment) => payment.id)
    });
    return;
  }
  try {
    await reviewManualPaymentsBulk({
      paymentIds: selectedPayments.value.map((payment) => payment.id),
      status
    });
    await loadPayments();
    await loadEnrollments();
    toast.success(t('teacher.paymentApprovedToast'));
  } catch (error) {
    console.error(error);
    toast.error(t('teacher.paymentDecisionError'));
  }
};

const openDecisionDialog = (payload: { mode: 'single' | 'bulk'; paymentId: number | null; paymentIds: number[] }) => {
  decisionDialog.value = {
    open: true,
    mode: payload.mode,
    paymentId: payload.paymentId,
    paymentIds: payload.paymentIds,
    notes: '',
    loading: false
  };
};

const closeDecisionDialog = () => {
  decisionDialog.value.open = false;
};

const submitRejection = async () => {
  const notes = decisionDialog.value.notes.trim();
  if (!notes) {
    toast.error(t('teacher.paymentRejectReasonRequired'));
    return;
  }
  if (decisionDialog.value.loading) return;
  decisionDialog.value.loading = true;
  try {
    if (decisionDialog.value.mode === 'single' && decisionDialog.value.paymentId != null) {
      await reviewManualPayment(decisionDialog.value.paymentId, { status: 'rejected', notes });
    } else if (decisionDialog.value.mode === 'bulk' && decisionDialog.value.paymentIds.length) {
      await reviewManualPaymentsBulk({ paymentIds: decisionDialog.value.paymentIds, status: 'rejected', notes });
      selectedPayments.value = [];
    }
    await loadPayments();
    await loadEnrollments();
    toast.success(t('teacher.paymentRejectedToast'));
    closeDecisionDialog();
  } catch (error) {
    console.error(error);
    toast.error(t('teacher.paymentRejectError'));
  } finally {
    decisionDialog.value.loading = false;
  }
};

const onEnrollmentCourseChange = async (enrollment: EnrollmentView, courseValue: string) => {
  const courseId = Number(courseValue);
  if (!courseId || courseId === enrollment.courseId) return;

  const payload: TeacherEnrollmentUpdatePayload = { courseId };
  enrollmentUpdating.value.push(enrollment.id);
  try {
    const updated = await updateTeacherEnrollment(enrollment.id, payload);
    enrollments.value = enrollments.value.map((item) => (item.id === updated.id ? updated : item));
    toast.success(t('teacher.updateEnrollmentSuccess'));
  } catch (error) {
    console.error(error);
    toast.error(t('teacher.updateEnrollmentError'));
  } finally {
    enrollmentUpdating.value = enrollmentUpdating.value.filter((id) => id !== enrollment.id);
  }
};

watch(selectedStatus, async () => {
  await loadPayments();
});

onMounted(async () => {
  await Promise.all([loadPayments(), loadEnrollments(), ensureCoursesLoaded()]);
  pollHandle = window.setInterval(async () => {
    if (!auth.isAuthenticated || !auth.isTeacherLike || isSessionRedirecting()) {
      stopPolling();
      return;
    }
    try {
      await loadPayments();
      await loadEnrollments();
    } catch (error) {
      if (isAuthFailure(error)) {
        stopPolling();
        return;
      }
      console.error(error);
    }
  }, 5000);
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped>
.teacher-enrollments__table :deep(table) {
  min-width: calc(var(--sakai-space-12) * 11);
}

.teacher-enrollments__table--enrollments :deep(table) {
  min-width: calc(var(--sakai-space-12) * 12);
}

.teacher-enrollments__link {
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
  text-decoration: none;
}

.teacher-enrollments__link:hover {
  text-decoration: underline;
}

.teacher-enrollments__list {
  display: none;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.teacher-enrollments__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-enrollments__list--payments .teacher-enrollments__list-item {
  border-color: color-mix(in srgb, var(--sakai-warning) 25%, var(--sakai-border-color) 60%);
}

.teacher-enrollments__list-titles h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-enrollments__list-titles span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.teacher-enrollments__list-grid div {
  display: grid;
  gap: var(--sakai-space-1);
}

.teacher-enrollments__list-grid dt {
  font-size: 0.78rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
}

.teacher-enrollments__list-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-enrollments__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.teacher-enrollments__card :deep(.ui-table) {
  display: block;
  width: 100%;
  overflow-x: auto;
}

.teacher-enrollments__card :deep(.ui-table table) {
  min-width: calc(var(--sakai-space-12) * 12);
}

@media (max-width: 960px) {
  .teacher-enrollments {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .teacher-enrollments__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-enrollments__bulk {
    width: 100%;
    justify-content: space-between;
  }

  .teacher-enrollments__bulk-actions {
    width: 100%;
    justify-content: stretch;
  }

  .teacher-enrollments__bulk-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .teacher-enrollments__row-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .teacher-enrollments__course-select {
    max-width: none;
  }

  .teacher-enrollments__table {
    display: none;
  }

  .teacher-enrollments__list {
    display: grid;
  }
}
</style>
