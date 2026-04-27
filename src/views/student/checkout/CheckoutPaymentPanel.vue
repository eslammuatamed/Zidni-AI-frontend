<template>
  <UiCard class="checkout-payment-panel">
    <header class="checkout-payment-panel__header">
      <div class="checkout-payment-panel__header-icon">
        <UiIcon name="CreditCardOutlined" :size="26" />
      </div>
      <div class="checkout-payment-panel__header-copy">
        <h3>{{ t('checkout.summaryTitle') }}</h3>
        <p>{{ t('checkout.summarySubtitle') }}</p>
      </div>
      <UiBadge v-if="hasValidation" color="success" variant="soft">
        {{ t('checkout.appliedBadge') }}
      </UiBadge>
    </header>

    <section v-if="hasItems" class="checkout-payment-panel__totals">
      <dl>
        <div>
          <dt>{{ t('checkout.subtotal') }}</dt>
          <dd>{{ formatMoney(subtotal) }}</dd>
        </div>
        <div v-if="hasDiscount">
          <dt>{{ t('checkout.discount') }}</dt>
          <dd class="checkout-payment-panel__discount">-{{ formatMoney(discount) }}</dd>
        </div>
        <div class="checkout-payment-panel__total">
          <dt>{{ t('checkout.total') }}</dt>
          <dd>{{ formatMoney(finalAmount) }}</dd>
        </div>
      </dl>
      <p v-if="hasValidation && validation?.code" class="checkout-payment-panel__code">
        <UiIcon name="TagOutlined" :size="16" />
        <span>{{ validation?.code }}</span>
      </p>
    </section>

    <div class="checkout-payment-panel__coupon">
      <CouponBox embedded :teacher-slug="teacherSlug" :items="items" :enabled="offersEnabled" />
    </div>

    <section v-if="isFreeCheckout" class="checkout-payment-panel__free">
      <header class="checkout-payment-panel__manual-header">
        <h3>{{ t('student.freeCheckoutTitle') }}</h3>
        <p>{{ t('student.freeCheckoutSubtitle') }}</p>
      </header>

      <UiAlert color="success" variant="soft">
        {{ t('student.freeCheckoutNotice', { code: validation?.code ?? '' }) }}
      </UiAlert>

      <label class="muse-field">
        <span>{{ t('student.course') }}</span>
        <select v-model="paymentForm.courseId" :disabled="paymentLoading || !hasItems" required>
          <option disabled value="">{{ t('student.course') }}</option>
          <option v-for="option in courseOptions" :key="option.id" :value="option.id">
            {{ option.title }}
          </option>
        </select>
      </label>

      <UiTextarea
        v-model="paymentForm.notes"
        class="checkout-payment-panel__field"
        :label="t('student.freeCheckoutNotesLabel')"
        :rows="3"
        :disabled="paymentLoading || !hasItems"
      />

      <div class="muse-form__feedback">
        <UiAlert v-if="formError" color="danger" variant="soft">
          {{ formError }}
        </UiAlert>
        <UiAlert v-else-if="paymentError" color="danger" variant="soft">
          {{ t('student.paymentError') }}
        </UiAlert>
        <UiAlert v-else-if="paymentSuccess" color="success" variant="soft">
          {{ t('student.freeCheckoutSuccess') }}
        </UiAlert>
      </div>

      <div class="muse-form__actions">
        <UiButton button-type="button" color="primary" :disabled="paymentLoading || !hasItems" @click="submitPayment">
          <span v-if="paymentLoading">{{ t('common.loading') }}</span>
          <span v-else>{{ t('student.freeCheckoutAction') }}</span>
        </UiButton>
      </div>
    </section>

    <div v-else-if="manualFlowEnabled" class="checkout-payment-panel__manual">
      <header class="checkout-payment-panel__manual-header">
        <h3>{{ t('student.checkoutManualTitle') }}</h3>
        <p>{{ t('student.checkoutManualSubtitle') }}</p>
      </header>

      <UiAlert
        v-if="manualPaymentPending"
        color="warning"
        variant="soft"
        class="checkout-payment-panel__manual-status"
      >
        {{ t('student.paymentPendingNotice') }}
      </UiAlert>

      <UiAlert
        v-else-if="manualPaymentRejected"
        color="danger"
        variant="soft"
        class="checkout-payment-panel__manual-status"
      >
        <div class="checkout-payment-panel__manual-status-content">
          <span>{{ t('student.paymentRejectedNotice') }}</span>
          <span v-if="manualPaymentNotes" class="checkout-payment-panel__manual-reject-note">
            {{ t('student.paymentRejectedReasonLabel') }}: {{ manualPaymentNotes }}
          </span>
        </div>
      </UiAlert>

      <UiAlert
        v-if="methodsError"
        color="danger"
        variant="soft"
        class="checkout-payment-panel__manual-status"
      >
        <div class="checkout-payment-panel__manual-status-content">
          <span>{{ methodsError }}</span>
          <UiButton
            size="sm"
            variant="link"
            color="danger"
            :disabled="methodsLoading"
            @click="loadManualOptions"
          >
            {{ t('common.retry') }}
          </UiButton>
        </div>
      </UiAlert>

      <div v-else>
        <UiSkeleton v-if="methodsLoading" height="4rem" />
        <template v-else>
          <UiAlert
            v-if="!hasManualMethods"
            color="warning"
            variant="soft"
            class="checkout-payment-panel__manual-status"
          >
            {{ t('student.paymentNoMethods') }}
          </UiAlert>

          <template v-else>
            <UiRadioGroup
              v-model="selectedMethod"
              :options="manualRadioOptions"
              :disabled="paymentLoading || manualSubmissionBlocked"
              class="checkout-payment-panel__manual-methods"
            />

            <section class="checkout-payment-panel__manual-details">
              <h4 class="checkout-payment-panel__manual-method-title">
                <span
                  v-if="selectedManualIcon"
                  class="checkout-payment-panel__manual-method-media"
                  aria-hidden="true"
                >
                  <img :src="selectedManualIcon.src" alt="" />
                </span>
                <span>{{ manualMethodLabel(selectedMethod) }}</span>
              </h4>

              <ul v-if="selectedAccountEntries.length" class="checkout-payment-panel__manual-accounts">
                <li
                  v-for="entry in selectedAccountEntries"
                  :key="entry.label"
                  class="checkout-payment-panel__manual-accounts-item"
                >
                  <span class="checkout-payment-panel__manual-accounts-label">{{ entry.label }}</span>
                  <a
                    v-if="entry.isLink"
                    class="checkout-payment-panel__manual-accounts-value checkout-payment-panel__manual-accounts-link"
                    :href="entry.href"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ entry.value }}
                  </a>
                  <span v-else class="checkout-payment-panel__manual-accounts-value">{{ entry.value }}</span>
                </li>
              </ul>

              <div v-if="selectedCustomLink?.url" class="checkout-payment-panel__manual-link">
                <a
                  :href="selectedCustomLink.url"
                  target="_blank"
                  rel="noopener"
                  class="checkout-payment-panel__manual-link-anchor"
                >
                  {{ selectedCustomLink.url }}
                </a>
              </div>

              <div v-if="hasSelectedInstructions" class="checkout-payment-panel__manual-instructions">
                <p v-if="selectedInstructions.primary">{{ selectedInstructions.primary }}</p>
                <p
                  v-if="selectedInstructions.secondary"
                  class="checkout-payment-panel__manual-instructions-secondary"
                >
                  {{ selectedInstructions.secondary }}
                </p>
              </div>
            </section>

            <form class="muse-form checkout-payment-panel__form" @submit.prevent="submitPayment">
              <label class="muse-field">
                <span>{{ t('student.course') }}</span>
                <select v-model="paymentForm.courseId" :disabled="!hasItems || paymentLoading || manualSubmissionBlocked" required>
                  <option disabled value="">{{ t('student.course') }}</option>
                  <option v-for="option in courseOptions" :key="option.id" :value="option.id">
                    {{ option.title }}
                  </option>
                </select>
              </label>

              <label class="muse-field">
                <span>{{ t('checkout.total') }}</span>
                <input
                  v-model.number="paymentForm.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :readonly="amountLocked"
                  :disabled="paymentLoading || !hasItems || manualSubmissionBlocked"
                />
                <small class="checkout-payment-panel__hint">{{ formatMoney(paymentForm.amount) }}</small>
              </label>

              <div class="checkout-payment-panel__vodafone-upload">
                <UiFileUpload
                  v-model="paymentForm.files"
                  :label="t('student.checkoutVodafoneUploadLabel')"
                  :hint="t('student.checkoutManualUploadHint')"
                  accept="image/*,.pdf"
                  :disabled="proofUploading || paymentLoading || !hasItems || manualSubmissionBlocked"
                  @remove="clearProof"
                />
                <small v-if="proofUploading">{{ t('common.loading') }}</small>
                <UiAlert v-if="proofError" color="danger" variant="soft">{{ proofError }}</UiAlert>
                <UiBadge v-if="paymentForm.proofUrl" color="success">
                  {{ t('student.proofUploaded') }}
                </UiBadge>
              </div>

              <UiInput
                v-if="selectedMethod !== 'custom_link'"
                v-model="paymentForm.transferReference"
                class="checkout-payment-panel__field"
                :label="t('student.paymentTransferReference')"
                :disabled="proofUploading || paymentLoading || manualSubmissionBlocked"
              />

              <UiTextarea
                v-model="paymentForm.notes"
                class="checkout-payment-panel__field"
                :label="t('student.checkoutVodafoneNotesLabel')"
                :rows="3"
                :disabled="paymentLoading || !hasItems || manualSubmissionBlocked"
              />

              <div class="muse-form__feedback">
                <UiAlert v-if="formError" color="danger" variant="soft">
                  {{ formError }}
                </UiAlert>
                <UiAlert v-else-if="paymentError" color="danger" variant="soft">
                  {{ t('student.paymentError') }}
                </UiAlert>
                <UiAlert v-else-if="paymentSuccess" color="success" variant="soft">
                  {{ t('student.paymentSuccess') }}
                </UiAlert>
              </div>

              <div class="muse-form__actions">
                <UiButton button-type="submit" color="primary" :disabled="paymentLoading || !hasItems || manualSubmissionBlocked">
                  <span v-if="paymentLoading">{{ t('common.loading') }}</span>
                  <span v-else>{{ manualSubmitLabel }}</span>
                </UiButton>
              </div>
            </form>
          </template>
        </template>
      </div>
    </div>
    <template v-else>
    <div v-if="stage === 'method'" class="checkout-payment-panel__method">
      <header class="checkout-payment-panel__method-header">
        <h3>{{ t('student.checkoutSelectGatewayTitle') }}</h3>
        <p>{{ t('student.checkoutSelectGatewaySubtitle') }}</p>
      </header>
      <UiRadioGroup
        v-model="selectedGateway"
        :options="gatewayChoices"
        :disabled="!hasItems || paymentLoading || onlineRedirecting"
      />
      <UiAlert
        v-if="selectedGateway && gatewayDescription"
        color="info"
        variant="soft"
        class="checkout-payment-panel__gateway-alert"
      >
        {{ gatewayDescription }}
      </UiAlert>
      <div class="checkout-payment-panel__actions">
        <UiButton
          color="primary"
          :disabled="!selectedGateway || !hasItems || paymentLoading || onlineRedirecting"
          @click="continueWithGateway"
        >
          {{ t('student.checkoutContinueAction') }}
        </UiButton>
      </div>
    </div>

    <form
      v-else-if="stage === 'vodafone'"
      class="muse-form checkout-payment-panel__form"
      @submit.prevent="submitPayment"
    >
      <header class="checkout-payment-panel__form-header">
        <h3>{{ t('student.checkoutVodafoneTitle') }}</h3>
        <p>{{ t('student.checkoutVodafoneSubtitle') }}</p>
      </header>

      <label class="muse-field">
        <span>{{ t('student.course') }}</span>
        <select v-model="paymentForm.courseId" :disabled="!hasItems || paymentLoading || manualSubmissionBlocked" required>
          <option disabled value="">{{ t('student.course') }}</option>
          <option v-for="option in courseOptions" :key="option.id" :value="option.id">
            {{ option.title }}
          </option>
        </select>
      </label>

      <label class="muse-field">
        <span>{{ t('checkout.total') }}</span>
        <input
          v-model.number="paymentForm.amount"
          type="number"
          min="0"
          step="0.01"
          required
          :readonly="amountLocked"
          :disabled="paymentLoading || !hasItems || manualSubmissionBlocked"
        />
        <small class="checkout-payment-panel__hint">{{ formatMoney(paymentForm.amount) }}</small>
      </label>

      <div class="checkout-payment-panel__vodafone-summary">
        <p class="checkout-payment-panel__vodafone-amount">{{ vodafoneAmountText }}</p>
        <p v-if="vodafoneWalletText" class="checkout-payment-panel__vodafone-wallet">
          {{ vodafoneWalletText }}
        </p>
      </div>

      <div class="checkout-payment-panel__vodafone-guidance">
        <UiAlert v-if="vodafoneError" color="danger" variant="soft">{{ vodafoneError }}</UiAlert>
        <UiAlert v-else-if="vodafoneLoading" color="info" variant="soft">{{ t('common.loading') }}</UiAlert>
        <template v-else>
          <div v-if="vodafoneInstructionLines.length" class="checkout-payment-panel__vodafone-instructions">
            <p class="checkout-payment-panel__vodafone-instructions-title">
              {{ t('student.checkoutVodafoneInstructionsTitle') }}
            </p>
            <ul>
              <li v-for="line in vodafoneInstructionLines" :key="line">{{ line }}</li>
            </ul>
          </div>
          <UiAlert v-else color="warning" variant="soft">
            {{ t('student.checkoutVodafoneInstructionsUnavailable') }}
          </UiAlert>
        </template>
      </div>

      <div v-if="vodafoneSupportDetails" class="checkout-payment-panel__vodafone-support">
        <span v-if="vodafoneSupportDetails.email">
          {{ t('student.checkoutVodafoneSupportEmail', { email: vodafoneSupportDetails.email }) }}
        </span>
        <span v-if="vodafoneSupportDetails.phone">
          {{ t('student.checkoutVodafoneSupportPhone', { phone: vodafoneSupportDetails.phone }) }}
        </span>
      </div>

      <div class="checkout-payment-panel__vodafone-upload">
        <UiFileUpload
          v-model="paymentForm.files"
          :label="t('student.checkoutVodafoneUploadLabel')"
          :hint="t('student.checkoutVodafoneUploadHint')"
          accept="image/*,.pdf"
          :disabled="proofUploading || paymentLoading || !hasItems || manualSubmissionBlocked"
          @remove="clearProof"
        />
        <small v-if="proofUploading">{{ t('common.loading') }}</small>
        <UiAlert v-if="proofError" color="danger" variant="soft">{{ proofError }}</UiAlert>
        <UiBadge v-if="paymentForm.proofUrl" color="success">
          {{ t('student.proofUploaded') }}
        </UiBadge>
      </div>

      <UiInput
        v-model="paymentForm.transferReference"
        class="checkout-payment-panel__field"
        :label="t('student.checkoutVodafoneReferenceLabel')"
        :disabled="proofUploading || paymentLoading || manualSubmissionBlocked"
      />

      <UiTextarea
        v-model="paymentForm.notes"
        class="checkout-payment-panel__field"
        :label="t('student.checkoutVodafoneNotesLabel')"
        :rows="3"
        :disabled="paymentLoading || !hasItems || manualSubmissionBlocked"
      />

      <div class="muse-form__feedback">
        <UiAlert v-if="paymentError" color="danger" variant="soft">
          {{ t('student.paymentError') }}
        </UiAlert>
        <UiAlert v-else-if="paymentSuccess" color="success" variant="soft">
          {{ t('student.paymentSuccess') }}
        </UiAlert>
      </div>

      <div class="muse-form__actions">
        <UiButton
          variant="outline"
          color="secondary"
          button-type="button"
          :disabled="paymentLoading"
          @click="backToMethod"
        >
          {{ t('student.checkoutBackAction') }}
        </UiButton>
        <UiButton button-type="submit" color="primary" :disabled="paymentLoading || !hasItems || manualSubmissionBlocked">
          <span v-if="paymentLoading">{{ t('common.loading') }}</span>
          <span v-else>{{ manualSubmitLabel }}</span>
        </UiButton>
      </div>
    </form>

    <div v-else class="checkout-payment-panel__online">
      <header class="checkout-payment-panel__form-header">
        <h3>{{ t('student.checkoutOnlineTitle', { method: onlineGatewayLabel }) }}</h3>
        <p>{{ t('student.checkoutOnlineSubtitle', { method: onlineGatewayLabel }) }}</p>
      </header>

      <dl class="checkout-payment-panel__online-summary">
        <div>
          <dt>{{ t('student.course') }}</dt>
          <dd>{{ selectedCourse?.title ?? t('checkout.fallbackCourse', { id: paymentForm.courseId }) }}</dd>
        </div>
        <div>
          <dt>{{ t('checkout.total') }}</dt>
          <dd>{{ formatMoney(finalAmount) }}</dd>
        </div>
        <div>
          <dt>{{ t('student.checkoutOnlineGateway') }}</dt>
          <dd>{{ onlineGatewayLabel }}</dd>
        </div>
      </dl>

      <UiAlert v-if="gatewayDescription" color="info" variant="soft">
        {{ gatewayDescription }}
      </UiAlert>

      <UiAlert v-if="onlineRedirectError" color="danger" variant="soft">
        {{ onlineRedirectError }}
      </UiAlert>

      <div class="checkout-payment-panel__actions">
        <UiButton
          variant="outline"
          color="secondary"
          :disabled="onlineRedirecting"
          @click="backToMethod"
        >
          {{ t('student.checkoutBackAction') }}
        </UiButton>
        <UiButton
          color="primary"
          :disabled="onlineRedirecting || !onlineRedirectUrl"
          @click="startOnlinePayment"
        >
          <span v-if="onlineRedirecting">{{ t('common.loading') }}</span>
          <span v-else>{{ t('student.checkoutOnlineAction', { method: onlineGatewayLabel }) }}</span>
        </UiButton>
      </div>
    </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch, onMounted } from 'vue';
