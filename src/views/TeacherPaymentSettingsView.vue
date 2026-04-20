<template>
  <ThemePage :title="t('teacher.paymentSettingsTitle')" :subtitle="t('teacher.paymentSettingsSubtitle')">
    <div class="teacher-payment-settings grid gap-[1.5rem]">
      <UiAlert v-if="errorMessage" color="danger" variant="soft" class="teacher-payment-settings__alert">
        {{ errorMessage }}
      </UiAlert>

      <UiAlert color="info" variant="soft" class="teacher-payment-settings__hint m-0">
        {{ t('teacher.paymentSettingsCountryHint') }}
      </UiAlert>

      <div v-if="loading" class="teacher-payment-settings__skeleton grid gap-4">
        <UiCard v-for="index in 3" :key="`payment-settings-skeleton-${index}`" hover>
          <UiSkeleton height="1.4rem" width="55%" />
          <UiSkeleton height="0.9rem" width="72%" />
          <UiSkeleton height="0.8rem" width="90%" />
        </UiCard>
      </div>

      <div v-else class="teacher-payment-settings__body grid gap-[1.5rem]">
        <UiCard class="teacher-payment-settings__overview" hover>
          <div class="teacher-payment-settings__overview-header grid gap-[0.35rem] max-w-[480px]">
            <h3>{{ t('teacher.paymentSettingsOverviewTitle') }}</h3>
            <p>{{ t('teacher.paymentSettingsOverviewDescription') }}</p>
          </div>
          <div class="teacher-payment-settings__overview-meta flex flex-col items-end gap-[0.6rem] min-w-[200px]">
            <UiBadge color="info" variant="soft">{{ methodsActiveLabel }}</UiBadge>
            <div v-if="activeMethods.length" class="teacher-payment-settings__overview-methods flex flex-col gap-[0.35rem]">
              <span class="teacher-payment-settings__overview-label text-[0.8rem] text-content-secondary uppercase tracking-[0.08em]">{{ t('teacher.paymentSettingsActiveMethodsLabel') }}</span>
              <ul class="teacher-payment-settings__overview-list flex flex-wrap justify-end gap-[0.35rem] list-none m-0 p-0">
                <li v-for="method in activeMethods" :key="method.value" class="teacher-payment-settings__overview-chip flex">
                  <UiBadge color="success" variant="soft">{{ method.label }}</UiBadge>
                </li>
              </ul>
            </div>
            <span v-if="lastUpdatedLabel" class="teacher-payment-settings__overview-updated inline-flex items-center gap-[0.4rem] text-content-secondary text-[0.85rem] text-right">
              <UiIcon name="ClockCircleOutlined" :size="16" aria-hidden="true" />
              {{ lastUpdatedLabel }}
            </span>
          </div>
        </UiCard>

        <form class="teacher-payment-settings__form grid gap-[1.5rem]" @submit.prevent="onSave">
          <div
            class="teacher-payment-settings__language-toggle inline-flex items-center gap-2 flex-wrap mb-2"
            role="group"
            :aria-label="t('teacher.paymentSettingsInstructionsLanguageLabel')"
          >
            <button
              v-for="option in instructionLanguageOptions"
              :key="option.value"
              type="button"
              class="teacher-payment-settings__language-button"
              :class="{ 'teacher-payment-settings__language-button--active': instructionsView === option.value }"
              @click="instructionsView = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <UiCard class="teacher-payment-settings__section grid gap-4" hover>
            <template #title>
              <div class="teacher-payment-settings__section-header flex items-center gap-4">
                <div class="teacher-payment-settings__section-media" aria-hidden="true">
                  <img :src="bankTransferIcon" :alt="t('teacher.paymentSettingsBankTitle')" />
                </div>
                <div class="teacher-payment-settings__section-copy grid gap-[0.35rem]">
                  <h3>{{ t('teacher.paymentSettingsBankTitle') }}</h3>
                  <span class="teacher-payment-settings__section-subtitle text-content-secondary text-[0.9rem]">
                    {{ t('teacher.paymentSettingsBankDescription') }}
                  </span>
                </div>
                <div class="teacher-payment-settings__section-meta flex items-center gap-[0.6rem] ml-auto">
                  <UiBadge color="success" variant="soft">{{ t('teacher.paymentSettingsStatusAlwaysOn') }}</UiBadge>
                </div>
              </div>
            </template>

            <div class="teacher-payment-settings__fields grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <UiInput
                v-model="form.bankTransfer.accountNumber"
                :label="t('teacher.paymentSettingsAccountNumber')"
                required
                :disabled="saving"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsAccountNumberHint')"
                :error="fieldErrors.bankTransfer.accountNumber"
                :data-error-field="errorFieldKey('bankTransfer', 'accountNumber')"
              />
              <UiInput
                v-model="form.bankTransfer.iban"
                :label="t('teacher.paymentSettingsIban')"
                :disabled="saving"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsIbanHint')"
                :error="fieldErrors.bankTransfer.iban"
                :data-error-field="errorFieldKey('bankTransfer', 'iban')"
              />
              <UiInput
                v-model="form.bankTransfer.accountHolderName"
                :label="t('teacher.paymentSettingsAccountHolder')"
                required
                :disabled="saving"
                class="teacher-payment-settings__field"
                :error="fieldErrors.bankTransfer.accountHolderName"
                :data-error-field="errorFieldKey('bankTransfer', 'accountHolderName')"
              />
              <UiInput
                v-model="form.bankTransfer.bankName"
                :label="t('teacher.paymentSettingsBankName')"
                :disabled="saving"
                class="teacher-payment-settings__field"
                :error="fieldErrors.bankTransfer.bankName"
                :data-error-field="errorFieldKey('bankTransfer', 'bankName')"
              />
              <UiTextarea
                v-model="form.bankTransfer.bankDetails"
                :label="t('teacher.paymentSettingsBankDetails')"
                :rows="3"
                :disabled="saving"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsBankDetailsHint')"
                :error="fieldErrors.bankTransfer.bankDetails"
                :data-error-field="errorFieldKey('bankTransfer', 'bankDetails')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('ar')"
                v-model="form.bankTransfer.instructionsAr"
                :label="t('teacher.paymentSettingsInstructionsAr')"
                :rows="3"
                :disabled="saving"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsArHint')"
                :error="fieldErrors.bankTransfer.instructionsAr"
                :data-error-field="errorFieldKey('bankTransfer', 'instructionsAr')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('en')"
                v-model="form.bankTransfer.instructionsEn"
                :label="t('teacher.paymentSettingsInstructionsEn')"
                :rows="3"
                :disabled="saving"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsEnHint')"
                :error="fieldErrors.bankTransfer.instructionsEn"
                :data-error-field="errorFieldKey('bankTransfer', 'instructionsEn')"
              />
            </div>
          </UiCard>


        <UiCard class="teacher-payment-settings__section grid gap-4" hover>
          <template #title>
            <div class="teacher-payment-settings__section-header flex items-center gap-4">
              <div class="teacher-payment-settings__section-media" aria-hidden="true">
                <img :src="vodafoneCashIcon" :alt="t('teacher.paymentSettingsVodafoneTitle')" />
              </div>
              <div class="teacher-payment-settings__section-copy grid gap-[0.35rem]">
                <h3>{{ t('teacher.paymentSettingsVodafoneTitle') }}</h3>
                <span class="teacher-payment-settings__section-subtitle text-content-secondary text-[0.9rem]">
                  {{ t('teacher.paymentSettingsVodafoneDescription') }}
                </span>
              </div>
              <div class="teacher-payment-settings__section-meta flex items-center gap-[0.6rem] ml-auto">
                <UiBadge
                  :color="form.vodafoneCash.enabled ? 'success' : 'secondary'"
                  variant="soft"
                >
                  {{ form.vodafoneCash.enabled ? t('teacher.paymentSettingsStatusActive') : t('teacher.paymentSettingsStatusDisabled') }}
                </UiBadge>
                <UiSwitch
                  v-model="form.vodafoneCash.enabled"
                  :label="t('teacher.paymentSettingsEnableMethod')"
                  :disabled="saving"
                  class="teacher-payment-settings__toggle mb-2"
                />
              </div>
            </div>
          </template>

          <div
            :class="['block relative', { 'opacity-[0.55]': !form.vodafoneCash.enabled }]"
            :aria-disabled="!form.vodafoneCash.enabled"
          >
            <div v-if="!form.vodafoneCash.enabled" class="teacher-payment-settings__method-overlay">
              <UiIcon name="UnlockOutlined" :size="16" aria-hidden="true" />
              <span>{{ t('teacher.paymentSettingsEnableToEdit') }}</span>
            </div>
            <div class="teacher-payment-settings__fields grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <UiInput
                v-model="form.vodafoneCash.accountNumber"
                :label="t('teacher.paymentSettingsAccountNumber')"
                :disabled="saving || !form.vodafoneCash.enabled"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsVodafoneHint')"
                :error="fieldErrors.vodafoneCash.accountNumber"
                :data-error-field="errorFieldKey('vodafoneCash', 'accountNumber')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('ar')"
                v-model="form.vodafoneCash.instructionsAr"
                :label="t('teacher.paymentSettingsInstructionsAr')"
                :rows="3"
                :disabled="saving || !form.vodafoneCash.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsArHint')"
                :error="fieldErrors.vodafoneCash.instructionsAr"
                :data-error-field="errorFieldKey('vodafoneCash', 'instructionsAr')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('en')"
                v-model="form.vodafoneCash.instructionsEn"
                :label="t('teacher.paymentSettingsInstructionsEn')"
                :rows="3"
                :disabled="saving || !form.vodafoneCash.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsEnHint')"
                :error="fieldErrors.vodafoneCash.instructionsEn"
                :data-error-field="errorFieldKey('vodafoneCash', 'instructionsEn')"
              />
            </div>
          </div>
        </UiCard>
        <UiCard class="teacher-payment-settings__section grid gap-4" hover>
          <template #title>
            <div class="teacher-payment-settings__section-header flex items-center gap-4">
              <div class="teacher-payment-settings__section-media" aria-hidden="true">
                <img :src="instaPayIcon" :alt="t('teacher.paymentSettingsInstaPayTitle')" />
              </div>
              <div class="teacher-payment-settings__section-copy grid gap-[0.35rem]">
                <h3>{{ t('teacher.paymentSettingsInstaPayTitle') }}</h3>
                <span class="teacher-payment-settings__section-subtitle text-content-secondary text-[0.9rem]">
                  {{ t('teacher.paymentSettingsInstaPayDescription') }}
                </span>
              </div>
              <div class="teacher-payment-settings__section-meta flex items-center gap-[0.6rem] ml-auto">
                <UiBadge
                  :color="form.instaPay.enabled ? 'success' : 'secondary'"
                  variant="soft"
                >
                  {{ form.instaPay.enabled ? t('teacher.paymentSettingsStatusActive') : t('teacher.paymentSettingsStatusDisabled') }}
                </UiBadge>
                <UiSwitch
                  v-model="form.instaPay.enabled"
                  :label="t('teacher.paymentSettingsEnableMethod')"
                  :disabled="saving"
                  class="teacher-payment-settings__toggle mb-2"
                />
              </div>
            </div>
          </template>

          <div
            :class="['block relative', { 'opacity-[0.55]': !form.instaPay.enabled }]"
            :aria-disabled="!form.instaPay.enabled"
          >
            <div v-if="!form.instaPay.enabled" class="teacher-payment-settings__method-overlay">
              <UiIcon name="UnlockOutlined" :size="16" aria-hidden="true" />
              <span>{{ t('teacher.paymentSettingsEnableToEdit') }}</span>
            </div>
            <div class="teacher-payment-settings__fields grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <UiInput
                v-model="form.instaPay.accountNumber"
                :label="t('teacher.paymentSettingsInstaPayMobileLabel')"
                :disabled="saving || !form.instaPay.enabled"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsInstaPayMobileHint')"
                :error="fieldErrors.instaPay.accountNumber"
                :data-error-field="errorFieldKey('instaPay', 'accountNumber')"
              />
              <UiInput
                v-model="form.instaPay.bankDetails"
                :label="t('teacher.paymentSettingsInstaPayLinkLabel')"
                :disabled="saving || !form.instaPay.enabled"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsInstaPayLinkHint')"
                :error="fieldErrors.instaPay.bankDetails"
                :data-error-field="errorFieldKey('instaPay', 'bankDetails')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('ar')"
                v-model="form.instaPay.instructionsAr"
                :label="t('teacher.paymentSettingsInstructionsAr')"
                :rows="3"
                :disabled="saving || !form.instaPay.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsArHint')"
                :error="fieldErrors.instaPay.instructionsAr"
                :data-error-field="errorFieldKey('instaPay', 'instructionsAr')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('en')"
                v-model="form.instaPay.instructionsEn"
                :label="t('teacher.paymentSettingsInstructionsEn')"
                :rows="3"
                :disabled="saving || !form.instaPay.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsEnHint')"
                :error="fieldErrors.instaPay.instructionsEn"
                :data-error-field="errorFieldKey('instaPay', 'instructionsEn')"
              />
            </div>
          </div>
        </UiCard>

        <UiCard class="teacher-payment-settings__section grid gap-4" hover>
          <template #title>
            <div class="teacher-payment-settings__section-header flex items-center gap-4">
              <div class="teacher-payment-settings__section-media" aria-hidden="true">
                <img :src="customLinkIcon" :alt="t('teacher.paymentSettingsCustomLinkTitle')" />
              </div>
              <div class="teacher-payment-settings__section-copy grid gap-[0.35rem]">
                <h3>{{ t('teacher.paymentSettingsCustomLinkTitle') }}</h3>
                <span class="teacher-payment-settings__section-subtitle text-content-secondary text-[0.9rem]">
                  {{ t('teacher.paymentSettingsCustomLinkDescription') }}
                </span>
              </div>
              <div class="teacher-payment-settings__section-meta flex items-center gap-[0.6rem] ml-auto">
                <UiBadge
                  :color="form.customLink.enabled ? 'success' : 'secondary'"
                  variant="soft"
                >
                  {{ form.customLink.enabled ? t('teacher.paymentSettingsStatusActive') : t('teacher.paymentSettingsStatusDisabled') }}
                </UiBadge>
                <UiSwitch
                  v-model="form.customLink.enabled"
                  :label="t('teacher.paymentSettingsEnableMethod')"
                  :disabled="saving"
                  class="teacher-payment-settings__toggle mb-2"
                />
              </div>
            </div>
          </template>

          <div
            :class="['block relative', { 'opacity-[0.55]': !form.customLink.enabled }]"
            :aria-disabled="!form.customLink.enabled"
          >
            <div v-if="!form.customLink.enabled" class="teacher-payment-settings__method-overlay">
              <UiIcon name="UnlockOutlined" :size="16" aria-hidden="true" />
              <span>{{ t('teacher.paymentSettingsEnableToEdit') }}</span>
            </div>
            <div class="teacher-payment-settings__fields grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <UiInput
                v-model="form.customLink.url"
                :label="t('teacher.paymentSettingsCustomLinkUrl')"
                :disabled="saving || !form.customLink.enabled"
                class="teacher-payment-settings__field"
                :hint="t('teacher.paymentSettingsCustomLinkHint')"
                :error="fieldErrors.customLink.url"
                :data-error-field="errorFieldKey('customLink', 'url')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('ar')"
                v-model="form.customLink.instructionsAr"
                :label="t('teacher.paymentSettingsInstructionsAr')"
                :rows="3"
                :disabled="saving || !form.customLink.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsArHint')"
                :error="fieldErrors.customLink.instructionsAr"
                :data-error-field="errorFieldKey('customLink', 'instructionsAr')"
              />
              <UiTextarea
                v-if="shouldShowLanguage('en')"
                v-model="form.customLink.instructionsEn"
                :label="t('teacher.paymentSettingsInstructionsEn')"
                :rows="3"
                :disabled="saving || !form.customLink.enabled"
                class="teacher-payment-settings__field col-span-full"
                :hint="t('teacher.paymentSettingsInstructionsEnHint')"
                :error="fieldErrors.customLink.instructionsEn"
                :data-error-field="errorFieldKey('customLink', 'instructionsEn')"
              />
            </div>
          </div>
        </UiCard>

          <div class="teacher-payment-settings__actions flex items-center justify-end gap-4">
            <span v-if="lastUpdatedLabel" class="teacher-payment-settings__updated text-content-secondary text-[0.9rem]">
              <UiIcon name="ClockCircleOutlined" :size="16" aria-hidden="true" />
              {{ lastUpdatedLabel }}
            </span>
            <UiBadge v-if="isDirty" color="warning" variant="soft" class="teacher-payment-settings__dirty normal-case">
              {{ t('teacher.paymentSettingsUnsaved') }}
            </UiBadge>
            <UiButton type="submit" color="primary" :disabled="saving || !isDirty">
              <span v-if="saving">{{ t('common.loading') }}</span>
              <span v-else>{{ t('teacher.paymentSettingsSave') }}</span>
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';
import { onBeforeRouteLeave } from 'vue-router';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useToast } from '@/composables/useToast';
import bankTransferIcon from '@/assets/payment/bank-transfer-icon.svg';
import instaPayIcon from '@/assets/payment/InstaPay_Logo.png';
import customLinkIcon from '@/assets/payment/Custom payment link.jpg';
import vodafoneCashIcon from '@/assets/icons/vodafone.png';
import {
  getTeacherManualPaymentSettings,
  updateTeacherManualPaymentSettings,
  type TeacherManualPaymentCustomLinkForm,
  type TeacherManualPaymentMethodForm,
  type TeacherManualPaymentSettingsPayload,
  type TeacherManualPaymentSettingsResponse
} from '@/services/teacher';
import { formatDateTime, formatRelativeTimeToNow } from '@/utils/formatters';

