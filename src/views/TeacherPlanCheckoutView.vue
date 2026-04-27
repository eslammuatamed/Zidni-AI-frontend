<template>
  <ThemePage :title="pageTitle" :subtitle="pageSubtitle">
    <template #actions>
      <UiButton variant="outline" color="secondary" @click="goBackToPlans">
        {{ t('teacher.planUpgradeBackBilingual') }}
      </UiButton>
    </template>

    <div class="teacher-plan-checkout">
      <template v-if="isPaymobReturnRoute">
        <UiCard class="teacher-plan-checkout__paymob-return" hover>
          <template #title>
            <h2>{{ paymobStatusHeading }}</h2>
          </template>
          <p class="teacher-plan-checkout__paymob-return-message">{{ paymobStatusDescription }}</p>
          <UiAlert
            v-if="paymobReturnState.error && !paymobReturnState.isLoading"
            color="danger"
            variant="soft"
          >
            {{ paymobReturnState.error }}
          </UiAlert>
          <UiSkeleton
            v-else-if="paymobReturnState.isLoading && !paymobReturnDetailsAvailable"
            height="1rem"
            width="70%"
          />
          <dl v-else-if="paymobReturnDetailsAvailable" class="teacher-plan-checkout__paymob-return-details">
            <div>
              <dt>{{ t('teacher.planUpgradePaymobReturnStatusLabel') }}</dt>
              <dd>{{ paymobStatusLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('teacher.planUpgradePaymobReturnOrderLabel') }}</dt>
              <dd>{{ paymobReturnState.merchantOrderId || '—' }}</dd>
            </div>
            <div v-if="paymobReturnState.transactionId">
              <dt>{{ t('teacher.planUpgradePaymobReturnTransactionLabel') }}</dt>
              <dd>{{ paymobReturnState.transactionId }}</dd>
            </div>
            <div v-if="paymobAmountDisplay">
              <dt>{{ t('teacher.planUpgradePaymobReturnAmountLabel') }}</dt>
              <dd>{{ paymobAmountDisplay }}</dd>
            </div>
          </dl>
          <div class="teacher-plan-checkout__actions">
            <UiButton color="primary" @click="goBackToPlans">
              {{ t('teacher.planUpgradePaymobReturnBack') }}
            </UiButton>
          </div>
        </UiCard>
      </template>

      <template v-else>
        <UiAlert v-if="loadError" color="danger" variant="soft">
          {{ t('teacher.planUpgradePricingError') }}
        </UiAlert>

        <template v-else>
          <UiCard v-if="isLoading" class="teacher-plan-checkout__loading" hover>
            <UiSkeleton height="1.25rem" width="55%" />
            <UiSkeleton height="1rem" width="75%" />
            <UiSkeleton height="1rem" width="65%" />
            <UiSkeleton height="1rem" width="80%" />
          </UiCard>

          <UiAlert v-else-if="!activePlan" color="warning" variant="soft" class="teacher-plan-checkout__empty">
            <p>{{ t('teacher.planUpgradeNoPlans') }}</p>
            <UiButton color="primary" @click="goBackToPlans">
              {{ t('teacher.planUpgradeBackBilingual') }}
            </UiButton>
          </UiAlert>

          <UiAlert
            v-else-if="activePlan.isContactOnly"
            color="warning"
            variant="soft"
            class="teacher-plan-checkout__empty"
          >
            <p>{{ t('teacher.planUpgradePaymentMethodsUnavailable') }}</p>
            <UiButton color="primary" @click="goBackToPlans">
              {{ t('teacher.planUpgradeBackBilingual') }}
            </UiButton>
          </UiAlert>

          <div v-else class="teacher-plan-checkout__content">
            <section class="teacher-plan-checkout__summary">
              <UiCard  hover>
                <template #title>
                  <h2>{{ activePlan.title }}</h2>
                  <p v-if="activePlan.tagline" class="teacher-plan-checkout__tagline">{{ activePlan.tagline }}</p>
              </template>
              <p class="teacher-plan-checkout__price">{{ activePlan.monthlyPrice }}</p>
              <p v-if="activePlan.yearlyPrice" class="teacher-plan-checkout__price-secondary">
                {{ activePlan.yearlyPrice }}
              </p>
              <p v-if="pricingNoticeText" class="teacher-plan-checkout__country-notice">
                {{ pricingNoticeText }}
              </p>
              <p
                v-if="fallbackNoticeText"
                class="teacher-plan-checkout__country-notice teacher-plan-checkout__country-notice--fallback"
              >
                {{ fallbackNoticeText }}
              </p>
              <p v-if="pricingContextText" class="teacher-plan-checkout__context">
                {{ pricingContextText }}
              </p>
              <h3 class="teacher-plan-checkout__features-heading">{{ t('teacher.planUpgradeIncluded') }}</h3>
              <ul class="teacher-plan-checkout__features">
                <li v-for="feature in activePlan.features" :key="feature">{{ feature }}</li>
              </ul>
            </UiCard>
          </section>

          <section class="teacher-plan-checkout__form">
            <UiCard class="teacher-plan-checkout__form-card" hover>
              <header class="teacher-plan-checkout__form-header">
                <h2>{{ t('teacher.planUpgradeCheckoutTitle', { plan: activePlan.title }) }}</h2>
                <p>{{ t('teacher.planUpgradeCheckoutSubtitle', { plan: activePlan.title }) }}</p>
              </header>

              <template v-if="checkout.stage === 'method'">
                <UiRadioGroup
                  v-model="checkout.selectedMethod"
                  :options="paymentOptions"
                  :label="t('teacher.planUpgradeCheckoutMethodLabel')"
                  :disabled="checkout.isProcessing"
                />
                <div class="teacher-plan-checkout__actions">
                  <UiButton variant="outline" color="secondary" :disabled="checkout.isProcessing" @click="goBackToPlans">
                    {{ t('common.cancel') }}
                  </UiButton>
                  <UiButton
                    color="primary"
                    :disabled="!checkout.selectedMethod || checkout.isProcessing"
                    @click="confirmCheckout"
                  >
                    {{ t('teacher.planUpgradeCheckoutContinue') }}
                  </UiButton>
                </div>
              </template>

              <template v-else>
                <div class="teacher-plan-checkout__vodafone-summary">
                  <p v-if="checkout.vodafone.request?.invoiceNo">
                    {{ t('teacher.planUpgradeVodafoneInvoice', { invoice: checkout.vodafone.request.invoiceNo }) }}
                  </p>
                  <p v-if="vodafoneAmountDisplay">
                    {{ t('teacher.planUpgradeVodafoneAmount', { amount: vodafoneAmountDisplay }) }}
                  </p>
                  <p v-if="vodafoneWalletDisplay">
                    {{ t('teacher.planUpgradeVodafoneWallet', { wallet: vodafoneWalletDisplay }) }}
                  </p>
                </div>

                <div v-if="vodafoneInstructionLines.length" class="teacher-plan-checkout__vodafone-instructions">
                  <p class="teacher-plan-checkout__vodafone-instructions-title">
                    {{ t('teacher.planUpgradeVodafoneInstructions') }}
                  </p>
                  <ul>
                    <li v-for="line in vodafoneInstructionLines" :key="line">{{ line }}</li>
                  </ul>
                </div>

                <div class="teacher-plan-checkout__vodafone-form">
                  <UiFileUpload
                    v-model="checkout.vodafone.files"
                    :label="t('teacher.planUpgradeVodafoneUploadLabel')"
                    :hint="t('teacher.planUpgradeVodafoneUploadHint')"
                    accept="image/*,.pdf"
                    :disabled="checkout.vodafone.isUploading"
                  />
                  <span v-if="checkout.vodafone.error" class="teacher-plan-checkout__vodafone-error">
                    {{ checkout.vodafone.error }}
                  </span>
                  <UiInput
                    v-model="checkout.vodafone.transferReference"
                    :label="t('teacher.planUpgradeVodafoneReferenceLabel')"
                    :disabled="checkout.vodafone.isUploading"
                  />
                  <UiTextarea
                    v-model="checkout.vodafone.notes"
                    :label="t('teacher.planUpgradeVodafoneNotesLabel')"
                    :rows="3"
                    :disabled="checkout.vodafone.isUploading"
                  />
                </div>

                <div v-if="vodafoneSupportDetails" class="teacher-plan-checkout__vodafone-support">
                  <span v-if="vodafoneSupportDetails.email">
                    {{ t('teacher.planUpgradeVodafoneSupportEmail', { email: vodafoneSupportDetails.email }) }}
                  </span>
                  <span v-if="vodafoneSupportDetails.phone">
                    {{ t('teacher.planUpgradeVodafoneSupportPhone', { phone: vodafoneSupportDetails.phone }) }}
                  </span>
                </div>

                <div class="teacher-plan-checkout__actions">
                  <UiButton
                    variant="outline"
                    color="secondary"
                    :disabled="checkout.vodafone.isUploading"
                    @click="goBackToMethod"
                  >
                    {{ t('teacher.planUpgradeCheckoutBack') }}
                  </UiButton>
                  <UiButton
                    color="primary"
                    :disabled="checkout.vodafone.isUploading"
                    @click="submitVodafoneReceipt"
                  >
                    {{ t('teacher.planUpgradeVodafoneSubmit') }}
                  </UiButton>
                </div>
              </template>
            </UiCard>
          </section>
          </div>
        </template>
      </template>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryValue } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiRadioGroup, { type UiRadioOption } from '@/components/ui/UiRadioGroup.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import paypalIcon from '@/assets/icons/paypal.png';
