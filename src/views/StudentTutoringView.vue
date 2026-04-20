<template>
  <ThemePage :title="t('tutoring.student.nav')" :subtitle="t('tutoring.student.availabilityTitle')">
    <template #meta>
      <div v-if="!tenantMissing" class="student-tutoring__summary">
        <UiStatCard
          color="info"
          icon="CalendarOutlined"
          :label="t('tutoring.student.summaryNextSession')"
          :value="nextSessionLabel"
          :secondary-stat="nextSessionDescription"
        />
        <UiStatCard
          color="warning"
          icon="ScheduleOutlined"
          :label="t('tutoring.student.summaryPendingActions')"
          :value="pendingActionsCount.toString()"
          :secondary-stat="pendingActionsDescription"
        />
        <UiStatCard
          color="success"
          icon="VideoCameraOutlined"
          :label="t('tutoring.student.summaryJoinReady')"
          :value="joinReadyCount.toString()"
          :secondary-stat="joinReadyDescription"
        />
      </div>
    </template>
    <div v-if="tenantMissing" class="student-tutoring__tenant-warning">
      <UiAlert color="warning" variant="soft">
        <div class="student-tutoring__tenant-warning-body">
          <p>{{ t('tutoring.student.tenantRequired') }}</p>
          <UiButton color="primary" variant="outline" @click="goToTenantSelection">
            {{ t('tutoring.student.tenantCta') }}
          </UiButton>
        </div>
      </UiAlert>
    </div>

    <template v-else>
      <section class="student-tutoring">
        <div class="student-tutoring__column student-tutoring__column--main">
          <UiCard :title="t('tutoring.student.availabilityTitle')" hover>
            <form class="student-tutoring__filters" @submit.prevent="applyAvailabilityFilters">
              <UiInput v-model="availabilityFilters.from" type="date" :label="t('tutoring.student.filterFrom')" />
              <UiInput v-model="availabilityFilters.to" type="date" :label="t('tutoring.student.filterTo')" />
              <UiSelect v-model="availabilityFilters.timeOfDay" :label="t('tutoring.student.filterTimeOfDay')">
                <option v-for="option in timeOfDayOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </UiSelect>
              <UiSelect v-model="availabilityFilters.priceRange" :label="t('tutoring.student.filterPriceRange')">
                <option v-for="option in priceRangeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </UiSelect>
              <UiInput
                v-model.number="availabilityFilters.size"
                type="number"
                min="1"
                max="50"
                :label="t('tutoring.student.filterPageSize')"
              />
              <div class="student-tutoring__filters-footer">
                <UiSegmentedControl
                  v-model="availabilityView"
                  :options="[
                    { label: t('tutoring.student.viewCards'), value: 'cards', icon: 'AppstoreOutlined' },
                    { label: t('tutoring.student.viewTable'), value: 'table', icon: 'OrderedListOutlined' }
                  ]"
                />
                <UiButton type="submit" color="primary">{{ t('common.apply') }}</UiButton>
              </div>
            </form>
            <p class="student-tutoring__filter-summary">{{ availabilitySummary }}</p>

          <template v-if="!filteredAvailability.length">
            <UiAlert color="info" variant="soft">{{ t('tutoring.student.noAvailability') }}</UiAlert>
          </template>
          <template v-else>
            <div v-if="availabilityView === 'cards'" class="student-tutoring__availability-grid" role="list">
              <article
                v-for="slot in filteredAvailability"
                :key="slot.id"
                class="student-tutoring__availability-card"
                role="listitem"
              >
                <header class="student-tutoring__availability-header">
                  <div class="student-tutoring__availability-times">
                    <strong>{{ formatTeacherTime(slot) }}</strong>
                    <span>{{ formatLocalTime(slot) }}</span>
                  </div>
                  <UiTag color="primary" size="sm">{{ slotCountdownLabel(slot) }}</UiTag>
                </header>
                <div class="student-tutoring__availability-meta">
                  <span>
                    <UiIcon name="HourglassOutlined" :size="16" />
                    {{ t('tutoring.teacher.durationLabel', { minutes: slot.durationMinutes }) }}
                  </span>
                  <span>
                    <UiIcon name="DollarOutlined" :size="16" />
                    {{ formatSlotRate(slot) }}
                  </span>
                </div>
                <footer class="student-tutoring__availability-actions">
                  <UiButton color="primary" prepend-icon="CalendarOutlined" @click="openBooking(slot)">
                    {{ t('tutoring.student.bookAction') }}
                  </UiButton>
                </footer>
              </article>
            </div>
            <UiTable
              v-if="availabilityView === 'table'"
              class="student-tutoring__table"
              :headers="availabilityHeaders"
              :items="filteredAvailability"
              density="comfortable"
            >
              <template #item.startAt="{ item }">
                <div class="student-tutoring__slot-meta">
                  <span>{{ formatTeacherTime(item) }}</span>
                  <small>{{ formatLocalTime(item) }}</small>
                </div>
              </template>
              <template #item.hourlyRate="{ item }">
                <span v-if="item.hourlyRate">{{ currency(item.hourlyRate) }}</span>
                <span v-else>—</span>
              </template>
              <template #item.actions="{ item }">
                <UiButton variant="link" color="primary" prepend-icon="CalendarOutlined" @click="openBooking(item)">
                  {{ t('tutoring.student.bookAction') }}
                </UiButton>
              </template>
            </UiTable>
            <div class="student-tutoring__pagination" v-if="store.studentAvailability.total > store.studentAvailability.size">
              <UiButton
                variant="link"
                color="secondary"
                :disabled="store.studentAvailability.page === 0"
                @click="changeAvailabilityPage(store.studentAvailability.page - 1)"
              >
                {{ t('common.previous') }}
              </UiButton>
              <span>{{ pageSummary(store.studentAvailability) }}</span>
              <UiButton
                variant="link"
                color="secondary"
                :disabled="(store.studentAvailability.page + 1) * store.studentAvailability.size >= store.studentAvailability.total"
                @click="changeAvailabilityPage(store.studentAvailability.page + 1)"
              >
                {{ t('common.next') }}
              </UiButton>
            </div>
          </template>
        </UiCard>

        <UiCard :title="t('tutoring.student.sessionsTitle')" hover>
          <template v-if="!store.studentSessions.items.length">
            <UiAlert color="info" variant="soft">{{ t('tutoring.student.noSessions') }}</UiAlert>
          </template>
          <template v-else>
            <div class="student-tutoring__sessions-grid" role="list">
              <article
                v-for="session in store.studentSessions.items"
                :key="session.id"
                class="student-tutoring__session-card"
                role="listitem"
              >
                <header class="student-tutoring__session-card-header">
                  <div class="student-tutoring__session-card-times">
                    <span class="student-tutoring__session-card-id">#{{ session.id }}</span>
                    <strong>{{ formatTeacherTime(session.slot) }}</strong>
                    <small>{{ formatLocalTime(session.slot) }}</small>
                  </div>
                  <UiTag :color="statusColor(session.status)" size="sm">
                    {{ t(`tutoring.status.${session.status}`) }}
                  </UiTag>
                </header>
                <div class="student-tutoring__session-card-meta">
                  <span>
                    <UiIcon name="ClockCircleOutlined" :size="16" />
                    {{ slotCountdownLabel(session.slot) }}
                  </span>
                  <span>
                    <UiIcon name="DollarOutlined" :size="16" />
                    {{ session.latestPayment ? formatPaymentAmount(session.latestPayment) : t('tutoring.student.paymentPendingShort') }}
                  </span>
                </div>
                <div class="student-tutoring__session-card-progress">
                  <UiTag :color="paymentStatusColor(session.latestPayment?.status || 'pending')" size="sm">
                    {{ session.latestPayment ? t(`tutoring.paymentStatus.${session.latestPayment.status}`) : t('tutoring.paymentStatus.pending') }}
                  </UiTag>
                </div>
                <footer class="student-tutoring__session-card-actions">
                  <UiButton color="primary" size="sm" prepend-icon="EyeOutlined" @click="openSession(session.id)">
                    {{ sessionActionLabel(session) }}
                  </UiButton>
                  <UiButton
                    v-if="session.canJoin && session.joinUrl"
                    variant="outline"
                    color="secondary"
                    size="sm"
                    append-icon="ExportOutlined"
                    :href="session.joinUrl"
                    target="_blank"
                  >
                    {{ t('tutoring.student.joinNow') }}
                  </UiButton>
                </footer>
              </article>
            </div>
            <UiTable class="student-tutoring__table" :headers="sessionHeaders" :items="store.studentSessions.items" density="comfortable">
              <template #item.id="{ item }">#{{ item.id }}</template>
              <template #item.slot="{ item }">
                <div class="student-tutoring__slot-meta">
                  <span>{{ formatTeacherTime(item.slot) }}</span>
                  <small>{{ formatLocalTime(item.slot) }}</small>
                </div>
              </template>
              <template #item.status="{ item }">
                <UiTag :color="statusColor(item.status)" size="sm">{{ t(`tutoring.status.${item.status}`) }}</UiTag>
              </template>
              <template #item.joinUrl="{ item }">
                <UiButton
                  v-if="item.canJoin && item.joinUrl"
                  variant="link"
                  color="primary"
                  size="sm"
                  append-icon="ExportOutlined"
                  :href="item.joinUrl"
                  target="_blank"
                >
                  {{ t('tutoring.student.joinNow') }}
                </UiButton>
                <span v-else>—</span>
              </template>
              <template #item.actions="{ item }">
                <UiButton variant="link" color="primary" prepend-icon="EyeOutlined" @click="openSession(item.id)">
                  {{ sessionActionLabel(item) }}
                </UiButton>
              </template>
            </UiTable>
            <div class="student-tutoring__pagination" v-if="store.studentSessions.total > store.studentSessions.size">
              <UiButton
                variant="link"
                color="secondary"
                :disabled="store.studentSessions.page === 0"
                @click="changeSessionPage(store.studentSessions.page - 1)"
              >
                {{ t('common.previous') }}
              </UiButton>
              <span>{{ pageSummary(store.studentSessions) }}</span>
              <UiButton
                variant="link"
                color="secondary"
                :disabled="(store.studentSessions.page + 1) * store.studentSessions.size >= store.studentSessions.total"
                @click="changeSessionPage(store.studentSessions.page + 1)"
              >
                {{ t('common.next') }}
              </UiButton>
            </div>
          </template>
        </UiCard>
      </div>

      <aside class="student-tutoring__column student-tutoring__column--side">
        <UiCard :title="t('tutoring.student.nextStepsTitle')" hover>
          <div class="student-tutoring__next-steps">
            <p>{{ t('tutoring.student.instructions') }}</p>
            <UiAlert color="info" variant="soft">{{ pendingActionsDescription }}</UiAlert>
            <UiAlert :color="hasJoinReady ? 'success' : 'warning'" variant="soft">{{ joinReadyDescription }}</UiAlert>
            <p class="student-tutoring__next-steps-reminder">{{ t('tutoring.student.reviewReminder') }}</p>
            <p class="student-tutoring__next-steps-hint">{{ availabilitySummary }}</p>
          </div>
        </UiCard>
      </aside>
    </section>

      <UiDialog v-model="bookingDialog" :title="t('tutoring.student.bookingDialogTitle')" width="640px">
        <template v-if="selectedSlot">
          <div class="student-tutoring__dialog-grid">
            <div class="student-tutoring__dialog-row">
              <strong>{{ t('tutoring.student.slotWindow') }}:</strong>
              <span>{{ formatTeacherTime(selectedSlot) }} · {{ formatLocalTime(selectedSlot) }}</span>
          </div>
          <UiTextarea v-model="bookingNotes" :label="t('tutoring.student.notesLabel')" :rows="3" />
        </div>
      </template>
      <template #footer>
        <div class="student-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="closeBookingDialog">{{ t('common.cancel') }}</UiButton>
          <UiButton color="primary" :disabled="formSubmitting" @click="confirmBooking">
            {{ t('tutoring.student.confirmBooking') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>

      <UiDialog v-model="sessionDialog" :title="sessionDialogTitle" width="840px">
        <template v-if="store.studentSelectedSession">
          <div class="student-tutoring__session">
            <div class="student-tutoring__session-header">
              <div class="student-tutoring__session-meta">
                <span class="student-tutoring__session-label">{{ store.studentSelectedSession.studentName }}</span>
              <span class="student-tutoring__session-email">{{ store.studentSelectedSession.studentEmail }}</span>
            </div>
            <UiTag :color="statusColor(store.studentSelectedSession.status)" size="sm">
              {{ t(`tutoring.status.${store.studentSelectedSession.status}`) }}
            </UiTag>
          </div>
          <div class="student-tutoring__session-row">
            <strong>{{ t('tutoring.student.slotWindow') }}</strong>
            <span>{{ formatTeacherTime(store.studentSelectedSession.slot) }} · {{ formatLocalTime(store.studentSelectedSession.slot) }}</span>
          </div>
          <div v-if="store.studentSelectedSession.canJoin && store.studentSelectedSession.joinUrl" class="student-tutoring__session-row">
            <strong>{{ t('tutoring.student.joinNow') }}</strong>
            <UiButton variant="outline" color="primary" append-icon="ExportOutlined" :href="store.studentSelectedSession.joinUrl" target="_blank">
              {{ store.studentSelectedSession.joinUrl }}
            </UiButton>
          </div>
          <div class="student-tutoring__timeline" role="list">
            <div
              v-for="step in sessionTimeline"
              :key="step.key"
              class="student-tutoring__timeline-step"
              :class="{ 'student-tutoring__timeline-step--done': step.completed }"
              role="listitem"
            >
              <span class="student-tutoring__timeline-marker" />
              <span class="student-tutoring__timeline-label">{{ step.label }}</span>
            </div>
          </div>
          <UiTextarea v-model="studentNotes" :label="t('tutoring.student.notesLabel')" :rows="3" @blur="saveStudentNotes" />
          <div class="student-tutoring__session-actions" v-if="store.studentSelectedSession.status === 'pending' || store.studentSelectedSession.status === 'confirmed'">
            <UiButton color="danger" variant="outline" @click="openCancelDialog">{{ t('tutoring.student.cancelSession') }}</UiButton>
          </div>
          <div class="student-tutoring__session-section">
            <span class="student-tutoring__session-heading">{{ t('tutoring.student.paymentStatusTitle') }}</span>
            <div class="student-tutoring__session-status">
              <UiTag :color="paymentStatusColor(store.studentSelectedSession.latestPayment?.status || 'pending')" size="sm">
                {{ store.studentSelectedSession.latestPayment ? t(`tutoring.paymentStatus.${store.studentSelectedSession.latestPayment.status}`) : t('tutoring.paymentStatus.pending') }}
              </UiTag>
            </div>
            <div v-if="selectedPayment" class="student-tutoring__payment-details">
              <div class="student-tutoring__payment-detail">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.amountLabel') }}</span>
                <span class="student-tutoring__payment-value">{{ formatPaymentAmount(selectedPayment) }}</span>
              </div>
              <div class="student-tutoring__payment-detail">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.methodLabel') }}</span>
                <span class="student-tutoring__payment-value">{{ paymentMethodLabel(selectedPayment.method) }}</span>
              </div>
              <div class="student-tutoring__payment-detail">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.submittedAtLabel') }}</span>
                <span class="student-tutoring__payment-value">{{ formatPaymentTimestamp(selectedPayment.submittedAt) }}</span>
              </div>
              <div v-if="selectedPayment.reviewedAt" class="student-tutoring__payment-detail">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.reviewedAtLabel') }}</span>
                <span class="student-tutoring__payment-value">{{ formatPaymentTimestamp(selectedPayment.reviewedAt) }}</span>
              </div>
              <div v-if="selectedPayment.notes" class="student-tutoring__payment-detail student-tutoring__payment-detail--notes">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.paymentNotes') }}</span>
                <span class="student-tutoring__payment-value">{{ selectedPayment.notes }}</span>
              </div>
              <div v-if="selectedPayment.proofUrl" class="student-tutoring__payment-detail">
                <span class="student-tutoring__payment-label">{{ t('tutoring.student.proofLabel') }}</span>
                <UiButton
                  variant="link"
                  color="primary"
                  size="sm"
                  append-icon="ExportOutlined"
                  :href="selectedPayment.proofUrl"
                  target="_blank"
                >
                  {{ t('tutoring.student.viewPaymentProof') }}
                </UiButton>
              </div>
            </div>
            <UiAlert v-else color="info" variant="soft">{{ t('tutoring.student.noPaymentDetails') }}</UiAlert>
            <div class="student-tutoring__payment-methods">
              <span class="student-tutoring__session-subheading">{{ t('tutoring.student.paymentMethodsTitle') }}</span>
              <p class="student-tutoring__payment-description">{{ t('tutoring.student.paymentMethodsInfo') }}</p>
              <ul class="student-tutoring__payment-list">
                <li v-for="method in methods" :key="method.value">{{ method.label }}</li>
              </ul>
            </div>
            <div class="student-tutoring__manual-accounts">
              <div class="student-tutoring__manual-accounts-header">
                <span class="student-tutoring__session-subheading">{{ t('tutoring.student.checkoutPaymentAccountsTitle') }}</span>
                <p class="student-tutoring__manual-accounts-description">
                  {{ t('tutoring.student.checkoutPaymentAccountsDescription') }}
                </p>
              </div>
              <div v-if="paymentAccounts.length" class="student-tutoring__manual-accounts-grid" role="list">
                <article
                  v-for="account in paymentAccounts"
                  :key="account.id"
                  class="student-tutoring__manual-account"
                  role="listitem"
                >
                  <header class="student-tutoring__manual-account-header">
                    <UiIcon :name="account.icon" :size="20" aria-hidden="true" />
                    <span class="student-tutoring__manual-account-title">{{ account.title }}</span>
                  </header>
                  <ul class="student-tutoring__manual-account-details">
                    <li v-for="detail in account.details" :key="detail">{{ detail }}</li>
                  </ul>
                </article>
              </div>
              <UiAlert v-else color="info" variant="soft">{{ t('tutoring.student.checkoutPaymentAccountsEmpty') }}</UiAlert>
            </div>
            <form class="student-tutoring__form" @submit.prevent="submitPayment">
              <UiInput :model-value="paymentForm.amount" type="number" min="0" step="0.5" :label="t('tutoring.student.amountLabel')" @update:model-value="onAmountChange" />
              <UiSelect :model-value="paymentForm.method" :label="t('tutoring.student.methodLabel')" @update:model-value="onMethodChange">
                <option v-for="method in methods" :key="method.value" :value="method.value">{{ method.label }}</option>
              </UiSelect>
              <UiFileUpload v-model="selectedProof" :label="t('tutoring.student.proofLabel')" accept="image/*,.pdf" :disabled="proofUploading" @change="onProofChange" @remove="onProofRemoved" />
              <UiTag v-if="paymentForm.proofUrl" color="success" size="sm" pill>{{ t('tutoring.student.proofReady') }}</UiTag>
              <UiTextarea v-model="paymentForm.notes" :label="t('tutoring.student.paymentNotes')" :rows="3" />
              <div class="student-tutoring__dialog-actions">
                <UiButton button-type="submit" color="primary" :disabled="formSubmitting">
                  {{ t('tutoring.student.submitPayment') }}
                </UiButton>
              </div>
            </form>
          </div>
          <div class="student-tutoring__session-section">
            <span class="student-tutoring__session-heading">{{ t('tutoring.student.reviewRating') }}</span>
            <div class="student-tutoring__review">
              <UiSlider v-model="studentReview.rating" :min="1" :max="5" :step="1" color="warning" :label="t('tutoring.student.reviewRating')" :format="(value) => `${value}/5`" />
              <UiTextarea v-model="studentReview.comment" :label="t('tutoring.student.reviewComment')" :rows="3" />
              <div class="student-tutoring__dialog-actions">
                <UiButton variant="outline" color="secondary" @click="submitReview">{{ t('tutoring.student.submitReview') }}</UiButton>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="student-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="closeSessionDialog">{{ t('common.close') }}</UiButton>
        </div>
      </template>
    </UiDialog>

      <UiDialog v-model="cancelDialog" :title="t('tutoring.student.cancelDialogTitle')" width="420px">
        <form class="student-tutoring__form" @submit.prevent="confirmCancel">
          <UiTextarea v-model="cancelForm.reason" :label="t('tutoring.student.cancelReason')" :rows="3" />
          <div class="student-tutoring__dialog-actions">
            <UiButton variant="link" color="secondary" @click="cancelDialog = false">{{ t('common.cancel') }}</UiButton>
            <UiButton button-type="submit" color="danger" :disabled="formSubmitting">{{ t('tutoring.student.cancelSession') }}</UiButton>
          </div>
        </form>
      </UiDialog>
    </template>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTutoringStore } from '@/stores/tutoring';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { getStoredTenantSlug } from '@/utils/tenantStorage';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import UiCard from '@/components/ui/UiCard.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiSlider from '@/components/ui/UiSlider.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiSegmentedControl from '@/components/ui/UiSegmentedControl.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import ThemePage from '@/layout/theme/ThemePage.vue';
import type {
  AvailabilitySlot,
  ManualPaymentMethod,
  ManualPaymentStatus,
  TutoringPayment,
  TutoringSession
} from '@/services/tutoring';
import {
  getStudentManualPaymentOptions,
  type ManualPaymentMethodDetails,
  type StudentManualPaymentOptions
} from '@/services/student';

const { t, tm, locale } = useI18n();
const toast = useToast();
const store = useTutoringStore();
const auth = useAuthStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const router = useRouter();

const availabilityFilters = reactive({ from: '', to: '', size: 10, page: 0, timeOfDay: 'any', priceRange: 'any' });
const sessionFilters = reactive({ page: 0 });
const availabilityView = ref<'cards' | 'table'>('cards');
const bookingDialog = ref(false);
const sessionDialog = ref(false);
const cancelDialog = ref(false);
const selectedSlot = ref<AvailabilitySlot | null>(null);
const bookingNotes = ref('');
const studentNotes = ref('');
const formSubmitting = ref(false);
const proofUploading = ref(false);
const selectedProof = ref<File[]>([]);
const cancelForm = reactive({ reason: '' });
const tenantMissing = ref(false);

const manualOptions = ref<StudentManualPaymentOptions | null>(null);
const manualOptionsLoaded = ref(false);

interface PaymentAccount {
  id: string;
  icon: string;
  title: string;
  details: string[];
}

const loadManualOptions = async () => {
  manualOptionsLoaded.value = false;
  try {
    manualOptions.value = await getStudentManualPaymentOptions();
  } catch (error) {
    console.error('[tutoring] failed to load manual payment options', error);
    manualOptions.value = null;
  } finally {
    manualOptionsLoaded.value = true;
  }
};

let skipNextTenantReload = false;

const paymentForm = reactive({ amount: 0, method: 'bank' as ManualPaymentMethod, proofUrl: '', proofKey: '', notes: '' });
const studentReview = reactive({ rating: 5, comment: '' });

const methods = computed(() => [
  { value: 'bank', label: t('tutoring.paymentMethod.bank') },
  { value: 'cash', label: t('tutoring.paymentMethod.cash') },
  { value: 'transfer', label: t('tutoring.paymentMethod.transfer') },
  { value: 'other', label: t('tutoring.paymentMethod.other') }
]);

const resolveAccountDetails = (key: string): string[] => {
  const localized = tm(key);
  return Array.isArray(localized) ? (localized as string[]) : [];
};

const fallbackAccounts = computed<PaymentAccount[]>(() => [
  {
    id: 'bank',
    icon: 'BankOutlined',
    title: t('tutoring.student.checkoutPaymentAccounts.bank.title'),
    details: resolveAccountDetails('tutoring.student.checkoutPaymentAccounts.bank.details')
  },
  {
    id: 'vodafone',
    icon: 'MobileOutlined',
    title: t('tutoring.student.checkoutPaymentAccounts.vodafone.title'),
    details: resolveAccountDetails('tutoring.student.checkoutPaymentAccounts.vodafone.details')
  },
  {
    id: 'instapay',
    icon: 'SwapOutlined',
    title: t('tutoring.student.checkoutPaymentAccounts.instapay.title'),
    details: resolveAccountDetails('tutoring.student.checkoutPaymentAccounts.instapay.details')
  }
]);

const pickInstruction = (
  source: { instructionsAr?: string | null; instructionsEn?: string | null } | null | undefined,
  language: 'ar' | 'en'
): string => {
  if (!source) {
    return '';
  }
  const primary = language === 'ar' ? source.instructionsAr : source.instructionsEn;
  if (primary && primary.trim()) {
    return primary.trim();
  }
  const fallback = language === 'ar' ? source.instructionsEn : source.instructionsAr;
  return fallback?.trim() ?? '';
};

const buildAccountDetails = (
  details: ManualPaymentMethodDetails | null | undefined,
  language: 'ar' | 'en'
): string[] => {
  if (!details?.enabled) {
    return [];
  }
  const entries: string[] = [];
  const holder = details.accountHolderName?.trim();
  const bankName = details.bankName?.trim();
  const accountNumber = details.accountNumber?.trim();
  const iban = details.iban?.trim();
  const bankDetails = details.bankDetails?.trim();
  if (holder) {
    entries.push(`${t('student.paymentAccountHolder')}: ${holder}`);
  }
  if (bankName) {
    entries.push(`${t('student.paymentBankName')}: ${bankName}`);
  }
  if (accountNumber) {
    entries.push(`${t('student.paymentAccountNumber')}: ${accountNumber}`);
  }
  if (iban) {
    entries.push(`${t('student.paymentIban')}: ${iban}`);
  }
  if (bankDetails) {
    entries.push(`${t('student.paymentBankDetails')}: ${bankDetails}`);
  }
  const instructions = pickInstruction(details, language);
  if (instructions) {
    entries.push(instructions);
  }
  return entries;
};

const paymentAccounts = computed<PaymentAccount[]>(() => {
  if (!manualOptionsLoaded.value) {
    return fallbackAccounts.value;
  }
  const options = manualOptions.value;
  if (!options) {
    return [];
  }
  const language = locale.value.startsWith('ar') ? 'ar' : 'en';
  const accounts: PaymentAccount[] = [];

  const bankDetails = buildAccountDetails(options.bankTransfer ?? null, language);
  if (bankDetails.length) {
    accounts.push({
      id: 'bank',
      icon: 'BankOutlined',
      title: t('tutoring.student.checkoutPaymentAccounts.bank.title'),
      details: bankDetails
    });
  }

  const vodafoneDetails = buildAccountDetails(options.vodafoneCash ?? null, language);
  if (vodafoneDetails.length) {
    accounts.push({
      id: 'vodafone',
      icon: 'MobileOutlined',
      title: t('tutoring.student.checkoutPaymentAccounts.vodafone.title'),
      details: vodafoneDetails
    });
  }

  const instapayDetails = buildAccountDetails(options.instaPay ?? null, language);
  if (instapayDetails.length) {
    accounts.push({
      id: 'instapay',
      icon: 'SwapOutlined',
      title: t('tutoring.student.checkoutPaymentAccounts.instapay.title'),
      details: instapayDetails
    });
  }

  return accounts;
});

const timeOfDayOptions = computed(() => [
  { value: 'any', label: t('tutoring.student.filterTimeAny') },
  { value: 'morning', label: t('tutoring.student.filterTimeMorning') },
  { value: 'afternoon', label: t('tutoring.student.filterTimeAfternoon') },
  { value: 'evening', label: t('tutoring.student.filterTimeEvening') }
]);

const priceRangeOptions = computed(() => [
  { value: 'any', label: t('tutoring.student.filterPriceAny') },
  { value: 'lt50', label: t('tutoring.student.filterPriceLow') },
  { value: '50-100', label: t('tutoring.student.filterPriceMid') },
  { value: 'gt100', label: t('tutoring.student.filterPriceHigh') }
]);

const availabilityHeaders = computed(() => [
  { title: t('tutoring.teacher.slotStart'), key: 'startAt' },
  { title: t('tutoring.teacher.hourlyRate'), key: 'hourlyRate' },
  { title: t('common.actions'), key: 'actions', sortable: false }
]);

const sessionHeaders = computed(() => [
  { title: t('tutoring.student.sessionId'), key: 'id' },
  { title: t('tutoring.student.slotHeader'), key: 'slot' },
  { title: t('tutoring.student.statusHeader'), key: 'status' },
  { title: t('tutoring.student.joinColumn'), key: 'joinUrl' },
  { title: t('common.actions'), key: 'actions', sortable: false }
]);

const hasJoinReady = computed(() => joinReadyCount.value > 0);

const sessionDialogTitle = computed(() =>
  store.studentSelectedSession
    ? t('tutoring.student.sessionDetailTitle', { id: store.studentSelectedSession.id })
    : t('tutoring.student.sessionsTitle')
);

const selectedPayment = computed(() => store.studentSelectedSession?.latestPayment ?? null);

const multiTeacherEnabled = computed(() => featuresStore.hasFeature(FEATURE.multiTeacherStudent));

const statusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
};

const paymentStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'warning';
  }
};

const currency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);

const normalizeManualStatus = (status?: ManualPaymentStatus | null) =>
  status ? String(status).toLowerCase() : '';

const isPaymentApproved = (status?: ManualPaymentStatus | null) => {
  const normalized = normalizeManualStatus(status);
  return normalized === 'approved' || normalized === 'success';
};

const sessionActionLabel = (session: TutoringSession) =>
  isPaymentApproved(session.latestPayment?.status)
    ? t('tutoring.student.reviewAction')
    : t('tutoring.student.payNowAction');

const formatPaymentAmount = (payment: TutoringPayment) => {
  const currencyCode = payment.currency && payment.currency.length === 3 ? payment.currency : 'USD';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(payment.amount);
};

const formatPaymentTimestamp = (value?: string) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—';

const paymentMethodLabel = (method: ManualPaymentMethod) =>
  methods.value.find((option) => option.value === method)?.label || method;

const formatTeacherTime = (slot: AvailabilitySlot | TutoringSession['slot']) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: slot.timeZone
  }).format(new Date(slot.startAt));

const formatLocalTime = (slot: AvailabilitySlot | TutoringSession['slot']) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(slot.startAt));

const pageSummary = (state: { page: number; size: number; total: number }) => {
  const start = state.page * state.size + 1;
  const end = Math.min((state.page + 1) * state.size, state.total);
  return t('tutoring.student.pageSummary', { start, end, total: state.total });
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const toRelativeTime = (target: Date) => {
  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ];

  let duration = (target.getTime() - Date.now()) / 1000;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeTimeFormatter.format(Math.round(duration), 'year');
};

