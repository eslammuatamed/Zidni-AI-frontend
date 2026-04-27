<template>
  <UiCard class="checkout-cart-panel">
    <header class="checkout-cart-panel__header">
      <div class="checkout-cart-panel__header-icon">
        <UiIcon name="ShoppingCartOutlined" :size="26" />
      </div>
      <div class="checkout-cart-panel__header-copy">
        <h3>{{ t('checkout.cartTitle') }}</h3>
        <p>{{ t('checkout.cartSubtitle') }}</p>
      </div>
      <UiBadge v-if="itemCount" color="primary" variant="soft">
        {{ t('checkout.cartBadge', { count: totalQuantity }) }}
      </UiBadge>
    </header>

    <UiAlert v-if="!itemCount" color="neutral" variant="soft" class="checkout-cart-panel__empty">
      {{ t('checkout.emptyCart') }}
    </UiAlert>

    <ul v-else class="checkout-cart-panel__list">
      <li v-for="item in items" :key="item.courseId" class="checkout-cart-panel__item">
        <div class="checkout-cart-panel__item-details">
          <h4>{{ item.title || fallbackTitle }}</h4>
          <p>{{ t('checkout.qty', { qty: item.qty }) }}</p>
        </div>
        <span class="checkout-cart-panel__item-price">{{ formatMoney(item.price, item.currency) }}</span>
      </li>
    </ul>

    <footer v-if="itemCount" class="checkout-cart-panel__footer">
      <span>{{ t('checkout.subtotal') }}</span>
      <span>{{ formatMoney(subtotal, resolvedCurrency) }}</span>
    </footer>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import type { CheckoutItem } from '@/stores/studentCheckout';
import { formatCheckoutMoney, resolveCheckoutCurrency } from '@/utils/checkoutCurrency';

interface Props {
  items: CheckoutItem[];
  currency?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  currency: null
});

const { t, locale } = useI18n();

const itemCount = computed(() => props.items.length);
const totalQuantity = computed(() => props.items.reduce((sum, item) => sum + item.qty, 0));
const subtotal = computed(() =>
  props.items.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price * item.qty : 0), 0)
);

const resolvedCurrency = computed(() => {
  const withCurrency = props.items.find(
    (item) => typeof item.currency === 'string' && item.currency.trim().length > 0
  );
  return resolveCheckoutCurrency(props.currency, withCurrency?.currency);
});

const fallbackTitle = computed(() => t('student.course'));

const formatMoney = (amount?: number | null, currencyOverride?: string | null) =>
  formatCheckoutMoney(
    amount,
    resolveCheckoutCurrency(currencyOverride, resolvedCurrency.value),
    locale.value
  );
</script>

<style scoped>
.checkout-cart-panel {
  display: grid;
  gap: 1.5rem;
  padding: 1.75rem;
}

.checkout-cart-panel__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkout-cart-panel__header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: var(--sakai-color-primary-50);
  color: var(--sakai-color-primary-600);
}

.checkout-cart-panel__header-copy {
  flex: 1;
  display: grid;
  gap: 0.25rem;
}

.checkout-cart-panel__header-copy h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.checkout-cart-panel__header-copy p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.95rem;
}

.checkout-cart-panel__empty {
  margin: 0;
}

.checkout-cart-panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1rem;
}

.checkout-cart-panel__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.checkout-cart-panel__item-details {
  display: grid;
  gap: 0.35rem;
}

.checkout-cart-panel__item-details h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-medium);
}

.checkout-cart-panel__item-details p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.checkout-cart-panel__item-price {
  font-weight: var(--sakai-font-weight-semibold);
  white-space: nowrap;
}

.checkout-cart-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: var(--sakai-font-weight-semibold);
  border-top: 1px solid var(--sakai-border-color);
  padding-top: 1rem;
}
</style>