const { t, te, locale } = useI18n();
const toast = useToast();

interface ManualPaymentFormState extends TeacherManualPaymentSettingsPayload {}

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const lastUpdated = ref<string | null>(null);

const form = reactive<ManualPaymentFormState>({
  bankTransfer: createMethod(true),
  instaPay: createMethod(false),
  vodafoneCash: createMethod(false),
  customLink: createCustomLink()
});

type MethodFieldErrors = {
  bankTransfer: {
    accountNumber: string;
    iban: string;
    accountHolderName: string;
    bankName: string;
    bankDetails: string;
    instructionsAr: string;
    instructionsEn: string;
  };
  instaPay: {
    accountNumber: string;
    bankDetails: string;
    instructionsAr: string;
    instructionsEn: string;
  };
  vodafoneCash: {
    accountNumber: string;
    instructionsAr: string;
    instructionsEn: string;
  };
  customLink: {
    url: string;
    instructionsAr: string;
    instructionsEn: string;
  };
};

type MethodKey = keyof MethodFieldErrors;

const fieldErrors = reactive<MethodFieldErrors>({
  bankTransfer: {
    accountNumber: '',
    iban: '',
    accountHolderName: '',
    bankName: '',
    bankDetails: '',
    instructionsAr: '',
    instructionsEn: ''
  },
  instaPay: {
    accountNumber: '',
    bankDetails: '',
    instructionsAr: '',
    instructionsEn: ''
  },
  vodafoneCash: {
    accountNumber: '',
    instructionsAr: '',
    instructionsEn: ''
  },
  customLink: {
    url: '',
    instructionsAr: '',
    instructionsEn: ''
  }
});

