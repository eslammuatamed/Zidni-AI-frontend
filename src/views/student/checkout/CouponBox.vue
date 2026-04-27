<template>
  <component
    :is="containerTag"
    class="coupon-box"
    :class="{ 'coupon-box--embedded': props.embedded }"
  >
    <header class="coupon-box__header">
      <div>
        <h3>{{ t('checkout.couponTitle') }}</h3>
        <p>{{ t('checkout.couponSubtitle') }}</p>
      </div>
      <UiBadge v-if="validation?.valid" color="success" variant="soft">
        {{ t('checkout.appliedBadge') }}
      </UiBadge>
    </header>

    <div class="coupon-box__form">
      <UiInput
        v-model="code"
        :label="t('checkout.codeLabel')"
        :placeholder="t('checkout.codePlaceholder')"
        :disabled="!enabled || loading"
        :readonly="!enabled"
        clearable
        @clear="clear"
      />
      <UiButton
        class="coupon-box__apply"
        color="primary"
        :disabled="!canApply"
        :loading="loading"
        @click="apply"
      >
        {{ t('checkout.applyAction') }}
      </UiButton>
    </div>

    <UiAlert v-if="!enabled" color="neutral" variant="soft" icon="LockOutlined">
      {{ t('checkout.disabled') }}
    </UiAlert>
    <UiAlert v-else-if="errorMessage" color="danger" variant="soft">
      {{ errorMessage }}
    </UiAlert>
    <UiAlert
      v-else-if="validation && validation.valid"
      color="success"
      variant="soft"
      icon="CheckCircleOutlined"
    >
      {{ validation.message || t('checkout.successDefault') }}
    </UiAlert>
    <UiAlert v-else-if="validation && !validation.valid" color="warning" variant="soft">
      {{ validation.message || t('checkout.invalidDefault') }}
    </UiAlert>

    <dl class="coupon-box__summary">
      <div>
        <dt>{{ t('checkout.subtotal') }}</dt>
        <dd>{{ formatMoney(currentSubtotal) }}</dd>
      </div>
      <div>
        <dt>{{ t('checkout.discount') }}</dt>
        <dd class="coupon-box__discount">{{ formatMoney(currentDiscount) }}</dd>
      </div>
      <div>
        <dt>{{ t('checkout.total') }}</dt>
        <dd class="coupon-box__total">{{ formatMoney(currentTotal) }}</dd>
      </div>
    </dl>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { useStudentCheckoutStore, type CheckoutItem } from '@/stores/studentCheckout';
import { formatCheckoutMoney, resolveCheckoutCurrency } from '@/utils/checkoutCurrency';

interface Props {
  teacherSlug: string;
  items: CheckoutItem[];
  enabled?: boolean;
  embedded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  embedded: false
});

const { t, locale } = useI18n();
const checkoutStore = useStudentCheckoutStore();

const code = ref(checkoutStore.validation?.code ?? '');
const containerTag = computed(() => (props.embedded ? 'div' : UiCard));

watch(
  () => props.items,
  (items) => {
    if (items && items !== checkoutStore.items) {
      checkoutStore.setItems(items.map((item) => ({ ...item })));
    }
  },
  { immediate: true }
);

watch(
  () => checkoutStore.validation?.code,
  (value) => {
    if (value && code.value !== value) {
      code.value = value;
    }
  }
);

const validation = computed(() => checkoutStore.validation);
const loading = computed(() => checkoutStore.loading);

const checkoutCurrency = computed(() => {
  const itemWithCurrency = checkoutStore.items.find(
    (item) => typeof item.currency === 'string' && item.currency.trim().length > 0
  );
  return resolveCheckoutCurrency(itemWithCurrency?.currency, validation.value?.currency);
});

const errorMessage = computed(() => {
  const key = checkoutStore.error;
  if (!key) return '';
  switch (key) {
    case 'EMPTY_CODE':
      return t('checkout.errors.empty');
    case 'NO_ITEMS':
      return t('checkout.errors.noItems');
    case 'INVALID_CODE':
      return t('checkout.errors.invalid');
    case 'UNKNOWN_ERROR':
      return t('checkout.errors.unknown');
    default:
      return key;
  }
});

const canApply = computed(() => {
  return (
    props.enabled &&
    checkoutStore.hasItems &&
    code.value.trim().length > 0 &&
    !loading.value
  );
});

const currentSubtotal = computed(() => {
  if (validation.value) {
    return validation.value.subtotal;
  }
  return checkoutStore.items.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
});

const currentDiscount = computed(() => (validation.value ? validation.value.discount : 0));

const currentTotal = computed(() => {
  if (validation.value) {
    return validation.value.total;
  }
  return currentSubtotal.value;
});

const formatMoney = (value: number) => {
  return formatCheckoutMoney(value, checkoutCurrency.value, locale.value);
};

const apply = async () => {
  if (!canApply.value) return;
  try {
    await checkoutStore.applyCode(props.teacherSlug, code.value);
  } catch (error) {
    console.warn('[CouponBox] Failed to validate offer', error);
  }
};

const clear = () => {
  checkoutStore.clearValidation();
};
</script>

<style scoped>
.coupon-box {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
}

.coupon-box--embedded {
  padding: 0;
}

.coupon-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.coupon-box__header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.coupon-box__header p {
  margin: 0.25rem 0 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.coupon-box__form {
  display: grid;
  grid-template-columns: 1fr minmax(120px, auto);
  gap: 1rem;
  align-items: end;
}

.coupon-box__apply {
  width: 100%;
}

.coupon-box__summary {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.coupon-box__summary div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--sakai-text-color-secondary);
}

.coupon-box__summary dt {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.coupon-box__summary dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.coupon-box__discount {
  color: var(--sakai-danger);
}

.coupon-box__total {
  color: var(--sakai-primary-600);
}

@media (max-width: 640px) {
  .coupon-box__form {
    grid-template-columns: 1fr;
  }
}
</style>
