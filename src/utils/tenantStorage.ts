export const TENANT_STORAGE_KEY = 'edtech_tenant';
export const TENANT_RAW_STORAGE_KEY = 'edtech_tenant_raw';
export const DEFAULT_TENANT_SLUG = 'demo';

export const sanitizeTenantSlug = (slug?: string | null): string => (slug ?? '').trim();

export const normalizeTenantSlug = (slug?: string | null): string =>
  sanitizeTenantSlug(slug).toLowerCase();

export interface StoredTenantSlug {
  raw: string;
  normalized: string;
}

export const getStoredTenantSlug = (): StoredTenantSlug => {
  if (typeof window === 'undefined') {
    return { raw: '', normalized: '' };
  }

  const raw = sanitizeTenantSlug(window.localStorage.getItem(TENANT_RAW_STORAGE_KEY));
  if (raw) {
    return { raw, normalized: normalizeTenantSlug(raw) };
  }

  const fallback = sanitizeTenantSlug(window.localStorage.getItem(TENANT_STORAGE_KEY));
  if (fallback) {
    return { raw: fallback, normalized: normalizeTenantSlug(fallback) };
  }

  return { raw: '', normalized: '' };
};

export const setStoredTenantSlug = (slug?: string | null): StoredTenantSlug => {
  const raw = sanitizeTenantSlug(slug);
  if (typeof window === 'undefined') {
    return { raw, normalized: normalizeTenantSlug(raw) };
  }

  if (!raw) {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
    window.localStorage.removeItem(TENANT_RAW_STORAGE_KEY);
    return { raw: '', normalized: '' };
  }

  const normalized = normalizeTenantSlug(raw);
  window.localStorage.setItem(TENANT_STORAGE_KEY, normalized);
  window.localStorage.setItem(TENANT_RAW_STORAGE_KEY, raw);
  return { raw, normalized };
};

export const clearStoredTenantSlug = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(TENANT_STORAGE_KEY);
  window.localStorage.removeItem(TENANT_RAW_STORAGE_KEY);
};