const instructionsView = ref<'all' | 'ar' | 'en'>('all');
const instructionLanguageOptions = computed(() => [
  { value: 'all' as const, label: t('teacher.paymentSettingsInstructionsLanguageAll') },
  { value: 'ar' as const, label: t('teacher.paymentSettingsInstructionsLanguageAr') },
  { value: 'en' as const, label: t('teacher.paymentSettingsInstructionsLanguageEn') }
]);


const activeMethods = computed(() => {
  const methods: Array<{ value: MethodKey; label: string }> = [];
  if (form.bankTransfer.enabled) {
    methods.push({ value: 'bankTransfer', label: t('teacher.paymentSettingsBankTitle') });
  }
  if (form.vodafoneCash.enabled) {
    methods.push({ value: 'vodafoneCash', label: t('teacher.paymentSettingsVodafoneTitle') });
  }
  if (form.instaPay.enabled) {
    methods.push({ value: 'instaPay', label: t('teacher.paymentSettingsInstaPayTitle') });
  }
  if (form.customLink.enabled) {
    methods.push({ value: 'customLink', label: t('teacher.paymentSettingsCustomLinkTitle') });
  }
  return methods;
});

const initialSnapshot = ref('');
const isDirty = ref(false);

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!isDirty.value) {
    return;
  }
  event.preventDefault();
  event.returnValue = '';
};