import vodafoneIcon from '@/assets/icons/vodafone.png';
import visaLogo from '@/assets/payment/visa.svg';
import mastercardLogo from '@/assets/payment/Mastercard.svg';
import { useToast } from '@/composables/useToast';
import { useVisibilityRefresh } from '@/composables/useVisibilityRefresh';
import {
  fetchTeacherPricing,
  type TeacherPlanMarketingContent,
  type TeacherPlanPricing,
  type TeacherPricingResponse
} from '@/services/teacherPlans';
import {
  createPaypalOrder,
  createPaymobPayment,
  createVodafonePaymentRequest,
  fetchPaymobPaymentStatus,
  uploadVodafoneReceipt,
  type PaypalCreateOrderResponse,
  type PaymobPaymentStatusResponse,
  type VodafoneCashRequestResponse
} from '@/services/teacherSubscriptions';
import { useFeaturesStore } from '@/stores/features';
import { useTeacherPlanCheckoutStore } from '@/stores/teacherPlanCheckout';
import { useTeacherProfileStore } from '@/stores/teacherProfile';
import { useSubscriptionStore } from '@/stores/subscription';
import type { TeacherPlanOption } from '@/types/teacherPlans';

type CheckoutStage = 'method' | 'vodafone';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const featuresStore = useFeaturesStore();
const checkoutStore = useTeacherPlanCheckoutStore();
const teacherProfileStore = useTeacherProfileStore();
const subscriptionStore = useSubscriptionStore();

const TARGET_CURRENCY = 'EGP';
const CARD_PAYMENT_METHOD = 'PAYMOB';
type PaymentLogo = { src: string; alt: string };
const CARD_PAYMENT_LOGOS: readonly PaymentLogo[] = Object.freeze([
  { src: visaLogo, alt: 'Visa' },
  { src: mastercardLogo, alt: 'Mastercard' }
]);

const DEFAULT_PAYMENT_METHODS = ['VODAFONE_CASH', 'PAYPAL', 'PAYMOB'] as const;

const normalizePaymentMethods = (methods: string[] | null | undefined): string[] => {
  if (!Array.isArray(methods)) {
    return [];
  }

  return Array.from(
    new Set(
      methods
        .map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : ''))
        .filter((code) => code)
    )
  );
};

const ensureDefaultPaymentMethods = (methods: string[] | null | undefined): string[] => {
  const normalized = normalizePaymentMethods(methods ?? []);
  return normalizePaymentMethods([...normalized, ...DEFAULT_PAYMENT_METHODS]);
};

const mergePaymentMethods = (
  existing: string[] | null | undefined,
  incoming: string[] | null | undefined
): string[] => {
  const normalizedExisting = normalizePaymentMethods(existing ?? []);
  const normalizedIncoming = normalizePaymentMethods(incoming ?? []);
  return ensureDefaultPaymentMethods([...normalizedExisting, ...normalizedIncoming]);
};
const FALLBACK_PRICING_COUNTRY = 'EG';

const normalizeCountryCode = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed || null;
};

const resolveCurrencyForCountry = (country: string | null | undefined): string | null => {
  void country;
  return TARGET_CURRENCY;
};

const isLoading = ref(false);
const loadError = ref(false);
const activePlan = ref<TeacherPlanOption | null>(checkoutStore.plan);
const paymentMethods = ref<string[]>(ensureDefaultPaymentMethods(checkoutStore.paymentMethods));
const pricingCountry = ref<string | null>(FALLBACK_PRICING_COUNTRY);
const pricingCurrency = ref<string | null>(TARGET_CURRENCY);
const detectedCountry = ref<string | null>(FALLBACK_PRICING_COUNTRY);
const usedFallbackPricing = ref(false);
const fallbackSourceCountry = ref<string | null>(null);

const checkout = reactive({
  stage: 'method' as CheckoutStage,
  selectedMethod: null as string | null,
  isProcessing: false,
  vodafone: {
    request: null as VodafoneCashRequestResponse | null,
    files: [] as File[],
    transferReference: '',
    notes: '',
    isUploading: false,
    error: null as string | null
  }
});

const isPaymobReturnRoute = computed(() => route.name === 'teacher-paymob-return');

const paymobReturnState = reactive({
  isLoading: false,
  status: '',
  success: null as boolean | null,
  merchantOrderId: '',
  transactionId: '',
  amountCents: null as number | null,
  currency: null as string | null,
  error: null as string | null
});

let paymobStatusRequestId = 0;

const paymobStatusLabel = computed(() => {
  const normalized = paymobReturnState.status ? paymobReturnState.status.toUpperCase() : '';
  if (!normalized) {
    return t('teacher.planUpgradePaymobReturnStatusUnknown');
  }
  if (normalized === 'SUCCEEDED') {
    return t('teacher.planUpgradePaymobReturnStatusSucceeded');
  }
  if (normalized === 'FAILED') {
    return t('teacher.planUpgradePaymobReturnStatusFailed');
  }
  if (normalized === 'PENDING') {
    return t('teacher.planUpgradePaymobReturnStatusPending');
  }
  return normalized;
});

