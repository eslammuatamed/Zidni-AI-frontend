<template>
  <ThemePage :title="t('teacher.planUpgradeTitle')" :subtitle="t('teacher.planUpgradeSubtitle')">
    <!-- <template #actions>
      <UiButton color="primary" :href="phoneHref">
        <UiIcon name="PhoneOutlined" :size="18" />
        <span>{{ t('teacher.planUpgradeCallAction', { phone: supportPhone }) }}</span>
      </UiButton>
    </template> -->

    <div class="teacher-plan-upgrade">
      <section class="teacher-plan-upgrade__hero">
        <div class="teacher-plan-upgrade__hero-content">
          <span class="teacher-plan-upgrade__hero-badge">{{ t('teacher.planUpgradeHero.badge') }}</span>
          <h2 class="teacher-plan-upgrade__hero-title">{{ t('teacher.planUpgradeHero.title') }}</h2>
          <p class="teacher-plan-upgrade__hero-subtitle">{{ t('teacher.planUpgradeHero.subtitle') }}</p>
          <ul v-if="heroHighlights.length" class="teacher-plan-upgrade__hero-highlights">
            <li v-for="highlight in heroHighlights" :key="highlight" class="teacher-plan-upgrade__hero-highlight">
              <UiIcon name="CheckCircleOutlined" :size="18" />
              <span>{{ highlight }}</span>
            </li>
          </ul>
        </div>
      </section>

      <div class="teacher-plan-upgrade__layout">
        <div class="teacher-plan-upgrade__main">
          <section aria-labelledby="teacher-plan-upgrade-plans" class="teacher-plan-upgrade__plans">
            <header class="teacher-plan-upgrade__plans-header">
              <h2 id="teacher-plan-upgrade-plans">{{ t('teacher.planUpgradePlansTitle') }}</h2>
            </header>
            <p v-if="pricingNoticeText" class="teacher-plan-upgrade__country-notice">
              {{ pricingNoticeText }}
            </p>
            <p v-if="fallbackNoticeText" class="teacher-plan-upgrade__country-notice teacher-plan-upgrade__country-notice--fallback">
              {{ fallbackNoticeText }}
            </p>
            <p v-if="!isLoading && pricingContextText" class="teacher-plan-upgrade__region-context">
              {{ pricingContextText }}
            </p>
            <UiAlert v-if="loadError" color="danger" variant="soft">
              {{ t('teacher.planUpgradePricingError') }}
            </UiAlert>
            <div v-else-if="isLoading" class="teacher-plan-upgrade__grid">
               
            </div>
            <div v-else-if="planOptions.length" class="teacher-plan-upgrade__grid">
              <UiCard
                v-for="plan in planOptions"
                :key="plan.key"
                
                hover
              >
                <template #title>
                  <h4>{{ plan.title }}</h4>
                  <p v-if="plan.tagline" class="teacher-plan-upgrade__tagline">{{ plan.tagline }}</p>
                </template>
                <div v-if="!plan.isContactOnly" class="teacher-plan-upgrade__billing">
                  <div class="teacher-plan-upgrade__billing-option">
                    <span class="teacher-plan-upgrade__billing-label">{{ t('teacher.planUpgradeMonthlyLabel') }}</span>
                    <span class="teacher-plan-upgrade__billing-value">{{ plan.monthlyPrice }}</span>
                  </div>
                </div>
                <div v-else class="teacher-plan-upgrade__contact-pricing">
                  <span class="teacher-plan-upgrade__contact-price">{{ plan.monthlyPrice }}</span>
                </div>
                <p class="teacher-plan-upgrade__best-for">
                  <strong>{{ t('teacher.planUpgradeBestFor') }}:</strong>
                  <span>{{ plan.bestFor }}</span>
                </p>
                <h3 class="teacher-plan-upgrade__features-heading">{{ t('teacher.planUpgradeIncluded') }}</h3>
                <ul class="teacher-plan-upgrade__features">
                  <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
                </ul>
                <div class="teacher-plan-upgrade__plan-actions">
                  <strong
                    v-if="shouldShowCurrentPlanNotice(plan)"
                    class="teacher-plan-upgrade__plan-current"
                  >
                    {{ t('teacher.planUpgradeCurrentPlanNotice') }}
                  </strong>
                  <template v-else-if="!plan.isContactOnly">
                    <UiButton
                      class="teacher-plan-upgrade__plan-button"
                      color="primary"
                      :disabled="!hasPaymentMethods"
                      @click="startCheckout(plan)"
                    >
                      {{ t('teacher.planUpgradeSelectPlan', { plan: plan.title }) }}
                    </UiButton>
                  </template>
                  <UiButton
                    v-else
                    class="teacher-plan-upgrade__plan-button"
                    color="primary"
                    :href="plan.contactHref || undefined"
                  >

                  </UiButton>
                </div>
              </UiCard>
            </div>
            <UiAlert v-else color="warning" variant="soft">
              {{ t('teacher.planUpgradeNoPlans') }}
            </UiAlert>
          </section>
        </div>

        <!-- <aside class="teacher-plan-upgrade__sidebar">
          <UiCard v-if="isLoading" class="teacher-plan-upgrade__meta" hover>
            <UiSkeleton height="1rem" />
            <UiSkeleton height="1rem" width="65%" />
          </UiCard>
          <UiCard v-else-if="pricingContextText" class="teacher-plan-upgrade__meta" hover>
            <template #title>{{ t('teacher.planUpgradeMeta.title') }}</template>
            <p class="teacher-plan-upgrade__meta-description">{{ pricingContextText }}</p>
          </UiCard>
        </aside> -->
      </div>

      <footer class="teacher-plan-upgrade__footer">
        <UiCard v-if="isLoading" class="teacher-plan-upgrade__methods" hover>
          <template #title>{{ t('teacher.planUpgradePaymentMethodsTitle') }}</template>
          <UiSkeleton height="1rem" />
          <UiSkeleton height="1rem" width="60%" />
        </UiCard>
        <UiCard v-else-if="paymentMethodEntries.length" class="teacher-plan-upgrade__methods" hover>
          <template #title>{{ t('teacher.planUpgradePaymentMethodsTitle') }}</template>
          <p class="teacher-plan-upgrade__methods-intro">{{ t('teacher.planUpgradePaymentMethodsBody') }}</p>
          <ul class="teacher-plan-upgrade__methods-list">
            <li v-for="method in paymentMethodEntries" :key="method.code" class="teacher-plan-upgrade__method">
              <span v-if="method.icon" class="teacher-plan-upgrade__method-icon">
                <img :src="method.icon" :alt="method.iconAlt" loading="lazy" />
              </span>
              <div
                v-else-if="method.logos?.length"
                class="teacher-plan-upgrade__method-icon cardsLogos"
                aria-hidden="true"
              >
                <img
                  v-for="logo in method.logos"
                  :key="logo.src"
                  :src="logo.src"
                  :alt="logo.alt"
                  loading="lazy"
                />
              </div>
              <div class="teacher-plan-upgrade__method-copy">
                <span class="teacher-plan-upgrade__method-name">{{ method.label }}</span>
                <p class="teacher-plan-upgrade__method-description">{{ method.description }}</p>
              </div>
            </li>
          </ul>
          <p class="teacher-plan-upgrade__methods-note">
            {{ t('teacher.planUpgradePaymobStatusNote') }}
          </p>
        </UiCard>
        <UiCard v-else class="teacher-plan-upgrade__methods" hover>
          <template #title>{{ t('teacher.planUpgradePaymentMethodsTitle') }}</template>
          <p>{{ t('teacher.planUpgradePaymentMethodsUnavailable') }}</p>
        </UiCard>

        <UiCard v-if="supportContacts.length" class="teacher-plan-upgrade__contact" hover>
          <template #title>{{ t('teacher.planUpgradeSupportTitle') }}</template>
          <p>{{ t('teacher.planUpgradeSupportBody') }}</p>
          <ul class="teacher-plan-upgrade__contact-locations" aria-label="Regional offices">
            <li
              v-for="contact in supportContacts"
              :key="contact.code"
              class="teacher-plan-upgrade__contact-location"
            >
              <div class="teacher-plan-upgrade__contact-location-header">
                <span class="teacher-plan-upgrade__contact-location-name">{{ contact.location }}</span>
                <a :href="contact.href" class="teacher-plan-upgrade__contact-location-phone">
                  {{ contact.phone }}
                </a>
              </div>
              <p class="teacher-plan-upgrade__contact-location-address">{{ contact.address }}</p>
            </li>
          </ul>
          <div class="teacher-plan-upgrade__contact-links" aria-label="Additional contact methods">
            <a
              class="teacher-plan-upgrade__contact-link"
              href="https://www.linkedin.com/in/hossamjava/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <UiIcon name="pi pi-linkedin" :size="22" />
            </a>
            <a
              class="teacher-plan-upgrade__contact-link"
              href="https://github.com/Hossam-Ahmed123"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <UiIcon name="pi pi-github" :size="22" />
            </a>
            <a
              class="teacher-plan-upgrade__contact-link"
              href="https://www.facebook.com/HossamDevloper"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <UiIcon name="pi pi-facebook" :size="22" />
            </a>
            <a
              class="teacher-plan-upgrade__contact-link teacher-plan-upgrade__contact-link--email"
              href="mailto:info@zidni.cloud"
            >
              <UiIcon name="MailOutlined" :size="22" />
              <span class="teacher-plan-upgrade__contact-email">info@zidni.cloud</span>
            </a>
          </div>
          <p class="teacher-plan-upgrade__contact-note">{{ t('teacher.planUpgradeSupportNote') }}</p>
        </UiCard>
      </footer>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import paypalIcon from '@/assets/icons/paypal.png';