function shouldShowLanguage(language: 'ar' | 'en'): boolean {
  return instructionsView.value === 'all' || instructionsView.value === language;
}

function errorFieldKey(method: MethodKey, field: string): string {
  return `${method}.${field}`;
}

function setFieldError(method: MethodKey, field: string, message: string) {
  (fieldErrors[method] as Record<string, string>)[field] = message;
}

function clearFieldError(method: MethodKey, field: string) {
  (fieldErrors[method] as Record<string, string>)[field] = '';
}

function resetMethodErrors(method: MethodKey) {
  const entries = Object.keys(fieldErrors[method]);
  for (const field of entries) {
    (fieldErrors[method] as Record<string, string>)[field] = '';
  }
}

function clearAllFieldErrors() {
  (Object.keys(fieldErrors) as MethodKey[]).forEach((method) => resetMethodErrors(method));
}

function focusField(method: MethodKey, field: string) {
  nextTick(() => {
    const selector = `[data-error-field="${errorFieldKey(method, field)}"]`;
    const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    element?.focus();
  });
}

registerValidationWatchers();

function registerValidationWatchers() {
  watch(
    () => form.bankTransfer.accountNumber,
    (value) => {
      if (fieldErrors.bankTransfer.accountNumber && normalize(value)) {
        clearFieldError('bankTransfer', 'accountNumber');
      }
    }
  );

  watch(
    () => form.bankTransfer.accountHolderName,
    (value) => {
      if (fieldErrors.bankTransfer.accountHolderName && normalize(value)) {
        clearFieldError('bankTransfer', 'accountHolderName');
      }
    }
  );

  watch(
    () => form.instaPay.accountNumber,
    (value) => {
      if (fieldErrors.instaPay.accountNumber && normalize(value)) {
        clearFieldError('instaPay', 'accountNumber');
      }
    }
  );

  watch(
    () => form.instaPay.bankDetails,
    (value) => {
      if (fieldErrors.instaPay.bankDetails && (!value || isValidCustomLinkUrl(value))) {
        clearFieldError('instaPay', 'bankDetails');
      }
    }
  );

  watch(
    () => form.vodafoneCash.accountNumber,
    (value) => {
      if (fieldErrors.vodafoneCash.accountNumber && normalize(value)) {
        clearFieldError('vodafoneCash', 'accountNumber');
      }
    }
  );

  watch(
    () => form.customLink.url,
    (value) => {
      if (fieldErrors.customLink.url && isValidCustomLinkUrl(value)) {
        clearFieldError('customLink', 'url');
      }
    }
  );

  watch(
    () => form.instaPay.enabled,
    (enabled) => {
      if (!enabled) {
        resetMethodErrors('instaPay');
      }
    }
  );

  watch(
    () => form.vodafoneCash.enabled,
    (enabled) => {
      if (!enabled) {
        resetMethodErrors('vodafoneCash');
      }
    }
  );

  watch(
    () => form.customLink.enabled,
    (enabled) => {
      if (!enabled) {
        resetMethodErrors('customLink');
      }
    }
  );
}