const paymobStatusHeading = computed(() => {
  if (paymobReturnState.error) {
    return t('teacher.planUpgradePaymobReturnFailureTitle');
  }
  if (paymobReturnState.success === true) {
    return t('teacher.planUpgradePaymobReturnSuccessTitle');
  }
  if (paymobReturnState.success === false) {
    return t('teacher.planUpgradePaymobReturnFailureTitle');
  }
  if (paymobReturnState.isLoading) {
    return t('teacher.planUpgradePaymobReturnChecking');
  }
  return t('teacher.planUpgradePaymobReturnPendingTitle');
});

const paymobStatusDescription = computed(() => {
  if (paymobReturnState.error) {
    return paymobReturnState.error;
  }
  if (paymobReturnState.success === true) {
    return t('teacher.planUpgradePaymobReturnSuccessDescription');
  }
  if (paymobReturnState.success === false) {
    return t('teacher.planUpgradePaymobReturnFailureDescription');
  }
  if (paymobReturnState.isLoading) {
    return t('teacher.planUpgradePaymobReturnCheckingDescription');
  }
  return t('teacher.planUpgradePaymobReturnPendingDescription');
});

const paymobReturnDetailsAvailable = computed(
  () =>
    !!paymobReturnState.merchantOrderId ||
    !!paymobReturnState.transactionId ||
    paymobReturnState.amountCents !== null ||
    !!paymobReturnState.status
);

const resetPaymobStatus = () => {
  paymobStatusRequestId += 1;
  paymobReturnState.isLoading = false;
  paymobReturnState.status = '';
  paymobReturnState.success = null;
  paymobReturnState.merchantOrderId = '';
  paymobReturnState.transactionId = '';
  paymobReturnState.amountCents = null;
  paymobReturnState.currency = null;
  paymobReturnState.error = null;
};

const extractMerchantOrderId = (query: LocationQuery): string | null => {
  const candidates = [
    query.merchant_order_id,
    query.merchantOrderId,
    query.order,
    query.orderId
  ];
  for (const raw of candidates) {
    if (Array.isArray(raw)) {
      const value = raw.find((item) => typeof item === 'string' && item.trim().length > 0);
      if (value) {
        return value.trim();
      }
    } else if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
  }
  return null;
};

const buildPaymobVerificationParams = (query: LocationQuery): Record<string, string> => {
  const params: Record<string, string> = {};
  for (const key of Object.keys(query)) {
    const normalized = firstQueryValue(query[key]);
    if (normalized) {
      params[key] = normalized;
    }
  }
  return params;
};

const firstQueryValue = (
  value: LocationQueryValue | LocationQueryValue[] | undefined
): string | null => {
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === 'string' && item.trim().length > 0);
    return found ? found.trim() : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const parseBooleanQueryParam = (
  value: LocationQueryValue | LocationQueryValue[] | undefined
): boolean | null => {
  const raw = firstQueryValue(value);
  if (!raw) {
    return null;
  }
  const normalized = raw.toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalized)) {
    return false;
  }
  return null;
};