import { isAxiosError } from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiRadioGroup, { type UiRadioOption } from '@/components/ui/UiRadioGroup.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import CouponBox from '@/views/student/checkout/CouponBox.vue';
import { useStudentCheckoutStore, type CheckoutItem } from '@/stores/studentCheckout';
import { useStudentStore } from '@/stores/student';
import {
  formatCheckoutMoney,
  normalizeCheckoutCurrency,
  resolveCheckoutCurrency
} from '@/utils/checkoutCurrency';
import type {
  PaymentGateway,
  ManualPaymentMethod,
  StudentManualPaymentOptions,
  ManualPaymentMethodDetails,
  ManualPaymentCustomLink
} from '@/services/student';
import { getStudentManualPaymentOptions } from '@/services/student';
import paypalIcon from '@/assets/icons/paypal.png';
import vodafoneIcon from '@/assets/icons/vodafone.png';
import visaLogo from '@/assets/payment/visa.svg';
import mastercardLogo from '@/assets/payment/Mastercard.svg';
import bankTransferIcon from '@/assets/payment/bank-transfer-icon.svg';
import instaPayIcon from '@/assets/payment/InstaPay.png';
import customPaymentIcon from '@/assets/payment/Custom payment link.jpg';

interface Props {
  teacherSlug: string;
  items: CheckoutItem[];
  offersEnabled: boolean;
}

