<template>
  <div class="tutoring-checkout-panel">
    <section class="tutoring-checkout-panel__section" aria-labelledby="tutoring-summary-heading">
      <header class="tutoring-checkout-panel__header">
        <h3 id="tutoring-summary-heading">{{ t('tutoring.student.checkoutSummaryTitle') }}</h3>
        <p>{{ t('tutoring.student.checkoutSummaryDescription') }}</p>
      </header>

      <div class="tutoring-checkout-panel__summary-grid">
        <div class="tutoring-checkout-panel__summary-item">
          <span class="tutoring-checkout-panel__summary-label">{{ t('tutoring.student.sessionId') }}</span>
          <span class="tutoring-checkout-panel__summary-value">#{{ session.id }}</span>
        </div>
        <div class="tutoring-checkout-panel__summary-item">
          <span class="tutoring-checkout-panel__summary-label">{{ t('tutoring.student.statusHeader') }}</span>
          <UiTag :color="statusColor(session.status)" size="sm">{{ t(`tutoring.status.${session.status}`) }}</UiTag>
        </div>
        <div class="tutoring-checkout-panel__summary-item">
          <span class="tutoring-checkout-panel__summary-label">{{ t('tutoring.student.slotWindow') }}</span>
          <span class="tutoring-checkout-panel__summary-value">{{ formatTeacherTime(session.slot) }}</span>
          <small class="tutoring-checkout-panel__summary-hint">{{ formatLocalTime(session.slot) }}</small>
        </div>
        <div class="tutoring-checkout-panel__summary-item">
          <span class="tutoring-checkout-panel__summary-label">{{ t('tutoring.teacher.hourlyRate') }}</span>
          <span class="tutoring-checkout-panel__summary-value">{{ formatSlotRate(session.slot) }}</span>
        </div>
      </div>
    </section>

    <section class="tutoring-checkout-panel__section" aria-labelledby="tutoring-payment-heading">
      <header class="tutoring-checkout-panel__header">
        <h3 id="tutoring-payment-heading">{{ t('tutoring.student.checkoutPaymentTitle') }}</h3>
        <p>{{ t('tutoring.student.checkoutPaymentDescription') }}</p>
      </header>

      <div class="tutoring-checkout-panel__accounts">
        <div class="tutoring-checkout-panel__accounts-header">
          <h4>{{ t('tutoring.student.checkoutPaymentAccountsTitle') }}</h4>
          <p>{{ t('tutoring.student.checkoutPaymentAccountsDescription') }}</p>
        </div>
        <div class="tutoring-checkout-panel__accounts-grid">
          <article
            v-for="account in paymentAccounts"
            :key="account.id"
            class="tutoring-checkout-panel__account"
          >
            <header class="tutoring-checkout-panel__account-header">
              <UiIcon :name="account.icon" :size="20" aria-hidden="true" />
              <span class="tutoring-checkout-panel__account-title">{{ account.title }}</span>
            </header>
            <ul class="tutoring-checkout-panel__account-list">
              <li v-for="detail in account.details" :key="detail">{{ detail }}</li>
            </ul>
          </article>
        </div>
      </div>

      <div class="tutoring-checkout-panel__status">
        <span class="tutoring-checkout-panel__status-label">{{ t('tutoring.student.paymentStatusTitle') }}</span>
        <UiTag :color="paymentStatusColor(session.latestPayment?.status || 'pending')" size="sm">
          {{ session.latestPayment ? t(`tutoring.paymentStatus.${session.latestPayment.status}`) : t('tutoring.paymentStatus.pending') }}
        </UiTag>
      </div>

      <form class="tutoring-checkout-panel__form" @submit.prevent="submitPayment">
        <UiInput
          :model-value="paymentForm.amount"
          type="number"
          min="0"
          step="0.5"
          :label="t('tutoring.student.amountLabel')"
          @update:model-value="onAmountChange"
        >
          <template #suffix>{{ sessionCurrencyCode }}</template>
        </UiInput>

        <UiSelect :model-value="paymentForm.method" :label="t('tutoring.student.methodLabel')" @update:model-value="onMethodChange">
          <option v-for="method in methods" :key="method.value" :value="method.value">{{ method.label }}</option>
        </UiSelect>

        <UiFileUpload
          v-model="selectedProof"
          :label="t('tutoring.student.proofLabel')"
          accept="image/*,.pdf"
          :disabled="proofUploading || formSubmitting"
          @change="onProofChange"
          @remove="onProofRemoved"
        />
        <UiTag v-if="paymentForm.proofUrl" color="success" size="sm" pill>{{ t('tutoring.student.proofReady') }}</UiTag>

        <UiTextarea v-model="paymentForm.notes" :label="t('tutoring.student.paymentNotes')" :rows="3" />

        <div class="tutoring-checkout-panel__actions">
          <UiButton button-type="submit" color="primary" :disabled="formSubmitting || proofUploading">
            <span v-if="formSubmitting">{{ t('common.loading') }}</span>
            <span v-else>{{ t('tutoring.student.submitPayment') }}</span>
          </UiButton>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import UiTag from '@/components/ui/UiTag.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useTutoringStore } from '@/stores/tutoring';
import { useToast } from '@/composables/useToast';
import type { TutoringSession, ManualPaymentMethod } from '@/services/tutoring';
import { getStudentManualPaymentOptions } from '@/services/student';
import type { ManualPaymentMethodDetails, StudentManualPaymentOptions } from '@/services/student';