const parseIntegerQueryParam = (
  value: LocationQueryValue | LocationQueryValue[] | undefined
): number | null => {
  const raw = firstQueryValue(value);
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCurrencyCode = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

const applyPaymobReturnQuery = (query: LocationQuery) => {
  const merchantOrderId = extractMerchantOrderId(query);
  if (merchantOrderId) {
    paymobReturnState.merchantOrderId = merchantOrderId;
  }

  const transactionId =
    firstQueryValue(query['transaction_id']) ??
    firstQueryValue(query['id']) ??
    firstQueryValue(query['transactionId']) ??
    firstQueryValue(query['order']);
  if (transactionId) {
    paymobReturnState.transactionId = transactionId;
  }

  const amountCents = parseIntegerQueryParam(query['amount_cents'] ?? query['amountCents']);
  if (amountCents !== null) {
    paymobReturnState.amountCents = amountCents;
  }

  const currency = normalizeCurrencyCode(
    firstQueryValue(query['currency']) ??
      firstQueryValue(query['currency_iso']) ??
      firstQueryValue(query['currencyIso'])
  );
  if (currency) {
    paymobReturnState.currency = currency;
  }

  const pending = parseBooleanQueryParam(
    query['pending'] ?? query['is_pending'] ?? query['isPending']
  );
  const success = parseBooleanQueryParam(
    query['success'] ?? query['is_success'] ?? query['isSuccess']
  );
  const failure = parseBooleanQueryParam(
    query['error_occured'] ?? query['errorOccurred'] ?? query['error']
  );

  if (pending === true) {
    paymobReturnState.status = 'PENDING';
    paymobReturnState.success = null;
  } else if (success === true) {
    paymobReturnState.status = 'SUCCEEDED';
    paymobReturnState.success = true;
  } else if (success === false || failure === true) {
    paymobReturnState.status = 'FAILED';
    paymobReturnState.success = false;
  }
};

const ensurePaymobStatus = async () => {
  const merchantOrderId = extractMerchantOrderId(route.query);
  if (!merchantOrderId) {
    resetPaymobStatus();
    paymobReturnState.error = t('teacher.planUpgradePaymobReturnMissingOrder');
    return;
  }
  paymobStatusRequestId += 1;
  const requestId = paymobStatusRequestId;
  paymobReturnState.isLoading = true;
  paymobReturnState.error = null;
  paymobReturnState.merchantOrderId = merchantOrderId;
  try {
    const verificationParams = buildPaymobVerificationParams(route.query);
    const response: PaymobPaymentStatusResponse = await fetchPaymobPaymentStatus(
      merchantOrderId,
      verificationParams
    );
    if (requestId !== paymobStatusRequestId) {
      return;
    }
    paymobReturnState.status = response.status ?? '';
    paymobReturnState.merchantOrderId = response.merchantOrderId ?? merchantOrderId;
    paymobReturnState.transactionId = response.transactionId ?? '';
    paymobReturnState.amountCents = response.amountCents ?? null;
    paymobReturnState.currency = response.currency ?? null;
    const normalized = response.status ? response.status.toUpperCase() : '';
    if (normalized === 'SUCCEEDED') {
      paymobReturnState.success = true;
    } else if (normalized === 'FAILED') {
      paymobReturnState.success = false;
    } else {
      paymobReturnState.success = null;
    }
  } catch (error) {
    if (requestId !== paymobStatusRequestId) {
      return;
    }
    console.error('[TeacherPlanCheckout] Failed to fetch Paymob payment status', error);
    paymobReturnState.status = '';
    paymobReturnState.success = null;
    paymobReturnState.error = t('teacher.planUpgradePaymobReturnError');
  } finally {
    if (requestId === paymobStatusRequestId) {
      paymobReturnState.isLoading = false;
    }
  }
};

const isRefreshingAfterPaymentSuccess = ref(false);

const refreshAfterPaymentSuccess = async () => {
  if (isRefreshingAfterPaymentSuccess.value) {
    return;
  }
  isRefreshingAfterPaymentSuccess.value = true;
  console.info('[TeacherPlanCheckout] Starting refresh after payment success');
  try {
    await Promise.allSettled([
      (async () => {
        try {
          await featuresStore.refresh();
        } catch (error) {
          console.warn(
            '[TeacherPlanCheckout] Failed to refresh feature flags after payment success',
            error
          );
        }
      })(),
      (async () => {
        try {
          await teacherProfileStore.load(true);
        } catch (error) {
          console.warn(
            '[TeacherPlanCheckout] Failed to refresh teacher profile after payment success',
            error
          );
        }
      })()
    ]);
    try {
      await subscriptionStore.loadSubscription(true);
    } catch (error) {
      console.warn(
        '[TeacherPlanCheckout] Failed to refresh subscription details after payment success',
        error
      );
    }
    subscriptionStore.startTemporaryPolling();
    console.info('[TeacherPlanCheckout] Completed refresh after payment success');
  } finally {
    isRefreshingAfterPaymentSuccess.value = false;
  }
};

const priceLocale = computed(() =>
  locale.value && locale.value.startsWith('ar') ? 'en-US' : locale.value || 'en-US'
);

const planCodeFromRoute = computed(() => {
  const raw = route.query.planCode;
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  if (typeof raw === 'string' && raw.trim().length) {
    return raw.trim();
  }
  return null;
});

watch(
  () => paymentMethods.value,
  (methods) => {
    if (!methods.length) {
      checkout.selectedMethod = null;
      return;
    }
    const preferred = checkout.selectedMethod;
    if (preferred && methods.includes(preferred)) {
      return;
    }
    checkout.selectedMethod = methods[0] ?? null;
  },
  { immediate: true, deep: true }
);

watch(
  () => checkout.vodafone.files.length,
  (length) => {
    if (length > 0) {
      checkout.vodafone.error = null;
    }
  }
);

watch(
  () => activePlan.value?.planCode,
  (next, previous) => {
    if (next && next !== previous) {
      resetCheckoutState();
    }
  }
);

watch(
  () => activePlan.value?.country,
  () => {
    pricingCountry.value = FALLBACK_PRICING_COUNTRY;
    if (!pricingCurrency.value) {
      pricingCurrency.value = TARGET_CURRENCY;
    }
  },
  { immediate: true }
);

watch(
  () => activePlan.value?.currency,
  (currency) => {
    if (currency) {
      void currency;
      pricingCurrency.value = TARGET_CURRENCY;
    }
  },
  { immediate: true }
);

watch(
  () => route.query,
  (query) => {
    if (isPaymobReturnRoute.value) {
      applyPaymobReturnQuery(query);
      void ensurePaymobStatus();
    }
  },
  { deep: true }
);

watch(isPaymobReturnRoute, (isReturn, wasReturn) => {
  if (isReturn) {
    applyPaymobReturnQuery(route.query);
    void ensurePaymobStatus();
    return;
  }
  if (wasReturn) {
    resetPaymobStatus();
    if (!activePlan.value) {
      void loadPlan();
    }
  }
});

watch(
  () => paymobReturnState.success,
  (success) => {
    if (success === true) {
      void refreshAfterPaymentSuccess();
    }
  }
);

const resetVodafoneState = () => {
  checkout.vodafone.request = null;
  checkout.vodafone.files = [];
  checkout.vodafone.transferReference = '';
  checkout.vodafone.notes = '';
  checkout.vodafone.isUploading = false;
  checkout.vodafone.error = null;
};

const resetCheckoutState = () => {
  const methods = ensureDefaultPaymentMethods(paymentMethods.value);
  paymentMethods.value = methods;
  checkout.stage = 'method';
  checkout.selectedMethod = methods[0] ?? null;
  checkout.isProcessing = false;
  resetVodafoneState();
};

const PAYMENT_METHOD_CONTENT: Record<
  string,
  { labelKey: string; descriptionKey: string; order: number; icon?: string | null }
> = {
  VODAFONE_CASH: {
    labelKey: 'teacher.planUpgradePaymentMethod.VODAFONE_CASH.label',
    descriptionKey: 'teacher.planUpgradePaymentMethod.VODAFONE_CASH.description',
    order: 0,
    icon: vodafoneIcon
  },
  PAYPAL: {
    labelKey: 'teacher.planUpgradePaymentMethod.PAYPAL.label',
    descriptionKey: 'teacher.planUpgradePaymentMethod.PAYPAL.description',
    order: 1,
    icon: paypalIcon
  },
  PAYMOB: {
    labelKey: 'teacher.planUpgradePaymentMethod.PAYMOB.label',
    descriptionKey: 'teacher.planUpgradePaymentMethod.PAYMOB.description',
    order: 2,
    icon: null
  }
};

type PaymentMethodEntry = {
  code: string;
  label: string;
  description: string;
  icon: string | null;
  iconAlt: string;
  logos: PaymentMethodLogos;
};

type PaymentMethodLogos = readonly PaymentLogo[] | null;

const paymentMethodEntries = computed<PaymentMethodEntry[]>(() => {
  const methods = normalizePaymentMethods(paymentMethods.value);
  methods.sort((left, right) => {
    const leftOrder = PAYMENT_METHOD_CONTENT[left]?.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = PAYMENT_METHOD_CONTENT[right]?.order ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
  return methods.map((code) => {
    const content = PAYMENT_METHOD_CONTENT[code];
    const label = content ? t(content.labelKey as any) : code;
    const logos: PaymentMethodLogos = code === CARD_PAYMENT_METHOD ? CARD_PAYMENT_LOGOS : null;
    return {
      code,
      label,
      description: content
        ? t(content.descriptionKey as any)
        : t('teacher.planUpgradePaymentMethodsFallback'),
      icon: content?.icon ?? null,
      iconAlt: label,
      logos
    };
  });
});

watch(planCodeFromRoute, () => {
  void loadPlan();
});

const paymentOptions = computed<UiRadioOption[]>(() =>
  paymentMethodEntries.value.map((method) => ({
    label: method.label,
    value: method.code,
    description: method.description,
    icon: method.icon,
    iconAlt: method.iconAlt,
    logos: method.logos ?? undefined
  }))
);

const hasPaymentMethods = computed(() => paymentMethodEntries.value.length > 0);

const pricingCountryName = computed(() => {
  const code = pricingCountry.value;
  if (!code) {
    return null;
  }
  const key = `teacher.planUpgradeCountry.${code}`;
  const localized = t(key as any);
  return localized === key ? code : localized;
});

const pricingCurrencyDisplay = computed(() => pricingCurrency.value ?? TARGET_CURRENCY);

const pricingContextText = computed(() => {
  const country = pricingCountryName.value;
  const currency = pricingCurrencyDisplay.value;
  if (country && currency) {
    return t('teacher.planUpgradeMeta.description', { country, currency });
  }
  if (country) {
    return t('teacher.planUpgradeMeta.countryOnly', { country });
  }
  if (currency) {
    return t('teacher.planUpgradeMeta.currencyOnly', { currency });
  }
  return '';
});

const pricingNoticeText = computed(() => '');

const fallbackNoticeText = computed(() => '');

type PlanBlueprint = {
  key: string;
  titleKey: string;
  taglineKey: string;
  priceFallbackKey: string;
  bestForKey: string;
  featureKeys: string[];
  fallbackPricing?: {
    amount: number;
    currency: string;
  };
};

const PLAN_BLUEPRINTS: PlanBlueprint[] = [
  {
    key: 'free',
    titleKey: 'teacher.planFree',
    taglineKey: 'teacher.planUpgradeFreeTagline',
    priceFallbackKey: 'teacher.planUpgradeFreePrice',
    bestForKey: 'teacher.planUpgradeFreeBestFor',
    featureKeys: [
      'teacher.planUpgradeFreeFeatures.courses',
      'teacher.planUpgradeFreeFeatures.students',
      'teacher.planUpgradeFreeFeatures.analytics'
    ],
    fallbackPricing: {
      amount: 0,
      currency: 'EGP'
    }
  },
  {
    key: 'basic',
    titleKey: 'teacher.planBasic',
    taglineKey: 'teacher.planUpgradeBasicTagline',
    priceFallbackKey: 'teacher.planUpgradeBasicPrice',
    bestForKey: 'teacher.planUpgradeBasicBestFor',
    featureKeys: [
      'teacher.planUpgradeBasicFeatures.courses',
      'teacher.planUpgradeBasicFeatures.students',
      'teacher.planUpgradeBasicFeatures.sessions'
    ],
    fallbackPricing: {
      amount: 399,
      currency: 'EGP'
    }
  },
  {
    key: 'pro',
    titleKey: 'teacher.planPro',
    taglineKey: 'teacher.planUpgradeProTagline',
    priceFallbackKey: 'teacher.planUpgradeProPrice',
    bestForKey: 'teacher.planUpgradeProBestFor',
    featureKeys: [
      'teacher.planUpgradeProFeatures.reports',
      'teacher.planUpgradeProFeatures.automations',
      'teacher.planUpgradeProFeatures.support',
      'teacher.planUpgradeProFeatures.assistants'
    ],
    fallbackPricing: {
      amount: 699,
      currency: 'EGP'
    }
  },
  {
    key: 'enterprise',
    titleKey: 'teacher.planEnterprise',
    taglineKey: 'teacher.planUpgradeEnterpriseTagline',
    priceFallbackKey: 'teacher.planUpgradeEnterprisePrice',
    bestForKey: 'teacher.planUpgradeEnterpriseBestFor',
    featureKeys: [
      'teacher.planUpgradeEnterpriseFeatures.support',
      'teacher.planUpgradeEnterpriseFeatures.customization',
      'teacher.planUpgradeEnterpriseFeatures.contact'
    ]
  }
];

type FormattedPlanPrice = {
  display: string;
  amount: number | null;
  currency: string | null;
};

const getFractionDigits = (currency: string | null | undefined) => {
  if (!currency) {
    return 2;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).resolvedOptions().maximumFractionDigits;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TeacherPlanCheckout] Unable to resolve fraction digits for', currency, error);
    }
    return 2;
  }
};