const slotTimeOfDay = (slot: AvailabilitySlot) => {
  const date = new Date(slot.startAt);
  if (!Number.isFinite(date.getTime())) {
    return 'any';
  }
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const slotMatchesTimeOfDay = (slot: AvailabilitySlot) => {
  if (availabilityFilters.timeOfDay === 'any') {
    return true;
  }
  return slotTimeOfDay(slot) === availabilityFilters.timeOfDay;
};

const slotMatchesPriceRange = (slot: AvailabilitySlot) => {
  if (availabilityFilters.priceRange === 'any') {
    return true;
  }
  const rate = slot.hourlyRate;
  if (rate == null) {
    return false;
  }
  switch (availabilityFilters.priceRange) {
    case 'lt50':
      return rate <= 50;
    case '50-100':
      return rate > 50 && rate <= 100;
    case 'gt100':
      return rate > 100;
    default:
      return true;
  }
};

const formatSlotRate = (slot: AvailabilitySlot) => {
  if (slot.hourlyRate == null) {
    return t('tutoring.teacher.rateUnset');
  }
  const currencyCode = slot.currency && slot.currency.length === 3 ? slot.currency : 'USD';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(slot.hourlyRate);
};

const slotCountdownLabel = (slot: AvailabilitySlot | TutoringSession['slot']) => {
  const date = new Date(slot.startAt);
  if (!Number.isFinite(date.getTime())) {
    return t('tutoring.student.countdownUnavailable');
  }
  return toRelativeTime(date);
};

const filteredAvailability = computed(() =>
  store.studentAvailability.items.filter((slot) => slotMatchesTimeOfDay(slot) && slotMatchesPriceRange(slot))
);

const hasActiveAvailabilityFilters = computed(
  () => availabilityFilters.timeOfDay !== 'any' || availabilityFilters.priceRange !== 'any'
);

const availableSlotsCount = computed(() => filteredAvailability.value.length);

const availabilitySummary = computed(() => {
  if (!store.studentAvailability.total && !availableSlotsCount.value) {
    return t('tutoring.student.summaryAvailabilityEmpty');
  }
  if (hasActiveAvailabilityFilters.value) {
    return t('tutoring.student.summaryAvailabilityFiltered', { count: availableSlotsCount.value });
  }
  return t('tutoring.student.summaryAvailabilityHint', {
    total: store.studentAvailability.total || availableSlotsCount.value
  });
});

const upcomingSessions = computed(() =>
  store.studentSessions.items
    .filter((session) => session.slot?.startAt && session.status !== 'cancelled')
    .sort((a, b) => new Date(a.slot.startAt).getTime() - new Date(b.slot.startAt).getTime())
);

const nextStudentSession = computed(() => upcomingSessions.value[0] ?? null);

const nextSessionLabel = computed(() => {
  if (!nextStudentSession.value) {
    return t('tutoring.student.summaryNoUpcoming');
  }
  return formatLocalTime(nextStudentSession.value.slot);
});

const nextSessionDescription = computed(() => {
  const session = nextStudentSession.value;
  if (!session?.slot?.startAt) {
    return t('tutoring.student.summaryNoUpcomingHint');
  }
  const date = new Date(session.slot.startAt);
  if (!Number.isFinite(date.getTime())) {
    return t('tutoring.student.summaryNoUpcomingHint');
  }
  return t('tutoring.student.summaryStartsIn', { relative: toRelativeTime(date) });
});

const pendingActionsCount = computed(() =>
  store.studentSessions.items.filter((session) => {
    if (session.status === 'cancelled') {
      return false;
    }
    if (!isPaymentApproved(session.latestPayment?.status)) {
      return true;
    }
    return session.status === 'pending';
  }).length
);

const pendingActionsDescription = computed(() => {
  if (pendingActionsCount.value === 0) {
    return t('tutoring.student.summaryPendingEmpty');
  }
  return t('tutoring.student.summaryPendingHint', { count: pendingActionsCount.value });
});

const joinReadyCount = computed(() => store.studentSessions.items.filter((session) => session.canJoin).length);

const joinReadyDescription = computed(() => {
  if (joinReadyCount.value === 0) {
    return t('tutoring.student.summaryJoinEmpty');
  }
  return t('tutoring.student.summaryJoinHint', { count: joinReadyCount.value });
});

const sessionTimeline = computed(() => {
  const session = store.studentSelectedSession;
  if (!session) {
    return [] as { key: string; label: string; completed: boolean }[];
  }
  const paymentSubmitted = Boolean(session.latestPayment);
  const paymentApproved = isPaymentApproved(session.latestPayment?.status);
  const reviewSubmitted = Boolean(session.studentNotes && session.studentNotes.trim().length > 0);

  return [
    { key: 'booked', label: t('tutoring.student.timelineBooked'), completed: true },
    { key: 'payment', label: t('tutoring.student.timelinePayment'), completed: paymentSubmitted },
    {
      key: 'approved',
      label: t('tutoring.student.timelineApproved'),
      completed: paymentApproved || session.status === 'confirmed' || session.status === 'completed'
    },
    { key: 'completed', label: t('tutoring.student.timelineCompleted'), completed: session.status === 'completed' },
    { key: 'review', label: t('tutoring.student.timelineReview'), completed: reviewSubmitted }
  ];
});

const goToTenantSelection = () => {
  router.push({ name: 'student-dashboard' });
};

const ensureTenantContext = async () => {
  tenantMissing.value = false;
  if (!auth.isStudent) {
    return true;
  }

  try {
    if (!tenantStore.branding) {
      await tenantStore.fetchBranding();
    }
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.initialLoadFailed') });
    return false;
  }

  if (!multiTeacherEnabled.value) {
    return true;
  }

  const storedTenant = getStoredTenantSlug().normalized;
  if (storedTenant) {
    try {
      skipNextTenantReload = true;
      await auth.setTenantContext({ teacherSlug: storedTenant });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ detail: t('tutoring.student.initialLoadFailed') });
      return false;
    }
  }

  tenantMissing.value = true;
  return false;
};