const enabledMethodsCount = computed(() => {
  let count = 0;
  if (form.bankTransfer.enabled) {
    count += 1;
  }
  if (form.instaPay.enabled) {
    count += 1;
  }
  if (form.vodafoneCash.enabled) {
    count += 1;
  }
  if (form.customLink.enabled) {
    count += 1;
  }
  return count;
});

const pluralRules = computed(() => new Intl.PluralRules(locale.value));

const methodsActiveLabel = computed(() => {
  const count = enabledMethodsCount.value;
  const baseKey = 'teacher.paymentSettingsMethodsActive';

  if (count === 0) {
    const zeroKey = `${baseKey}.zero`;
    if (te(zeroKey)) {
      return t(zeroKey, { count });
    }
  }

  const categoryKey = `${baseKey}.${pluralRules.value.select(count)}`;
  if (te(categoryKey)) {
    return t(categoryKey, { count });
  }

  return t(`${baseKey}.other`, { count });
});

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return '';
  }
  return t('teacher.paymentSettingsLastUpdated', {
    relative: formatRelativeTimeToNow(lastUpdated.value),
    date: formatDateTime(lastUpdated.value)
  });
});

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnloadHandler);
  await loadSettings();
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});

onBeforeRouteLeave((to, from, next) => {
  if (!isDirty.value) {
    next();
    return;
  }
  const shouldLeave = window.confirm(t('teacher.paymentSettingsLeaveConfirm'));
  if (shouldLeave) {
    next();
  } else {
    next(false);
  }
});