const props = defineProps<Props>();
const { teacherSlug, items, offersEnabled } = toRefs(props);

const { t, locale } = useI18n();
const checkoutStore = useStudentCheckoutStore();
const studentStore = useStudentStore();
const toast = useToast();

const paymentForm = reactive({
  courseId: null as number | null,
  amount: 0,
  currency: resolveCheckoutCurrency(),
  method: 'bank' as ManualPaymentMethod,
  gateway: null as PaymentGateway | null,
  files: [] as File[],
  proofUrl: '',
  proofKey: '',
  notes: '',
  transferReference: ''
});

const paymentLoading = ref(false);
const paymentError = ref(false);
const paymentSuccess = ref(false);
const proofUploading = ref(false);
const proofError = ref('');
const stage = ref<'method' | 'vodafone' | 'online'>('method');
const selectedGateway = ref<PaymentGateway | null>(null);
const onlineRedirecting = ref(false);
const onlineRedirectError = ref('');
const vodafoneLoading = ref(false);
const vodafoneError = ref('');
const vodafoneSettings = computed(() => studentStore.vodafoneSettings);

const gatewayOrder: PaymentGateway[] = ['VODAFONE_CASH', 'PAYPAL', 'PAYMOB'];
const ONLINE_GATEWAYS: readonly PaymentGateway[] = ['PAYPAL', 'PAYMOB'];
const CARD_GATEWAY: PaymentGateway = 'PAYMOB';
type GatewayLogo = { src: string; alt: string };
type GatewayMedia = { icon?: string | null; logos?: readonly GatewayLogo[] | null };
type ManualMethodIconMeta = { src: string; alt: string };
const CARD_GATEWAY_LOGOS: readonly GatewayLogo[] = Object.freeze([
  { src: visaLogo, alt: 'Visa' },
  { src: mastercardLogo, alt: 'Mastercard' }
]);
const gatewayMedia: Record<PaymentGateway, GatewayMedia> = {
  VODAFONE_CASH: { icon: vodafoneIcon },
  PAYPAL: { icon: paypalIcon },
  PAYMOB: { logos: CARD_GATEWAY_LOGOS }
};

