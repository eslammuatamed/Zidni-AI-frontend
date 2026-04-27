import { computed, shallowRef, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTenantStore } from '@/stores/tenant';
import { fetchBranding, applyCssVars, applyDirection, applyAssets, type BrandingConfig } from '@/theme/BrandInjector';
import { getStoredTenantSlug, normalizeTenantSlug } from '@/utils/tenantStorage';

const BRANDING_CACHE = new Map<string, BrandingConfig>();
const PENDING = new Map<string, Promise<BrandingConfig>>();
const RTL_OVERRIDE_STORAGE_KEY = 'edtech_rtl_override';

const resolveTenantKey = (slug?: string | null) => {
  const normalized = normalizeTenantSlug(slug);
  if (normalized) {
    return normalized;
  }
  const stored = getStoredTenantSlug();
  if (stored.normalized) {
    return stored.normalized;
  }
  return 'default';
};

const readOverride = (): 'rtl' | 'ltr' | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(RTL_OVERRIDE_STORAGE_KEY);
  return value === 'rtl' || value === 'ltr' ? value : null;
};

export function useBranding() {
  const tenantStore = useTenantStore();
  const { locale } = useI18n();

  const branding = shallowRef<BrandingConfig | null>(null);
  const loading = ref(false);
  const error = ref<unknown>(null);
  const rtlOverride = ref<'rtl' | 'ltr' | null>(readOverride());

  const tenantKey = computed(() => resolveTenantKey(tenantStore.branding?.slug));

  const resolveDirection = (config: BrandingConfig | null, currentLocale: string) => {
    const isArabic = currentLocale.toLowerCase().startsWith('ar');
    const preferredRtl = Boolean(config?.rtlPreferred);
    if (rtlOverride.value === 'rtl') {
      return true;
    }
    if (rtlOverride.value === 'ltr') {
      return false;
    }
    return isArabic || preferredRtl;
  };

  const hydrate = async (force = false) => {
    const key = tenantKey.value;
    if (!force && BRANDING_CACHE.has(key)) {
      const cached = BRANDING_CACHE.get(key)!;
      branding.value = cached;
      applyCssVars(cached);
      applyAssets(cached.assets);
      applyDirection(resolveDirection(cached, locale.value));
      return cached;
    }

    let promise = PENDING.get(key);
    if (!promise || force) {
      loading.value = true;
      promise = fetchBranding()
        .then((data) => {
          BRANDING_CACHE.set(key, data);
          return data;
        })
        .catch((err) => {
          error.value = err;
          throw err;
        })
        .finally(() => {
          loading.value = false;
          PENDING.delete(key);
        });
      PENDING.set(key, promise);
    }

    try {
      const result = await promise;
      branding.value = result;
      applyCssVars(result);
      applyAssets(result.assets);
      applyDirection(resolveDirection(result, locale.value));
      return result;
    } catch (err) {
      applyDirection(resolveDirection(branding.value, locale.value));
      throw err;
    }
  };

  const updateOverride = (value: 'rtl' | 'ltr' | null) => {
    rtlOverride.value = value;
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(RTL_OVERRIDE_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(RTL_OVERRIDE_STORAGE_KEY);
      }
    }
    applyDirection(resolveDirection(branding.value, locale.value));
  };

  onMounted(() => {
    hydrate(false).catch(() => {
      /* errors logged in fetch */
    });
  });

  watch(
    tenantKey,
    () => {
      hydrate(true).catch(() => {
        /* swallow */
      });
    },
    { immediate: false }
  );

  watch(
    () => locale.value,
    (value) => {
      applyDirection(resolveDirection(branding.value, value));
    },
    { immediate: true }
  );

  watch(
    branding,
    (value) => {
      if (value) {
        applyCssVars(value);
        applyAssets(value.assets);
        applyDirection(resolveDirection(value, locale.value));
      }
    },
    { immediate: false }
  );

  return {
    branding,
    loading,
    error,
    rtlOverride,
    refresh: () => hydrate(true),
    setRtlOverride: updateOverride,
    isRtl: computed(() => resolveDirection(branding.value, locale.value))
  };
}