function createMethod(enabled: boolean): TeacherManualPaymentMethodForm {
  return {
    enabled,
    accountNumber: '',
    iban: '',
    accountHolderName: '',
    bankName: '',
    bankDetails: '',
    instructionsAr: '',
    instructionsEn: ''
  };
}

function createCustomLink(): TeacherManualPaymentCustomLinkForm {
  return {
    enabled: false,
    url: '',
    instructionsAr: '',
    instructionsEn: ''
  };
}

async function loadSettings() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await getTeacherManualPaymentSettings();
    applySettings(response);
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function applySettings(response: TeacherManualPaymentSettingsResponse) {
  const payload = response.settings;
  assignMethod(form.bankTransfer, payload.bankTransfer, true);
  assignMethod(form.instaPay, payload.instaPay, false);
  assignMethod(form.vodafoneCash, payload.vodafoneCash, false);
  assignCustomLink(form.customLink, payload.customLink);
  lastUpdated.value = response.updatedAt ?? null;
  clearAllFieldErrors();
  nextTick(updateSnapshot);
}

function assignMethod(
  target: TeacherManualPaymentMethodForm,
  source: TeacherManualPaymentMethodForm | undefined,
  forceEnabled: boolean
) {
  target.enabled = forceEnabled || Boolean(source?.enabled);
  target.accountNumber = source?.accountNumber ?? '';
  target.iban = source?.iban ?? '';
  target.accountHolderName = source?.accountHolderName ?? '';
  target.bankName = source?.bankName ?? '';
  target.bankDetails = source?.bankDetails ?? '';
  target.instructionsAr = source?.instructionsAr ?? '';
  target.instructionsEn = source?.instructionsEn ?? '';
}