import vodafoneIcon from '@/assets/icons/vodafone.png';
import visaLogo from '@/assets/payment/visa.svg';
import mastercardLogo from '@/assets/payment/Mastercard.svg';
import {
  fetchTeacherPricing,
  getPersistedTeacherPricingCountry,
  type TeacherPlanMarketingContent,
  type TeacherPlanPricing,
  type TeacherPricingResponse
} from '@/services/teacherPlans';
import { useToast } from '@/composables/useToast';
import { isNavigationFailure, useRouter } from 'vue-router';
import { useTeacherPlanCheckoutStore } from '@/stores/teacherPlanCheckout';
import { useFeaturesStore } from '@/stores/features';
import { useTeacherProfileStore } from '@/stores/teacherProfile';
import { useSubscriptionStore } from '@/stores/subscription';
import type { TeacherPlanOption } from '@/types/teacherPlans';

const { t, tm, locale } = useI18n();
const router = useRouter();
const toast = useToast();
const checkoutStore = useTeacherPlanCheckoutStore();
const featuresStore = useFeaturesStore();
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

const normalizePaymentMethods = (methods: string[] | undefined | null): string[] => {
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

type SupportContactBlueprint = {
  code: string;
  phoneKey: string;
  fallbackPhone: string;
  locationKey: string;
  addressKey: string;
  fallbackLocation: string;
  fallbackAddress: string;
};

type SupportContact = {
  code: string;
  phone: string;
  href: string;
  location: string;
  address: string;
};

const SUPPORT_CONTACT_BLUEPRINTS: SupportContactBlueprint[] = [
  {
    code: 'uae',
    phoneKey: 'teacher.planUpgradeSupportPhones.uae',
    fallbackPhone: '+971 58 230 2840',
    locationKey: 'teacher.planUpgradeSupportLocations.uae',
    addressKey: 'teacher.planUpgradeSupportAddresses.uae',
    fallbackLocation: 'Dubai, UAE',
    fallbackAddress: 'Al Barsha 1, Dubai, UAE'
  },
  {
    code: 'eg',
    phoneKey: 'teacher.planUpgradeSupportPhones.eg',
    fallbackPhone: '+20 100 400 3528',
    locationKey: 'teacher.planUpgradeSupportLocations.eg',
    addressKey: 'teacher.planUpgradeSupportAddresses.eg',
    fallbackLocation: 'Mansoura, Egypt',
    fallbackAddress: 'Mansoura, University District, Egypt'
  }
];

const FALLBACK_PRICING_COUNTRY = 'EG';
const DEFAULT_PRICING_COUNTRY = FALLBACK_PRICING_COUNTRY;

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

const resolveInitialPricingCountry = (
  phoneCountryCode: string | null | undefined,
  persistedCountry: string | null | undefined
): string => {
  void phoneCountryCode;
  void persistedCountry;
  return DEFAULT_PRICING_COUNTRY;
};

const DIGIT_TRANSLATIONS: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9'
};