const formatPlanPrice = (
  pricing: TeacherPlanPricing,
  fallback: string,
  localeTag: string,
  options?: {
    fallbackAmount: number | null;
    fallbackCurrency: string | null;
    periodKey: string | null;
  }
): FormattedPlanPrice => {
  const amountMinor = pricing.amountMinor;
  const currency = pricing.currency ?? options?.fallbackCurrency ?? pricingCurrencyDisplay.value ?? null;
  const period = options?.periodKey ? t(options.periodKey as any) : null;

  if (typeof amountMinor !== 'number' || !currency) {
    const amount = options?.fallbackAmount ?? null;
    if (amount !== null && currency) {
      try {
        const formatter = new Intl.NumberFormat(localeTag, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        const formatted = formatter.format(amount);
        const display = period ? `${formatted} / ${period}` : formatted;
        return {
          display,
          amount,
          currency
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[TeacherPlanCheckout] Unable to format fallback price', currency, error);
        }
      }
    }
    return {
      display: fallback,
      amount: options?.fallbackAmount ?? null,
      currency: currency ?? null
    };
  }

  const digits = getFractionDigits(currency);
  const amount = amountMinor / Math.pow(10, digits);
  try {
    const formatter = new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const formatted = formatter.format(amount);
    const display = period ? `${formatted} / ${period}` : formatted;

    return {
      display,
      amount,
      currency
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TeacherPlanCheckout] Unable to format currency', currency, error);
    }
    const fallbackAmount = Math.round(amount);
    const fallbackDisplay = `${fallbackAmount.toString()} ${currency}`;
    const display = period ? `${fallbackDisplay} / ${period}` : fallbackDisplay;
    return {
      display,
      amount,
      currency
    };
  }
};

const formatYearlyPrice = (amount: number, currency: string, localeTag: string) => {
  const yearlyAmount = amount * 10;
  const formatter = new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const formatted = formatter.format(yearlyAmount);
  const period = t('teacher.planUpgradePerYear');
  return `${formatted} / ${period}`;
};

const normalizeLocaleKey = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const findMarketingEntry = (
  marketing?: Record<string, TeacherPlanMarketingContent> | null
): TeacherPlanMarketingContent | null => {
  if (!marketing) {
    return null;
  }
  const entries = new Map<string, TeacherPlanMarketingContent>();
  Object.entries(marketing).forEach(([key, content]) => {
    const normalizedKey = normalizeLocaleKey(key);
    if (!normalizedKey || !content) {
      return;
    }
    entries.set(normalizedKey, content);
  });
  const activeLocale = normalizeLocaleKey(locale.value);
  if (activeLocale) {
    const exact = entries.get(activeLocale);
    if (exact) {
      return exact;
    }
    const base = normalizeLocaleKey(activeLocale.split('-')[0]);
    if (base) {
      const baseMatch = entries.get(base);
      if (baseMatch) {
        return baseMatch;
      }
    }
  }
  const english = entries.get('en');
  if (english) {
    return english;
  }
  const iterator = entries.values().next();
  return iterator.done ? null : iterator.value;
};

const resolveMarketingForPlan = (
  plan: PlanBlueprint,
  pricing?: TeacherPlanPricing
) => {
  const marketingEntry = findMarketingEntry(pricing?.marketingCopy ?? null);
  const fallbackIncludes = plan.featureKeys.map((featureKey) => t(featureKey as any));
  if (!marketingEntry) {
    return {
      tagline: t(plan.taglineKey as any),
      bestFor: t(plan.bestForKey as any),
      includes: fallbackIncludes
    };
  }
  const tagline = marketingEntry.tagline?.trim() ?? '';
  const bestFor = marketingEntry.bestFor?.trim() ?? '';
  const includes = (marketingEntry.includes ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => !!item && item.length > 0);
  return {
    tagline: tagline || t(plan.taglineKey as any),
    bestFor: bestFor || t(plan.bestForKey as any),
    includes: includes.length ? includes : fallbackIncludes
  };
};

