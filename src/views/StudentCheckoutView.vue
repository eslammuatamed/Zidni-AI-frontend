<template>
  <ThemePage :title="t('checkout.title')" :subtitle="t('checkout.subtitle')">
    <template #actions>
      <UiButton v-if="catalogRoute" variant="outline" color="secondary" :to="catalogRoute">
        {{ t('checkout.backToCatalog') }}
      </UiButton>
    </template>

    <div class="student-checkout flex flex-col gap-5">
      <UiAlert v-if="tutoringError" color="danger" variant="soft" class="student-checkout__empty grid gap-3 justify-items-start">
        <p>{{ tutoringError }}</p>
      </UiAlert>

      <UiAlert v-else-if="!hasItems" color="neutral" variant="soft" class="student-checkout__empty grid gap-3 justify-items-start">
        <p>{{ t('checkout.emptyCart') }}</p>
        <UiButton v-if="catalogRoute" color="primary" :to="catalogRoute">
          {{ t('checkout.backToCatalog') }}
        </UiButton>
      </UiAlert>

      <div v-else class="student-checkout__content grid gap-5">
        <section v-if="!tutoringSession" class="student-checkout__cart flex flex-col">
          <CheckoutCartPanel
            :items="checkoutStore.items"
            :currency="checkoutCurrency"
          />
        </section>

        <section class="student-checkout__form flex flex-col">
          <UiCard class="student-checkout__form-card grid gap-4 p-5" hover>
            <header class="student-checkout__form-header grid gap-[0.35rem]">
              <h2>{{ checkoutTitle }}</h2>
              <p>{{ checkoutSubtitle }}</p>
            </header>

            <div class="student-checkout__form-body grid">
              <CheckoutPaymentPanel
                v-if="!tutoringSession"
                :teacher-slug="teacherSlug"
                :items="checkoutStore.items"
                :offers-enabled="offersEnabled"
              />
              <TutoringCheckoutPanel
                v-else
                :session="tutoringSession"
                @session-updated="onTutoringSessionUpdated"
              />
            </div>
          </UiCard>
        </section>
      </div>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import CheckoutPaymentPanel from '@/views/student/checkout/CheckoutPaymentPanel.vue';
import TutoringCheckoutPanel from '@/views/student/checkout/TutoringCheckoutPanel.vue';
import CheckoutCartPanel from '@/views/student/checkout/CheckoutCartPanel.vue';
import { useStudentCheckoutStore } from '@/stores/studentCheckout';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { getStudentCourses } from '@/services/student';
import { fetchStudentSession, type TutoringSession } from '@/services/tutoring';
import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const route = useRoute();
const tenantStore = useTenantStore();
const checkoutStore = useStudentCheckoutStore();
const featuresStore = useFeaturesStore();
const toast = useToast();

const tutoringSession = ref<TutoringSession | null>(null);
const tutoringError = ref('');

const teacherSlug = computed(() => {
  const slugParam = route.query.slug;
  if (typeof slugParam === 'string' && slugParam.trim().length > 0) {
    return slugParam.trim();
  }
  return tenantStore.branding?.slug || '';
});

const offersEnabled = computed(
  () => tutoringSession.value == null && featuresStore.hasFeature(FEATURE.offers)
);
const hasItems = computed(() => checkoutStore.items.length > 0 || tutoringSession.value != null);

const checkoutCurrency = computed(() => {
  const validationCurrency = checkoutStore.validation?.currency;
  if (typeof validationCurrency === 'string') {
    const trimmed = validationCurrency.trim();
    if (trimmed.length > 0) {
      return trimmed.toUpperCase();
    }
  }
  const itemWithCurrency = checkoutStore.items.find(
    (item) => typeof item.currency === 'string' && item.currency.trim().length > 0
  );
  if (itemWithCurrency?.currency) {
    return itemWithCurrency.currency.trim().toUpperCase();
  }
  return null;
});

const checkoutTitle = computed(() =>
  tutoringSession.value ? t('tutoring.student.checkoutPaymentTitle') : t('checkout.paymentTitle')
);