const normalizePhoneDigits = (value: string) =>
  value
    .split('')
    .map((char) => DIGIT_TRANSLATIONS[char] ?? char)
    .join('');

const formatPhoneHref = (phone: string) => {
  const normalized = normalizePhoneDigits(phone);
  const sanitized = normalized.replace(/[^\d+]/g, '');
  if (!sanitized) {
    return '#';
  }
  return `tel:${sanitized}`;
};

const resolveLocalizedText = (key: string, fallback: string) => {
  const localized = t(key as any);
  return localized === key ? fallback : localized;
};

const supportContacts = computed<SupportContact[]>(() =>
  SUPPORT_CONTACT_BLUEPRINTS.map((contact) => {
    const phone = resolveLocalizedText(contact.phoneKey, contact.fallbackPhone);
    return {
      code: contact.code,
      phone,
      href: formatPhoneHref(phone),
      location: resolveLocalizedText(contact.locationKey, contact.fallbackLocation),
      address: resolveLocalizedText(contact.addressKey, contact.fallbackAddress)
    };
  })
);

const primarySupportContact = computed<SupportContact | null>(() => supportContacts.value[0] ?? null);
const supportPhone = computed(() => primarySupportContact.value?.phone ?? '');
const phoneHref = computed(() => primarySupportContact.value?.href ?? '#');