const applyPlanBlueprintFallbacks = (
  entries: Record<string, TeacherPlanPricing>,
  options: { currency: string | null }
): Record<string, TeacherPlanPricing> => {
  const next = { ...entries };
  PLAN_BLUEPRINTS.forEach((blueprint) => {
    if (next[blueprint.key]) {
      return;
    }
    next[blueprint.key] = {
      code: blueprint.key,
      name: t(blueprint.titleKey as any),
      description: t(blueprint.taglineKey as any),
      amountMinor: null,
      currency: options.currency ?? null,
      formattedAmount: t(blueprint.priceFallbackKey as any),
      marketingCopy: null
    };
  });
  return next;
};

const normalizePricing = (pricing: TeacherPlanPricing[]): Record<string, TeacherPlanPricing> => {
  return pricing.reduce<Record<string, TeacherPlanPricing>>((accumulator, entry) => {
    if (!entry || typeof entry.code !== 'string') {
      return accumulator;
    }
    const key = entry.code.trim().toLowerCase();
    if (!key) {
      return accumulator;
    }
    accumulator[key] = entry;
    return accumulator;
  }, {});
};

const derivePlanFromPricing = (
  pricing: Record<string, TeacherPlanPricing>,
  planCode: string
): TeacherPlanOption | null => {
  const localeTag = priceLocale.value;
  const normalizedTarget = planCode.trim().toLowerCase();
  const entry = Object.entries(pricing).find(([key, plan]) => {
    const code = plan.code?.trim().toLowerCase() || '';
    const normalizedKey = key.trim().toLowerCase();
    return code === normalizedTarget || normalizedKey === normalizedTarget;
  });

  if (!entry) {
    return null;
  }

  const [key, planPricing] = entry;
  const blueprint = PLAN_BLUEPRINTS.find((plan) => plan.key === key);
  const isContactOnly = key === 'enterprise';
  const fallbackDisplay = blueprint
    ? t(blueprint.priceFallbackKey as any)
    : planPricing.formattedAmount ?? '--';
  const monthly = formatPlanPrice(planPricing, fallbackDisplay, localeTag, {
    fallbackAmount: blueprint?.fallbackPricing?.amount ?? null,
    fallbackCurrency:
      blueprint?.fallbackPricing?.currency ?? planPricing.currency ?? pricingCurrencyDisplay.value ?? null,
    periodKey: isContactOnly ? null : 'teacher.planUpgradePerMonth'
  });
  const marketing = blueprint ? resolveMarketingForPlan(blueprint, planPricing) : null;
  const tagline = marketing?.tagline?.trim() || planPricing.description?.trim() || '';
  const includes = (marketing?.includes ?? [])
    .map((item) => item?.trim())
    .filter((item): item is string => !!item && item.length > 0);
  const featureList = includes.length
    ? includes
    : planPricing.description
      ? [planPricing.description]
      : [t('teacher.planUpgradeFeaturesFallback')];
  const yearlyPrice =
    !isContactOnly && monthly.amount !== null && monthly.amount > 0 && monthly.currency
      ? formatYearlyPrice(monthly.amount, monthly.currency, localeTag)
      : null;
  const title = blueprint ? t(blueprint.titleKey as any) : planPricing.name ?? planPricing.code;
  const contactLabel = isContactOnly
    ? t('teacher.planUpgradeEnterprisePrice')
    : '';

  return {
    key,
    planCode: planPricing.code?.trim() || key,
    title,
    tagline,
    monthlyPrice: monthly.display,
    monthlyAmount: monthly.amount,
    currency: monthly.currency ?? planPricing.currency ?? pricingCurrencyDisplay.value ?? null,
    country: pricingCountry.value,
    yearlyPrice,
    bestFor: marketing?.bestFor?.trim() || t('teacher.planUpgradeBestForFallback'),
    features: Array.from(new Set(featureList)),
    isContactOnly,
    isCurrentPlan: false,
    contactHref: null,
    contactLabel
  };
};

const applyPricingResponse = (
  pricing: TeacherPricingResponse,
  requestedCountry: string | null
) => {
  const resolvedCountry =
    normalizeCountryCode(pricing.country) ?? normalizeCountryCode(requestedCountry) ?? FALLBACK_PRICING_COUNTRY;
  pricingCountry.value = FALLBACK_PRICING_COUNTRY;
  detectedCountry.value = FALLBACK_PRICING_COUNTRY;
  const normalizedCurrency = pricing.currency ? pricing.currency.toUpperCase() : null;
  const resolvedCurrency =
    normalizedCurrency ?? resolveCurrencyForCountry(resolvedCountry) ?? resolveCurrencyForCountry(FALLBACK_PRICING_COUNTRY);
  pricingCurrency.value = resolvedCurrency ?? TARGET_CURRENCY;
  const normalizedPlans = normalizePricing(pricing.plans ?? []);
  const withFallbacks = applyPlanBlueprintFallbacks(normalizedPlans, { currency: resolvedCurrency });
  paymentMethods.value = mergePaymentMethods(paymentMethods.value, pricing.availablePaymentMethods);
  return {
    resolvedCountry,
    withFallbacks,
    planCount: Array.isArray(pricing.plans) ? pricing.plans.length : 0
  };
};

const resolvePlanForCountry = async (country: string | null) => {
  const label = country ?? 'auto';
  console.info('[TeacherPlanCheckout] Loading pricing for country', label, 'plan', planCodeFromRoute.value ?? '');
  const pricing = await fetchTeacherPricing(country);
  const response = applyPricingResponse(pricing, country);
  const plan = planCodeFromRoute.value
    ? derivePlanFromPricing(response.withFallbacks, planCodeFromRoute.value)
    : null;
  return { response, plan };
};

const loadPlan = async () => {
  if (activePlan.value && (!planCodeFromRoute.value || activePlan.value.planCode === planCodeFromRoute.value)) {
    return;
  }

  if (!planCodeFromRoute.value) {
    activePlan.value = null;
    paymentMethods.value = [];
    resetCheckoutState();
    return;
  }

  isLoading.value = true;
  loadError.value = false;
  usedFallbackPricing.value = false;
  fallbackSourceCountry.value = null;

  try {
    const primary = await resolvePlanForCountry(null);
    let active = primary.plan;

    if (!active || primary.response.planCount === 0) {
      usedFallbackPricing.value = true;
      fallbackSourceCountry.value = primary.response.resolvedCountry ?? null;
      console.info(
        '[TeacherPlanCheckout] No matching plan for country, falling back to',
        FALLBACK_PRICING_COUNTRY
      );
      const fallback = await resolvePlanForCountry(FALLBACK_PRICING_COUNTRY);
      active = fallback.plan;
      if (!active) {
        toast.warning({ detail: t('teacher.planUpgradeNoPlans') });
        activePlan.value = null;
        paymentMethods.value = [];
        resetCheckoutState();
        return;
      }
      if (active.isContactOnly) {
        toast.info({ detail: t('teacher.planUpgradePaymentMethodsUnavailable') });
      }
      activePlan.value = active;
      return;
    }

    activePlan.value = active;
    if (active.isContactOnly) {
      toast.info({ detail: t('teacher.planUpgradePaymentMethodsUnavailable') });
    }
  } catch (error) {
    console.error('[TeacherPlanCheckout] Failed to load plan', error);
    try {
      usedFallbackPricing.value = true;
      fallbackSourceCountry.value = detectedCountry.value ?? null;
      const fallback = await resolvePlanForCountry(FALLBACK_PRICING_COUNTRY);
      const active = fallback.plan;
      if (!active) {
        toast.warning({ detail: t('teacher.planUpgradeNoPlans') });
        activePlan.value = null;
        paymentMethods.value = [];
        resetCheckoutState();
        loadError.value = true;
        return;
      }
      activePlan.value = active;
      if (active.isContactOnly) {
        toast.info({ detail: t('teacher.planUpgradePaymentMethodsUnavailable') });
      }
      loadError.value = false;
    } catch (fallbackError) {
      console.error('[TeacherPlanCheckout] Fallback pricing load failed', fallbackError);
      loadError.value = true;
      activePlan.value = null;
      paymentMethods.value = [];
      pricingCountry.value = FALLBACK_PRICING_COUNTRY;
      pricingCurrency.value = resolveCurrencyForCountry(FALLBACK_PRICING_COUNTRY);
      resetCheckoutState();
    }
  } finally {
    isLoading.value = false;
  }
};

