import api from '@/services/api';
import { withCacheBusting } from '@/utils/cacheBusting';
import { getStoredTenantSlug, sanitizeTenantSlug } from '@/utils/tenantStorage';

const MEDIA_PATH_PREFIX = '/api/v1/media/videos/';

const isAbsoluteUrl = (value: string): boolean => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const getApiBaseUrl = (): string => {
  const base = api.defaults.baseURL;
  if (typeof base === 'string' && base.length > 0) {
    if (isAbsoluteUrl(base)) {
      return base;
    }
    if (typeof window !== 'undefined' && window.location) {
      try {
        return new URL(base, window.location.origin).toString();
      } catch {
        /* ignore */
      }
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost';
};

const isSameOriginMediaPath = (url: URL): boolean => {
  return url.pathname.startsWith(MEDIA_PATH_PREFIX);
};

interface BuildMediaOptions {
  version?: string | number | null;
}

export const buildAuthenticatedMediaUrl = (
  raw?: string | null,
  options: BuildMediaOptions = {}
): string | null => {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(trimmed, getApiBaseUrl());
  } catch (error) {
    console.warn('[media] Failed to parse media url', error);
    return trimmed;
  }

  if (!isSameOriginMediaPath(resolvedUrl)) {
    return resolvedUrl.toString();
  }

  if (typeof window !== 'undefined') {
    const role = window.localStorage.getItem('edtech_role');
    if (role !== 'PLATFORM_ADMIN' && !resolvedUrl.searchParams.has('tenant')) {
      const stored = getStoredTenantSlug();
      const fallback = sanitizeTenantSlug(import.meta.env.VITE_TENANT_SLUG);
      const tenant = stored.raw || fallback;
      if (tenant) {
        resolvedUrl.searchParams.set('tenant', tenant);
      }
    }
  }

  return withCacheBusting(resolvedUrl.toString(), options.version ?? undefined);
};

export const isHlsUrl = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  return /\.m3u8($|\?)/i.test(value.trim());
};