const planPricing = ref<Record<string, TeacherPlanPricing>>({});
const paymentMethods = ref<string[]>(ensureDefaultPaymentMethods(checkoutStore.paymentMethods));
const pricingCountry = ref<string | null>(DEFAULT_PRICING_COUNTRY);
const pricingCurrency = ref<string | null>(TARGET_CURRENCY);
const detectedCountry = ref<string | null>(DEFAULT_PRICING_COUNTRY);
const usedFallbackPricing = ref(false);
const fallbackSourceCountry = ref<string | null>(null);
const isLoading = ref(true);
const loadError = ref(false);


const currentPlanKey = computed(() => featuresStore.plan?.trim().toLowerCase() || null);

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

const applyPricingResponse = (
  pricing: TeacherPricingResponse,
  requestedCountry: string | null
) => {
  const resolvedCountry =
    normalizeCountryCode(pricing.country) ?? normalizeCountryCode(requestedCountry) ?? DEFAULT_PRICING_COUNTRY;
  pricingCountry.value = DEFAULT_PRICING_COUNTRY;
  const normalizedCurrency = pricing.currency ? pricing.currency.toUpperCase() : null;
  const resolvedCurrency =
    normalizedCurrency ?? resolveCurrencyForCountry(resolvedCountry) ?? resolveCurrencyForCountry(FALLBACK_PRICING_COUNTRY);
  pricingCurrency.value = resolvedCurrency ?? TARGET_CURRENCY;
  const normalizedPlans = normalizePricing(pricing.plans ?? []);
  planPricing.value = applyPlanBlueprintFallbacks(normalizedPlans, { currency: resolvedCurrency });
  paymentMethods.value = mergePaymentMethods(paymentMethods.value, pricing.availablePaymentMethods);
  return {
    resolvedCountry,
    planCount: Array.isArray(pricing.plans) ? pricing.plans.length : 0
  };
};

const resetToFallbackBlueprints = (country: string | null) => {
  const normalized = normalizeCountryCode(country) ?? FALLBACK_PRICING_COUNTRY;
  const currency = resolveCurrencyForCountry(normalized) ?? resolveCurrencyForCountry(FALLBACK_PRICING_COUNTRY);
  planPricing.value = applyPlanBlueprintFallbacks({}, { currency });
  paymentMethods.value = ensureDefaultPaymentMethods([]);
  pricingCountry.value = normalized;
  pricingCurrency.value = currency;
};