function assignCustomLink(
  target: TeacherManualPaymentCustomLinkForm,
  source: TeacherManualPaymentCustomLinkForm | undefined
) {
  target.enabled = Boolean(source?.enabled);
  target.url = source?.url ?? '';
  target.instructionsAr = source?.instructionsAr ?? '';
  target.instructionsEn = source?.instructionsEn ?? '';
}

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeMethod(
  method: TeacherManualPaymentMethodForm,
  forceEnabled: boolean
): TeacherManualPaymentMethodForm {
  return {
    enabled: forceEnabled || method.enabled,
    accountNumber: normalize(method.accountNumber),
    iban: normalize(method.iban),
    accountHolderName: normalize(method.accountHolderName),
    bankName: normalize(method.bankName),
    bankDetails: normalize(method.bankDetails),
    instructionsAr: normalize(method.instructionsAr),
    instructionsEn: normalize(method.instructionsEn)
  };
}

function normalizeCustomLink(method: TeacherManualPaymentCustomLinkForm): TeacherManualPaymentCustomLinkForm {
  return {
    enabled: method.enabled,
    url: normalize(method.url),
    instructionsAr: normalize(method.instructionsAr),
    instructionsEn: normalize(method.instructionsEn)
  };
}

function isValidCustomLinkUrl(value: string | null | undefined): boolean {
  const url = normalize(value);
  return Boolean(url && /^https?:\/\/.+/i.test(url));
}

function validate(): boolean {
  clearAllFieldErrors();
  let firstError: { method: MethodKey; field: string } | null = null;

  const ensure = (method: MethodKey, field: string, condition: boolean, message: string) => {
    if (condition) {
      return;
    }
    setFieldError(method, field, message);
    if (!firstError) {
      firstError = { method, field };
    }
  };

  ensure(
    'bankTransfer',
    'accountNumber',
    Boolean(normalize(form.bankTransfer.accountNumber)),
    t('teacher.paymentSettingsErrorBankAccountNumber')
  );
  ensure(
    'bankTransfer',
    'accountHolderName',
    Boolean(normalize(form.bankTransfer.accountHolderName)),
    t('teacher.paymentSettingsErrorBankAccountHolder')
  );

  if (form.instaPay.enabled) {
    ensure(
      'instaPay',
      'accountNumber',
      Boolean(normalize(form.instaPay.accountNumber)),
      t('teacher.paymentSettingsErrorInstaPayMobile')
    );
    const instaLink = normalize(form.instaPay.bankDetails);
    ensure(
      'instaPay',
      'bankDetails',
      !instaLink || isValidCustomLinkUrl(instaLink),
      t('teacher.paymentSettingsErrorInstaPayLink')
    );
  }

  if (form.vodafoneCash.enabled) {
    ensure(
      'vodafoneCash',
      'accountNumber',
      Boolean(normalize(form.vodafoneCash.accountNumber)),
      t('teacher.paymentSettingsErrorVodafoneAccount')
    );
  }

  if (form.customLink.enabled) {
    ensure('customLink', 'url', isValidCustomLinkUrl(form.customLink.url), t('teacher.paymentSettingsErrorCustomLinkUrl'));
  }

  if (firstError) {
    errorMessage.value = t('teacher.paymentSettingsValidationSummary');
    focusField(firstError.method, firstError.field);
    return false;
  }

  errorMessage.value = '';
  return true;
}