type RuntimeGatewayConfig = Partial<Record<PaymentGateway, string>>;

type CourseOption = {
  id: number;
  title: string;
  price: number;
  currency: string | null;
};

const normalizeCurrencyCode = normalizeCheckoutCurrency;

const assignRuntimeGatewayCandidate = (
  gateway: PaymentGateway,
  raw: unknown,
  target: RuntimeGatewayConfig
) => {
  if (target[gateway]) {
    return;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed) {
      target[gateway] = trimmed;
    }
    return;
  }
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const nestedCandidate = record.url || record.href || record.value || record.link;
    if (typeof nestedCandidate === 'string') {
      const trimmed = nestedCandidate.trim();
      if (trimmed) {
        target[gateway] = trimmed;
      }
    }
  }
};

const collectRuntimeGatewayCandidates = (
  source: unknown,
  target: RuntimeGatewayConfig
) => {
  if (!source) {
    return;
  }
  if (typeof source === 'function') {
    try {
      collectRuntimeGatewayCandidates((source as () => unknown)(), target);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[CheckoutPaymentPanel] Runtime gateway config source threw an error', error);
      }
    }
    return;
  }
  if (Array.isArray(source)) {
    source.forEach((entry) => collectRuntimeGatewayCandidates(entry, target));
    return;
  }
  if (typeof source !== 'object') {
    return;
  }
  const record = source as Record<string, unknown>;
  const containers: Record<string, unknown>[] = [record];
  const nestedKeys = ['gateways', 'gateway', 'methods', 'options'];
  for (const nestedKey of nestedKeys) {
    const nested = record[nestedKey];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      containers.push(nested as Record<string, unknown>);
    }
  }
  for (const container of containers) {
    for (const gateway of ONLINE_GATEWAYS) {
      if (target[gateway]) {
        continue;
      }
      const keys = [
        gateway,
        gateway.toLowerCase(),
        gateway.toUpperCase(),
        `${gateway}Url`,
        `${gateway}URL`,
        `${gateway.toLowerCase()}Url`,
        `${gateway.toLowerCase()}_url`,
        `${gateway.toUpperCase()}_URL`
      ];
      if (gateway === 'PAYPAL') {
        keys.push('paypalCheckoutUrl', 'paypal_checkout_url', 'paypalRedirectUrl', 'paypal_redirect_url');
      } else if (gateway === 'PAYMOB') {
        keys.push('paymobCheckoutUrl', 'paymob_checkout_url', 'paymobRedirectUrl', 'paymob_redirect_url');
      }
      for (const key of keys) {
        if (key in container) {
          assignRuntimeGatewayCandidate(gateway, container[key], target);
        }
      }
    }
  }
};

const readRuntimeOnlineGatewayConfig = (): RuntimeGatewayConfig => {
  if (typeof window === 'undefined') {
    return {};
  }
  const target: RuntimeGatewayConfig = {};
  const windowRecord = window as typeof window & Record<string, unknown>;
  const candidateKeys = ['__STUDENT_CHECKOUT__', '__STUDENT_PAYMENTS__', 'STUDENT_CHECKOUT', 'STUDENT_PAYMENTS'];
  for (const key of candidateKeys) {
    if (key in windowRecord) {
      collectRuntimeGatewayCandidates(windowRecord[key], target);
    }
  }
  if (typeof document !== 'undefined') {
    const metaSelectors: Partial<Record<PaymentGateway, string>> = {
      PAYPAL: 'meta[name="student-paypal-checkout-url"]',
      PAYMOB: 'meta[name="student-paymob-checkout-url"]'
    };
    for (const [key, selector] of Object.entries(metaSelectors)) {
      if (!selector) {
        continue;
      }
      const element = document.querySelector(selector);
      const content = element?.getAttribute('content');
      if (content) {
        assignRuntimeGatewayCandidate(key as PaymentGateway, content, target);
      }
    }
  }
  return target;
};

const onlineGatewayEnv = {
  PAYPAL: (import.meta.env.VITE_STUDENT_PAYPAL_CHECKOUT_URL as string | undefined) || '',
  PAYMOB: (import.meta.env.VITE_STUDENT_PAYMOB_CHECKOUT_URL as string | undefined) || ''
} as Partial<Record<PaymentGateway, string>>;

const runtimeOnlineGatewayConfig = ref<RuntimeGatewayConfig>(readRuntimeOnlineGatewayConfig());