interface Props {
  session: TutoringSession;
}

interface MethodsOption {
  value: ManualPaymentMethod;
  label: string;
}

interface PaymentAccount {
  id: string;
  icon: string;
  title: string;
  details: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'session-updated', session: TutoringSession): void }>();

const { t, tm, locale } = useI18n();
const store = useTutoringStore();
const toast = useToast();

const DEFAULT_TUTORING_CURRENCY = 'EGP';

const manualOptions = ref<StudentManualPaymentOptions | null>(null);
const manualOptionsLoaded = ref(false);

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

onMounted(() => {
  loadManualOptions();
});

const paymentForm = reactive({
  amount: 0,
  method: 'bank' as ManualPaymentMethod,
  proofUrl: '',
  proofKey: '',
  notes: ''
});

const selectedProof = ref<File[]>([]);
const formSubmitting = ref(false);
const proofUploading = ref(false);

const methods = computed<MethodsOption[]>(() => [
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

const sessionCurrencyCode = computed(() => {
  const paymentCurrency = props.session.latestPayment?.currency;
  const slotCurrency = props.session.slot?.currency;
  return (paymentCurrency ?? slotCurrency ?? DEFAULT_TUTORING_CURRENCY).toUpperCase();
});

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

const toNumericAmount = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCurrencyDisplay = (amount: number | string | null | undefined, currency?: string | null) => {
  const numeric = toNumericAmount(amount);
  if (numeric === null) {
    return '—';
  }
  const resolvedCurrency = (currency ?? DEFAULT_TUTORING_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: resolvedCurrency
    }).format(numeric);
  } catch (error) {
    return `${resolvedCurrency} ${numeric.toFixed(2)}`;
  }
};

const formatSlotRate = (slot: TutoringSession['slot'] | null | undefined) =>
  formatCurrencyDisplay(slot?.hourlyRate ?? null, slot?.currency ?? null);

const formatTeacherTime = (slot: TutoringSession['slot']) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: slot.timeZone
  }).format(new Date(slot.startAt));

const formatLocalTime = (slot: TutoringSession['slot']) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(slot.startAt));

const initializeForm = (session: TutoringSession) => {
  paymentForm.amount = session.latestPayment?.amount ?? session.slot.hourlyRate ?? 0;
  paymentForm.method = session.latestPayment?.method ?? 'bank';
  paymentForm.notes = '';
  paymentForm.proofKey = '';
  paymentForm.proofUrl = '';
  selectedProof.value = [];
};

watch(
  () => props.session,
  (session) => {
    if (session) {
      initializeForm(session);
    }
  },
  { immediate: true }
);

const onAmountChange = (value: string | number | boolean) => {
  const parsed = Number(value);
  paymentForm.amount = Number.isFinite(parsed) ? parsed : 0;
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
  formSubmitting.value = true;
  try {
    await store.submitPayment(props.session.id, {
      amount: paymentForm.amount,
      method: paymentForm.method,
      proofUrl: paymentForm.proofUrl || undefined,
      proofKey: paymentForm.proofKey || undefined,
      notes: paymentForm.notes || undefined
    });
    const updated = await store.loadStudentSession(props.session.id);
    if (updated) {
      emit('session-updated', updated);
      initializeForm(updated);
    } else {
      initializeForm(props.session);
    }
    toast.success({ detail: t('tutoring.student.paymentSubmitted') });
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('tutoring.student.paymentFailed') });
  } finally {
    formSubmitting.value = false;
    onProofRemoved();
  }
};
</script>

<style scoped>
.tutoring-checkout-panel {
  display: grid;
  gap: var(--sakai-space-6);
}

.tutoring-checkout-panel__section {
  display: grid;
  gap: var(--sakai-space-4);
}

.tutoring-checkout-panel__header {
  display: grid;
  gap: var(--sakai-space-1);
}

.tutoring-checkout-panel__header h3 {
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.tutoring-checkout-panel__summary-grid {
  display: grid;
  gap: var(--sakai-space-4);
}

@media (min-width: 720px) {
  .tutoring-checkout-panel__summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

.tutoring-checkout-panel__summary-item {
  display: grid;
  gap: var(--sakai-space-1);
}

.tutoring-checkout-panel__summary-label {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.tutoring-checkout-panel__summary-value {
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-medium);
}

.tutoring-checkout-panel__summary-hint {
  color: var(--sakai-text-color-tertiary);
}

.tutoring-checkout-panel__accounts {
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-lg);
  background-color: var(--sakai-surface-color);
}

.tutoring-checkout-panel__accounts-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.tutoring-checkout-panel__accounts-header p {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.tutoring-checkout-panel__accounts-grid {
  display: grid;
  gap: var(--sakai-space-4);
}

.tutoring-checkout-panel__account {
  display: grid;
  gap: var(--sakai-space-2);
}

.tutoring-checkout-panel__account-header {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.tutoring-checkout-panel__account-title {
  font-size: 0.95rem;
}

.tutoring-checkout-panel__account-list {
  margin: 0;
  padding-inline-start: 1.25rem;
  display: grid;
  gap: var(--sakai-space-1);
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.tutoring-checkout-panel__account-list li {
  line-height: 1.4;
}

.tutoring-checkout-panel__status {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.tutoring-checkout-panel__status-label {
  font-weight: var(--sakai-font-weight-semibold);
}

.tutoring-checkout-panel__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.tutoring-checkout-panel__actions {
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .tutoring-checkout-panel__accounts-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