const loadInitialData = async () => {
  try {
    await Promise.all([
      store.loadStudentAvailability({ size: availabilityFilters.size, page: availabilityFilters.page }),
      store.loadStudentSessions({ page: sessionFilters.page })
    ]);
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.initialLoadFailed') });
  }
};

const applyAvailabilityFilters = async () => {
  try {
    await store.loadStudentAvailability({
      from: availabilityFilters.from || undefined,
      to: availabilityFilters.to || undefined,
      size: availabilityFilters.size,
      page: availabilityFilters.page
    });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.availabilityLoadFailed') });
  }
};

const changeAvailabilityPage = (page: number) => {
  availabilityFilters.page = Math.max(page, 0);
  applyAvailabilityFilters();
};

const applySessionFilters = async () => {
  try {
    await store.loadStudentSessions({ page: sessionFilters.page });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.sessionsLoadFailed') });
  }
};

watch(
  () => [availabilityFilters.timeOfDay, availabilityFilters.priceRange],
  () => {
    availabilityFilters.page = 0;
  }
);

const changeSessionPage = (page: number) => {
  sessionFilters.page = Math.max(page, 0);
  applySessionFilters();
};

const openBooking = (slot: AvailabilitySlot) => {
  selectedSlot.value = slot;
  bookingNotes.value = '';
  paymentForm.amount = slot.hourlyRate ?? 0;
  bookingDialog.value = true;
};

