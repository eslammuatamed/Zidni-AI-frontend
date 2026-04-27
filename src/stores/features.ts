import { defineStore } from 'pinia';
import { fetchResolvedFeatures, type ResolvedFeaturesResponse } from '@/services/features';
import {
  FEATURE,
  ENTITLEMENT,
  FEATURE_CODES,
  ENTITLEMENT_KEYS,
  isFeatureCode,
  isEntitlementKey,
  type FeatureCode,
  type EntitlementKey
} from '@/constants/featureCatalog';
import { isAuthorizationError } from '@/utils/httpError';

export interface FeatureContext {
  tenant?: string | null;
  role?: string | null;
  audience?: 'secure' | 'public';
}

interface FeaturesState {
  plan: string | null;
  version: number | null;
  features: Partial<Record<FeatureCode, boolean>>;
  entitlements: Partial<Record<EntitlementKey, unknown>>;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  contextKey: string | null;
  audience: 'secure' | 'public';
  currentContext: FeatureContext | null;
  secureLoadAttempted: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

const initialState = (): FeaturesState => ({
  plan: null,
  version: null,
  features: {},
  entitlements: {},
  loading: false,
  loaded: false,
  error: null,
  lastLoadedAt: null,
  contextKey: null,
  audience: 'secure',
  currentContext: null,
  secureLoadAttempted: false
});

const normalizeContext = (context?: FeatureContext) => {
  const tenant = (context?.tenant ?? '').trim().toLowerCase();
  const role = (context?.role ?? '').trim().toUpperCase();
  const audience = context?.audience ?? 'secure';
  return {
    key: `${audience}::${tenant || 'anon'}::${role || 'none'}`,
    audience,
    tenant: tenant || null,
    role: role || null
  };
};

const coerceFeatures = (
  payload?: Partial<Record<string, boolean>>
): Partial<Record<FeatureCode, boolean>> => {
  if (!payload) {
    return {};
  }
  return Object.entries(payload).reduce<Partial<Record<FeatureCode, boolean>>>((acc, [code, value]) => {
    if (isFeatureCode(code)) {
      acc[code] = value === true;
    }
    return acc;
  }, {});
};

const coerceEntitlements = (
  payload?: Partial<Record<string, unknown>>
): Partial<Record<EntitlementKey, unknown>> => {
  if (!payload) {
    return {};
  }
  return Object.entries(payload).reduce<Partial<Record<EntitlementKey, unknown>>>((acc, [key, value]) => {
    if (isEntitlementKey(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

let activeLoad: Promise<void> | null = null;

export const useFeaturesStore = defineStore('features', {
  state: (): FeaturesState => initialState(),
  getters: {
    featureError: (state): string | null => state.error,
    hasAttemptedSecureLoad: (state): boolean => state.secureLoadAttempted
  },
  actions: {
    async ensureLoaded(context?: FeatureContext) {
      const normalized = normalizeContext(context ?? this.currentContext ?? undefined);
      if (this.contextKey !== normalized.key) {
        this.contextKey = normalized.key;
        this.audience = normalized.audience;
        this.loaded = false;
        this.lastLoadedAt = null;
        this.secureLoadAttempted = normalized.audience === 'secure' ? false : this.secureLoadAttempted;
        this.currentContext = {
          tenant: normalized.tenant,
          role: normalized.role,
          audience: normalized.audience
        };
      }
      if (this.loaded) {
        const isExpired = !this.lastLoadedAt || Date.now() - this.lastLoadedAt > CACHE_TTL_MS;
        if (!isExpired) {
          return;
        }
      }
      await this.load(false, context);
    },
    async load(force = false, context?: FeatureContext) {
      const initialContext = normalizeContext(context ?? this.currentContext ?? undefined);

      if (this.loading) {
        if (!force && this.contextKey === initialContext.key) {
          return activeLoad ?? Promise.resolve();
        }
        if (activeLoad) {
          await activeLoad.catch(() => {});
        }
      }

      const normalized = normalizeContext(context ?? this.currentContext ?? undefined);

      if (this.loaded && !force && this.contextKey === normalized.key) {
        return;
      }

      if (normalized.audience === 'public') {
        this.loaded = true;
        this.lastLoadedAt = Date.now();
        this.contextKey = normalized.key;
        this.audience = 'public';
        this.currentContext = {
          tenant: normalized.tenant,
          role: normalized.role,
          audience: 'public'
        };
        this.secureLoadAttempted = false;
        return;
      }

      this.loading = true;
      this.error = null;

      const loadTask = (async () => {
        try {
          const response = await fetchResolvedFeatures();
          this.applyResponse(response, { tenant: normalized.tenant, role: normalized.role, audience: 'secure' });
        } catch (error) {
          if (isAuthorizationError(error)) {
            console.info('[features] skipping secure feature load due to authorization error');
            this.plan = null;
            this.version = null;
            this.features = {};
            this.entitlements = {};
            this.loaded = true;
            this.lastLoadedAt = Date.now();
            this.contextKey = normalized.key;
            this.audience = normalized.audience;
            this.currentContext = {
              tenant: normalized.tenant,
              role: normalized.role,
              audience: normalized.audience
            };
            this.error = 'features.errors.unauthorized';
            this.secureLoadAttempted = true;
          } else {
            console.error('[features] failed to load feature set', error);
            this.error = 'features.errors.loadFailed';
            if (normalized.audience === 'secure') {
              this.secureLoadAttempted = true;
            }
          }
        } finally {
          this.loading = false;
          activeLoad = null;
        }
      })();

      activeLoad = loadTask;
      await loadTask;
    },
    applyResponse(response: ResolvedFeaturesResponse, context?: FeatureContext) {
      const normalized = normalizeContext(context ?? this.currentContext ?? undefined);
      this.plan = response.plan ?? null;
      this.version = typeof response.version === 'number' ? response.version : null;
      this.features = coerceFeatures(response.features);
      this.entitlements = coerceEntitlements(response.entitlements);
      this.loaded = true;
      this.lastLoadedAt = Date.now();
      this.contextKey = normalized.key;
      this.audience = normalized.audience;
      this.currentContext = {
        tenant: normalized.tenant,
        role: normalized.role,
        audience: normalized.audience
      };
      if (normalized.audience === 'secure') {
        this.secureLoadAttempted = true;
      }
    },
    seedFromBranding(flags: Record<string, unknown> | undefined, tenant?: string | null) {
      const snapshot = coerceFeatures(flags as Partial<Record<string, boolean>>);
      const normalized = normalizeContext({ tenant, audience: 'public' });
      this.plan = null;
      this.version = null;
      this.features = snapshot;
      this.entitlements = {};
      this.loaded = true;
      this.lastLoadedAt = Date.now();
      this.contextKey = normalized.key;
      this.audience = 'public';
      this.currentContext = {
        tenant: normalized.tenant,
        role: null,
        audience: 'public'
      };
      this.secureLoadAttempted = false;
    },
    async refresh(context?: FeatureContext) {
      this.loaded = false;
      this.lastLoadedAt = null;
      const normalized = normalizeContext(context ?? this.currentContext ?? undefined);
      if (normalized.audience === 'secure') {
        this.secureLoadAttempted = false;
      }
      await this.load(true, context ?? this.currentContext ?? undefined);
    },
    invalidate(context?: FeatureContext) {
      if (context) {
        const normalized = normalizeContext(context);
        this.contextKey = normalized.key;
        this.audience = normalized.audience;
        this.currentContext = {
          tenant: normalized.tenant,
          role: normalized.role,
          audience: normalized.audience
        };
      }
      this.loaded = false;
      this.lastLoadedAt = null;
      if (this.audience === 'secure') {
        this.secureLoadAttempted = false;
      }
    },
    reset() {
      Object.assign(this, initialState());
    },
    hasFeature(code: FeatureCode): boolean {
      return Boolean(this.features[code]);
    },
    getEntitlement<T = unknown>(key: EntitlementKey, fallback: T | null = null): T | unknown | null {
      return this.entitlements[key] ?? fallback;
    },
    listFeatureCodes(): FeatureCode[] {
      return FEATURE_CODES.filter((code) => this.features[code]).sort();
    },
    listEntitlementKeys(): EntitlementKey[] {
      return ENTITLEMENT_KEYS.filter((key) => this.entitlements[key] !== undefined);
    }
  }
});

export function hasFeature(code: FeatureCode): boolean {
  const store = useFeaturesStore();
  return store.hasFeature(code);
}

export { FEATURE, ENTITLEMENT };