const checkoutSubtitle = computed(() =>
  tutoringSession.value
    ? t('tutoring.student.checkoutPaymentSubtitle')
    : t('checkout.paymentSubtitle')
);

const catalogRoute = computed(() => {
  const slug = teacherSlug.value?.trim();
  if (!slug) {
    return null;
  }
  return { name: 'public-teacher-landing', params: { teacherSlug: slug } } as const;
});

const courseIdFromQuery = computed(() => {
  const raw = route.query.courseId;
  if (raw == null) {
    return null;
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
});

const tutoringSessionIdFromQuery = computed(() => {
  const raw = route.query.tutoringSessionId;
  if (raw == null) {
    return null;
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
});

const normalizeCurrency = (value?: string | null) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed.toUpperCase();
    }
  }
  return null;
};

const hydrateCheckoutItems = async () => {
  try {
    if (tutoringSessionIdFromQuery.value != null) {
      tutoringError.value = '';
      const session = await fetchStudentSession(tutoringSessionIdFromQuery.value);
      tutoringSession.value = session;
      checkoutStore.clear();
      return;
    }

    tutoringSession.value = null;
    tutoringError.value = '';

    const catalog = await getStudentCourses();

    if (courseIdFromQuery.value != null) {
      const matchedCourse = catalog.find((course) => course.id === courseIdFromQuery.value);
      if (matchedCourse) {
        checkoutStore.setItems([
          {
            courseId: matchedCourse.id,
            qty: 1,
            title: matchedCourse.title,
            price: matchedCourse.price,
            currency: normalizeCurrency(matchedCourse.currency)
          }
        ]);
        return;
      }
    }

    if (!checkoutStore.items.length) {
      return;
    }

    const hydrated = checkoutStore.items.map((item) => {
      const existingCurrency = normalizeCurrency(item.currency);
      const match = catalog.find((course) => course.id === item.courseId);
      if (!match) {
        if (item.currency === existingCurrency || (item.currency == null && existingCurrency == null)) {
          return item;
        }
        return { ...item, currency: existingCurrency };
      }
      const title = item.title?.trim() ? item.title : match.title;
      const price = match.price ?? item.price;
      const currency = normalizeCurrency(match.currency ?? existingCurrency);
      if (
        title === item.title &&
        price === item.price &&
        currency === existingCurrency &&
        (item.currency === currency || (item.currency == null && currency == null))
      ) {
        return item;
      }
      return { ...item, title, price, currency };
    });

    const changed = hydrated.some((item, index) => item !== checkoutStore.items[index]);
    if (changed) {
      checkoutStore.setItems(hydrated);
    }
  } catch (error) {
    if (tutoringSessionIdFromQuery.value != null) {
      tutoringSession.value = null;
      tutoringError.value = t('tutoring.student.checkoutLoadFailed');
      toast.error({ detail: tutoringError.value });
    } else if (import.meta.env.DEV) {
      console.warn('[StudentCheckout] Failed to hydrate checkout items', error);
    }
  }
};

onMounted(async () => {
  if (teacherSlug.value && tenantStore.branding?.slug !== teacherSlug.value) {
    await tenantStore.fetchBranding(teacherSlug.value);
  }
  await hydrateCheckoutItems();
});

watch(courseIdFromQuery, async () => {
  await hydrateCheckoutItems();
});

watch(tutoringSessionIdFromQuery, async () => {
  await hydrateCheckoutItems();
});

const onTutoringSessionUpdated = (session: TutoringSession) => {
  tutoringSession.value = session;
};

</script>


<style scoped>
.student-checkout__form-header h2 {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
}

.student-checkout__form-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.student-checkout__form-body :deep(.checkout-payment-panel) {
  margin-top: 0;
}

@media (min-width: 960px) {
  .student-checkout__content {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1.75fr);
    align-items: start;
  }
}

@media (max-width: 600px) {
  .student-checkout__form-card {
    padding: var(--sakai-space-4);
  }
}
</style>