const closeBookingDialog = () => {
  bookingDialog.value = false;
};

const confirmBooking = async () => {
  if (!selectedSlot.value) return;
  formSubmitting.value = true;
  try {
    await store.bookSession({ slotId: selectedSlot.value.id, notes: bookingNotes.value || undefined });
    toast.success({ detail: t('tutoring.student.bookingConfirmed') });
    bookingDialog.value = false;
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.bookingFailed') });
  } finally {
    formSubmitting.value = false;
  }
};

const openSession = async (sessionId: number) => {
  formSubmitting.value = true;
  try {
    const session = await store.loadStudentSession(sessionId);
    if (session) {
      studentNotes.value = session.studentNotes || '';
      paymentForm.amount = session.latestPayment?.amount || 0;
      paymentForm.method = session.latestPayment?.method || 'bank';
      paymentForm.notes = '';
      paymentForm.proofKey = '';
      paymentForm.proofUrl = '';
      studentReview.rating = 5;
      studentReview.comment = '';
      sessionDialog.value = true;
    }
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.sessionLoadFailed') });
  } finally {
    formSubmitting.value = false;
  }
};

const closeSessionDialog = () => {
  sessionDialog.value = false;
};

const saveStudentNotes = async () => {
  if (!store.studentSelectedSession) return;
  try {
    await store.saveStudentNotes(store.studentSelectedSession.id, studentNotes.value);
    toast.success({ detail: t('tutoring.student.notesSaved') });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.notesFailed') });
  }
};