const loadPlanPricing = async () => {
  isLoading.value = true;
  loadError.value = false;
  usedFallbackPricing.value = false;
  fallbackSourceCountry.value = null;

  await teacherProfileStore.load(true);

  const phoneCountryCode = teacherProfileStore.profile?.phoneCountryCode ?? null;
  const persistedCountry = getPersistedTeacherPricingCountry();
  const initialCountryPreference = resolveInitialPricingCountry(phoneCountryCode, persistedCountry);
  const initialCountry = normalizeCountryCode(initialCountryPreference) ?? FALLBACK_PRICING_COUNTRY;
  detectedCountry.value = initialCountry;

  const primaryLabel = detectedCountry.value ?? 'auto';
  let resolvedPricing = false;
  let lastError: unknown = null;
  try {
    console.info('[TeacherPlanUpgradeView] Loading pricing for country', primaryLabel);
    const pricing = await fetchTeacherPricing(initialCountry);
    const { resolvedCountry, planCount } = applyPricingResponse(pricing, initialCountry);
    detectedCountry.value = resolvedCountry ?? initialCountry;
    resolvedPricing = true;
    console.info(
      '[TeacherPlanUpgradeView] Pricing loaded',
      resolvedCountry ?? 'unknown',
      'plans:',
      planCount
    );

    if (planCount === 0) {
      const sourceLabel = resolvedCountry ?? primaryLabel;
      console.info(
        '[TeacherPlanUpgradeView] No active plans for country, falling back to',
        FALLBACK_PRICING_COUNTRY,
        'requested:',
        sourceLabel
      );
      usedFallbackPricing.value = true;
      fallbackSourceCountry.value = resolvedCountry ?? initialCountry;
      const fallbackPricing = await fetchTeacherPricing(FALLBACK_PRICING_COUNTRY);
      const fallbackResult = applyPricingResponse(fallbackPricing, FALLBACK_PRICING_COUNTRY);
      detectedCountry.value = fallbackResult.resolvedCountry ?? FALLBACK_PRICING_COUNTRY;
      resolvedPricing = true;
    }
  } catch (error) {
    console.warn('[TeacherPlanUpgradeView] Unable to load plan pricing for resolved country', error);
    lastError = error;
    try {
      usedFallbackPricing.value = true;
      fallbackSourceCountry.value = detectedCountry.value ?? null;
      console.info(
        '[TeacherPlanUpgradeView] Attempting fallback pricing for',
        FALLBACK_PRICING_COUNTRY,
        'after failure'
      );
      const fallbackPricing = await fetchTeacherPricing(FALLBACK_PRICING_COUNTRY);
      const fallbackResult = applyPricingResponse(fallbackPricing, FALLBACK_PRICING_COUNTRY);
      detectedCountry.value = fallbackResult.resolvedCountry ?? FALLBACK_PRICING_COUNTRY;
      resolvedPricing = true;
      lastError = null;
    } catch (fallbackError) {
      console.error('[TeacherPlanUpgradeView] Fallback pricing load failed', fallbackError);
      lastError = fallbackError;
      resetToFallbackBlueprints(FALLBACK_PRICING_COUNTRY);
      loadError.value = true;
    }
  } finally {
    if (!resolvedPricing) {
      const fallbackCurrency = resolveCurrencyForCountry(initialCountry);
      planPricing.value = applyPlanBlueprintFallbacks({}, { currency: fallbackCurrency });
      paymentMethods.value = ensureDefaultPaymentMethods([]);
      pricingCountry.value = initialCountry;
      pricingCurrency.value = fallbackCurrency ?? TARGET_CURRENCY;
      loadError.value = true;
      if (lastError) {
        console.warn('[TeacherPlanUpgradeView] Falling back to static pricing', lastError);
      }
    }
    isLoading.value = false;
  }
};

const handleSubscriptionVisibility = () => {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
    return;
  }
  void subscriptionStore.loadSubscription(true);
};

onMounted(() => {
  void subscriptionStore.loadSubscription();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleSubscriptionVisibility);
  }
  void (async () => {
    try {
      await featuresStore.refresh();
    } catch (error) {
      console.warn('[TeacherPlanUpgradeView] Failed to refresh feature flags before loading pricing', error);
    } finally {
      await loadPlanPricing();
    }
  })();
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleSubscriptionVisibility);
  }
});

onActivated(() => {
  void subscriptionStore.loadSubscription(true);
});

const heroHighlights = computed(() => {
  const localized = tm('teacher.planUpgradeHero.highlights') as unknown;
  if (Array.isArray(localized)) {
    return localized
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => item.length > 0);
  }
  if (typeof localized === 'string') {
    const trimmed = localized.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
});

const priceLocale = computed(() =>
  locale.value && locale.value.startsWith('ar') ? 'en-US' : locale.value || 'en-US'
);

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
    console.warn('[TeacherPlanUpgradeView] Unable to resolve fraction digits for currency', currency, error);
    return 2;
  }
};

const convertMinorToMajor = (
  amountMinor: number | null | undefined,
  currency: string | null | undefined
) => {
  if (amountMinor === null || amountMinor === undefined) {
    return null;
  }
  const digits = getFractionDigits(currency ?? null);
  return amountMinor / Math.pow(10, digits);
};

