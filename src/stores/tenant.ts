import { defineStore } from 'pinia';
import api from '@/services/api';
import { useFeaturesStore } from '@/stores/features';
import {
  DEFAULT_TENANT_SLUG,
  clearStoredTenantSlug,
  getStoredTenantSlug,
  normalizeTenantSlug,
  sanitizeTenantSlug,
  setStoredTenantSlug
} from '@/utils/tenantStorage';

import type { PublicLandingResponse } from '@/services/landing';

interface BrandingResponse {
  id: number;
  slug: string;
  name: string;
  subject?: string;
  plan?: string;
  bio?: string;
  branding?: Record<string, unknown> & { defaultLocale?: string; colors?: Record<string, string> };
  flags?: Record<string, unknown>;
  landing?: {
    id: number;
    code: string;
    name: string;
    content: Record<string, unknown>;
  } | null;
  page?: PublicLandingResponse;
}

const RESERVED_SUBDOMAIN_VALUES = new Set(['app', 'platform']);
const isReservedSubdomainValue = (value: string): boolean => {
  if (!value) {
    return false;
  }

  if (value === 'www' || /^www\d+$/.test(value)) {
    return true;
  }

  return RESERVED_SUBDOMAIN_VALUES.has(value);
};

const isLocalhostSlug = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }

  const normalized = normalizeTenantSlug(value);
  return normalized === 'localhost' || normalized === '127.0.0.1';
};

const resolveInitialSlug = () => {
  const {
    rawSubdomain,
    normalizedSubdomain,
    isReservedSubdomain,
    hostnameSegments,
    isLocalhostDomain
  } = (() => {
    if (typeof window === 'undefined') {
      return {
        rawSubdomain: '',
        normalizedSubdomain: '',
        isReservedSubdomain: false,
        hostnameSegments: [] as string[],
        isLocalhostDomain: false
      };
    }

    const host = window.location.hostname ?? '';
    const isLocalhostDomain = host === 'localhost' || host === '127.0.0.1';
    const segments = host.split('.').filter(Boolean);
    const firstSegment = segments.length ? segments[0] : '';
    const rawSegment = sanitizeTenantSlug(firstSegment);
    const normalizedSegment = normalizeTenantSlug(firstSegment);

    return {
      rawSubdomain: rawSegment,
      normalizedSubdomain: normalizedSegment,
      isReservedSubdomain: normalizedSegment ? isReservedSubdomainValue(normalizedSegment) : false,
      hostnameSegments: segments,
      isLocalhostDomain
    };
  })();

  const stored = (() => {
    const candidate = getStoredTenantSlug();
    if (candidate.raw && isLocalhostSlug(candidate.normalized)) {
      clearStoredTenantSlug();
      return { raw: '', normalized: '' };
    }

    return candidate;
  })();

  const envSlug = sanitizeTenantSlug(import.meta.env.VITE_TENANT_SLUG);
  const envCandidate = envSlug && !isLocalhostSlug(envSlug)
    ? { raw: envSlug, normalized: normalizeTenantSlug(envSlug) }
    : null;

  if (isLocalhostDomain) {
    if (stored.raw) {
      return stored;
    }

    if (envCandidate) {
      return envCandidate;
    }

    return {
      raw: DEFAULT_TENANT_SLUG,
      normalized: normalizeTenantSlug(DEFAULT_TENANT_SLUG)
    };
  }

  const isWwwLikeSubdomain = normalizedSubdomain ? /^www\d*$/.test(normalizedSubdomain) : false;

  if (normalizedSubdomain && !isReservedSubdomain && !isLocalhostSlug(normalizedSubdomain)) {
    const resolvedFromHost = {
      raw: rawSubdomain || normalizedSubdomain,
      normalized: normalizedSubdomain
    };

    if (!stored.raw) {
      return resolvedFromHost;
    }

    if (stored.normalized !== normalizedSubdomain) {
      return resolvedFromHost;
    }

    return stored;
  }

  if (stored.raw) {
    return stored;
  }

  if (envCandidate) {
    return envCandidate;
  }

  if (isWwwLikeSubdomain && hostnameSegments.length > 1) {
    const fallbackCandidate = hostnameSegments
      .slice(1)
      .map((segment) => sanitizeTenantSlug(segment))
      .find((segment) => {
        if (!segment) {
          return false;
        }

        const normalizedSegment = normalizeTenantSlug(segment);
        return !isReservedSubdomainValue(normalizedSegment) && !isLocalhostSlug(normalizedSegment);
      });

    if (fallbackCandidate) {
      const normalizedFallback = normalizeTenantSlug(fallbackCandidate);
      return {
        raw: fallbackCandidate,
        normalized: normalizedFallback
      };
    }
  }

  return { raw: '', normalized: '' };
};

const initial = resolveInitialSlug();

if (initial.raw && typeof window !== 'undefined') {
  setStoredTenantSlug(initial.raw);
}

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    branding: null as BrandingResponse | null,
    loading: false,
    landings: new Map<string, PublicLandingResponse>(),
    slug: initial.normalized,
    rawSlug: initial.raw
  }),
  actions: {
    setSlug(slug?: string | null) {
      const raw = sanitizeTenantSlug(slug);
      const normalized = normalizeTenantSlug(raw);

      if (!normalized) {
        this.slug = '';
        this.rawSlug = '';
        clearStoredTenantSlug();
        this.branding = null;
        useFeaturesStore().seedFromBranding(undefined, null);
        return;
      }

      const shouldUpdate = this.rawSlug !== raw || this.slug !== normalized;

      this.slug = normalized;
      this.rawSlug = raw;

      if (shouldUpdate) {
        setStoredTenantSlug(raw);
      }
    },
    async fetchBranding(slug?: string) {
      const requestedRaw = sanitizeTenantSlug(slug ?? this.rawSlug ?? this.slug);
      const targetSlug = normalizeTenantSlug(requestedRaw);
      if (!targetSlug) {
        return;
      }

      const previousRaw = this.rawSlug;
      const previousSlug = this.slug;
      if (previousSlug !== targetSlug) {
        this.setSlug(requestedRaw || targetSlug);
      }

      this.loading = true;
      try {
        const { data } = await api.get<BrandingResponse>(`/public/tenant/${targetSlug}/branding`);
        this.branding = data;
        const resolvedTenant = sanitizeTenantSlug(data.slug) || requestedRaw || targetSlug;
        this.setSlug(resolvedTenant);
        useFeaturesStore().seedFromBranding(data.flags, resolvedTenant);
        if (data.page) {
          const cacheKey = `${normalizeTenantSlug(resolvedTenant || targetSlug)}::home`;
          this.landings.set(cacheKey, data.page);
        }
      } catch (error) {
        if (previousSlug !== targetSlug) {
          this.setSlug(previousRaw || previousSlug);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },
    cacheLanding(slug: string, landing: PublicLandingResponse) {
      this.landings.set(`${normalizeTenantSlug(slug)}::${landing.route}`, landing);
    },
    getCachedLanding(slug: string, route: string) {
      return this.landings.get(`${normalizeTenantSlug(slug)}::${route}`);
    }
  }
});