const onAmountChange = (value: string | number | boolean) => {
  paymentForm.amount = Number(value) || 0;
};

const onMethodChange = (value: string | number | boolean) => {
  paymentForm.method = String(value) as ManualPaymentMethod;
};

const onProofChange = async (files: File[]) => {
  if (!files.length) return;
  proofUploading.value = true;
  try {
    const result = await store.uploadProof(files[0]);
    if (result) {
      paymentForm.proofUrl = result.url;
      paymentForm.proofKey = result.key;
      toast.success({ detail: t('tutoring.student.proofUploaded') });
    }
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.proofFailed') });
  } finally {
    proofUploading.value = false;
  }
};

const onProofRemoved = () => {
  selectedProof.value = [];
  paymentForm.proofKey = '';
  paymentForm.proofUrl = '';
};

const submitPayment = async () => {
  if (!store.studentSelectedSession) return;
  formSubmitting.value = true;
  try {
    await store.submitPayment(store.studentSelectedSession.id, {
      amount: paymentForm.amount,
      method: paymentForm.method,
      proofUrl: paymentForm.proofUrl || undefined,
      proofKey: paymentForm.proofKey || undefined,
      notes: paymentForm.notes || undefined
    });
    toast.success({ detail: t('tutoring.student.paymentSubmitted') });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.paymentFailed') });
  } finally {
    formSubmitting.value = false;
  }
};