const formatPlanPrice = (
  pricing: TeacherPlanPricing | undefined,
  fallback: string,
  localeTag: string,
  options: { fallbackAmount?: number | null; fallbackCurrency?: string | null; periodKey?: string | null }
): FormattedPlanPrice => {
  const fallbackAmount = options.fallbackAmount ?? null;
  const fallbackCurrency = options.fallbackCurrency ?? null;
  const period = options.periodKey ? t(options.periodKey as any) : null;

  let currency = pricing?.currency?.trim() || fallbackCurrency || null;
  let amount = convertMinorToMajor(pricing?.amountMinor ?? null, currency);

  if (amount === null && typeof fallbackAmount === 'number') {
    amount = fallbackAmount;
  }

  if (!currency && amount !== null) {
    currency = fallbackCurrency ?? 'EGP';
  }

  if (amount === null || !currency) {
    const preformatted = pricing?.formattedAmount?.trim();
    if (preformatted) {
      const display = period ? `${preformatted} / ${period}` : preformatted;
      return {
        display,
        amount: null,
        currency: currency ?? null
      };
    }
    return {
      display: fallback,
      amount: null,
      currency: currency ?? null
    };
  }

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

const pricingCountryName = computed(() => {
  if (!pricingCountry.value) {
    return null;
  }
  const key = `teacher.planUpgradeCountry.${pricingCountry.value}`;
  const localized = t(key as any);
  return localized === key ? pricingCountry.value : localized;
});

type PricingMeta = { country: string | null; currency: string | null };

const pricingCurrencyDisplay = computed(() => pricingCurrency.value ?? TARGET_CURRENCY);

const pricingMeta = computed<PricingMeta>(() => ({
  country: pricingCountryName.value,
  currency: pricingCurrencyDisplay.value
}));

const pricingContextText = computed(() => {
  const { country, currency } = pricingMeta.value;
  if (country && currency) {
    return t('teacher.planUpgradeMeta.description', {
      country,
      currency
    });
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
  const methods = [...paymentMethods.value];
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

const hasPaymentMethods = computed(() => paymentMethodEntries.value.length > 0);

const STANDARD_PLAN_KEYS = new Set(['basic', 'pro']);
const isStandardPlanKey = (key: string | null | undefined): boolean => {
  if (!key) {
    return false;
  }
  return STANDARD_PLAN_KEYS.has(key.trim().toLowerCase());
};

const shouldShowCurrentPlanNotice = (plan: TeacherPlanOption): boolean =>
  plan.isCurrentPlan && isStandardPlanKey(plan.key);

const startCheckout = (plan: TeacherPlanOption) => {
  if (plan.isCurrentPlan) {
    return;
  }
  if (!hasPaymentMethods.value) {
    toast.warning({ detail: t('teacher.planUpgradePaymentMethodsUnavailable') });
    return;
  }
  const methods = [...paymentMethods.value];
  checkoutStore.setCheckout(plan, methods);
  paymentMethods.value = methods;
  router
    .push({
      name: 'teacher-plan-checkout',
      query: { planCode: plan.planCode }
    })
    .catch((error) => {
      if (isNavigationFailure(error)) {
        return;
      }
      console.error('[TeacherPlanUpgradeView] Failed to navigate to checkout', error);
      toast.error({ detail: t('teacher.planUpgradeNavigationFailed') });
    });
};

const planOptions = computed<TeacherPlanOption[]>(() => {
  const localeTag = priceLocale.value;
  const entries = Object.entries(planPricing.value).filter(([key]) => key !== 'free');
  entries.sort(([, left], [, right]) => {
    const leftAmount = typeof left.amountMinor === 'number' ? left.amountMinor : Number.MAX_SAFE_INTEGER;
    const rightAmount = typeof right.amountMinor === 'number' ? right.amountMinor : Number.MAX_SAFE_INTEGER;
    return leftAmount - rightAmount;
  });

  const activePlanKey = currentPlanKey.value;

  return entries.map(([key, pricing]) => {
    const blueprint = PLAN_BLUEPRINTS.find((plan) => plan.key === key);
    const isContactOnly = key === 'enterprise';
    const fallbackDisplay = blueprint
      ? t(blueprint.priceFallbackKey as any)
      : pricing.formattedAmount ?? '--';
    const monthly = formatPlanPrice(pricing, fallbackDisplay, localeTag, {
      fallbackAmount: blueprint?.fallbackPricing?.amount ?? null,
      fallbackCurrency:
        blueprint?.fallbackPricing?.currency ?? pricing.currency ?? pricingCurrencyDisplay.value ?? null,
      periodKey: isContactOnly ? null : 'teacher.planUpgradePerMonth'
    });
    const marketing = blueprint ? resolveMarketingForPlan(blueprint, pricing) : null;
    const tagline = marketing?.tagline?.trim() || pricing.description?.trim() || '';
    const bestFor = marketing?.bestFor?.trim() || t('teacher.planUpgradeBestForFallback');
    const includes = (marketing?.includes ?? [])
      .map((item) => item?.trim())
      .filter((item): item is string => !!item && item.length > 0);
    const featureList = includes.length
      ? includes
      : pricing.description
        ? [pricing.description]
        : [t('teacher.planUpgradeFeaturesFallback')];
    const yearlyPrice =
      !isContactOnly && monthly.amount !== null && monthly.amount > 0 && monthly.currency
        ? formatYearlyPrice(monthly.amount, monthly.currency, localeTag)
        : null;
    const title = blueprint ? t(blueprint.titleKey as any) : pricing.name ?? pricing.code;
    const contactLabel = isContactOnly
      ? supportPhone.value
        ? t('teacher.planUpgradeCallAction', { phone: supportPhone.value })
        : t('teacher.planUpgradeEnterprisePrice')
      : '';
    const contactHref = isContactOnly && phoneHref.value !== '#' ? phoneHref.value : null;

    const normalizedPlanCode = pricing.code?.trim().toLowerCase() || null;
    const isCurrentPlan = Boolean(
      activePlanKey && (activePlanKey === key || (normalizedPlanCode && activePlanKey === normalizedPlanCode))
    );

    return {
      key,
      planCode: pricing.code?.trim() || key,
      title,
      tagline,
      monthlyPrice: monthly.display,
      monthlyAmount: monthly.amount,
      currency: monthly.currency ?? pricing.currency ?? pricingCurrencyDisplay.value ?? null,
      country: pricingCountry.value,
      yearlyPrice,
      bestFor,
      features: Array.from(new Set(featureList)),
      isContactOnly,
      isCurrentPlan,
      contactHref,
      contactLabel
    };
  });
});
</script>

<style scoped lang="scss">
.teacher-plan-upgrade {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.teacher-plan-upgrade__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-primary) 18%, transparent) 0%,
    color-mix(in srgb, var(--sakai-primary) 6%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 22%, transparent);
}

.teacher-plan-upgrade__hero-content {
  flex: 1 1 320px;
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-plan-upgrade__hero-badge {
  align-self: start;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-primary) 20%, transparent);
  color: var(--sakai-primary-700);
  font-size: var(--sakai-font-size-xs);
  font-weight: var(--sakai-font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-plan-upgrade__hero-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-plan-upgrade__hero-subtitle {
  margin: 0;
  font-size: var(--sakai-font-size-md);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__hero-highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-plan-upgrade__hero-highlight {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-upgrade__layout {
  display: grid;
  gap: var(--sakai-space-5);
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}

.teacher-plan-upgrade__main {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-plan-upgrade__plans {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-plan-upgrade__plans-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.teacher-plan-upgrade__plans-header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.teacher-plan-upgrade__country-notice {
  margin: 0;
  margin-top: var(--sakai-space-2);
  font-size: var(--sakai-font-size-xs);
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-upgrade__country-notice + .teacher-plan-upgrade__country-notice {
  margin-top: var(--sakai-space-1);
}

.teacher-plan-upgrade__country-notice--fallback {
  color: var(--sakai-warning-600, #b7791f);
}

.teacher-plan-upgrade__region-context {
  margin: 0;
  margin-top: var(--sakai-space-2);
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-upgrade__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  justify-content: center;
  align-items: stretch;
}

.teacher-plan-upgrade__plan {
  display: grid;
  gap: var(--sakai-space-3);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 14%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  background: color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-surface-card));
  min-height: 100%;
  width: 100%;
}

.teacher-plan-upgrade__tagline {
  margin: 0.35rem 0 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__billing {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.teacher-plan-upgrade__billing-option {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
}

.teacher-plan-upgrade__billing-label {
  font-size: var(--sakai-font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-upgrade__billing-value {
  font-weight: var(--sakai-font-weight-bold);
  font-size: 1.1rem;
  color: var(--sakai-primary-700);
}

.teacher-plan-upgrade__contact-pricing {
  padding: 0.85rem;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.teacher-plan-upgrade__contact-price {
  font-weight: var(--sakai-font-weight-bold);
  font-size: 1.1rem;
  color: var(--sakai-primary-700);
}

.teacher-plan-upgrade__best-for {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.teacher-plan-upgrade__features-heading {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-tertiary);
}

.teacher-plan-upgrade__features {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.teacher-plan-upgrade__features li {
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-upgrade__plan-actions {
  margin-top: var(--sakai-space-4);
  display: flex;
}

.teacher-plan-upgrade__plan-button {
  width: 100%;
  justify-content: center;
}

.teacher-plan-upgrade__plan-current {
  display: block;
  width: 100%;
  text-align: center;
  font-weight: var(--sakai-font-weight-semibold, 600);
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-upgrade__sidebar {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-plan-upgrade__footer {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.teacher-plan-upgrade__footer > * {
  flex: 1 1 0;
}

.teacher-plan-upgrade__meta,
.teacher-plan-upgrade__methods,
.teacher-plan-upgrade__contact {
  display: grid;
  gap: var(--sakai-space-3);
  align-content: start;
}

.teacher-plan-upgrade__methods-note {
  margin-top: var(--sakai-space-3);
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__meta {
  background: var(--sakai-surface-card);
}

.teacher-plan-upgrade__meta-description {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.teacher-plan-upgrade__methods {
  background: var(--sakai-surface-card);
}

.teacher-plan-upgrade__methods-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-plan-upgrade__methods-intro {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__method {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sakai-space-3);
  align-items: start;
  padding: 0.85rem;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-surface-card));
}

.teacher-plan-upgrade__method-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-primary) 18%, var(--sakai-surface-card));
  overflow: hidden;
}

.cardsLogos {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  width: auto;
  height: auto;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.cardsLogos img {
  height: 1rem;
  width: auto;
}

.teacher-plan-upgrade__method-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.teacher-plan-upgrade__method-copy {
  display: grid;
  gap: 0.35rem;
}

.teacher-plan-upgrade__method-name {
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-plan-upgrade__method-description {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__contact {
  background: var(--sakai-surface-card);
}

.teacher-plan-upgrade__contact-locations {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-plan-upgrade__contact-location {
  display: grid;
  gap: 0.35rem;
}

.teacher-plan-upgrade__contact-location-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.teacher-plan-upgrade__contact-location-name {
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-plan-upgrade__contact-location-phone {
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-primary-600);
  text-decoration: none;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-plan-upgrade__contact-location-phone:hover,
.teacher-plan-upgrade__contact-location-phone:focus {
  text-decoration: underline;
}

.teacher-plan-upgrade__contact-location-address {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-plan-upgrade__contact-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-3);
}

.teacher-plan-upgrade__contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  padding: 0.35rem 0.5rem;
  border-radius: var(--sakai-border-radius-sm);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.teacher-plan-upgrade__contact-link:hover,
.teacher-plan-upgrade__contact-link:focus {
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary-700);
}

.teacher-plan-upgrade__contact-link:focus {
  outline: 2px solid var(--sakai-primary-500);
  outline-offset: 2px;
}

.teacher-plan-upgrade__contact-link--email {
  font-size: var(--sakai-font-size-sm);
}

.teacher-plan-upgrade__contact-email {
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-plan-upgrade__contact-note {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

@media (max-width: 1024px) {
  .teacher-plan-upgrade__layout {
    grid-template-columns: 1fr;
  }

  .teacher-plan-upgrade__hero {
    padding: var(--sakai-space-4);
  }
}

@media (max-width: 768px) {
  .teacher-plan-upgrade__hero-title {
    font-size: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .teacher-plan-upgrade__footer {
    flex-direction: row;
  }
}

@media (max-width: 600px) {
  .teacher-plan-upgrade__hero {
    flex-direction: column;
  }

  .teacher-plan-upgrade__hero-plan {
    width: 100%;
  }

  .teacher-plan-upgrade__plans-header {
    align-items: stretch;
  }

  .teacher-plan-upgrade__region-select {
    min-width: 100%;
    flex: 1 1 auto;
  }
}
</style>