const pageTitle = computed(() => {
  if (isPaymobReturnRoute.value) {
    return t('teacher.planUpgradePaymobReturnTitle');
  }
  if (activePlan.value) {
    return t('teacher.planUpgradeCheckoutTitle', { plan: activePlan.value.title });
  }
  return t('teacher.planUpgradeCheckoutTitleGeneric');
});

const pageSubtitle = computed(() => {
  if (isPaymobReturnRoute.value) {
    return t('teacher.planUpgradePaymobReturnSubtitle');
  }
  if (activePlan.value) {
    return t('teacher.planUpgradeCheckoutSubtitle', { plan: activePlan.value.title });
  }
  return '';
});

const vodafoneInstructions = computed(() => {
  const request = checkout.vodafone.request;
  if (!request) {
    return '';
  }
  const localeKey = locale.value?.toLowerCase() ?? 'en';
  const preferArabic = localeKey.startsWith('ar');
  const preferred = preferArabic ? request.instructionsAr : request.instructionsEn;
  const fallback = preferArabic ? request.instructionsEn : request.instructionsAr;
  return preferred?.trim() || fallback?.trim() || '';
});

const vodafoneInstructionLines = computed(() => {
  const instructions = vodafoneInstructions.value;
  if (!instructions) {
    return [] as string[];
  }
  return instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
});

const formatCurrencyDisplay = (
  amountMinor: number | null | undefined,
  currency: string | null | undefined
) => {
  if (amountMinor === null || amountMinor === undefined) {
    return null;
  }
  const resolvedCurrency = currency ?? pricingCurrencyDisplay.value;
  if (!resolvedCurrency) {
    return null;
  }
  const digits = getFractionDigits(resolvedCurrency);
  const amount = amountMinor / Math.pow(10, digits);
  try {
    const formatter = new Intl.NumberFormat(priceLocale.value, {
      style: 'currency',
      currency: resolvedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  } catch (error) {
    console.warn('[TeacherPlanCheckout] Unable to format currency', resolvedCurrency, error);
    return `${Math.round(amount).toString()} ${resolvedCurrency}`;
  }
};

const computePaypalAmountMinor = (response: PaypalCreateOrderResponse): number | null => {
  if (typeof response.paypalAmountMinor === 'number') {
    return response.paypalAmountMinor;
  }
  const rate = typeof response.fxRateUsed === 'number' ? response.fxRateUsed : Number(response.fxRateUsed);
  if (typeof response.amountMinor === 'number' && Number.isFinite(rate)) {
    const egpMajor = response.amountMinor / 100;
    const usdMajor = egpMajor * rate;
    return Math.round(usdMajor * 100);
  }
  return null;
};

const paymobAmountDisplay = computed(() =>
  formatCurrencyDisplay(paymobReturnState.amountCents, paymobReturnState.currency)
);

const vodafoneAmountDisplay = computed(() =>
  formatCurrencyDisplay(checkout.vodafone.request?.amountMinor ?? null, checkout.vodafone.request?.currency ?? null)
);

const vodafoneWalletDisplay = computed(() => checkout.vodafone.request?.walletNumber?.trim() || null);

const vodafoneSupportDetails = computed(() => {
  const email = checkout.vodafone.request?.supportEmail?.trim() ?? '';
  const phone = checkout.vodafone.request?.supportPhone?.trim() ?? '';
  if (!email && !phone) {
    return null;
  }
  return {
    email: email || null,
    phone: phone || null
  };
});

const goBackToPlans = () => {
  checkoutStore.clear();
  router.push({ name: 'teacher-plan-upgrade' }).catch(() => {
    // ignore redundant navigation
  });
};

const goBackToMethod = () => {
  checkout.stage = 'method';
  checkout.isProcessing = false;
  resetVodafoneState();
};

const confirmCheckout = async () => {
  if (!activePlan.value || !checkout.selectedMethod) {
    return;
  }
  console.info(
    '[TeacherPlanCheckout] Confirming checkout for plan %s using method %s',
    activePlan.value.planCode,
    checkout.selectedMethod
  );
  if (!hasPaymentMethods.value) {
    toast.warning({ detail: t('teacher.planUpgradePaymentMethodsUnavailable') });
    return;
  }
  if (checkout.selectedMethod === 'PAYPAL') {
    checkout.isProcessing = true;
    try {
      const countryHeader =
        normalizeCountryCode(pricingCountry.value) ?? normalizeCountryCode(detectedCountry.value) ?? null;
      const response = await createPaypalOrder(
        { planCode: activePlan.value.planCode },
        { country: countryHeader }
      );
      const egpDisplay =
        formatCurrencyDisplay(response.amountMinor, response.currency ?? 'EGP') ??
        `${response.currency ?? 'EGP'} ${Math.round((response.amountMinor ?? 0) / 100)}`.trim();
      const paypalMinor = computePaypalAmountMinor(response);
      const usdDisplay =
        formatCurrencyDisplay(paypalMinor, response.paypalCurrency ?? 'USD') ??
        `${response.paypalCurrency ?? 'USD'} ${paypalMinor !== null ? Math.round(paypalMinor / 100) : ''}`.trim();
      const notice = t('teacher.planUpgradePaypalConversionNotice', {
        amountEgp: egpDisplay,
        amountUsd: usdDisplay
      });
      const proceed = window.confirm(notice);
      if (!proceed) {
        console.info('[TeacherPlanCheckout] PayPal checkout cancelled by user');
        return;
      }
      toast.info({ detail: t('teacher.planUpgradePaypalRedirect') });
      console.info('[TeacherPlanCheckout] Redirecting to PayPal approval url');
      window.location.href = response.approveUrl;
    } catch (error) {
      console.error('[TeacherPlanCheckout] Failed to start PayPal order', error);
      toast.error({ detail: t('teacher.planUpgradePaymentFailed') });
    } finally {
      checkout.isProcessing = false;
    }
    return;
  }
  if (checkout.selectedMethod === 'PAYMOB') {
    checkout.isProcessing = true;
    try {
      const countryHeader =
        normalizeCountryCode(pricingCountry.value) ?? normalizeCountryCode(detectedCountry.value) ?? null;
      const response = await createPaymobPayment(
        { planCode: activePlan.value.planCode },
        { country: countryHeader }
      );
      toast.info({ detail: t('teacher.planUpgradePaymobRedirect') });
      const paymobIdentifier = response.merchantOrderId ?? response.id ?? 'unknown';
      console.info(
        '[TeacherPlanCheckout] Redirecting to Paymob iframe for payment request %s',
        paymobIdentifier
      );
      window.location.href = response.iframeUrl;
    } catch (error) {
      console.error('[TeacherPlanCheckout] Failed to start Paymob payment', error);
      toast.error({ detail: t('teacher.planUpgradePaymentFailed') });
    } finally {
      checkout.isProcessing = false;
    }
    return;
  }
  if (checkout.selectedMethod === 'VODAFONE_CASH') {
    checkout.isProcessing = true;
    try {
      const countryHeader =
        normalizeCountryCode(pricingCountry.value) ?? normalizeCountryCode(detectedCountry.value) ?? null;
      const response = await createVodafonePaymentRequest(
        { planCode: activePlan.value.planCode },
        { country: countryHeader }
      );
      checkout.vodafone.request = response;
      console.info(
        '[TeacherPlanCheckout] Created Vodafone Cash payment request %s for teacher plan %s',
        response.paymentRequestId,
        activePlan.value.planCode
      );
      checkout.stage = 'vodafone';
      toast.success({ detail: t('teacher.planUpgradeVodafoneCreated', { invoice: response.invoiceNo }) });
    } catch (error) {
      console.error('[TeacherPlanCheckout] Failed to create Vodafone Cash request', error);
      toast.error({ detail: t('teacher.planUpgradePaymentFailed') });
    } finally {
      checkout.isProcessing = false;
    }
  }
};

const submitVodafoneReceipt = async () => {
  const request = checkout.vodafone.request;
  if (!request) {
    console.warn('[TeacherPlanCheckout] Attempted Vodafone receipt submission without a request');
    return;
  }
  const file = checkout.vodafone.files[0];
  if (!file) {
    checkout.vodafone.error = t('teacher.planUpgradeVodafoneReceiptRequired');
    return;
  }
  checkout.vodafone.isUploading = true;
  console.info(
    '[TeacherPlanCheckout] Uploading Vodafone receipt for request %s with reference %s',
    request.paymentRequestId,
    checkout.vodafone.transferReference
  );
  try {
    await uploadVodafoneReceipt({
      paymentRequestId: request.paymentRequestId,
      file,
      transferReference: checkout.vodafone.transferReference.trim() || undefined,
      notes: checkout.vodafone.notes.trim() || undefined
    });
    toast.success({ detail: t('teacher.planUpgradeVodafoneReceiptSuccess') });
    console.info('[TeacherPlanCheckout] Uploaded Vodafone receipt for request %s', request.paymentRequestId);
    try {
      await refreshAfterPaymentSuccess();
    } catch (error) {
      console.warn('[TeacherPlanCheckout] Failed to refresh state after Vodafone receipt upload', error);
    } finally {
      console.info('[TeacherPlanCheckout] Returning to plans list after Vodafone receipt upload');
      goBackToPlans();
    }
  } catch (error) {
    console.error('[TeacherPlanCheckout] Failed to upload Vodafone receipt', error);
    toast.error({ detail: t('teacher.planUpgradeVodafoneUploadFailed') });
  } finally {
    checkout.vodafone.isUploading = false;
    console.info('[TeacherPlanCheckout] Finished Vodafone receipt submission flow for request %s', request.paymentRequestId);
  }
};

onMounted(() => {
  if (isPaymobReturnRoute.value) {
    applyPaymobReturnQuery(route.query);
    void ensurePaymobStatus();
    return;
  }
  if (
    !activePlan.value ||
    (planCodeFromRoute.value && activePlan.value.planCode.toLowerCase() !== planCodeFromRoute.value.toLowerCase())
  ) {
    void loadPlan();
  }
});

useVisibilityRefresh(
  (reason) => {
    console.debug('[TeacherPlanCheckout] visibility refresh triggered by %s', reason);
    const tasks: Promise<unknown>[] = [subscriptionStore.loadSubscription(true)];
    if (isPaymobReturnRoute.value) {
      tasks.push(ensurePaymobStatus());
    } else {
      tasks.push(featuresStore.ensureLoaded());
      tasks.push(loadPlan());
    }
    void Promise.allSettled(tasks).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.warn('[TeacherPlanCheckout] visibility refresh task failed', result.reason);
        }
      });
    });
  },
  {
    includeActivated: true,
    throttleMs: 750
  }
);