const submitReview = async () => {
  if (!store.studentSelectedSession) return;
  try {
    await store.leaveStudentReview(store.studentSelectedSession.id, {
      rating: studentReview.rating,
      comment: studentReview.comment || undefined
    });
    toast.success({ detail: t('tutoring.student.reviewSubmitted') });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.reviewFailed') });
  }
};

const openCancelDialog = () => {
  cancelForm.reason = '';
  cancelDialog.value = true;
};

const confirmCancel = async () => {
  if (!store.studentSelectedSession) return;
  formSubmitting.value = true;
  try {
    await store.cancelStudentBooking(store.studentSelectedSession.id, { reason: cancelForm.reason || undefined });
    cancelDialog.value = false;
    sessionDialog.value = false;
    toast.warning({ detail: t('tutoring.student.sessionCancelled') });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.sessionCancelFailed') });
  } finally {
    formSubmitting.value = false;
  }
};

watch(
  () => store.studentSelectedSession,
  (session) => {
    if (session) {
      paymentForm.amount = session.latestPayment?.amount || paymentForm.amount;
      paymentForm.method = session.latestPayment?.method || paymentForm.method;
    }
  }
);

onMounted(async () => {
  const hasTenant = await ensureTenantContext();
  if (!hasTenant) {
    return;
  }
  await loadManualOptions();
  await loadInitialData();
});