function buildPayload(): TeacherManualPaymentSettingsPayload {
  return {
    bankTransfer: normalizeMethod(form.bankTransfer, true),
    instaPay: normalizeMethod(form.instaPay, false),
    vodafoneCash: normalizeMethod(form.vodafoneCash, false),
    customLink: normalizeCustomLink(form.customLink)
  };
}

const serializedForm = computed(() => JSON.stringify(buildPayload()));

watch(serializedForm, (value) => {
  isDirty.value = value !== initialSnapshot.value;
});

function updateSnapshot() {
  initialSnapshot.value = serializedForm.value;
  isDirty.value = false;
}

async function onSave() {
  if (saving.value) {
    return;
  }
  if (!validate()) {
    return;
  }

  saving.value = true;
  try {
    const response = await updateTeacherManualPaymentSettings(buildPayload());
    applySettings(response);
    toast.success(t('teacher.paymentSettingsUpdated'));
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

function resolveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim().length) {
      const normalized = message.trim();
      if (normalized === 'Bank transfer details require an account number and account holder name') {
        return t('teacher.paymentSettingsBackendBankRequired');
      }
      if (normalized === 'InstaPay requires a mobile number when enabled') {
        return t('teacher.paymentSettingsBackendInstaPayRequired');
      }
      if (normalized === 'Vodafone Cash requires a wallet number when enabled') {
        return t('teacher.paymentSettingsBackendVodafoneRequired');
      }
      if (normalized === 'Custom link requires a valid URL when enabled') {
        return t('teacher.paymentSettingsBackendCustomLinkRequired');
      }
      return message;
    }
  }
  return t('common.genericError');
}
</script>

<style scoped>
.teacher-payment-settings__alert {
  margin-bottom: 0 !important;
}

.teacher-payment-settings__overview {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem 2rem;
  padding: 1.75rem;
  background: color-mix(in srgb, var(--sakai-info-100) 45%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-info-400) 20%, transparent);
}

.teacher-payment-settings__overview-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-payment-settings__overview-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.95rem;
}

.teacher-payment-settings__section-media {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sakai-primary) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 25%, transparent);
  overflow: hidden;
}

.teacher-payment-settings__section-media img {
  display: block;
  width: 60%;
  height: auto;
}

.teacher-payment-settings__section-copy h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-payment-settings__field :deep(.ui-input__input),
.teacher-payment-settings__field :deep(.ui-textarea__textarea) {
  font-size: 1rem;
  padding: 0.75rem 0.9rem;
}

.teacher-payment-settings__field :deep(.ui-input__label),
.teacher-payment-settings__field :deep(.ui-textarea__label) {
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-payment-settings__method-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--sakai-surface) 75%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
  pointer-events: none;
}

.teacher-payment-settings__language-button {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface);
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: background var(--sakai-transition-duration) var(--sakai-transition-ease),
    color var(--sakai-transition-duration) var(--sakai-transition-ease),
    border-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-payment-settings__language-button--active {
  background: color-mix(in srgb, var(--sakai-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--sakai-primary) 45%, transparent);
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
}

@media (max-width: 768px) {
  .teacher-payment-settings__overview {
    padding: 1.25rem;
  }

  .teacher-payment-settings__overview-meta {
    align-items: flex-start;
    min-width: unset;
  }

  .teacher-payment-settings__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-payment-settings__updated {
    text-align: center;
  }
}
</style>