const resolveOnlineGatewayBase = (gateway: PaymentGateway): string => {
  const envValue = (onlineGatewayEnv[gateway] || '').trim();
  if (envValue) {
    return envValue;
  }
  const runtimeValue = runtimeOnlineGatewayConfig.value[gateway];
  if (typeof runtimeValue === 'string') {
    const trimmed = runtimeValue.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
};

const isGatewayConfigured = (gateway: PaymentGateway) => {
  if (gateway === 'PAYPAL' || gateway === 'PAYMOB') {
    return resolveOnlineGatewayBase(gateway).length > 0;
  }
  return true;
};

const availableGatewayOrder = computed(() =>
  gatewayOrder.filter((gateway) => isGatewayConfigured(gateway))
);
const manualFlowEnabled = true;
const methodsLoading = ref(false);
const methodsError = ref('');
const manualOptions = reactive<StudentManualPaymentOptions>({
  bankTransfer: createMethodDetails(),
  instaPay: createMethodDetails(),
  vodafoneCash: createMethodDetails(),
  customLink: createCustomLinkDetails()
});
const selectedMethod = ref<ManualPaymentMethod>('bank');

const formError = ref('');
const normalizeManualStatus = (status?: string | null) => {
  const value = String(status ?? '').toUpperCase();
  if (value === 'PENDING_REVIEW' || value === 'PENDING') return 'pending';
  if (value === 'APPROVED' || value === 'SUCCESS') return 'approved';
  if (value === 'REJECTED' || value === 'FAILED') return 'rejected';
  return value.toLowerCase();
};
const latestCoursePayment = computed(() => {
  if (!paymentForm.courseId) return null;
  return studentStore.payments.find((payment) => payment.courseId === paymentForm.courseId) ?? null;
});
const manualPaymentStatus = computed(() => normalizeManualStatus(latestCoursePayment.value?.status));
const manualPaymentPending = computed(() => manualPaymentStatus.value === 'pending');
const manualPaymentRejected = computed(() => manualPaymentStatus.value === 'rejected');
const manualPaymentNotes = computed(() => latestCoursePayment.value?.notes?.trim() || '');
const manualSubmissionBlocked = computed(() => manualPaymentPending.value);
const manualSubmitLabel = computed(() =>
  manualPaymentRejected.value ? t('student.resubmitPaymentAction') : t('student.submitPaymentAction')
);
const manualMethodOrder: ManualPaymentMethod[] = ['bank', 'instapay', 'vodafone_cash', 'custom_link'];

const manualMethodOptions = computed(() =>
  manualMethodOrder
    .map((method) => ({
      method,
      details: methodDetailsFor(method)
    }))
    .filter(({ details }) => Boolean(details?.enabled))
);

const manualRadioOptions = computed<UiRadioOption[]>(() =>
  manualMethodOptions.value.map(({ method, details }) => {
    const icon = manualMethodIcon(method);
    return {
      value: method,
      label: manualMethodLabel(method),
      description: manualMethodSummary(method, details),
      icon: icon?.src ?? undefined,
      iconAlt: icon?.alt ?? undefined
    };
  })
);

const hasManualMethods = computed(() => manualMethodOptions.value.length > 0);

const selectedMethodOption = computed(() =>
  manualMethodOptions.value.find((option) => option.method === selectedMethod.value) ?? null
);

const selectedManualDetails = computed<ManualPaymentMethodDetails | null>(() => {
  if (selectedMethod.value === 'custom_link') {
    return null;
  }
  const option = selectedMethodOption.value;
  if (!option) {
    return null;
  }
  return option.details as ManualPaymentMethodDetails;
});

const selectedManualIcon = computed(() => manualMethodIcon(selectedMethod.value));

const selectedCustomLink = computed<ManualPaymentCustomLink | null>(() =>
  selectedMethod.value === 'custom_link' ? (manualOptions.customLink as ManualPaymentCustomLink) : null
);

const selectedInstructions = computed(() => {
  const source =
    selectedMethod.value === 'custom_link'
      ? selectedCustomLink.value
      : selectedManualDetails.value;
  if (!source) {
    return { primary: '', secondary: '' };
  }
  const primaryLang = locale.value.startsWith('ar') ? 'ar' : 'en';
  const secondaryLang = primaryLang === 'ar' ? 'en' : 'ar';
  return {
    primary: pickInstruction(source, primaryLang),
    secondary: pickInstruction(source, secondaryLang)
  };
});

const hasSelectedInstructions = computed(
  () => Boolean(selectedInstructions.value.primary) || Boolean(selectedInstructions.value.secondary)
);

const selectedAccountEntries = computed(() => {
  const details = selectedManualDetails.value;
  if (!details) {
    return [] as { label: string; value: string; isLink?: boolean; href?: string }[];
  }
  const entries: { label: string; value: string; isLink?: boolean; href?: string }[] = [];

  if (selectedMethod.value === 'instapay') {
    if (details.accountNumber) {
      entries.push({ label: t('student.paymentInstaPayMobile'), value: details.accountNumber });
    }
    if (details.bankDetails) {
      const link = details.bankDetails.trim();
      entries.push({
        label: t('student.paymentInstaPayLink'),
        value: link,
        isLink: true,
        href: link
      });
    }
    return entries;
  }

  if (details.accountNumber) {
    entries.push({ label: t('student.paymentAccountNumber'), value: details.accountNumber });
  }
  if (details.iban) {
    entries.push({ label: t('student.paymentIban'), value: details.iban });
  }
  if (details.accountHolderName) {
    entries.push({ label: t('student.paymentAccountHolder'), value: details.accountHolderName });
  }
  if (details.bankName) {
    entries.push({ label: t('student.paymentBankName'), value: details.bankName });
  }
  if (details.bankDetails) {
    entries.push({ label: t('student.paymentBankDetails'), value: details.bankDetails });
  }
  return entries;
});


function createMethodDetails(): ManualPaymentMethodDetails {
  return {
    enabled: false,
    accountNumber: null,
    iban: null,
    accountHolderName: null,
    bankName: null,
    bankDetails: null,
    instructionsAr: null,
    instructionsEn: null
  };
}

function createCustomLinkDetails(): ManualPaymentCustomLink {
  return {
    enabled: false,
    url: null,
    instructionsAr: null,
    instructionsEn: null
  };
}

function assignManualOptions(options: StudentManualPaymentOptions) {
  Object.assign(manualOptions.bankTransfer, options.bankTransfer ?? createMethodDetails());
  Object.assign(manualOptions.instaPay, options.instaPay ?? createMethodDetails());
  Object.assign(manualOptions.vodafoneCash, options.vodafoneCash ?? createMethodDetails());
  Object.assign(manualOptions.customLink, options.customLink ?? createCustomLinkDetails());
}

function methodDetailsFor(method: ManualPaymentMethod): ManualPaymentMethodDetails | ManualPaymentCustomLink {
  switch (method) {
    case "instapay":
      return manualOptions.instaPay;
    case "vodafone_cash":
      return manualOptions.vodafoneCash;
    case "custom_link":
      return manualOptions.customLink;
    default:
      return manualOptions.bankTransfer;
  }
}

function manualMethodLabel(method: ManualPaymentMethod): string {
  switch (method) {
    case "bank":
      return t('student.paymentMethod.bank');
    case "instapay":
      return t('student.paymentMethod.instapay');
    case "vodafone_cash":
      return t('student.paymentMethod.vodafone');
    case "custom_link":
      return t('student.paymentMethod.customLink');
    default:
      return t('student.paymentMethod.other');
  }
}

function manualMethodIcon(method: ManualPaymentMethod): ManualMethodIconMeta | null {
  switch (method) {
    case 'bank':
      return { src: bankTransferIcon, alt: t('student.paymentMethod.bank') };
    case 'instapay':
      return { src: instaPayIcon, alt: t('student.paymentMethod.instapay') };
    case 'vodafone_cash':
      return { src: vodafoneIcon, alt: t('student.paymentMethod.vodafone') };
    case 'custom_link':
      return { src: customPaymentIcon, alt: t('student.paymentMethod.customLink') };
    default:
      return null;
  }
}

function manualMethodSummary(
  method: ManualPaymentMethod,
  details: ManualPaymentMethodDetails | ManualPaymentCustomLink
): string {
  if (method === 'custom_link') {
    const { url } = details as ManualPaymentCustomLink;
    return url ? url : '';
  }
  const info = details as ManualPaymentMethodDetails;
  if (method === 'vodafone_cash') {
    return info.accountNumber ?? '';
  }
  if (method === 'instapay') {
    return info.accountNumber ?? info.bankDetails ?? '';
  }
  const parts = [info.accountNumber, info.accountHolderName].filter(Boolean);
  if (parts.length) {
    return parts.join(' - ');
  }
  return info.bankName ?? '';
}

function pickInstruction(
  source: { instructionsAr?: string | null; instructionsEn?: string | null } | null,
  language: 'ar' | 'en'
): string {
  if (!source) {
    return '';
  }
  const primary = language === 'ar' ? source.instructionsAr : source.instructionsEn;
  if (primary && primary.trim()) {
    return primary.trim();
  }
  const fallback = language === 'ar' ? source.instructionsEn : source.instructionsAr;
  return fallback?.trim() ?? '';
}

async function loadManualOptions() {
  methodsLoading.value = true;
  methodsError.value = '';
  try {
    const options = await getStudentManualPaymentOptions();
    assignManualOptions(options);
  } catch (error) {
    methodsError.value = resolveErrorMessage(error);
  } finally {
    methodsLoading.value = false;
  }
}

function resolveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return t('common.genericError');
}