watch(
  () => auth.teacherId,
  async (teacherId) => {
    if (!auth.isStudent || !multiTeacherEnabled.value) {
      return;
    }

    if (teacherId == null) {
      tenantMissing.value = true;
      return;
    }

    tenantMissing.value = false;
    if (skipNextTenantReload) {
      skipNextTenantReload = false;
      return;
    }

    await loadManualOptions();
    await loadInitialData();
  }
);
</script>

<style scoped>
.student-tutoring__tenant-warning {
  display: grid;
  gap: var(--sakai-space-4);
  max-width: 640px;
}

.student-tutoring__tenant-warning-body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.student-tutoring {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: 1fr;
}

.student-tutoring__summary {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.student-tutoring__column {
  display: grid;
  gap: var(--sakai-space-5);
}

.student-tutoring__filters {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: var(--sakai-space-4);
  align-items: end;
}

.student-tutoring__filters-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.student-tutoring__filters-footer :deep(.ui-segmented-control) {
  flex: 1 1 auto;
}

.student-tutoring__filter-summary {
  margin: var(--sakai-space-2) 0 var(--sakai-space-4);
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__table :deep(table tbody tr td:last-child) {
  width: 1%;
  white-space: nowrap;
}

.student-tutoring__table {
  margin-top: var(--sakai-space-4);
}

.student-tutoring__slot-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__availability-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-top: var(--sakai-space-4);
}

.student-tutoring__availability-card {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 20%, var(--sakai-border-color) 60%);
  box-shadow: 0 16px 28px color-mix(in srgb, var(--sakai-primary) 12%, rgba(0, 0, 0, 0.16));
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.student-tutoring__availability-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 38px color-mix(in srgb, var(--sakai-primary) 18%, rgba(0, 0, 0, 0.16));
}

.student-tutoring__availability-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.student-tutoring__availability-times {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__availability-times strong {
  font-size: 1rem;
}

.student-tutoring__availability-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__availability-meta span {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.student-tutoring__availability-actions {
  display: flex;
  justify-content: flex-end;
}

.student-tutoring__next-steps {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-tutoring__next-steps-reminder {
  font-weight: var(--sakai-font-weight-medium);
  margin: 0;
}

.student-tutoring__next-steps-hint {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__sessions-grid {
  display: grid;
  gap: var(--sakai-space-4);
  margin-bottom: var(--sakai-space-4);
}

.student-tutoring__session-card {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-secondary) 24%, var(--sakai-border-color) 55%);
  box-shadow: 0 18px 32px color-mix(in srgb, var(--sakai-secondary) 12%, rgba(0, 0, 0, 0.16));
}

.student-tutoring__session-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.student-tutoring__session-card-times {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__session-card-id {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__session-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__session-card-meta span {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.student-tutoring__session-card-progress {
  display: flex;
  justify-content: flex-end;
}

.student-tutoring__session-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
}

.student-tutoring__session-card-actions :deep(.ui-button) {
  min-width: 140px;
}

.student-tutoring__dialog-grid {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-tutoring__dialog-row {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.student-tutoring__session {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-tutoring__session-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-4);
}

.student-tutoring__session-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__session-label {
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.student-tutoring__session-email {
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__session-row {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tutoring__session-heading {
  font-weight: var(--sakai-font-weight-semibold);
}

.student-tutoring__session-status {
  display: flex;
  gap: var(--sakai-space-2);
}

.student-tutoring__payment-details {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-radius-md);
  background-color: var(--sakai-surface-2);
}

.student-tutoring__payment-detail {
  display: flex;
  gap: var(--sakai-space-2);
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.student-tutoring__payment-detail--notes {
  flex-direction: column;
  align-items: flex-start;
}

.student-tutoring__payment-label {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__payment-value {
  color: var(--sakai-text-color-primary);
  word-break: break-word;
}

.student-tutoring__payment-methods {
  display: grid;
  gap: var(--sakai-space-2);
  margin-top: var(--sakai-space-4);
}

.student-tutoring__manual-accounts {
  display: grid;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.student-tutoring__manual-accounts-header {
  display: grid;
  gap: var(--sakai-space-1);
}

.student-tutoring__manual-accounts-description {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__manual-accounts-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-tutoring__manual-account {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-secondary) 18%, var(--sakai-border-color) 55%);
  background: color-mix(in srgb, var(--sakai-surface-card) 80%, transparent);
}

.student-tutoring__manual-account-header {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.student-tutoring__manual-account-title {
  font-size: 0.95rem;
}

.student-tutoring__manual-account-details {
  margin: 0;
  padding-inline-start: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-1);
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.student-tutoring__session-subheading {
  font-weight: var(--sakai-font-weight-medium);
}

.student-tutoring__payment-description {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__payment-list {
  margin: 0;
  padding-left: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-1);
}

.student-tutoring__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-tutoring__review {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-tutoring__timeline {
  display: grid;
  gap: var(--sakai-space-2);
  padding-block: var(--sakai-space-2);
}

.student-tutoring__timeline-step {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color-tertiary);
}

.student-tutoring__timeline-step--done {
  color: var(--sakai-success);
}

.student-tutoring__timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
}

.student-tutoring__timeline-label {
  font-size: 0.85rem;
}

.student-tutoring__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--sakai-space-3);
}

@media (max-width: 720px) {
  .student-tutoring__filters {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .student-tutoring__filters-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .student-tutoring__filters-footer :deep(.ui-segmented-control) {
    width: 100%;
  }

  .student-tutoring__availability-grid,
  .student-tutoring__sessions-grid {
    grid-template-columns: 1fr;
  }

  .student-tutoring__session-card-actions {
    justify-content: stretch;
  }

  .student-tutoring__session-card-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }
}

@media (min-width: 960px) {
  .student-tutoring {
    grid-template-columns: 2fr 1fr;
  }

  .student-tutoring__column--side {
    align-self: flex-start;
  }
}
</style>