onBeforeUnmount(() => {
  checkoutStore.clear();
  subscriptionStore.stopPolling();
});
</script>

<style scoped lang="scss">
.teacher-plan-checkout {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.teacher-plan-checkout__loading {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-plan-checkout__empty {
  display: grid;
  gap: var(--sakai-space-3);
  justify-items: start;
}

.teacher-plan-checkout__content {
  display: grid;
  gap: var(--sakai-space-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.teacher-plan-checkout__paymob-return {
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
}

.teacher-plan-checkout__paymob-return-message {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-checkout__paymob-return-details {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-plan-checkout__paymob-return-details div {
  display: grid;
  gap: var(--sakai-space-1);
}

.teacher-plan-checkout__paymob-return-details dt {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-checkout__paymob-return-details dd {
  margin: 0;
  font-size: var(--sakai-font-size-base);
}

.teacher-plan-checkout__summary-card {
  display: grid;
  gap: var(--sakai-space-3);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
}

.teacher-plan-checkout__tagline {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-checkout__price {
  margin: 0;
  font-size: var(--sakai-font-size-xl);
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-plan-checkout__price-secondary {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-checkout__country-notice {
  margin: 0;
  margin-top: var(--sakai-space-2);
  font-size: var(--sakai-font-size-xs);
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-checkout__country-notice + .teacher-plan-checkout__country-notice {
  margin-top: var(--sakai-space-1);
}

.teacher-plan-checkout__country-notice--fallback {
  color: var(--sakai-warning-600, #b7791f);
}

.teacher-plan-checkout__context {
  margin: 0;
  margin-top: var(--sakai-space-2);
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-checkout__features-heading {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  font-weight: var(--sakai-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.teacher-plan-checkout__features {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.35rem;
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-checkout__form-card {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-plan-checkout__form-header {
  display: grid;
  gap: 0.35rem;
}

.teacher-plan-checkout__form-header h2 {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
}

.teacher-plan-checkout__form-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-checkout__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.teacher-plan-checkout__vodafone-summary {
  display: grid;
  gap: 0.35rem;
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-checkout__vodafone-summary p {
  margin: 0;
}

.teacher-plan-checkout__vodafone-instructions {
  display: grid;
  gap: var(--sakai-space-2);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
}

.teacher-plan-checkout__vodafone-instructions-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-plan-checkout__vodafone-instructions ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.25rem;
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-checkout__vodafone-form {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-plan-checkout__vodafone-error {
  color: var(--sakai-danger);
  font-size: var(--sakai-font-size-xs);
}

.teacher-plan-checkout__vodafone-support {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

@media (max-width: 900px) {
  .teacher-plan-checkout__content {
    grid-template-columns: 1fr;
  }
}
</style>