const resetProofState = () => {
  paymentForm.proofUrl = '';
  paymentForm.proofKey = '';
  paymentForm.files = [];
  paymentForm.transferReference = '';
  proofUploading.value = false;
};

watch(
  manualMethodOptions,
  (options) => {
    if (!manualFlowEnabled) {
      return;
    }
    if (!options.length) {
      selectedMethod.value = 'bank';
      return;
    }
    if (!options.some((option) => option.method === selectedMethod.value)) {
      selectedMethod.value = options[0].method;
    }
  },
  { immediate: true }
);

watch(
  () => selectedMethod.value,
  (method) => {
    if (!manualFlowEnabled) {
      return;
    }
    paymentForm.method = method;
    paymentForm.gateway = method === 'vodafone_cash' ? 'VODAFONE_CASH' : null;
    resetProofState();
  },
  { immediate: true }
);

const courseOptions = computed<CourseOption[]>(() => {
  const fallback = (id: number) => t('checkout.fallbackCourse', { id });
  return checkoutStore.items.map((item) => ({
    id: item.courseId,
    title: item.title?.trim() ? item.title : fallback(item.courseId),
    price: item.price ?? 0,
    currency: normalizeCurrencyCode(item.currency)
  }));
});

const gatewayLabel = (gateway: PaymentGateway) => {
  const key = `student.paymentGateways.${gateway}`;
  const translated = t(key);
  return translated === key ? gateway : translated;
};

const gatewaySummary = (gateway: PaymentGateway) => {
  const key = `student.paymentGatewaySummaries.${gateway}`;
  const translated = t(key);
  return translated === key ? '' : translated;
};

const gatewayDescription = computed(() => {
  const gateway = stage.value === 'vodafone' ? paymentForm.gateway : selectedGateway.value;
  if (!gateway) {
    return '';
  }
  const key = `student.paymentGatewayDescriptions.${gateway}`;
  const translated = t(key);
  return translated === key ? '' : translated;
});

const gatewayChoices = computed<UiRadioOption[]>(() =>
  availableGatewayOrder.value.map((gateway) => {
    const label = gatewayLabel(gateway);
    const media = gatewayMedia[gateway];
    return {
      value: gateway,
      label,
      description: gatewaySummary(gateway),
      disabled: paymentLoading.value || onlineRedirecting.value || !hasItems.value,
      icon: media?.icon ?? null,
      iconAlt: media?.icon ? label : null,
      logos:
        gateway === CARD_GATEWAY && media?.logos
          ? media.logos.map((logo) => ({ ...logo }))
          : undefined
    };
  })
);

const hasItems = computed(() => checkoutStore.hasItems);
const validation = computed(() => checkoutStore.validation);
const hasValidation = computed(() => validation.value != null);
const subtotal = computed(() =>
  checkoutStore.items.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0)
);
const finalAmount = computed(() => {
  const total = validation.value?.total ?? subtotal.value;
  return Number.isFinite(total) ? Number(total) : 0;
});
const isFreeCheckout = computed(() => Boolean(validation.value?.valid && validation.value?.code) && finalAmount.value <= 0.005);
const discount = computed(() => {
  const value = subtotal.value - finalAmount.value;
  return value > 0 ? value : 0;
});
const hasDiscount = computed(() => discount.value > 0.005);
const amountLocked = computed(() => {
  if (!hasItems.value) {
    return false;
  }
  if (validation.value) {
    return true;
  }
  return subtotal.value > 0;
});

const selectedCourse = computed(() =>
  courseOptions.value.find((option) => option.id === paymentForm.courseId) || null
);

const selectedCourseCurrency = computed(() => normalizeCurrencyCode(selectedCourse.value?.currency));

const firstItemCurrency = computed(() => {
  const entry = checkoutStore.items.find(
    (item) => typeof item.currency === 'string' && item.currency.trim().length > 0
  );
  return entry ? normalizeCurrencyCode(entry.currency) : null;
});

const resolvedCurrency = computed(() => {
  return resolveCheckoutCurrency(
    selectedCourseCurrency.value,
    firstItemCurrency.value,
    validation.value?.currency
  );
});

const onlineGatewayLabel = computed(() =>
  selectedGateway.value ? gatewayLabel(selectedGateway.value) : ''
);

const onlineRedirectUrl = computed(() => {
  if (stage.value !== 'online' || !selectedGateway.value) {
    return '';
  }
  const base = resolveOnlineGatewayBase(selectedGateway.value as PaymentGateway);
  if (!base) {
    return '';
  }
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const target = base.includes('://') ? new URL(base) : new URL(base, origin);
    const params = new URLSearchParams(target.search);
    if (teacherSlug.value) {
      params.set('teacher', teacherSlug.value);
    }
    if (paymentForm.courseId != null) {
      params.set('courseId', String(paymentForm.courseId));
    }
    params.set('amount', finalAmount.value.toFixed(2));
    params.set('currency', resolvedCurrency.value);
    if (checkoutStore.validation?.code) {
      params.set('code', checkoutStore.validation.code);
    }
    target.search = params.toString();
    return target.toString();
  } catch (error) {
    console.error('[CheckoutPaymentPanel] Failed to build redirect URL', error);
    return '';
  }
});

const vodafoneInstructionLines = computed(() => {
  const settings = vodafoneSettings.value;
  if (!settings) {
    return [] as string[];
  }
  const raw = locale.value === 'ar' ? settings.instructionsAr : settings.instructionsEn;
  if (!raw) {
    return [] as string[];
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
});

const vodafoneWalletNumber = computed(() => {
  const wallet = vodafoneSettings.value?.walletNumber?.trim() || '';
  return wallet || '';
});

const formatMoney = (value: number) => {
  return formatCheckoutMoney(value, resolvedCurrency.value, locale.value);
};

const vodafoneAmountDisplay = computed(() => formatMoney(paymentForm.amount));
const vodafoneAmountText = computed(() =>
  t('student.checkoutVodafoneAmount', { amount: vodafoneAmountDisplay.value })
);
const vodafoneWalletText = computed(() =>
  vodafoneWalletNumber.value ? t('student.checkoutVodafoneWallet', { wallet: vodafoneWalletNumber.value }) : ''
);

const vodafoneSupportDetails = computed(() => {
  const email = vodafoneSettings.value?.supportEmail?.trim() || '';
  const phone = vodafoneSettings.value?.supportPhone?.trim() || '';
  if (!email && !phone) {
    return null;
  }
  return {
    email: email || null,
    phone: phone || null
  };
});

const ensureVodafoneSettings = async () => {
  if (vodafoneSettings.value || vodafoneLoading.value) {
    return;
  }
  vodafoneError.value = '';
  vodafoneLoading.value = true;
  try {
    await studentStore.fetchVodafoneSettings();
  } catch (error) {
    console.error('[CheckoutPaymentPanel] Failed to load Vodafone settings', error);
    vodafoneError.value = t('student.checkoutVodafoneSettingsError');
  } finally {
    vodafoneLoading.value = false;
  }
};

watch(
  courseOptions,
  (options) => {
    if (!options.length) {
      paymentForm.courseId = null;
      return;
    }
    if (paymentForm.courseId == null || !options.some((option) => option.id === paymentForm.courseId)) {
      paymentForm.courseId = options[0].id;
    }
  },
  { immediate: true }
);

watch(
  resolvedCurrency,
  (currency) => {
    paymentForm.currency = currency;
  },
  { immediate: true }
);

watch(
  [finalAmount, amountLocked],
  ([value, locked]) => {
    if (!locked) {
      if (!Number.isFinite(paymentForm.amount)) {
        paymentForm.amount = 0;
      }
      return;
    }
    if (!Number.isFinite(value)) {
      paymentForm.amount = 0;
      return;
    }
    paymentForm.amount = Number.parseFloat(value.toFixed(2));
  },
  { immediate: true }
);

watch(
  gatewayChoices,
  (options) => {
    if (!options.length) {
      selectedGateway.value = null;
      return;
    }
    if (!selectedGateway.value || !options.some((option) => option.value === selectedGateway.value)) {
      selectedGateway.value = options[0].value as PaymentGateway;
    }
  },
  { immediate: true }
);

watch(
  () => stage.value,
  (value) => {
    proofError.value = '';
    if (value !== 'online') {
      onlineRedirectError.value = '';
    }
    onlineRedirecting.value = false;
    if (value !== 'vodafone') {
      resetProofState();
    }
    if (value === 'vodafone') {
      paymentForm.method = 'vodafone_cash';
      paymentForm.gateway = 'VODAFONE_CASH';
      void ensureVodafoneSettings();
    } else {
      if (!manualFlowEnabled) {
        paymentForm.method = 'bank';
      }
      if (selectedGateway.value) {
        paymentForm.gateway = selectedGateway.value;
      } else {
        paymentForm.gateway = null;
      }
    }
  },
  { immediate: true }
);

watch(
  () => selectedGateway.value,
  (gateway) => {
    if (!gateway) {
      return;
    }
    if (gateway !== 'VODAFONE_CASH' && stage.value === 'vodafone') {
      stage.value = 'method';
    }
    if (gateway === 'VODAFONE_CASH' && stage.value === 'online') {
      stage.value = 'method';
    }
    if (stage.value !== 'vodafone') {
      paymentForm.gateway = gateway;
    }
  }
);

watch(hasItems, (value) => {
  if (!value) {
    stage.value = 'method';
    selectedGateway.value = null;
    resetProofState();
    resetFeedback();
  }
});

watch(
  () => paymentForm.files,
  (files) => {
    if (!files || files.length === 0) {
      if (!paymentForm.proofUrl) {
        proofError.value = '';
      }
      return;
    }
    void onProofSelected(files);
  },
  { deep: true }
);

onMounted(() => {
  runtimeOnlineGatewayConfig.value = readRuntimeOnlineGatewayConfig();
  if (manualFlowEnabled) {
    void loadManualOptions();
  }
  void studentStore.fetchPayments();
  if (stage.value === 'vodafone') {
    void ensureVodafoneSettings();
  }
});

const resetFeedback = () => {
  paymentError.value = false;
  paymentSuccess.value = false;
  proofError.value = '';
};

const backToMethod = () => {
  stage.value = 'method';
  paymentLoading.value = false;
  resetProofState();
  resetFeedback();
  paymentForm.method = 'bank';
  paymentForm.gateway = null;
};

const continueWithGateway = () => {
  if (!selectedGateway.value) {
    return;
  }
  resetFeedback();
  if (selectedGateway.value === 'VODAFONE_CASH') {
    paymentForm.method = 'vodafone_cash';
    paymentForm.gateway = 'VODAFONE_CASH';
    stage.value = 'vodafone';
    return;
  }
  stage.value = 'online';
  if (!onlineRedirectUrl.value) {
    onlineRedirectError.value = t('student.checkoutOnlineUnavailable');
  } else {
    onlineRedirectError.value = '';
  }
};

const startOnlinePayment = () => {
  if (!selectedGateway.value) {
    return;
  }
  const url = onlineRedirectUrl.value;
  if (!url) {
    onlineRedirectError.value = t('student.checkoutOnlineUnavailable');
    toast.error({ summary: t('student.checkoutOnlineUnavailable') });
    return;
  }
  onlineRedirectError.value = '';
  onlineRedirecting.value = true;
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};

const onProofSelected = async (files: File[]) => {
  if (!files || files.length === 0) {
    return;
  }
  const [file] = files;
  if (!file) {
    return;
  }
  proofError.value = '';
  proofUploading.value = true;
  paymentForm.proofUrl = '';
  paymentForm.proofKey = '';
  try {
    const result = await studentStore.uploadProof(file);
    paymentForm.proofUrl = result.url;
    paymentForm.proofKey = result.key;
  } catch (error) {
    console.error('[CheckoutPaymentPanel] Failed to upload proof', error);
    proofError.value = t('student.proofUploadFailed');
    paymentForm.files = [];
    paymentForm.proofUrl = '';
    paymentForm.proofKey = '';
  } finally {
    proofUploading.value = false;
  }
};

const clearProof = () => {
  proofError.value = '';
  resetProofState();
};

const submitPayment = async () => {
  if (isFreeCheckout.value) {
    if (!hasItems.value || paymentForm.courseId == null) {
      return;
    }

    paymentLoading.value = true;
    resetFeedback();
    formError.value = '';

    try {
      await studentStore.submitPayment({
        courseId: paymentForm.courseId,
        amount: 0,
        currency: resolvedCurrency.value,
        method: 'other',
        notes: paymentForm.notes || undefined,
        offerCode: validation.value?.code ?? undefined
      });
      paymentSuccess.value = true;
      paymentError.value = false;
      paymentForm.notes = '';
      await Promise.allSettled([
        studentStore.fetchNotifications(),
        studentStore.fetchPayments(),
        studentStore.fetchEnrollments()
      ]);
    } catch (error) {
      formError.value = resolveErrorMessage(error);
      paymentError.value = true;
      paymentSuccess.value = false;
    } finally {
      paymentLoading.value = false;
    }
    return;
  }

  if (manualFlowEnabled) {
    if (!hasItems.value || paymentForm.courseId == null || methodsLoading.value) {
      return;
    }
    if (manualSubmissionBlocked.value) {
      formError.value = t('student.paymentPendingNotice');
      return;
    }

    paymentLoading.value = true;
    resetFeedback();

    if (!paymentForm.proofUrl) {
      proofError.value = t('student.proofRequiredError');
      paymentLoading.value = false;
      return;
    }

    formError.value = '';
    try {
      await studentStore.submitPayment({
        courseId: paymentForm.courseId,
        amount: paymentForm.amount,
        currency: resolvedCurrency.value,
        method: paymentForm.method,
        gateway: paymentForm.gateway ?? undefined,
        proofImageUrl: paymentForm.proofUrl || undefined,
        proofKey: paymentForm.proofKey || undefined,
        notes: paymentForm.notes || undefined,
        transferReference: paymentForm.transferReference.trim() || undefined
      });
      paymentSuccess.value = true;
      paymentError.value = false;
      resetProofState();
      paymentForm.notes = '';
      await Promise.allSettled([
        studentStore.fetchNotifications(),
        studentStore.fetchPayments(),
        studentStore.fetchEnrollments()
      ]);
    } catch (error) {
      formError.value = resolveErrorMessage(error);
      paymentError.value = true;
      paymentSuccess.value = false;
    } finally {
      paymentLoading.value = false;
    }
    return;
  }

  if (stage.value !== 'vodafone' || !hasItems.value || paymentForm.courseId == null) {
    return;
  }

  paymentLoading.value = true;
  resetFeedback();

  if (!paymentForm.proofUrl) {
    proofError.value = t('student.proofRequiredError');
    paymentLoading.value = false;
    return;
  }

  try {
    await studentStore.submitPayment({
      courseId: paymentForm.courseId,
      amount: paymentForm.amount,
      currency: resolvedCurrency.value,
      method: paymentForm.method,
      gateway: paymentForm.gateway,
      proofImageUrl: paymentForm.proofUrl || undefined,
      proofKey: paymentForm.proofKey || undefined,
      notes: paymentForm.notes || undefined,
      transferReference: paymentForm.transferReference.trim() || undefined
    });
    paymentSuccess.value = true;
    resetProofState();
    paymentForm.notes = '';
    await Promise.allSettled([
      studentStore.fetchNotifications(),
      studentStore.fetchPayments(),
      studentStore.fetchEnrollments()
    ]);
  } catch (error) {
    console.error('[CheckoutPaymentPanel] Failed to submit payment', error);
    paymentError.value = true;
  } finally {
    paymentLoading.value = false;
  }
};
</script>

<style scoped>
.checkout-payment-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.checkout-payment-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 1.75rem 1.25rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-primary) 18%, transparent) 0%,
    transparent 60%
  );
}

.checkout-payment-panel__header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary);
}

.checkout-payment-panel__header-copy {
  flex: 1;
}

.checkout-payment-panel__header-copy h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel__header-copy p {
  margin: 0.4rem 0 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.checkout-payment-panel__totals {
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  display: grid;
  gap: 0.85rem;
}

.checkout-payment-panel__totals dl {
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.checkout-payment-panel__totals div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.checkout-payment-panel__totals dt {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.checkout-payment-panel__totals dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel__total dt {
  font-size: 1rem;
  color: var(--sakai-text-color);
}

.checkout-payment-panel__total dd {
  font-size: 1.05rem;
}

.checkout-payment-panel__discount {
  color: var(--sakai-success);
}

.checkout-payment-panel__code {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-success) 10%, transparent);
  color: var(--sakai-success);
  font-weight: var(--sakai-font-weight-medium);
}

.checkout-payment-panel__coupon {
  padding: 1.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-section) 60%, transparent);
}

.checkout-payment-panel__manual {
  display: grid;
  gap: 1.5rem;
  padding: 1.75rem;
}

.checkout-payment-panel__free {
  display: grid;
  gap: 1.25rem;
  padding: 1.75rem;
}

.checkout-payment-panel__manual-header {
  display: grid;
  gap: 0.35rem;
}

.checkout-payment-panel__manual-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel__manual-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__manual-status {
  margin: 0;
}

.checkout-payment-panel__manual-status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkout-payment-panel__manual-reject-note {
  font-size: 0.85rem;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__manual-methods {
  margin: 0;
}

.checkout-payment-panel__manual-details {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-section) 65%, transparent);
}

.checkout-payment-panel__manual-method-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.checkout-payment-panel__manual-method-media {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 20%, transparent);
  overflow: hidden;
}

.checkout-payment-panel__manual-method-media img {
  display: block;
  width: 60%;
  height: auto;
}

.checkout-payment-panel__manual-accounts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.checkout-payment-panel__manual-accounts-item {
  display: grid;
  gap: 0.15rem;
}

.checkout-payment-panel__manual-accounts-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__manual-accounts-value {
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-medium);
  word-break: break-word;
}

.checkout-payment-panel__manual-accounts-link {
  color: var(--sakai-primary);
  text-decoration: underline;
}

.checkout-payment-panel__manual-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.checkout-payment-panel__manual-link-anchor {
  color: var(--sakai-primary);
  font-weight: var(--sakai-font-weight-medium);
  text-decoration: underline;
  word-break: break-all;
}

.checkout-payment-panel__manual-instructions {
  display: grid;
  gap: 0.5rem;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__manual-instructions p {
  margin: 0;
}

.checkout-payment-panel__manual-instructions-secondary {
  font-size: 0.9rem;
}

.checkout-payment-panel__form {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.checkout-payment-panel__form-header {
  display: grid;
  gap: 0.35rem;
}

.checkout-payment-panel__form-header h3 {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
}

.checkout-payment-panel__form-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__hint {
  display: block;
  margin-top: 0.35rem;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__gateway-alert {
  margin-top: -0.15rem;
}

.checkout-payment-panel__online-hint {
  margin: -0.25rem 0 0;
}

.checkout-payment-panel__method,
.checkout-payment-panel__online {
  display: grid;
  gap: 1.25rem;
  padding: 1.75rem;
}

.checkout-payment-panel__method-header {
  display: grid;
  gap: 0.4rem;
}

.checkout-payment-panel__method-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel__method-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.checkout-payment-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.checkout-payment-panel__vodafone-summary {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.25rem;
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.checkout-payment-panel__vodafone-summary p {
  margin: 0;
}

.checkout-payment-panel__vodafone-amount {
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 1.05rem;
}

.checkout-payment-panel__vodafone-wallet {
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__vodafone-guidance {
  display: grid;
  gap: var(--sakai-space-3);
}

.checkout-payment-panel__vodafone-instructions {
  display: grid;
  gap: var(--sakai-space-2);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
}

.checkout-payment-panel__vodafone-instructions-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel__vodafone-instructions ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
  font-size: var(--sakai-font-size-sm);
}

.checkout-payment-panel__vodafone-support {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.checkout-payment-panel__vodafone-upload {
  display: grid;
  gap: var(--sakai-space-2);
}

.checkout-payment-panel__field {
  width: 100%;
}

.checkout-payment-panel__online-summary {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.checkout-payment-panel__online-summary div {
  display: flex;
  justify-content: space-between;
  gap: 1.25rem;
  font-size: 0.95rem;
}

.checkout-payment-panel__online-summary dt {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.checkout-payment-panel__online-summary dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-payment-panel :deep(.coupon-box) {
  border: none;
  background: transparent;
  box-shadow: none;
}

@media (max-width: 768px) {
  .checkout-payment-panel__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .checkout-payment-panel__manual,
  .checkout-payment-panel__free {
    padding: 1.25rem;
  }

  .checkout-payment-panel__manual-status-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .checkout-payment-panel__manual-details {
    padding: 1rem;
  }

  .checkout-payment-panel__code {
    width: 100%;
    justify-content: center;
  }

  .checkout-payment-panel__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>


